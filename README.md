# LiteAIDetect
LiteAIDetect is a lightweight service that helps you check whether a piece of text was likely written by AI.

## Frontend (Vite + React + TS)

## Backend (FastAPI)

## Pre-commit
Install and enable:
```
pip install pre-commit
pre-commit install
```
This runs ruff/black/isort and prettier (for `frontend/*.{ts,tsx,...}`) on commit.

## CI
GitHub Actions workflow `ci.yml` runs:
- Backend: lint (ruff/black/isort) + tests
- Frontend: typecheck + build

### Env Vars (example)
```
APP_ENV=local
AWS_REGION=us-west-2
S3_BUCKET=lite-ai-detect-dev
DB_URL=postgresql+asyncpg://postgres:postgres@db:5432/liteaidetect
REDIS_URL=redis://redis:6379/0
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ISSUER=https://securetoken.google.com/your-project-id
```

### Run locally
- In `backend/`:
  - Create venv and install deps
    - `python3 -m venv .venv && source .venv/bin/activate`
    - `pip install -r requirements.txt`
  - Create `.env` with the vars above
  - Run: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

### E2E Demo (Login → Upload → Result)
1. Frontend
   - In `frontend/`: prepare `.env` (Firebase + `VITE_API_BASE`) and run `npm run dev`.
   - Ensure the Firebase project has an Email/Password user.
2. Backend
   - In `backend/`: create `.env` (see variables above). For local demo:
     - `ENABLE_STORAGE_STUB=true`（不连真实 S3）
     - `DB_URL=sqlite+aiosqlite:///./dev.db`（简化本地）
     - `REDIS_URL=redis://localhost:6379/0`
   - Run API: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
   - Run Worker: `python -m app.workers.runner`
3. Browser Flow
   - 打开 `http://localhost:5173` 登录
   - 进入“上传”，选择一个文本文件 → 创建任务后自动跳转到 `jobs/:id`
   - 在 Job 详情页可看到状态进度、AI 概率、标签、特征摘要与耗时

Health:
- GET `/health` -> `{ "status": "ok" }`

API:
- POST `/api/upload-url`
  - Body: `{ "filename": "a.txt", "contentType": "text/plain" }`
  - Resp: `{ "key": "uploads/uid/uuid_a.txt", "url": "...", "expires_in": 900 }`
- POST `/api/jobs`
  - Body: `{ "s3_key": "uploads/uid/uuid_a.txt", "meta": {...} }`
  - Resp: `{ "id": "job-uuid", "status": "PENDING", ... }`
- GET `/api/jobs`
  - Query: `page`, `status`
  - Resp: `{ "items": [], "page": 1, "status": null }`
- GET `/api/jobs/{id}`
  - Resp: `{ "id": "...", "status": "PENDING" }`

Notes:
- In local dev, S3 upload URL can be stubbed; set `ENABLE_STORAGE_STUB=true` or leave `S3_BUCKET` empty.

### Prerequisites
- Node.js 18+

### Setup
1. Copy environment example and fill values:
   - In `frontend/`:
     - Copy `.env.example` to `.env`
     - Fill Firebase and API base URL:
       - `VITE_FIREBASE_API_KEY`
       - `VITE_FIREBASE_AUTH_DOMAIN`
       - `VITE_FIREBASE_PROJECT_ID`
       - `VITE_FIREBASE_APP_ID`
       - `VITE_API_BASE` (e.g. `http://localhost:8000`)

2. Install dependencies:
   - In `frontend/` run:
     - `npm install`

3. Development server:
   - `npm run dev`
   - Open http://localhost:5173

4. Build & Preview:
   - Build: `npm run build`
   - Preview: `npm run preview`

5. Lint & Typecheck:
   - Lint: `npm run lint`
   - Typecheck: `npm run typecheck`

