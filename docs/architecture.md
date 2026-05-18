# AI Arranger Studio Architecture

AI Arranger Studio is split into a browser app and a small FastAPI AI service. The frontend owns the music editing experience and browser playback. The backend owns API keys, AI provider calls, and safe mock fallback behavior.

## Frontend Architecture

The React app follows a feature-first structure:

- `src/app` contains the app shell and route selection.
- `src/components` contains shared layout, music, and UI primitives.
- `src/features/arranger` contains the arranger domain models, Zustand store, workspace components, and music utility functions.
- `src/lib/audio` isolates Tone.js playback and scheduling.
- `src/lib/ai` exposes the AI client and deterministic local mock arranger.
- `src/lib/storage` owns local project persistence and JSON import/export.
- `src/lib/monitoring` is a placeholder seam for a future browser monitoring SDK.

The main state boundary is `features/arranger/store/arrangerStore.ts`. Components dispatch store actions instead of mutating project data directly. This keeps UI behavior, persistence, playback, and AI application logic easier to test and replace.

## Audio Engine

Playback is browser-only and currently uses Tone.js. `lib/audio/arrangementPlayer.ts` schedules generated synth sounds for chords and melody:

- Chords are converted from chord symbols into voiced MIDI notes.
- Melody notes are scheduled from `NoteEvent` data.
- Tempo is read from the current `MusicProject`.
- Stop cancels scheduled transport events so playback can restart cleanly.

The audio layer intentionally does not know about React components. Future MIDI export, multi-track playback, and sampled instruments should extend this library boundary instead of coupling scheduling logic to UI components.

## AI Service

The frontend calls `lib/ai/arrangerClient.ts` for all suggestions. That client tries the FastAPI backend first and falls back to local deterministic mocks if the backend is unavailable or returns an invalid shape.

The backend lives in `backend/app`:

- `main.py` creates the FastAPI app, health endpoint, CORS config, and monitoring placeholder.
- `routers/ai.py` exposes chord, melody, bass, and drum suggestion endpoints.
- `models/music.py` defines Pydantic request and response models.
- `services/ai_service.py` selects the AI provider, validates structured responses, and falls back to mocks.
- `services/mock_arranger.py` keeps backend mock suggestions deterministic.

API keys are loaded only from backend environment variables. No paid AI keys or provider calls are made from the browser.

## Storage Strategy

Current persistence is local-first:

- `localStorage` saves one current project.
- JSON export/import allows manual backup and sharing.
- The project data shape is plain JSON, so it can later move to a database with minimal migration.

The next storage step should be backend project persistence with versioned project documents. A practical path is:

1. Keep localStorage as an offline draft cache.
2. Add authenticated backend project CRUD.
3. Store projects in a document database such as MongoDB Atlas or PostgreSQL JSONB.
4. Add migration helpers when the `MusicProject` schema changes.

## Error Monitoring

Phase 4 adds monitoring placeholders without adding a vendor dependency:

- Frontend: `VITE_ERROR_MONITORING_DSN` and `src/lib/monitoring/errorMonitoring.ts`.
- Backend: `ERROR_MONITORING_DSN` and `backend/app/services/monitoring.py`.

The placeholder functions are intentionally tiny. When a provider is selected, replace the console/logging internals with that provider's SDK initialization and capture calls.

## Future Cloud Deployment

A small production deployment can stay simple:

- Frontend: static build on Cloudflare Pages, Azure Static Web Apps, Netlify, or Vercel.
- Backend: FastAPI on Azure Container Apps, Azure App Service, Render, Fly.io, or a small VM.
- Secrets: backend environment variables only.
- Database: MongoDB Atlas or managed PostgreSQL for saved projects.
- Object storage: later, for exported MIDI files, audio renders, and stems.
- CI/CD: GitHub Actions for lint, format, test, build, and deployment gates.

Keep the frontend and backend deployable independently. That preserves the current local fallback behavior and avoids making the music editor unusable when the AI service is temporarily offline.
