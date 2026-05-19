import { useEffect, useMemo } from 'react'
import { Panel } from '../../../components/ui/Panel'
import { prewarmCache } from '../../../lib/audio/soundGenerator'
import { useArrangerStore } from '../../arranger/store/arrangerStore'
import { SOUND_CATALOG, getClipsByCategory } from '../catalog/soundCatalog'
import { useSoundLibraryStore } from '../store/soundLibraryStore'
import { CategoryFilter } from './CategoryFilter'
import { SoundLibraryCard } from './SoundLibraryCard'

export function SoundLibraryPanel() {
  const project = useArrangerStore((state) => state.project)
  const addClipToProject = useArrangerStore((state) => state.addClipToProject)
  const filter = useSoundLibraryStore((state) => state.filter)
  const setFilter = useSoundLibraryStore((state) => state.setFilter)
  const generatedClips = useSoundLibraryStore((state) => state.generatedClips)

  useEffect(() => {
    prewarmCache(SOUND_CATALOG.map((clip) => clip.id))
  }, [])

  const visibleClips = useMemo(() => {
    if (!filter) {
      return [...SOUND_CATALOG, ...generatedClips]
    }

    return [...getClipsByCategory(filter), ...generatedClips.filter((clip) => clip.category === filter)]
  }, [filter, generatedClips])
  const addedClipIds = useMemo(() => new Set(project.clips.map((event) => event.clipId)), [project.clips])

  return (
    <Panel title="Sound Library" eyebrow="Demo Catalog" className="rounded-none border-0 bg-transparent shadow-none">
      <p className="border-b border-studio-line px-4 py-3 text-xs leading-5 text-slate-500">
        Demo catalog clips are synthesized locally with Tone.js. No samples, uploads, or paid AI services are used.
      </p>
      <CategoryFilter selected={filter} onChange={setFilter} />
      {visibleClips.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">No sounds match this filter.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {visibleClips.map((clip) => (
            <SoundLibraryCard
              key={clip.id}
              clip={clip}
              isAdded={addedClipIds.has(clip.id)}
              onAdd={() => addClipToProject(clip.id)}
            />
          ))}
        </div>
      )}
    </Panel>
  )
}
