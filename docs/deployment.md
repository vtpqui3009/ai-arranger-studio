# Deployment Guide

This is a lightweight deployment plan for the current frontend-plus-backend app.

## Local Production Check

Frontend:

```bash
npm install
npm run format:check
npm run lint
npm run test
npm run build
```

Backend:

```bash
cd backend
python -m pip install -r requirements.txt
python -m ruff format --check .
python -m ruff check .
python -m pytest tests
python -m compileall .
```

## Environment Variables

Frontend:

- `VITE_AI_BACKEND_URL`: public URL of the FastAPI backend.
- `VITE_ERROR_MONITORING_DSN`: optional placeholder for future browser monitoring.

Backend:

- `OPENAI_API_KEY`: optional AI provider key. If omitted, the backend returns mock suggestions.
- `OPENAI_MODEL`: optional model name.
- `AI_ALLOWED_ORIGINS`: comma-separated frontend origins for CORS.
- `ERROR_MONITORING_DSN`: optional placeholder for future backend monitoring.

## Frontend Deployment

Build output is generated in `dist`.

Good MVP hosts:

- Cloudflare Pages
- Azure Static Web Apps
- Netlify
- Vercel
- GitHub Pages for frontend-only demos

Set `VITE_AI_BACKEND_URL` during the frontend build so deployed users call the deployed backend instead of localhost.

## Backend Deployment

Good MVP hosts:

- Azure Container Apps
- Azure App Service
- Render
- Fly.io
- A small VM running Uvicorn behind a reverse proxy

Production command example:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

For a container deployment, run that command from the `backend` directory after installing `backend/requirements.txt`.

## Release Checklist

- CI passes on the target branch.
- Frontend `VITE_AI_BACKEND_URL` points at the deployed backend.
- Backend `AI_ALLOWED_ORIGINS` includes the deployed frontend origin.
- No API keys are present in frontend files, Git history, or logs.
- `/health` returns `status: ok`.
- AI endpoints return either `source: openai` or safe `source: mock` responses.
- Import/export still works in the deployed browser.

## Future Deployment Enhancements

- Add a Dockerfile for the backend.
- Add preview deployments for pull requests.
- Add database migrations once cloud persistence exists.
- Add Sentry or another monitoring provider using the existing placeholder seam.
- Add uptime checks against `/health`.
