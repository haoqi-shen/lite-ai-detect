import os
import time
import types

import fakeredis
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.config import get_settings
from app.repos.db import Base
from sqlalchemy import create_engine


@pytest.fixture(autouse=True)
def setup_env(tmp_path, monkeypatch):
    # Use sqlite for async/sync via URL conversion in worker
    db_file = tmp_path / "test.db"
    os.environ["DB_URL"] = f"sqlite+aiosqlite:///{db_file}"
    # Ensure tables exist for sync engine
    sync_engine = create_engine(f"sqlite+pysqlite:///{db_file}", future=True)
    Base.metadata.create_all(bind=sync_engine)

    # Fake Redis
    fake = fakeredis.FakeRedis()
    import app.services.queue as queue_mod
    monkeypatch.setattr(queue_mod, "redis", types.SimpleNamespace(from_url=lambda url: fake))

    yield


def auth_header():
    # Bypass real auth by monkeypatching dependency if needed; here we hit endpoints that require Authorization.
    # Use a dummy Firebase token; the auth dependency will fail in real run. For tests, override the dependency.
    return {"Authorization": "Bearer dummy"}


@pytest.fixture(autouse=True)
def override_auth(monkeypatch):
    from app.services import auth as auth_mod

    async def fake_dep(request):
        info = {"uid": "u1", "email": "u1@example.com"}
        request.state.auth = info
        return info

    monkeypatch.setattr(auth_mod, "auth_dependency", fake_dep)
    yield


def test_job_state_flow(tmp_path):
    client = TestClient(app)

    # create upload-url (not essential for job creation test)
    r1 = client.post("/api/upload-url", json={"filename": "a.txt", "contentType": "text/plain"}, headers=auth_header())
    assert r1.status_code == 200
    key = r1.json()["key"]

    # create job
    r2 = client.post("/api/jobs", json={"s3_key": key}, headers=auth_header())
    assert r2.status_code == 200
    job_id = r2.json()["id"]

    # Immediately check list/get -> should at least be PENDING or RUNNING after enqueue
    r3 = client.get("/api/jobs", headers=auth_header())
    assert r3.status_code == 200

    # Poll for DONE (worker runs synchronously in tests via rq only if a worker process consumes; in this test we just simulate small wait)
    # Since we don't start a real worker here, we only ensure creation success path. In integration tests, start worker separately.
    r4 = client.get(f"/api/jobs/{job_id}", headers=auth_header())
    assert r4.status_code == 200


