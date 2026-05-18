import type { ChordEvent, DrumEvent, MusicProject, NoteEvent } from '../../features/arranger/types/music'
import {
  ARRANGEMENT_STYLES,
  INSTRUMENT_TYPES,
  NOTE_DURATION_OPTIONS,
  SCALE_TYPES,
} from '../../features/arranger/types/music'
import { clampTempo, createId, midiToPitch } from '../../features/arranger/utils/musicTheory'

const STORAGE_KEY = 'ai-arranger-studio.project.v1'

export function saveProject(project: MusicProject): void {
  try {
    getLocalStorage().setItem(STORAGE_KEY, JSON.stringify(project))
  } catch (error) {
    // QuotaExceededError or private-mode browsers can throw here.
    throw new Error(
      `Unable to save project: ${error instanceof Error ? error.message : 'storage unavailable'}`,
      { cause: error },
    )
  }
}

export function loadProject(): MusicProject | null {
  let raw: string | null
  try {
    raw = getLocalStorage().getItem(STORAGE_KEY)
  } catch (error) {
    throw new Error('Unable to read from local storage.', { cause: error })
  }

  if (!raw) {
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Saved project data is corrupted (invalid JSON).')
  }

  const project = parseProjectValue(parsed)
  if (!project) {
    throw new Error('Saved project data is not compatible with AI Arranger Studio.')
  }

  return project
}

export function parseProjectJson(projectJson: string): MusicProject {
  const parsedProject = parseProjectValue(JSON.parse(projectJson) as unknown)
  if (!parsedProject) {
    throw new Error('Imported JSON is not a valid AI Arranger Studio project.')
  }

  return parsedProject
}

export function clearProject(): void {
  try {
    getLocalStorage().removeItem(STORAGE_KEY)
  } catch {
    throw new Error('Unable to clear local storage.')
  }
}

function getLocalStorage(): Storage {
  if (typeof window === 'undefined') {
    throw new Error('Local project storage is only available in the browser.')
  }

  return window.localStorage
}

function parseProjectValue(value: unknown): MusicProject | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.title !== 'string' ||
    typeof value.key !== 'string' ||
    typeof value.tempo !== 'number' ||
    !Array.isArray(value.chords) ||
    !Array.isArray(value.melody)
  ) {
    return null
  }

  return {
    id: typeof value.id === 'string' ? value.id : createId('project'),
    title: value.title,
    tempo: clampTempo(value.tempo),
    key: value.key,
    scale: SCALE_TYPES.find((scale) => scale === value.scale) ?? 'major',
    style: ARRANGEMENT_STYLES.find((style) => style === value.style) ?? 'pop',
    instrument: INSTRUMENT_TYPES.find((instrument) => instrument === value.instrument) ?? 'synth',
    selectedNoteDurationBeats:
      NOTE_DURATION_OPTIONS.find((duration) => duration === value.selectedNoteDurationBeats) ?? 1,
    chords: value.chords.map(parseChordEvent).filter((chord): chord is ChordEvent => chord !== null),
    melody: value.melody.map(parseNoteEvent).filter((note): note is NoteEvent => note !== null),
    bass: Array.isArray(value.bass)
      ? value.bass.map(parseNoteEvent).filter((note): note is NoteEvent => note !== null)
      : [],
    drums: Array.isArray(value.drums)
      ? value.drums.map(parseDrumEvent).filter((event): event is DrumEvent => event !== null)
      : [],
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseChordEvent(value: unknown): ChordEvent | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.symbol !== 'string' ||
    typeof value.startBeat !== 'number' ||
    typeof value.durationBeats !== 'number'
  ) {
    return null
  }

  return {
    id: typeof value.id === 'string' ? value.id : createId('chord'),
    symbol: value.symbol,
    startBeat: value.startBeat,
    durationBeats: value.durationBeats,
  }
}

function parseNoteEvent(value: unknown): NoteEvent | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.midi !== 'number' ||
    typeof value.startBeat !== 'number' ||
    typeof value.durationBeats !== 'number'
  ) {
    return null
  }

  // Always derive pitch from midi so the two fields stay consistent.
  return {
    id: typeof value.id === 'string' ? value.id : createId('note'),
    pitch: midiToPitch(value.midi),
    midi: value.midi,
    startBeat: value.startBeat,
    durationBeats: value.durationBeats,
    velocity: typeof value.velocity === 'number' ? value.velocity : 0.82,
  }
}

function parseDrumEvent(value: unknown): DrumEvent | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.startBeat !== 'number' ||
    typeof value.durationBeats !== 'number' ||
    typeof value.velocity !== 'number'
  ) {
    return null
  }

  const DRUM_VOICES = ['kick', 'snare', 'closedHat', 'openHat'] as const
  const voice = DRUM_VOICES.find((v) => v === value.voice)
  if (!voice) {
    return null
  }

  return {
    id: typeof value.id === 'string' ? value.id : createId('drum'),
    voice,
    startBeat: value.startBeat,
    durationBeats: value.durationBeats,
    velocity: value.velocity,
  }
}
