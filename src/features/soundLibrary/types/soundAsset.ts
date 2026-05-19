import type { SoundCategory, SoundClip } from './soundClip'
import type { ScaleType } from '../../arranger/types/music'

export type SoundAsset = SoundClip & {
  title: string
  description: string
  bpm: number
  key: string | null
  scale: ScaleType | null
  licenseLabel: 'Royalty-free placeholder'
  preview: {
    tone: SoundPreviewTone
    accentBeats: number[]
  }
}

export type SoundPreviewTone = SoundCategory | 'soft-pad'
