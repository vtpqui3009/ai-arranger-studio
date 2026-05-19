export const TRACK_TYPES = ['chords', 'melody', 'bass', 'drums', 'clips'] as const
export type TrackType = (typeof TRACK_TYPES)[number]
export type TrackMixSettings = { volume: number; muted: boolean }
export type MixerState = Record<TrackType, TrackMixSettings>
export const DEFAULT_MIXER_STATE: MixerState = {
  chords: { volume: 75, muted: false },
  melody: { volume: 80, muted: false },
  bass: { volume: 85, muted: false },
  drums: { volume: 80, muted: false },
  clips: { volume: 80, muted: false },
}
