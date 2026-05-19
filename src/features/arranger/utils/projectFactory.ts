import type { ChordEvent, MusicProject, NoteDurationBeats, NoteEvent } from '../types/music'
import { PROJECT_SCHEMA_VERSION } from '../types/music'
import { DEFAULT_MIXER_STATE } from '../../mixer/types/mixer'
import { BEATS_PER_BAR, DEFAULT_NOTE_DURATION_BEATS, PROJECT_BEATS, createId, midiToPitch } from './musicTheory'

const DEFAULT_CHORDS = ['Cmaj7', 'Am7', 'Fmaj7', 'G7'] as const
const DEMO_MELODY = [
  { midi: 64, startBeat: 0, durationBeats: 1 },
  { midi: 67, startBeat: 1, durationBeats: 0.5 },
  { midi: 71, startBeat: 1.5, durationBeats: 0.5 },
  { midi: 72, startBeat: 2.5, durationBeats: 1.5 },
  { midi: 69, startBeat: 4, durationBeats: 1 },
  { midi: 67, startBeat: 5.5, durationBeats: 0.5 },
  { midi: 64, startBeat: 6, durationBeats: 1 },
  { midi: 62, startBeat: 7, durationBeats: 1 },
  { midi: 64, startBeat: 8, durationBeats: 2 },
  { midi: 67, startBeat: 10.5, durationBeats: 0.5 },
  { midi: 69, startBeat: 12, durationBeats: 1 },
  { midi: 72, startBeat: 14, durationBeats: 2 },
] as const

export function createNoteEvent(
  midi: number,
  startBeat: number,
  durationBeats: NoteDurationBeats | number = DEFAULT_NOTE_DURATION_BEATS,
  velocity = 0.82,
): NoteEvent {
  return {
    id: createId('note'),
    pitch: midiToPitch(midi),
    midi,
    startBeat,
    durationBeats,
    velocity,
  }
}

export function createChordEvent(symbol: string, startBeat: number, durationBeats = BEATS_PER_BAR): ChordEvent {
  return {
    id: createId('chord'),
    symbol,
    startBeat,
    durationBeats,
  }
}

export function createChordGrid(symbols: readonly string[]): ChordEvent[] {
  const chordDuration = PROJECT_BEATS / symbols.length
  return symbols.map((symbol, index) => createChordEvent(symbol, index * chordDuration, chordDuration))
}

export function createDemoProject(): MusicProject {
  return {
    id: createId('project'),
    title: 'Midnight Sketch',
    tempo: 92,
    key: 'C',
    scale: 'major',
    style: 'lofi',
    instrument: 'piano',
    selectedNoteDurationBeats: 1,
    chords: createChordGrid(DEFAULT_CHORDS),
    melody: DEMO_MELODY.map((note) => createNoteEvent(note.midi, note.startBeat, note.durationBeats)),
    bass: [],
    drums: [],
    clips: [],
    userClips: [],
    mixer: DEFAULT_MIXER_STATE,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  }
}

export function createEmptyProject(): MusicProject {
  return {
    id: createId('project'),
    title: 'Untitled Arrangement',
    tempo: 100,
    key: 'C',
    scale: 'major',
    style: 'pop',
    instrument: 'synth',
    selectedNoteDurationBeats: 1,
    chords: createChordGrid(['C', 'G', 'Am', 'F']),
    melody: [],
    bass: [],
    drums: [],
    clips: [],
    userClips: [],
    mixer: DEFAULT_MIXER_STATE,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  }
}
