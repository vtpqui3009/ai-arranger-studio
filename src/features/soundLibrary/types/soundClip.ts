import type { ArrangementStyle } from '../../arranger/types/music'

export const SOUND_CATEGORIES = ['drums', 'bass', 'atmosphere', 'melody', 'fx'] as const
export type SoundCategory = (typeof SOUND_CATEGORIES)[number]
export type SoundClipSource = 'catalog-synth' | 'ai-generated'
export type SoundClip = {
  id: string
  name: string
  category: SoundCategory
  tags: string[]
  style: ArrangementStyle | null
  durationBeats: number
  referenceBpm: number
  source: SoundClipSource
}
export type ClipTrackEvent = {
  id: string
  clipId: string
  startBeat: number
  gain: number
}
