import type { NoteDurationBeats, ScaleType } from '../types/music'
import { NOTE_DURATION_OPTIONS } from '../types/music'

export const PROJECT_BEATS = 16
export const BEATS_PER_BAR = 4
export const PIANO_ROLL_STEP_BEATS = 0.5
export const PIANO_ROLL_STEPS = PROJECT_BEATS / PIANO_ROLL_STEP_BEATS
export const STEPS_PER_BEAT = 1 / PIANO_ROLL_STEP_BEATS
export const DEFAULT_NOTE_DURATION_BEATS: NoteDurationBeats = 1
export const MIN_TEMPO = 60
export const MAX_TEMPO = 180

export const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const

const CHROMATIC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10] as const

const FLAT_NOTE_ALIASES: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
}

const SEMITONES_BY_NOTE = CHROMATIC_SHARP.reduce<Record<string, number>>((map, noteName, index) => {
  map[noteName] = index
  return map
}, {})

Object.entries(FLAT_NOTE_ALIASES).forEach(([flatName, sharpName]) => {
  SEMITONES_BY_NOTE[flatName] = SEMITONES_BY_NOTE[sharpName]
})

export const PIANO_ROLL_MIDI_RANGE = {
  highest: 84,
  lowest: 60,
} as const

export const PIANO_ROLL_NOTES = Array.from(
  { length: PIANO_ROLL_MIDI_RANGE.highest - PIANO_ROLL_MIDI_RANGE.lowest + 1 },
  (_, index) => {
    const midi = PIANO_ROLL_MIDI_RANGE.highest - index
    return {
      midi,
      pitch: midiToPitch(midi),
    }
  },
)

export function clampTempo(tempo: number): number {
  if (Number.isNaN(tempo)) {
    return 100
  }

  return Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, Math.round(tempo)))
}

export function normalizeNoteDuration(duration: number): NoteDurationBeats {
  return NOTE_DURATION_OPTIONS.find((option) => option === duration) ?? DEFAULT_NOTE_DURATION_BEATS
}

export function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function midiToPitch(midi: number): string {
  const noteName = CHROMATIC_SHARP[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${noteName}${octave}`
}

export function pitchToMidi(pitch: string): number {
  const match = pitch.match(/^([A-G](?:#|b)?)(-?\d+)$/)
  if (!match) {
    throw new Error(`Invalid pitch: ${pitch}`)
  }

  const [, noteName, octaveText] = match
  const semitone = semitoneForNoteName(noteName)
  const octave = Number(octaveText)

  return (octave + 1) * 12 + semitone
}

export function chordSymbolToMidiNotes(symbol: string, octave = 3): number[] {
  const match = symbol.trim().match(/^([A-G](?:#|b)?)([^/]*)/)
  if (!match) {
    return []
  }

  const [, rootName, qualityText] = match
  const rootMidi = noteNameToMidi(rootName, octave)
  const quality = qualityText.toLowerCase()
  const triadIntervals = getTriadIntervals(quality)
  const extensionIntervals = getExtensionIntervals(quality)

  return [...triadIntervals, ...extensionIntervals].map((interval) => rootMidi + interval)
}

export function chordSymbolToVoicedMidiNotes(symbol: string, octave = 3): number[] {
  const notes = chordSymbolToMidiNotes(symbol, octave)
  if (notes.length === 0) {
    return []
  }

  const voicedNotes = notes.map((note, index) => (index > 0 && note - notes[0] < 5 ? note + 12 : note))

  if (voicedNotes.length === 3) {
    voicedNotes.push(voicedNotes[0] + 12)
  }

  return voicedNotes
    .map((note) => {
      if (note < 50) {
        return note + 12
      }

      if (note > 76) {
        return note - 12
      }

      return note
    })
    .sort((left, right) => left - right)
}

export function buildChordSymbol(key: string, scale: ScaleType, degree: number, suffix: string): string {
  const intervals = scale === 'major' ? MAJOR_SCALE_INTERVALS : MINOR_SCALE_INTERVALS
  const root = transposeNoteName(key, intervals[degree - 1] ?? 0)
  return `${root}${suffix}`
}

export function getScaleMidiNotes(key: string, scale: ScaleType, octave = 4): number[] {
  const intervals = scale === 'major' ? MAJOR_SCALE_INTERVALS : MINOR_SCALE_INTERVALS
  const rootMidi = noteNameToMidi(key, octave)
  return intervals.map((interval) => rootMidi + interval)
}

export function transposeNoteName(noteName: string, semitones: number): string {
  const sourceSemitone = semitoneForNoteName(noteName)
  const targetSemitone = (sourceSemitone + semitones + 120) % 12
  return CHROMATIC_SHARP[targetSemitone]
}

export function beatToStep(beat: number): number {
  return Math.round(beat / PIANO_ROLL_STEP_BEATS)
}

export function stepToBeat(step: number): number {
  return step * PIANO_ROLL_STEP_BEATS
}

export function beatsToSteps(beats: number): number {
  return Math.max(1, Math.round(beats / PIANO_ROLL_STEP_BEATS))
}

export function formatMeasureBeat(beat: number): string {
  const measure = Math.floor(beat / BEATS_PER_BAR) + 1
  const beatWithinMeasure = Math.floor(beat % BEATS_PER_BAR) + 1
  const hasHalfStep = Math.abs(beat - Math.floor(beat)) > 0.001

  return `M${measure} B${beatWithinMeasure}${hasHalfStep ? '+' : ''}`
}

function noteNameToMidi(noteName: string, octave: number): number {
  return (octave + 1) * 12 + semitoneForNoteName(noteName)
}

function semitoneForNoteName(noteName: string): number {
  const normalizedNote = FLAT_NOTE_ALIASES[noteName] ?? noteName
  const semitone = SEMITONES_BY_NOTE[normalizedNote]

  if (semitone === undefined) {
    throw new Error(`Unsupported note name: ${noteName}`)
  }

  return semitone
}

function getTriadIntervals(quality: string): number[] {
  if (quality.includes('dim')) {
    return [0, 3, 6]
  }

  if (quality.includes('aug')) {
    return [0, 4, 8]
  }

  if (quality.includes('sus2')) {
    return [0, 2, 7]
  }

  if (quality.includes('sus')) {
    return [0, 5, 7]
  }

  if (quality.startsWith('m') && !quality.startsWith('maj')) {
    return [0, 3, 7]
  }

  return [0, 4, 7]
}

function getExtensionIntervals(quality: string): number[] {
  if (quality.includes('13')) {
    return [10, 14, 21]
  }

  if (quality.includes('add9') || quality.includes('madd9')) {
    return [14]
  }

  if (quality.includes('maj9')) {
    return [11, 14]
  }

  if (quality.includes('maj7')) {
    return [11]
  }

  if (quality.includes('9')) {
    return [10, 14]
  }

  if (quality.includes('7')) {
    return [10]
  }

  if (quality.includes('6')) {
    return [9]
  }

  return []
}
