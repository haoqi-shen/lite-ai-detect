import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends

from ..services.auth import auth_dependency
from ..services.storage import get_presigned_put_url

router = APIRouter()


@router.post("/upload-url")
async def create_upload_url(payload: Dict[str, Any], auth: Dict[str, Any] = Depends(auth_dependency)):
    filename = payload.get("filename") or "upload.bin"
    content_type = payload.get("contentType") or "application/octet-stream"
    key = f"uploads/{auth['uid']}/{uuid.uuid4()}_{filename}"
    url, expires_in = get_presigned_put_url(key, content_type)
    return {"key": key, "url": url, "expires_in": expires_in}


