import { create } from 'zustand'
import type { SoundCategory, SoundClip } from '../types/soundClip'
import { previewClip, stopPreview } from '../../../lib/audio/clipPreviewPlayer'

type PreviewStatus = 'idle' | 'loading' | 'playing'

type SoundLibraryStore = {
  filter: SoundCategory | null
  previewingClipId: string | null
  previewStatus: PreviewStatus
  generatedClips: SoundClip[]
  setFilter: (category: SoundCategory | null) => void
  startPreview: (clipId: string) => Promise<void>
  stopAllPreview: () => void
  addGeneratedClip: (clip: SoundClip) => void
}

export const useSoundLibraryStore = create<SoundLibraryStore>((set, get) => ({
  filter: null,
  previewingClipId: null,
  previewStatus: 'idle',
  generatedClips: [],

  setFilter: (category) => set({ filter: category }),

  startPreview: async (clipId) => {
    const { previewingClipId, previewStatus, stopAllPreview } = get()

    if (previewingClipId === clipId && previewStatus === 'playing') {
      stopAllPreview()
      return
    }

    set({ previewingClipId: clipId, previewStatus: 'loading' })

    try {
      await previewClip(clipId, () => set({ previewStatus: 'idle', previewingClipId: null }))
      set({ previewStatus: 'playing' })
    } catch {
      set({ previewStatus: 'idle', previewingClipId: null })
    }
  },

  stopAllPreview: () => {
    stopPreview()
    set({ previewStatus: 'idle', previewingClipId: null })
  },

  addGeneratedClip: (clip) => set((state) => ({ generatedClips: [...state.generatedClips, clip] })),
}))

export const stopAllPreview = (): void => useSoundLibraryStore.getState().stopAllPreview()
