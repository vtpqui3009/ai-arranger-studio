import { ArrowRight, FolderOpen, Music2, Sparkles } from 'lucide-react'
import { SequencerBackdrop } from '../music/SequencerBackdrop'
import { Button } from '../ui/Button'

type LandingPageProps = {
  hasSavedProject: boolean
  onOpenStudio: () => void
  onLoadSaved: () => void
}

export function LandingPage({ hasSavedProject, onOpenStudio, onLoadSaved }: LandingPageProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-studio-ink">
      <SequencerBackdrop />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-studio-teal/40 bg-studio-teal/10 text-studio-teal">
              <Music2 size={20} aria-hidden="true" />
            </span>
            AI Arranger Studio
          </div>
        </header>

        <section className="flex flex-1 items-center px-5 pb-16 pt-8 sm:px-8 lg:px-14">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-studio-line bg-studio-panel/70 px-4 py-2 text-sm text-slate-300">
              <Sparkles size={16} className="text-studio-amber" aria-hidden="true" />
              Browser-native music arranging MVP
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              AI Arranger Studio
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Sketch chords, melody, tempo, key, and style in a focused production workspace, then use local AI-style
              suggestions to shape the arrangement.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" icon={<ArrowRight size={18} aria-hidden="true" />} onClick={onOpenStudio}>
                Open Studio
              </Button>
              <Button
                variant="secondary"
                icon={<FolderOpen size={18} aria-hidden="true" />}
                onClick={onLoadSaved}
                disabled={!hasSavedProject}
              >
                Load Saved
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
