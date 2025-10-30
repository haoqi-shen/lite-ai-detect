from fastapi import APIRouter
from .upload import router as upload_router
from .jobs import router as jobs_router

api_router = APIRouter(prefix="/api")

api_router.include_router(upload_router)
api_router.include_router(jobs_router)


