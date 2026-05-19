import { ArrowLeft, Download, Drum, Sliders } from 'lucide-react'
import { useState } from 'react'
import { ErrorBoundary } from '../../../components/ErrorBoundary'
import { StudioSidebar } from '../../../components/layout/StudioSidebar'
import { Button } from '../../../components/ui/Button'
import { Tabs, type TabItem } from '../../../components/ui/Tabs'
import { playProject, stopPlayback } from '../../../lib/audio/arrangementPlayer'
import { exportArrangementToWav } from '../../../lib/audio/wavExporter'
import { MixerPanel } from '../../mixer/components/MixerPanel'
import { AIStudioPanel } from '../../aiSongGen/components/AIStudioPanel'
import { ArrangementTimeline } from './ArrangementTimeline'
import { ChordTimeline } from './ChordTimeline'
import { ClipTrack } from './ClipTrack'
import { PianoRoll } from './PianoRoll'
import { TransportControls } from './TransportControls'
import { useArrangerStore } from '../store/arrangerStore'

type WorkspacePageProps = {
  onBackToLanding: () => void
}

type CenterTab = 'arrange' | 'mix'

const CENTER_TABS: ReadonlyArray<TabItem<CenterTab>> = [
  { value: 'arrange', label: 'Arrange', icon: <Drum size={14} aria-hidden="true" /> },
  { value: 'mix', label: 'Mix', icon: <Sliders size={14} aria-hidden="true" /> },
]

export function WorkspacePage({ onBackToLanding }: WorkspacePageProps) {
  const project = useArrangerStore((state) => state.project)
  const playbackStatus = useArrangerStore((state) => state.playback.status)
  const setPlaybackStatus = useArrangerStore((state) => state.setPlaybackStatus)
  const [statusMessage, setStatusMessage] = useState('Ready.')
  const [transportError, setTransportError] = useState('')
  const [centerTab, setCenterTab] = useState<CenterTab>('arrange')
  const [isExporting, setIsExporting] = useState(false)

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

  const handleExportWav = async () => {
    if (isExporting) return
    setIsExporting(true)
    setStatusMessage('Rendering arrangement to WAV (demo)...')
    try {
      await exportArrangementToWav(project)
      setStatusMessage('WAV export complete.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? `Export failed: ${error.message}` : 'Export failed.')
    } finally {
      setIsExporting(false)
    }
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
                {project.melody.length} notes / {project.chords.length} chords / {project.clips.length} clips
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={<Download size={16} aria-hidden="true" />}
                onClick={handleExportWav}
                disabled={isExporting}
              >
                {isExporting ? 'Rendering...' : 'Export WAV (demo)'}
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
              <Tabs items={CENTER_TABS} value={centerTab} onChange={setCenterTab} ariaLabel="Workspace mode" />
              {centerTab === 'arrange' ? (
                <>
                  <ArrangementTimeline />
                  <ChordTimeline />
                  <PianoRoll />
                </>
              ) : (
                <>
                  <ClipTrack />
                  <MixerPanel />
                </>
              )}
            </div>
            <ErrorBoundary>
              <AIStudioPanel />
            </ErrorBoundary>
          </div>
        </section>
      </div>
    </main>
  )
}
