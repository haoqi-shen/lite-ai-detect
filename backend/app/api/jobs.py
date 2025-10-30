import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..services.auth import auth_dependency
from ..services.queue import enqueue_job
from ..repos.async_session import get_async_session
from ..repos.models import User, Document, Job, Result

router = APIRouter(prefix="/jobs")


@router.post("")
async def create_job(
    payload: Dict[str, Any],
    auth: Dict[str, Any] = Depends(auth_dependency),
    session: AsyncSession = Depends(get_async_session),
):
    s3_key = payload.get("s3_key") or payload.get("object_key") or payload.get("key")
    if not s3_key:
        raise HTTPException(status_code=422, detail="s3_key is required")
    meta = payload.get("meta")

    # upsert user
    uid = auth["uid"]
    email = auth.get("email")
    user = (await session.scalars(select(User).where(User.uid == uid))).first()
    if not user:
        user = User(uid=uid, email=email)
        session.add(user)
        await session.flush()

    # create document
    doc = Document(user_id=user.id, s3_key=s3_key)
    session.add(doc)
    await session.flush()

    # create job
    job_uuid = str(uuid.uuid4())
    job = Job(job_uuid=job_uuid, user_id=user.id, document_id=doc.id, status="PENDING", meta=str(meta) if meta else None)
    session.add(job)
    await session.commit()

    enqueue_job(job_uuid)

    return {"id": job_uuid, "status": "PENDING"}


@router.get("")
async def list_jobs(
    page: int = Query(1, ge=1),
    status: Optional[str] = None,
    auth: Dict[str, Any] = Depends(auth_dependency),
    session: AsyncSession = Depends(get_async_session),
):
    limit = 20
    offset = (page - 1) * limit
    stmt = select(Job).where(Job.user_id == (await session.scalars(select(User.id).where(User.uid == auth["uid"]))).first()).order_by(Job.id.desc()).offset(offset).limit(limit)
    if status:
        stmt = select(Job).where(Job.user_id == (await session.scalars(select(User.id).where(User.uid == auth["uid"]))).first(), Job.status == status).order_by(Job.id.desc()).offset(offset).limit(limit)
    rows = (await session.scalars(stmt)).all()
    items: List[Dict[str, Any]] = [
        {"id": j.job_uuid, "status": j.status, "created_at": getattr(j, "created_at", None)} for j in rows
    ]
    return {"items": items, "page": page, "status": status}


@router.get("/{job_id}")
async def get_job(job_id: str, auth: Dict[str, Any] = Depends(auth_dependency), session: AsyncSession = Depends(get_async_session)):
    j = (await session.scalars(select(Job).where(Job.job_uuid == job_id))).first()
    if not j:
        raise HTTPException(status_code=404, detail="Not found")
    # Ensure owner
    user_id = (await session.scalars(select(User.id).where(User.uid == auth["uid"]))).first()
    if j.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    r = (await session.scalars(select(Result).where(Result.job_id == j.id).order_by(Result.id.desc()))).first()
    resp = {"id": j.job_uuid, "status": j.status}
    if r:
        resp.update({
            "probability": r.probability,
            "summary": r.summary,
            "feature_summary": r.feature_summary,
            "latency_ms": r.latency_ms,
        })
    return resp


