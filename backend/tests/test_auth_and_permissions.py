import os
import types

import fakeredis
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repos.db import Base
from sqlalchemy import create_engine


@pytest.fixture(autouse=True)
def setup_env(tmp_path, monkeypatch):
    db_file = tmp_path / "test.db"
    os.environ["DB_URL"] = f"sqlite+aiosqlite:///{db_file}"
    sync_engine = create_engine(f"sqlite+pysqlite:///{db_file}", future=True)
    Base.metadata.create_all(bind=sync_engine)

    fake = fakeredis.FakeRedis()
    import app.services.queue as queue_mod
    monkeypatch.setattr(queue_mod, "redis", types.SimpleNamespace(from_url=lambda url: fake))
    yield


def test_auth_required_upload_url():
    client = TestClient(app)
    r = client.post("/api/upload-url", json={"filename": "a.txt", "contentType": "text/plain"})
    assert r.status_code == 401


@pytest.fixture
def auth_user(monkeypatch):
    from app.services import auth as auth_mod

    async def dep(request):
        info = {"uid": "u1", "email": "u1@x.com"}
        request.state.auth = info
        return info

    monkeypatch.setattr(auth_mod, "auth_dependency", dep)
    return {"Authorization": "Bearer dummy"}


def test_permission_isolation(auth_user):
    client = TestClient(app)
    # create one job as u1
    up = client.post("/api/upload-url", json={"filename": "a.txt", "contentType": "text/plain"}, headers=auth_user)
    key = up.json()["key"]
    r = client.post("/api/jobs", json={"s3_key": key}, headers=auth_user)
    assert r.status_code == 200
    job_id = r.json()["id"]

    # switch to u2 should not see u1 job
    from app.services import auth as auth_mod

    async def dep2(request):
        info = {"uid": "u2", "email": "u2@x.com"}
        request.state.auth = info
        return info

    # override auth to u2
    auth_mod.auth_dependency = dep2  # type: ignore
    r2 = client.get("/api/jobs", headers={"Authorization": "Bearer dummy"})
    assert r2.status_code == 200
    assert all(item["id"] != job_id for item in r2.json().get("items", []))

    # u2 get u1 job should be forbidden
    r3 = client.get(f"/api/jobs/{job_id}", headers={"Authorization": "Bearer dummy"})
    assert r3.status_code in (403, 404)


