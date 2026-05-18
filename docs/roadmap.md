# AI Arranger Studio Roadmap

This roadmap favors small learning-focused phases that keep the app runnable.

## Phase 1 - MVP Foundation

- React, TypeScript, Vite, Tailwind, Zustand, and Tone.js.
- Landing page, studio workspace, project controls, chord editor, piano roll, local save/load, and mock AI suggestions.
- Browser playback for chords and melody.

## Phase 2 - Sequencer Usability

- Measure and beat labels.
- Note duration selection.
- Instrument selection.
- Better chord voicing.
- AI suggestion history.
- JSON export/import.
- Demo project.

## Phase 3 - Backend AI Integration

- FastAPI service with Pydantic models.
- Server-side AI provider integration.
- Environment-only API keys.
- Safe mock fallback when no key is configured.
- Frontend AI client with backend fallback to local mocks.

## Phase 4 - Production Readiness

- GitHub Actions CI for frontend and backend.
- Prettier, ESLint, Ruff, and basic unit tests.
- Error monitoring placeholders.
- Architecture, deployment, roadmap, and learning-offers documentation.

## Recommended Phase 5 - Deeper Music Editing

- Drag and resize notes in the piano roll.
- Separate editable bass and drum tracks.
- Velocity editing.
- Undo and redo for project edits.
- Keyboard shortcuts for common sequencing actions.

## Recommended Phase 6 - Project Persistence

- Authenticated user accounts.
- Backend project CRUD endpoints.
- Cloud database storage.
- Project versioning and schema migrations.
- Import/export compatibility tests.

## Recommended Phase 7 - Music Export

- MIDI export.
- Better arrangement sections: intro, verse, chorus, bridge, outro.
- Track mute and solo.
- Basic mix controls per track.
- Optional audio render workflow.

## Recommended Phase 8 - AI Quality

- Prompt evaluation fixtures.
- Suggestion quality checks for range, rhythm density, and harmonic fit.
- User feedback on suggestions.
- Style presets that generate more distinctive musical patterns.
- Background jobs for longer arrangement generation.
