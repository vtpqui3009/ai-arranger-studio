import { LoaderCircle, Pause, Play } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { cn } from '../../../components/ui/cn'
import type { SoundAsset } from '../types/soundAsset'

type PreviewState = 'idle' | 'loading' | 'playing'

type SoundCardProps = {
  asset: SoundAsset
  previewState: PreviewState
  errorMessage: string | null
  onTogglePreview: (asset: SoundAsset) => void
}

export function SoundCard({ asset, previewState, errorMessage, onTogglePreview }: SoundCardProps) {
  const isLoading = previewState === 'loading'
  const isPlaying = previewState === 'playing'

  return (
    <article className="rounded-lg border border-studio-line bg-studio-raised/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-50">{asset.title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">{asset.description}</p>
        </div>
        <Button
          variant={isPlaying ? 'primary' : 'secondary'}
          size="icon"
          aria-label={`${isPlaying ? 'Pause' : 'Play'} ${asset.title}`}
          icon={
            isLoading ? (
              <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
            ) : isPlaying ? (
              <Pause size={18} aria-hidden="true" />
            ) : (
              <Play size={18} aria-hidden="true" />
            )
          }
          disabled={isLoading}
          onClick={() => onTogglePreview(asset)}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
        <Metadata label="Category" value={asset.category} />
        <Metadata label="Style" value={asset.style ?? 'Any'} />
        <Metadata label="BPM" value={String(asset.bpm)} />
        <Metadata label="Key" value={asset.key ? `${asset.key} ${asset.scale ?? ''}`.trim() : 'None'} />
        <Metadata label="Duration" value={`${asset.durationBeats} beats`} />
        <Metadata label="License" value={asset.licenseLabel} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {asset.tags.map((tag) => (
          <span key={tag} className="rounded-md bg-slate-950/60 px-2 py-1 text-xs text-slate-400">
            {tag}
          </span>
        ))}
      </div>

      {errorMessage && <p className="mt-3 text-xs text-red-200">{errorMessage}</p>}

      <div
        className={cn(
          'mt-3 h-1 rounded-full bg-slate-950',
          isPlaying ? 'bg-studio-teal shadow-[0_0_12px_rgba(57,217,200,0.55)]' : '',
        )}
      />
    </article>
  )
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-950/50 px-2 py-1.5">
      <span className="block text-[10px] uppercase text-slate-500">{label}</span>
      <span className="mt-0.5 block truncate font-medium capitalize text-slate-200">{value}</span>
    </div>
  )
}
