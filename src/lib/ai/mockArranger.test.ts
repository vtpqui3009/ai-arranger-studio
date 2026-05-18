import { describe, expect, it } from 'vitest'
import { createDemoProject } from '../../features/arranger/utils/projectFactory'
import { PROJECT_BEATS } from '../../features/arranger/utils/musicTheory'
import { suggestChordProgression, suggestDrumGroove, suggestMelodyVariation } from './mockArranger'

describe('mock arranger suggestions', () => {
  it('creates a four-bar chord progression for the selected key and style', () => {
    const suggestion = suggestChordProgression('D', 'minor', 'cinematic')

    expect(suggestion.kind).toBe('chords')
    expect(suggestion.chords).toHaveLength(4)
    expect(suggestion.chords[0].symbol).toMatch(/^D/)
  })

  it('keeps melody variation notes inside the project loop', () => {
    const project = createDemoProject()
    const suggestion = suggestMelodyVariation(project)

    expect(suggestion.kind).toBe('melody')
    expect(suggestion.notes.length).toBeGreaterThan(0)
    expect(
      suggestion.notes.every((note) => note.startBeat >= 0 && note.startBeat + note.durationBeats <= PROJECT_BEATS),
    ).toBe(true)
  })

  it('creates deterministic drum events for a style', () => {
    const suggestion = suggestDrumGroove('edm')

    expect(suggestion.kind).toBe('drums')
    expect(suggestion.pattern.some((event) => event.voice === 'kick')).toBe(true)
    expect(suggestion.pattern.some((event) => event.voice === 'closedHat')).toBe(true)
  })
})
