from app.services.queue import enqueue_job


class DummyJob:
    def __init__(self, id: str):
        self.id = id


def test_enqueue_has_retry_and_timeout(monkeypatch):
    captured = {}

    class DummyQueue:
        def __init__(self, name, connection=None, default_timeout=None):
            captured["queue_default_timeout"] = default_timeout

        def enqueue(self, func, job_uuid, retry=None, failure_ttl=None, job_timeout=None):
            captured.update({
                "retry": retry,
                "failure_ttl": failure_ttl,
                "job_timeout": job_timeout,
                "func_name": getattr(func, "__name__", str(func)),
            })
            return DummyJob("jid-1")

    import app.services.queue as qmod
    monkeypatch.setattr(qmod, "Queue", DummyQueue)
    monkeypatch.setattr(qmod, "redis", type("R", (), {"from_url": staticmethod(lambda url: object())}))

    jid = enqueue_job("abc")
    assert jid == "jid-1"
    assert captured["job_timeout"] == 600
    assert captured["failure_ttl"] == 86400
    assert captured["retry"] is not None


