# AI Arranger Studio

[![Frontend CI](../../actions/workflows/frontend-ci.yml/badge.svg)](../../actions/workflows/frontend-ci.yml)
[![Backend CI](../../actions/workflows/backend-ci.yml/badge.svg)](../../actions/workflows/backend-ci.yml)

AI Arranger Studio is a browser-based music arranging MVP for beginners and semi-professional creators. It lets you sketch a short song idea with chords, melody notes, tempo, key, scale, style, and instrument, then use AI-assisted arrangement suggestions with safe local and backend mock fallbacks.

The current app includes a React frontend, optional FastAPI backend, browser synth playback, JSON import/export, CI checks, basic tests, and production-readiness documentation. There are no paid API calls in the frontend and no copyrighted samples.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- Zustand for project and playback state
- Tone.js for browser synth playback
- FastAPI + Pydantic for backend AI suggestions
- Optional OpenAI backend provider with mock fallback
- LocalStorage for MVP persistence
- ESLint, Prettier, Vitest, Ruff, Pytest
- GitHub Actions CI

## Frontend Setup

```bash
npm install
npm run dev
npm run build
```

On Windows PowerShell, if script execution blocks `npm`, use `npm.cmd`:

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

Frontend quality checks:

```bash
npm run format:check
npm run lint
npm run test
npm run build
```

## Backend Setup

The backend is optional during local development. If it is not running, the frontend falls back to local mock suggestions.

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

To enable real AI suggestions, set `OPENAI_API_KEY` in `backend/.env`. API keys must stay in backend environment variables only. The frontend can optionally set `VITE_AI_BACKEND_URL` in a root `.env` file; by default it uses `http://127.0.0.1:8000`.

Backend quality checks:

```bash
cd backend
python -m ruff format --check .
python -m ruff check .
python -m pytest tests
python -m compileall .
```

Backend endpoints:

- `GET /health`
- `POST /api/ai/suggest-chords`
- `POST /api/ai/suggest-melody`
- `POST /api/ai/suggest-bass`
- `POST /api/ai/suggest-drums`

## Current Features

- Landing page and responsive dark studio workspace
- Project metadata editing: title, tempo, key, scale, style, and instrument
- Chord progression timeline with measure and beat labels
- Piano roll grid with half-beat placement and click-to-add/remove editing
- Note duration selection: 1/2 beat, 1 beat, 2 beats, and 4 beats
- Instrument selection: synth, piano-like synth, bass synth, and pad
- Tone.js playback for chords and melody using generated synth sounds
- Chord voicing and subtle strummed scheduling
- AI suggestion panel for chords, melody, bass, and drums
- Backend AI suggestion client with validated responses
- Safe frontend fallback to local mock suggestions when the backend is unavailable
- Safe backend fallback to mock suggestions when no API key is configured
- AI suggestion history with selectable previous suggestions and applied-state badges
- Apply suggested chord progressions and melody variations
- Save, load, clear, export, and import project JSON
- Demo project with varied note durations and a piano-like lead sound
- Error monitoring placeholders for future frontend/backend SDK integration
- GitHub Actions CI workflows for frontend and backend checks
- Basic frontend and backend unit tests

## Project Structure

```text
src/
  app/
  components/
  features/
    arranger/
  lib/
    audio/
    ai/
    monitoring/
    storage/
  main.tsx

backend/
  app/
    main.py
    models/
    routers/
    services/
  tests/
  requirements.txt

docs/
```

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [Roadmap](docs/roadmap.md)
- [GitHub Education Offers](docs/github-education-offers.md)

## Architecture Notes

- `features/arranger/types/music.ts` owns the main domain models.
- `features/arranger/store/arrangerStore.ts` keeps UI state and project mutations in a predictable Zustand store.
- `lib/audio/arrangementPlayer.ts` isolates Tone.js scheduling.
- `lib/ai/arrangerClient.ts` calls the backend AI API, validates suggestion shape, and falls back to local mocks.
- `lib/storage/projectStorage.ts` keeps persistence and JSON import parsing behind a tiny API.
- `backend/app/services/ai_service.py` contains provider selection and structured-response validation.

## Next Roadmap

1. Add note drag, resize, velocity editing, and undo/redo.
2. Add separate editable tracks for bass and drums.
3. Add backend project persistence and authentication.
4. Add MIDI export.
5. Add prompt evaluation fixtures for AI suggestion quality.
