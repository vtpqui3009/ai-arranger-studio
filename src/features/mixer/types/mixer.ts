export const TRACK_TYPES = ['chords', 'melody', 'bass', 'drums', 'clips'] as const
export type TrackType = (typeof TRACK_TYPES)[number]
export type TrackMixSettings = { volume: number; muted: boolean; solo: boolean }
export type MixerState = Record<TrackType, TrackMixSettings>
export const DEFAULT_MIXER_STATE: MixerState = {
  chords: { volume: 75, muted: false, solo: false },
  melody: { volume: 80, muted: false, solo: false },
  bass: { volume: 85, muted: false, solo: false },
  drums: { volume: 80, muted: false, solo: false },
  clips: { volume: 80, muted: false, solo: false },
}

export function isTrackAudible(mixer: MixerState, track: TrackType): boolean {
  const settings = mixer[track]
  if (settings.muted) return false
  const anySolo = TRACK_TYPES.some((t) => mixer[t].solo)
  return anySolo ? settings.solo : true
}

export function effectiveGain(mixer: MixerState, track: TrackType): number {
  return isTrackAudible(mixer, track) ? mixer[track].volume / 100 : 0
}
