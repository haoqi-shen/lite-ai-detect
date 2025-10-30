from fastapi import FastAPI
from .api.routes import api_router

app = FastAPI(title="Lite AI Detect API")


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(api_router, prefix="")


