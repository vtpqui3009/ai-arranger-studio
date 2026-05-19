import type { ChordEvent, DrumEvent, MusicProject, NoteEvent } from '../../features/arranger/types/music'
import {
  ARRANGEMENT_STYLES,
  INSTRUMENT_TYPES,
  NOTE_DURATION_OPTIONS,
  PROJECT_SCHEMA_VERSION,
  SCALE_TYPES,
} from '../../features/arranger/types/music'
import { clampTempo, createId, midiToPitch } from '../../features/arranger/utils/musicTheory'
import type { MixerState, TrackMixSettings } from '../../features/mixer/types/mixer'
import { DEFAULT_MIXER_STATE, TRACK_TYPES } from '../../features/mixer/types/mixer'
import type { ClipTrackEvent, SoundClip, SoundClipSource } from '../../features/soundLibrary/types/soundClip'
import { SOUND_CATEGORIES } from '../../features/soundLibrary/types/soundClip'

const STORAGE_KEY = 'ai-arranger-studio.project.v1'

export function saveProject(project: MusicProject): void {
  try {
    getLocalStorage().setItem(STORAGE_KEY, JSON.stringify(project))
  } catch (error) {
    // QuotaExceededError or private-mode browsers can throw here.
    throw new Error(`Unable to save project: ${error instanceof Error ? error.message : 'storage unavailable'}`, {
      cause: error,
    })
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

  const project = parseProjectValue(parsed).project
  if (!project) {
    throw new Error('Saved project data is not compatible with AI Arranger Studio.')
  }

  return project
}

export function parseProjectJson(projectJson: string): MusicProject {
  let parsedValue: unknown
  try {
    parsedValue = JSON.parse(projectJson)
  } catch {
    throw new Error('Invalid JSON file. Choose a valid AI Arranger Studio project export.')
  }

  const parsedProject = parseProjectValue(parsedValue, { strictEvents: true })
  if (!parsedProject.project) {
    throw new Error(parsedProject.error ?? 'Imported JSON is not a valid AI Arranger Studio project.')
  }

  return parsedProject.project
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

type ParseProjectOptions = {
  strictEvents?: boolean
}

type ParseProjectResult = {
  project: MusicProject | null
  error?: string
}

function parseProjectValue(value: unknown, options: ParseProjectOptions = {}): ParseProjectResult {
  if (!isRecord(value)) {
    return { project: null, error: 'Imported project must be a JSON object.' }
  }

  if (
    typeof value.title !== 'string' ||
    typeof value.key !== 'string' ||
    typeof value.tempo !== 'number' ||
    !Array.isArray(value.chords) ||
    !Array.isArray(value.melody)
  ) {
    return { project: null, error: 'Imported project is missing required arrangement data.' }
  }

  const chords = parseEventArray(value.chords, parseChordEvent, 'chord', options.strictEvents)
  const melody = parseEventArray(value.melody, parseNoteEvent, 'melody', options.strictEvents)
  const bass = Array.isArray(value.bass)
    ? parseEventArray(value.bass, parseNoteEvent, 'bass', options.strictEvents)
    : { events: [] }
  const drums = Array.isArray(value.drums)
    ? parseEventArray(value.drums, parseDrumEvent, 'drum', options.strictEvents)
    : { events: [] }
  const clips = Array.isArray(value.clips)
    ? parseEventArray(value.clips, parseClipTrackEvent, 'clip', options.strictEvents)
    : { events: [] }
  const userClips = Array.isArray(value.userClips)
    ? parseEventArray(value.userClips, parseSoundClip, 'user clip', options.strictEvents)
    : { events: [] }
  const eventError = chords.error ?? melody.error ?? bass.error ?? drums.error ?? clips.error ?? userClips.error
  if (eventError) {
    return { project: null, error: eventError }
  }

  return {
    project: {
      id: typeof value.id === 'string' ? value.id : createId('project'),
      title: value.title,
      tempo: clampTempo(value.tempo),
      key: value.key,
      scale: SCALE_TYPES.find((scale) => scale === value.scale) ?? 'major',
      style: ARRANGEMENT_STYLES.find((style) => style === value.style) ?? 'pop',
      instrument: INSTRUMENT_TYPES.find((instrument) => instrument === value.instrument) ?? 'synth',
      selectedNoteDurationBeats:
        NOTE_DURATION_OPTIONS.find((duration) => duration === value.selectedNoteDurationBeats) ?? 1,
      chords: chords.events,
      melody: melody.events,
      bass: bass.events,
      drums: drums.events,
      clips: clips.events,
      userClips: userClips.events,
      mixer: parseMixerState(value.mixer),
      schemaVersion: typeof value.schemaVersion === 'number' ? value.schemaVersion : PROJECT_SCHEMA_VERSION,
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseEventArray<Event>(
  values: unknown[],
  parser: (value: unknown) => Event | null,
  label: string,
  strictEvents = false,
): { events: Event[]; error?: string } {
  const events: Event[] = []

  for (const value of values) {
    const event = parser(value)
    if (!event) {
      if (strictEvents) {
        return { events: [], error: `Imported project contains an invalid ${label} event.` }
      }
      continue
    }
    events.push(event)
  }

  return { events }
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

function parseClipTrackEvent(value: unknown): ClipTrackEvent | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.clipId !== 'string' ||
    typeof value.startBeat !== 'number' ||
    typeof value.gain !== 'number'
  ) {
    return null
  }

  return {
    id: value.id,
    clipId: value.clipId,
    startBeat: value.startBeat,
    gain: Math.min(1, Math.max(0, value.gain)),
    muted: typeof value.muted === 'boolean' ? value.muted : false,
  }
}

const VALID_SOURCES: SoundClipSource[] = ['catalog-synth', 'ai-generated']

function parseSoundClip(value: unknown): SoundClip | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.durationBeats !== 'number' ||
    typeof value.referenceBpm !== 'number'
  ) {
    return null
  }
  const category = SOUND_CATEGORIES.find((c) => c === value.category)
  if (!category) return null
  const source = VALID_SOURCES.find((s) => s === value.source)
  if (!source) return null
  const style = ARRANGEMENT_STYLES.find((s) => s === value.style) ?? null
  const tags = Array.isArray(value.tags) ? value.tags.filter((t): t is string => typeof t === 'string') : []

  return {
    id: value.id,
    name: value.name,
    category,
    style,
    tags,
    durationBeats: value.durationBeats,
    referenceBpm: value.referenceBpm,
    source,
    aliasSourceId: typeof value.aliasSourceId === 'string' ? value.aliasSourceId : undefined,
  }
}

function parseMixerState(value: unknown): MixerState {
  if (!isRecord(value)) {
    return DEFAULT_MIXER_STATE
  }

  return TRACK_TYPES.reduce<MixerState>((mixer, track) => {
    const settings = value[track]
    mixer[track] = parseTrackMixSettings(settings) ?? DEFAULT_MIXER_STATE[track]
    return mixer
  }, {} as MixerState)
}

function parseTrackMixSettings(value: unknown): TrackMixSettings | null {
  if (!isRecord(value) || typeof value.volume !== 'number' || typeof value.muted !== 'boolean') {
    return null
  }

  return {
    volume: Math.min(100, Math.max(0, value.volume)),
    muted: value.muted,
    solo: typeof value.solo === 'boolean' ? value.solo : false,
  }
}
