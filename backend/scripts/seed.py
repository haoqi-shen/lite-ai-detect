from __future__ import annotations

import os
import uuid

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.repos.models import User, Document, Job, Result
from app.repos.db import Base
from app.config import get_settings


def main() -> None:
    settings = get_settings()
    sync_url = settings.DB_URL.replace("+asyncpg", "+psycopg").replace("+aiosqlite", "+pysqlite")
    engine = create_engine(sync_url, future=True)
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        user = User(uid="demo", email="demo@example.com")
        session.add(user)
        session.flush()

        doc = Document(user_id=user.id, s3_key="uploads/demo/sample.txt")
        session.add(doc)
        session.flush()

        job_uuid = str(uuid.uuid4())
        job = Job(job_uuid=job_uuid, user_id=user.id, document_id=doc.id, status="SUCCEEDED")
        session.add(job)
        session.flush()

        res = Result(job_id=job.id, probability=0.73, summary="lang=en", feature_summary="{}", latency_ms=120)
        session.add(res)

        session.commit()
        print({"user": user.email, "job": job_uuid})


if __name__ == "__main__":
    main()


