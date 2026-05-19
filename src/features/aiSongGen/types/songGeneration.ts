import type { ArrangementStyle } from '../../arranger/types/music'

export type GenerationStatus = 'idle' | 'pending' | 'done' | 'error'
export type SongGenerationRequest = {
  id: string
  prompt: string
  style: ArrangementStyle
  status: GenerationStatus
  resultClipId: string | null
  errorMessage: string | null
  startedAt: string | null
}
