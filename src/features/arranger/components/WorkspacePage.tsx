import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { ErrorBoundary } from '../../../components/ErrorBoundary'
import { StudioSidebar } from '../../../components/layout/StudioSidebar'
import { Button } from '../../../components/ui/Button'
import { playProject, stopPlayback } from '../../../lib/audio/arrangementPlayer'
import { AIAssistantPanel } from './AIAssistantPanel'
import { ChordTimeline } from './ChordTimeline'
import { PianoRoll } from './PianoRoll'
import { TransportControls } from './TransportControls'
import { useArrangerStore } from '../store/arrangerStore'

type WorkspacePageProps = {
  onBackToLanding: () => void
}

export function WorkspacePage({ onBackToLanding }: WorkspacePageProps) {
  const project = useArrangerStore((state) => state.project)
  const playbackStatus = useArrangerStore((state) => state.playback.status)
  const setPlaybackStatus = useArrangerStore((state) => state.setPlaybackStatus)
  const [statusMessage, setStatusMessage] = useState('Ready.')
  const [transportError, setTransportError] = useState('')

  const handlePlay = async () => {
    setTransportError('')
    setStatusMessage('Starting playback.')
    setPlaybackStatus('loading')

    try {
      await playProject(project, {
        onEnded: () => {
          setPlaybackStatus('stopped')
          setStatusMessage('Playback finished.')
        },
      })
      setPlaybackStatus('playing')
      setStatusMessage('Playing arrangement.')
    } catch (error) {
      setPlaybackStatus('stopped')
      setTransportError(error instanceof Error ? error.message : 'Unable to start audio playback.')
      setStatusMessage('Playback failed.')
    }
  }

  const handleStop = () => {
    stopPlayback()
    setPlaybackStatus('stopped')
    setStatusMessage('Playback stopped.')
  }

  return (
    <main className="min-h-screen bg-studio-ink text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <StudioSidebar statusMessage={statusMessage} setStatusMessage={setStatusMessage} />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-studio-line bg-studio-ink/80 px-4 py-3 backdrop-blur">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={16} aria-hidden="true" />}
              onClick={onBackToLanding}
            >
              Landing
            </Button>
            <p className="text-sm text-slate-400">
              {project.melody.length} notes / {project.chords.length} chords / {project.instrument}
            </p>
          </header>

          <div className="grid flex-1 gap-4 overflow-y-auto p-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid min-w-0 content-start gap-4">
              <TransportControls
                project={project}
                status={playbackStatus}
                errorMessage={transportError}
                onStartPlayback={handlePlay}
                onStop={handleStop}
              />
              <ChordTimeline />
              <PianoRoll />
            </div>
            <ErrorBoundary>
              <AIAssistantPanel />
            </ErrorBoundary>
          </div>
        </section>
      </div>
    </main>
  )
}
