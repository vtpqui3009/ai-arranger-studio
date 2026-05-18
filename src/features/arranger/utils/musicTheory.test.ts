import { describe, expect, it } from 'vitest'
import {
  chordSymbolToVoicedMidiNotes,
  formatMeasureBeat,
  midiToPitch,
  normalizeNoteDuration,
  pitchToMidi,
} from './musicTheory'

describe('music theory utilities', () => {
  it('converts between MIDI numbers and pitch names', () => {
    expect(midiToPitch(60)).toBe('C4')
    expect(midiToPitch(61)).toBe('C#4')
    expect(pitchToMidi('Eb4')).toBe(63)
  })

  it('normalizes unsupported note durations to the default value', () => {
    expect(normalizeNoteDuration(0.5)).toBe(0.5)
    expect(normalizeNoteDuration(3)).toBe(1)
  })

  it('formats measure and beat labels for whole and half beats', () => {
    expect(formatMeasureBeat(0)).toBe('M1 B1')
    expect(formatMeasureBeat(4.5)).toBe('M2 B1+')
  })

  it('builds playable voiced chord notes', () => {
    const notes = chordSymbolToVoicedMidiNotes('Cmaj9', 3)

    expect(notes.length).toBeGreaterThanOrEqual(4)
    expect(notes.every((midi) => midi >= 50 && midi <= 76)).toBe(true)
  })
})
