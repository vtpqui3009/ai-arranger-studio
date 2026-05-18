import type {
  ArrangementStyle,
  ArrangerSuggestion,
  BassSuggestion,
  ChordSuggestion,
  DrumEvent,
  DrumSuggestion,
  MelodySuggestion,
  MusicProject,
  ScaleType,
} from '../../features/arranger/types/music'
import {
  BEATS_PER_BAR,
  PROJECT_BEATS,
  buildChordSymbol,
  chordSymbolToMidiNotes,
  createId,
  getScaleMidiNotes,
} from '../../features/arranger/utils/musicTheory'
import { createChordEvent, createNoteEvent } from '../../features/arranger/utils/projectFactory'

type ChordPatternStep = {
  degree: number
  suffix: string
}

const STYLE_CHORD_PATTERNS: Record<ArrangementStyle, Record<ScaleType, ChordPatternStep[]>> = {
  lofi: {
    major: [
      { degree: 1, suffix: 'maj9' },
      { degree: 6, suffix: 'm9' },
      { degree: 2, suffix: 'm7' },
      { degree: 5, suffix: '13' },
    ],
    minor: [
      { degree: 1, suffix: 'm9' },
      { degree: 6, suffix: 'maj7' },
      { degree: 3, suffix: 'maj9' },
      { degree: 7, suffix: '7' },
    ],
  },
  pop: {
    major: [
      { degree: 1, suffix: 'add9' },
      { degree: 5, suffix: '' },
      { degree: 6, suffix: 'm' },
      { degree: 4, suffix: '' },
    ],
    minor: [
      { degree: 1, suffix: 'm' },
      { degree: 7, suffix: '' },
      { degree: 6, suffix: '' },
      { degree: 7, suffix: '' },
    ],
  },
  edm: {
    major: [
      { degree: 6, suffix: 'm' },
      { degree: 4, suffix: '' },
      { degree: 1, suffix: 'add9' },
      { degree: 5, suffix: '' },
    ],
    minor: [
      { degree: 1, suffix: 'm' },
      { degree: 6, suffix: '' },
      { degree: 3, suffix: '' },
      { degree: 7, suffix: '' },
    ],
  },
  cinematic: {
    major: [
      { degree: 1, suffix: 'add9' },
      { degree: 4, suffix: 'maj7' },
      { degree: 6, suffix: 'm7' },
      { degree: 5, suffix: 'sus4' },
    ],
    minor: [
      { degree: 1, suffix: 'madd9' },
      { degree: 6, suffix: 'maj7' },
      { degree: 4, suffix: 'm7' },
      { degree: 7, suffix: '' },
    ],
  },
  rnb: {
    major: [
      { degree: 2, suffix: 'm9' },
      { degree: 5, suffix: '13' },
      { degree: 1, suffix: 'maj9' },
      { degree: 6, suffix: 'm9' },
    ],
    minor: [
      { degree: 4, suffix: 'm7' },
      { degree: 7, suffix: '7' },
      { degree: 3, suffix: 'maj7' },
      { degree: 6, suffix: 'maj7' },
    ],
  },
}

export function suggestChordProgression(key: string, scale: ScaleType, style: ArrangementStyle): ChordSuggestion {
  const pattern = STYLE_CHORD_PATTERNS[style][scale]
  const chords = pattern.map((step, index) =>
    createChordEvent(buildChordSymbol(key, scale, step.degree, step.suffix), index * BEATS_PER_BAR, BEATS_PER_BAR),
  )

  return {
    kind: 'chords',
    title: `${styleLabel(style)} ${scale} progression`,
    chords,
    explanation: `A four-bar ${styleLabel(style).toLowerCase()} progression in ${key} ${scale} with color tones chosen for smoother browser-synth playback.`,
  }
}

export function suggestMelodyVariation(project: MusicProject): MelodySuggestion {
  const scalePool = [
    ...getScaleMidiNotes(project.key, project.scale, 4),
    ...getScaleMidiNotes(project.key, project.scale, 5),
  ]
  const rhythm = getMelodyRhythm(project.style)
  const notes = project.chords.flatMap((chord, chordIndex) => {
    const chordTonePool = chordSymbolToMidiNotes(chord.symbol, 4)
      .map((midi) => normalizeIntoRange(midi, 60, 84))
      .filter((midi, index, pool) => pool.indexOf(midi) === index)
    const candidatePool = chordTonePool.length > 0 ? chordTonePool : scalePool

    return rhythm.map((step, stepIndex) => {
      const sourceMidi = candidatePool[(chordIndex + stepIndex + step.degreeOffset) % candidatePool.length]
      const nearestScaleIndex = findNearestScaleIndex(scalePool, sourceMidi)
      const contourOffset = (chordIndex + stepIndex) % 3 === 0 ? 1 : 0
      const midi = scalePool[Math.min(scalePool.length - 1, nearestScaleIndex + contourOffset)]

      return createNoteEvent(midi, chord.startBeat + step.offset, step.duration, 0.78 + stepIndex * 0.04)
    })
  })

  return {
    kind: 'melody',
    title: `${styleLabel(project.style)} motif variation`,
    notes,
    explanation: `Builds a new ${project.key} ${project.scale} motif from chord tones, passing tones, and style-specific rhythm accents.`,
  }
}

