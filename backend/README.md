# AI Arranger Studio Backend

FastAPI backend for AI suggestion development. It returns deterministic mock suggestions by default and can optionally use a real OpenAI model when `OPENAI_API_KEY` is configured on the backend.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

API keys must stay in `backend/.env` or server environment variables. The frontend never receives provider keys and does not need to know which provider produced a suggestion.

## Run

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The frontend defaults to `http://127.0.0.1:8000`. To point it explicitly at the backend, add this to a root `.env` file:

```bash
VITE_AI_BACKEND_URL=http://127.0.0.1:8000
```

If the backend is unavailable, the frontend still falls back to local mock suggestions.

## Optional OpenAI Provider

By default, no paid AI provider is called. To enable real backend suggestions, set these values in `backend/.env`:

```bash
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-4o-mini
```

All provider responses are parsed into the existing Pydantic suggestion models before they are returned to the frontend. If the provider is unavailable or returns malformed data, the backend logs the error and returns a deterministic mock suggestion with the same response shape.

## Endpoints

- `GET /health`
- `POST /api/ai/suggest-chords`
- `POST /api/ai/suggest-melody`
- `POST /api/ai/suggest-bass`
- `POST /api/ai/suggest-drums`

All suggestion endpoints accept:

```json
{
  "project": {
    "id": "project-id",
    "title": "Sketch",
    "tempo": 100,
    "key": "C",
    "scale": "major",
    "style": "pop",
    "instrument": "synth",
    "selectedNoteDurationBeats": 1,
    "chords": [],
    "melody": [],
    "bass": [],
    "drums": [],
    "updatedAt": "2026-05-19T00:00:00.000Z"
  }
}
```

Responses use the same chord, note, drum, and suggestion shapes as the frontend domain model.
