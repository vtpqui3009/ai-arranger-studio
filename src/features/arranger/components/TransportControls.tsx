import { LoaderCircle, Play, Square } from 'lucide-react'
import type { MusicProject, PlaybackStatus } from '../types/music'
import { Button } from '../../../components/ui/Button'

type TransportControlsProps = {
  project: MusicProject
  status: PlaybackStatus
  errorMessage: string
  onStartPlayback: () => void
  onStop: () => void
}

export function TransportControls({ project, status, errorMessage, onStartPlayback, onStop }: TransportControlsProps) {
  const isLoading = status === 'loading'
  const isPlaying = status === 'playing'

  return (
    <section className="min-w-0 rounded-lg border border-studio-line bg-studio-panel/90 p-4 shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-teal">Transport</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-300">
            <span className="rounded-md bg-slate-950/60 px-2 py-1">{project.tempo} BPM</span>
            <span className="rounded-md bg-slate-950/60 px-2 py-1">
              {project.key} {project.scale}
            </span>
            <span className="rounded-md bg-slate-950/60 px-2 py-1">{project.style.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            icon={
              isLoading ? (
                <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
              ) : (
                <Play size={18} aria-hidden="true" />
              )
            }
            onClick={onStartPlayback}
            disabled={isLoading || isPlaying}
          >
            Play
          </Button>
          <Button
            variant="secondary"
            icon={<Square size={18} aria-hidden="true" />}
            onClick={onStop}
            disabled={!isPlaying}
          >
            Stop
          </Button>
        </div>
      </div>
      {errorMessage && <p className="mt-3 text-sm text-red-200">{errorMessage}</p>}
    </section>
  )
}
