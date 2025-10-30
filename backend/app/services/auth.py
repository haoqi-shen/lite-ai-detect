import time
from typing import Any, Dict, Optional

import httpx
from fastapi import Depends, HTTPException, Request
from jose import jwt

from ..config import get_settings


_GOOGLE_CERTS_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
)


class JWKsCache:
    def __init__(self) -> None:
        self._certs: Dict[str, str] = {}
        self._expires_at: float = 0

    async def get_certs(self) -> Dict[str, str]:
        now = time.time()
        if self._certs and now < self._expires_at:
            return self._certs
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(_GOOGLE_CERTS_URL)
            resp.raise_for_status()
            # Cache for 1 hour
            self._certs = resp.json()
            self._expires_at = now + 3600
            return self._certs


_jwks_cache = JWKsCache()


async def verify_firebase_token(id_token: str) -> Dict[str, Any]:
    settings = get_settings()
    certs = await _jwks_cache.get_certs()

    last_err: Optional[Exception] = None
    for kid, cert_pem in certs.items():
        try:
            payload = jwt.decode(
                id_token,
                cert_pem,
                algorithms=["RS256"],
                audience=settings.FIREBASE_PROJECT_ID,
                issuer=settings.FIREBASE_ISSUER or f"https://securetoken.google.com/{settings.FIREBASE_PROJECT_ID}",
                options={"verify_exp": True},
            )
            # Validate required claims
            if not payload.get("sub"):
                raise HTTPException(status_code=401, detail="Invalid token: missing sub")
            return {
                "uid": payload.get("user_id") or payload.get("sub"),
                "email": payload.get("email"),
                "claims": payload,
            }
        except Exception as e:  # try next cert
            last_err = e
            continue
    raise HTTPException(status_code=401, detail=f"Invalid token: {last_err}")


async def auth_dependency(request: Request) -> Dict[str, Any]:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth_header.split(" ", 1)[1]
    info = await verify_firebase_token(token)
    # attach to request state for downstream access
    request.state.auth = info
    return info


