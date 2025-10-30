from rq import Worker, Queue, Connection
import redis

from ..config import get_settings


def main() -> None:
    settings = get_settings()
    conn = redis.from_url(settings.REDIS_URL)
    with Connection(conn):
        worker = Worker([Queue("jobs")])
        worker.work()


if __name__ == "__main__":
    main()


