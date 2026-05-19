export const ARRANGEMENT_STYLES = ['lofi', 'pop', 'edm', 'cinematic', 'rnb'] as const
export const INSTRUMENT_TYPES = ['synth', 'piano', 'bass', 'pad'] as const
export const NOTE_DURATION_OPTIONS = [0.5, 1, 2, 4] as const
export const SCALE_TYPES = ['major', 'minor'] as const

export type ArrangementStyle = (typeof ARRANGEMENT_STYLES)[number]
export type InstrumentType = (typeof INSTRUMENT_TYPES)[number]
export type NoteDurationBeats = (typeof NOTE_DURATION_OPTIONS)[number]
export type ScaleType = (typeof SCALE_TYPES)[number]

export type NoteEvent = {
  id: string
  pitch: string
  midi: number
  startBeat: number
  durationBeats: number
  velocity: number
}

export type ChordEvent = {
  id: string
  symbol: string
  startBeat: number
  durationBeats: number
}

export type DrumVoice = 'kick' | 'snare' | 'closedHat' | 'openHat'

export type DrumEvent = {
  id: string
  voice: DrumVoice
  startBeat: number
  durationBeats: number
  velocity: number
}

export type MusicProject = {
  id: string
  title: string
  tempo: number
  key: string
  scale: ScaleType
  style: ArrangementStyle
  instrument: InstrumentType
  selectedNoteDurationBeats: NoteDurationBeats
  chords: ChordEvent[]
  melody: NoteEvent[]
  bass: NoteEvent[]
  drums: DrumEvent[]
  updatedAt: string
}

export type PlaybackStatus = 'stopped' | 'loading' | 'playing'

export type PlaybackState = {
  status: PlaybackStatus
  currentBeat: number
}

export type ChordSuggestion = {
  kind: 'chords'
  title: string
  chords: ChordEvent[]
  explanation: string
}

export type MelodySuggestion = {
  kind: 'melody'
  title: string
  notes: NoteEvent[]
  explanation: string
}

export type BassSuggestion = {
  kind: 'bass'
  title: string
  notes: NoteEvent[]
  explanation: string
}

export type DrumSuggestion = {
  kind: 'drums'
  title: string
  pattern: DrumEvent[]
  explanation: string
}

export type ArrangerSuggestion = ChordSuggestion | MelodySuggestion | BassSuggestion | DrumSuggestion

export type SuggestionHistoryItem = {
  id: string
  suggestion: ArrangerSuggestion
  createdAt: string
  applied: boolean
}
