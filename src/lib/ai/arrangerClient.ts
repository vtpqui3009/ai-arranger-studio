import type {
  ArrangerSuggestion,
  ChordEvent,
  DrumEvent,
  MusicProject,
  NoteEvent,
} from '../../features/arranger/types/music'
import { suggestBassLine, suggestChordProgression, suggestDrumGroove, suggestMelodyVariation } from './mockArranger'
import { captureError } from '../monitoring/errorMonitoring'

const DEFAULT_BACKEND_URL = 'http://127.0.0.1:8000'
const BACKEND_URL = getBackendUrl()
const REQUEST_TIMEOUT_MS = 15_000

export type AISuggestionSource = 'backend-openai' | 'backend-mock' | 'local-mock'

export type AISuggestionResult = {
  suggestion: ArrangerSuggestion
  source: AISuggestionSource
  warning?: string
}

type BackendSource = 'openai' | 'mock'

type BackendSuggestionResponse = {
  suggestion: ArrangerSuggestion
  source: BackendSource
  warning?: string | null
}

export async function requestChordSuggestion(
  project: MusicProject,
  signal?: AbortSignal,
): Promise<AISuggestionResult> {
  return requestSuggestion('/api/ai/suggest-chords', project, () =>
    suggestChordProgression(project.key, project.scale, project.style), signal,
  )
}

export async function requestMelodySuggestion(
  project: MusicProject,
  signal?: AbortSignal,
): Promise<AISuggestionResult> {
  return requestSuggestion('/api/ai/suggest-melody', project, () => suggestMelodyVariation(project), signal)
}

export async function requestBassSuggestion(
  project: MusicProject,
  signal?: AbortSignal,
): Promise<AISuggestionResult> {
  return requestSuggestion('/api/ai/suggest-bass', project, () => suggestBassLine(project), signal)
}

export async function requestDrumSuggestion(
  project: MusicProject,
  signal?: AbortSignal,
): Promise<AISuggestionResult> {
  return requestSuggestion('/api/ai/suggest-drums', project, () => suggestDrumGroove(project.style), signal)
}

async function requestSuggestion(
  endpoint: string,
  project: MusicProject,
  fallback: () => ArrangerSuggestion,
  callerSignal?: AbortSignal,
): Promise<AISuggestionResult> {
  const signal = mergeAbortSignals(callerSignal, REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
      signal,
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}.`)
    }

    const parsedResponse = parseBackendSuggestionResponse(await response.json())
    if (!parsedResponse) {
      throw new Error('Backend returned an invalid suggestion shape.')
    }

    return {
      suggestion: parsedResponse.suggestion,
      source: parsedResponse.source === 'openai' ? 'backend-openai' : 'backend-mock',
      warning: parsedResponse.warning ?? undefined,
    }
  } catch (error) {
    // Do not fall back when the caller intentionally cancelled the request.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    captureError(error, { area: 'ai-client', endpoint })

    return {
      suggestion: fallback(),
      source: 'local-mock',
      warning: error instanceof Error ? error.message : 'Backend AI request failed.',
    }
  }
}

/**
 * Returns a single AbortSignal that fires on the first of: timeout or caller abort.
 * Uses AbortSignal.any() when available, otherwise falls back to a manual controller.
 */
function mergeAbortSignals(callerSignal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)

  if (!callerSignal) {
    return timeoutSignal
  }

  // AbortSignal.any is available in modern browsers and Node 20+.
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([callerSignal, timeoutSignal])
  }

  // Fallback: wire them together manually.
  const controller = new AbortController()
  const abort = () => controller.abort()
  callerSignal.addEventListener('abort', abort, { once: true })
  timeoutSignal.addEventListener('abort', abort, { once: true })
  return controller.signal
}

function parseBackendSuggestionResponse(value: unknown): BackendSuggestionResponse | null {
  if (!isRecord(value)) {
    return null
  }

  if ((value.source !== 'openai' && value.source !== 'mock') || !isArrangerSuggestion(value.suggestion)) {
    return null
  }

  return {
    suggestion: value.suggestion,
    source: value.source,
    warning: typeof value.warning === 'string' ? value.warning : null,
  }
}

function isArrangerSuggestion(value: unknown): value is ArrangerSuggestion {
  if (!isRecord(value) || typeof value.title !== 'string' || typeof value.explanation !== 'string') {
    return false
  }

  if (value.kind === 'chords') {
    return Array.isArray(value.chords) && value.chords.every(isChordEvent)
  }

  if (value.kind === 'melody' || value.kind === 'bass') {
    return Array.isArray(value.notes) && value.notes.every(isNoteEvent)
  }

  if (value.kind === 'drums') {
    return Array.isArray(value.pattern) && value.pattern.every(isDrumEvent)
  }

  return false
}

function isChordEvent(value: unknown): value is ChordEvent {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.symbol === 'string' &&
    typeof value.startBeat === 'number' &&
    typeof value.durationBeats === 'number'
  )
}

function isNoteEvent(value: unknown): value is NoteEvent {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.pitch === 'string' &&
    typeof value.midi === 'number' &&
    typeof value.startBeat === 'number' &&
    typeof value.durationBeats === 'number' &&
    typeof value.velocity === 'number'
  )
}

function isDrumEvent(value: unknown): value is DrumEvent {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (value.voice === 'kick' || value.voice === 'snare' || value.voice === 'closedHat' || value.voice === 'openHat') &&
    typeof value.startBeat === 'number' &&
    typeof value.durationBeats === 'number' &&
    typeof value.velocity === 'number'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getBackendUrl(): string {
  const configuredUrl = import.meta.env.VITE_AI_BACKEND_URL as string | undefined
  return (configuredUrl?.trim() || DEFAULT_BACKEND_URL).replace(/\/$/, '')
}