export function suggestBassLine(project: MusicProject): BassSuggestion {
  const offsets = getBassOffsets(project.style)
  const notes = project.chords.flatMap((chord) => {
    const chordNotes = chordSymbolToMidiNotes(chord.symbol, 2)
    if (chordNotes.length === 0) {
      return []
    }

    const root = chordNotes[0]
    const fifth = root + 7
    const octave = root + 12
    const pool = [root, fifth, octave, fifth]

    return offsets.map((offset, index) =>
      createNoteEvent(pool[index % pool.length], chord.startBeat + offset, 0.5, 0.9 - index * 0.05),
    )
  })

  return {
    kind: 'bass',
    title: 'Root-and-fifth bass outline',
    notes,
    explanation: `Uses roots, fifths, and octave returns with a ${styleLabel(project.style).toLowerCase()} rhythmic push.`,
  }
}

export function suggestDrumGroove(style: ArrangementStyle): DrumSuggestion {
  const pattern = createDrumPattern(style)

  return {
    kind: 'drums',
    title: `${styleLabel(style)} drum groove`,
    pattern,
    explanation: `A deterministic ${styleLabel(style).toLowerCase()} groove sketch with kick, snare, and hat placements for the 16-beat loop.`,
  }
}

export function describeSuggestion(suggestion: ArrangerSuggestion): string {
  return suggestion.explanation
}

function createDrumPattern(style: ArrangementStyle): DrumEvent[] {
  const kickBeatsByStyle: Record<ArrangementStyle, number[]> = {
    lofi: [0, 3, 6, 8, 11, 14],
    pop: [0, 4, 8, 12],
    edm: [0, 2, 4, 6, 8, 10, 12, 14],
    cinematic: [0, 8, 12],
    rnb: [0, 3, 7, 10, 13],
  }

  const events: DrumEvent[] = []
  kickBeatsByStyle[style].forEach((beat) => events.push(createDrumEvent('kick', beat, 0.5, 0.95)))
  ;[2, 6, 10, 14].forEach((beat) => events.push(createDrumEvent('snare', beat, 0.5, style === 'lofi' ? 0.68 : 0.82)))

  for (let beat = 0; beat < PROJECT_BEATS; beat += style === 'edm' ? 0.5 : 1) {
    events.push(createDrumEvent('closedHat', beat, 0.25, beat % 2 === 0 ? 0.58 : 0.42))
  }

  if (style === 'rnb' || style === 'lofi') {
    ;[5.5, 13.5].forEach((beat) => events.push(createDrumEvent('openHat', beat, 0.5, 0.5)))
  }

  return events.sort((left, right) => left.startBeat - right.startBeat)
}

function getMelodyRhythm(
  style: ArrangementStyle,
): Array<{ offset: number; duration: 0.5 | 1 | 2; degreeOffset: number }> {
  if (style === 'edm') {
    return [
      { offset: 0, duration: 0.5, degreeOffset: 0 },
      { offset: 0.5, duration: 0.5, degreeOffset: 2 },
      { offset: 1.5, duration: 0.5, degreeOffset: 1 },
      { offset: 3, duration: 1, degreeOffset: 3 },
    ]
  }

  if (style === 'cinematic') {
    return [
      { offset: 0, duration: 2, degreeOffset: 0 },
      { offset: 2.5, duration: 0.5, degreeOffset: 1 },
      { offset: 3, duration: 1, degreeOffset: 2 },
    ]
  }

  if (style === 'rnb') {
    return [
      { offset: 0, duration: 0.5, degreeOffset: 1 },
      { offset: 1, duration: 1, degreeOffset: 2 },
      { offset: 2.5, duration: 0.5, degreeOffset: 0 },
      { offset: 3.5, duration: 0.5, degreeOffset: 3 },
    ]
  }

  return [
    { offset: 0, duration: 1, degreeOffset: 0 },
    { offset: 1.5, duration: 0.5, degreeOffset: 1 },
    { offset: 2, duration: 1, degreeOffset: 2 },
    { offset: 3.5, duration: 0.5, degreeOffset: 1 },
  ]
}

function getBassOffsets(style: ArrangementStyle): number[] {
  if (style === 'edm') {
    return [0, 1, 2, 3]
  }

  if (style === 'rnb' || style === 'lofi') {
    return [0, 1.5, 2.5, 3.5]
  }

  if (style === 'cinematic') {
    return [0, 2, 3]
  }

  return [0, 1, 2.5, 3]
}

function createDrumEvent(
  voice: DrumEvent['voice'],
  startBeat: number,
  durationBeats: number,
  velocity: number,
): DrumEvent {
  return {
    id: createId('drum'),
    voice,
    startBeat,
    durationBeats,
    velocity,
  }
}

function findNearestScaleIndex(scalePool: number[], midi: number): number {
  let closestIndex = 0
  let smallestDistance = Number.POSITIVE_INFINITY

  scalePool.forEach((scaleMidi, index) => {
    const distance = Math.abs(scaleMidi - midi)
    if (distance < smallestDistance) {
      smallestDistance = distance
      closestIndex = index
    }
  })

  return closestIndex
}

function normalizeIntoRange(midi: number, lowest: number, highest: number): number {
  let normalizedMidi = midi

  while (normalizedMidi < lowest) {
    normalizedMidi += 12
  }

  while (normalizedMidi > highest) {
    normalizedMidi -= 12
  }

  return normalizedMidi
}

function styleLabel(style: ArrangementStyle): string {
  return style === 'rnb' ? 'R&B' : style.charAt(0).toUpperCase() + style.slice(1)
}
