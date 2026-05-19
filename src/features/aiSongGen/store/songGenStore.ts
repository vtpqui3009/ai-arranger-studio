import { create } from 'zustand'
import type { ArrangementStyle } from '../../arranger/types/music'
import { useArrangerStore } from '../../arranger/store/arrangerStore'
import { createId } from '../../arranger/utils/musicTheory'
import { getAudioBuffer, registerCacheAlias } from '../../../lib/audio/soundGenerator'
import type { SoundClip } from '../../soundLibrary/types/soundClip'
import type { GenerationStatus, SongGenerationRequest } from '../types/songGeneration'

const GENERATOR_IDS_BY_STYLE: Record<ArrangementStyle, string> = {
  lofi: 'lofi-drum-loop-1',
  pop: 'pop-lead-hook',
  edm: 'edm-four-on-floor',
  cinematic: 'cinematic-strings',
  rnb: 'rnb-pocket-groove',
}

type SongGenStore = {
  requests: SongGenerationRequest[]
  generate: (prompt: string, style: ArrangementStyle) => Promise<void>
  clearRequests: () => void
}

export const useSongGenStore = create<SongGenStore>((set) => ({
  requests: [],

  generate: async (prompt, style) => {
    const id = createId('gen')
    const pendingStatus: GenerationStatus = 'pending'
    const newRequest: SongGenerationRequest = {
      id,
      prompt,
      style,
      status: pendingStatus,
      resultClipId: null,
      errorMessage: null,
      startedAt: new Date().toISOString(),
    }

    set((state) => ({ requests: [newRequest, ...state.requests] }))

    const delay = 2000 + Math.random() * 2000
    await new Promise((resolve) => window.setTimeout(resolve, delay))

    try {
      const sourceId = GENERATOR_IDS_BY_STYLE[style]
      await getAudioBuffer(sourceId)

      const newClipId = createId('ai-clip')
      const newClip: SoundClip = {
        id: newClipId,
        name: `[Demo AI] ${prompt.slice(0, 32).trim()}`,
        category: 'melody',
        style,
        tags: ['ai-generated', 'demo', style],
        durationBeats: 16,
        referenceBpm: 90,
        source: 'ai-generated',
        aliasSourceId: sourceId,
      }

      registerCacheAlias(newClipId, sourceId)
      useArrangerStore.getState().addUserClip(newClip)

      set((state) => ({
        requests: state.requests.map((request) =>
          request.id === id ? { ...request, status: 'done', resultClipId: newClipId } : request,
        ),
      }))
    } catch (error) {
      set((state) => ({
        requests: state.requests.map((request) =>
          request.id === id
            ? {
                ...request,
                status: 'error',
                errorMessage: error instanceof Error ? error.message : 'Generation failed.',
              }
            : request,
        ),
      }))
    }
  },

  clearRequests: () => set({ requests: [] }),
}))
