import type { ChordEvent, MusicProject, NoteEvent } from '../../features/arranger/types/music'
import {
  ARRANGEMENT_STYLES,
  INSTRUMENT_TYPES,
  NOTE_DURATION_OPTIONS,
  SCALE_TYPES,
} from '../../features/arranger/types/music'
import { clampTempo, createId, midiToPitch } from '../../features/arranger/utils/musicTheory'

const STORAGE_KEY = 'ai-arranger-studio.project.v1'

export function saveProject(project: MusicProject): void {
  getLocalStorage().setItem(STORAGE_KEY, JSON.stringify(project))
}

export function loadProject(): MusicProject | null {
  const savedProject = getLocalStorage().getItem(STORAGE_KEY)
  if (!savedProject) {
    return null
  }

  const parsedProject = parseProjectValue(JSON.parse(savedProject) as unknown)
  if (!parsedProject) {
    throw new Error('Saved project data is not compatible with AI Arranger Studio.')
  }

  return parsedProject
}

export function parseProjectJson(projectJson: string): MusicProject {
  const parsedProject = parseProjectValue(JSON.parse(projectJson) as unknown)
  if (!parsedProject) {
    throw new Error('Imported JSON is not a valid AI Arranger Studio project.')
  }

  return parsedProject
}

export function clearProject(): void {
  getLocalStorage().removeItem(STORAGE_KEY)
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

  return {
    id: typeof value.id === 'string' ? value.id : createId('note'),
    pitch: typeof value.pitch === 'string' ? value.pitch : midiToPitch(value.midi),
    midi: value.midi,
    startBeat: value.startBeat,
    durationBeats: value.durationBeats,
    velocity: typeof value.velocity === 'number' ? value.velocity : 0.82,
  }
}
