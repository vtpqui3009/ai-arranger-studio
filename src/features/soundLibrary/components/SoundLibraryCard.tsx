import { Check, LoaderCircle, Play, Plus, Square } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { cn } from '../../../components/ui/cn'
import type { SoundCategory, SoundClip } from '../types/soundClip'
import { useSoundLibraryStore } from '../store/soundLibraryStore'

type SoundLibraryCardProps = {
  clip: SoundClip
  isAdded: boolean
  onAdd: () => void
}

const categoryBadgeClasses: Record<SoundCategory, string> = {
  drums: 'border-studio-coral/40 bg-studio-coral/10 text-studio-coral',
  bass: 'border-studio-amber/40 bg-studio-amber/10 text-studio-amber',
  atmosphere: 'border-studio-lilac/40 bg-studio-lilac/10 text-studio-lilac',
  melody: 'border-studio-teal/40 bg-studio-teal/10 text-studio-teal',
  fx: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
}

export function SoundLibraryCard({ clip, isAdded, onAdd }: SoundLibraryCardProps) {
  const previewingClipId = useSoundLibraryStore((state) => state.previewingClipId)
  const previewStatus = useSoundLibraryStore((state) => state.previewStatus)
  const startPreview = useSoundLibraryStore((state) => state.startPreview)
  const stopAllPreview = useSoundLibraryStore((state) => state.stopAllPreview)
  const isCurrentClip = previewingClipId === clip.id
  const isLoading = isCurrentClip && previewStatus === 'loading'
  const isPlaying = isCurrentClip && previewStatus === 'playing'

  return (
    <article className="flex flex-col gap-2 rounded-lg border border-studio-line bg-studio-raised p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn('rounded-full border px-2 py-1 text-xs font-semibold', categoryBadgeClasses[clip.category])}
        >
          {clip.category}
        </span>
        <span className="rounded bg-slate-950/60 px-2 py-1 text-xs text-studio-amber">
          {Math.ceil(clip.durationBeats / 4)} bars
        </span>
      </div>

      <h3 className="min-w-0 truncate text-sm font-semibold text-slate-100">
        {clip.name}
        {clip.source === 'ai-generated' && <span className="ml-2 text-xs text-studio-lilac">Γ£ª Demo AI</span>}
      </h3>

      <div className="flex flex-wrap gap-1.5">
        {clip.tags.map((tag) => (
          <span key={tag} className="rounded bg-slate-950/40 px-1.5 py-1 text-xs text-slate-500">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${isPlaying ? 'Stop' : 'Play'} ${clip.name}`}
          onClick={() => {
            if (isPlaying) {
              stopAllPreview()
            } else {
              void startPreview(clip.id)
            }
          }}
        >
          {isLoading ? (
            <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
          ) : isPlaying ? (
            <Square size={16} aria-hidden="true" />
          ) : (
            <Play size={16} aria-hidden="true" />
          )}
        </Button>

        <Button
          variant="primary"
          size="sm"
          disabled={isAdded}
          icon={isAdded ? <Check size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
          onClick={onAdd}
        >
          {isAdded ? 'Added' : 'Add'}
        </Button>
      </div>
    </article>
  )
}
