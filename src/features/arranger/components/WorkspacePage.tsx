import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Library, X } from 'lucide-react'
import { useState } from 'react'
import { ErrorBoundary } from '../../../components/ErrorBoundary'
import { StudioSidebar } from '../../../components/layout/StudioSidebar'
import { Button } from '../../../components/ui/Button'
import { playProject, stopPlayback } from '../../../lib/audio/arrangementPlayer'
import { MixerPanel } from '../../mixer/components/MixerPanel'
import { SoundLibraryPanel } from '../../soundLibrary/components/SoundLibraryPanel'
import { stopAllPreview } from '../../soundLibrary/store/soundLibraryStore'
import { AISongGenerationPanel } from '../../aiSongGen/components/AISongGenerationPanel'
import { AIAssistantPanel } from './AIAssistantPanel'
import { ArrangementTimeline } from './ArrangementTimeline'
import { ChordTimeline } from './ChordTimeline'
import { ClipTrack } from './ClipTrack'
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
  const [libraryOpen, setLibraryOpen] = useState(false)

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
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-slate-400">
                {project.melody.length} notes / {project.chords.length} chords / {project.instrument}
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<Library size={16} aria-hidden="true" />}
                onClick={() => setLibraryOpen(true)}
              >
                Library
              </Button>
            </div>
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
              <ArrangementTimeline />
              <ChordTimeline />
              <PianoRoll />
              <ClipTrack />
              <MixerPanel />
            </div>
            <ErrorBoundary>
              <div className="grid gap-4">
                <AIAssistantPanel />
                <AISongGenerationPanel />
              </div>
            </ErrorBoundary>
          </div>
        </section>
      </div>
      <AnimatePresence>
        {libraryOpen && (
          <motion.div
            key="library-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-screen w-96 overflow-y-auto border-l border-studio-line bg-studio-panel shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-studio-line p-4">
              <span className="text-sm font-semibold text-white">Sound Library</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  stopAllPreview()
                  setLibraryOpen(false)
                }}
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </div>
            <SoundLibraryPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
