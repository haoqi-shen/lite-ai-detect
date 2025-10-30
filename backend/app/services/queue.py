from rq import Queue
from rq.retry import Retry
import redis

from ..config import get_settings


def _get_connection() -> redis.Redis:
    settings = get_settings()
    return redis.from_url(settings.REDIS_URL)


def enqueue_job(job_uuid: str) -> str:
    conn = _get_connection()
    q = Queue("jobs", connection=conn, default_timeout=600)
    # Lazy import to avoid heavy deps on API import
    from ..workers.rq_tasks import process_job  # type: ignore

    job = q.enqueue(
        process_job,
        job_uuid,
        retry=Retry(max=3, interval=[5, 10, 20]),
        failure_ttl=86400,
        job_timeout=600,
    )
    return job.id


