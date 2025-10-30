import time
from contextlib import contextmanager
from typing import Generator

from langdetect import detect
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from ..config import get_settings
from ..services.storage import read_text
from ..repos.models import Job, Result, Document
from ..models.features import extract_features
from ..models.onnx_runner import infer


def _to_sync_db_url(async_url: str) -> str:
    # Convert common async URLs to sync driver for worker side
    return async_url.replace("+asyncpg", "+psycopg").replace("+aiosqlite", "+pysqlite")


@contextmanager
def get_sync_session() -> Generator[Session, None, None]:
    settings = get_settings()
    sync_url = _to_sync_db_url(settings.DB_URL)
    engine = create_engine(sync_url, future=True)
    with Session(engine) as session:
        yield session


def process_job(job_uuid: str) -> None:
    with get_sync_session() as session:
        job: Job | None = session.scalar(select(Job).where(Job.job_uuid == job_uuid))
        if not job:
            return
        job.status = "RUNNING"
        session.commit()

        doc: Document | None = session.get(Document, job.document_id)
        if not doc:
            job.status = "FAILED"
            session.commit()
            return

        try:
            start = time.time()
            text = read_text(doc.s3_key)
            cleaned = text.strip()
            language = detect(cleaned) if cleaned else "unknown"

            feats, feat_summary = extract_features(cleaned)
            ai_probability = infer(feats)

            latency_ms = int((time.time() - start) * 1000)
            result = Result(
                job_id=job.id,
                probability=ai_probability,
                summary=f"lang={language}",
                feature_summary=str(feat_summary),
                latency_ms=latency_ms,
            )
            session.add(result)
            job.status = "SUCCEEDED"
            session.commit()
        except Exception:
            job.status = "FAILED"
            session.commit()


