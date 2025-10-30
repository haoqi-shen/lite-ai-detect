import time
import uuid
from typing import Tuple

import boto3

from ..config import get_settings


def get_presigned_put_url(key: str, content_type: str, expires_in: int = 900) -> Tuple[str, int]:
    settings = get_settings()
    if settings.ENABLE_STORAGE_STUB or not settings.S3_BUCKET:
        # Stub: return a dummy URL in local dev
        url = f"https://example.com/upload/{uuid.uuid4()}"
        return url, expires_in

    s3 = boto3.client("s3", region_name=settings.AWS_REGION)
    url = s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": key, "ContentType": content_type},
        ExpiresIn=expires_in,
    )
    return url, expires_in


def read_text(key: str) -> str:
    settings = get_settings()
    if settings.ENABLE_STORAGE_STUB or not settings.S3_BUCKET:
        return "stubbed content"
    s3 = boto3.client("s3", region_name=settings.AWS_REGION)
    obj = s3.get_object(Bucket=settings.S3_BUCKET, Key=key)
    return obj["Body"].read().decode("utf-8")


