import { Bot, Check, Clock3, Drum, ListMusic, LoaderCircle, Music, WandSparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Panel } from '../../../components/ui/Panel'
import { cn } from '../../../components/ui/cn'
import type { ArrangerSuggestion, DrumEvent, NoteEvent } from '../types/music'
import { useArrangerStore } from '../store/arrangerStore'
import type { AISuggestionResult } from '../../../lib/ai/arrangerClient'
import {
  requestBassSuggestion,
  requestChordSuggestion,
  requestDrumSuggestion,
  requestMelodySuggestion,
} from '../../../lib/ai/arrangerClient'
import { describeSuggestion } from '../../../lib/ai/mockArranger'

type SuggestionAction = 'chords' | 'melody' | 'bass' | 'drums'

export function AIAssistantPanel() {
  const [pendingAction, setPendingAction] = useState<SuggestionAction | null>(null)
  const [statusMessage, setStatusMessage] = useState('Backend AI will be used when available.')
  const [errorMessage, setErrorMessage] = useState('')
  // Holds the controller for any in-flight request so we can cancel it if a new one starts.
  const abortControllerRef = useRef<AbortController | null>(null)

  const project = useArrangerStore((state) => state.project)
  const suggestionHistory = useArrangerStore((state) => state.suggestionHistory)
  const selectedSuggestionId = useArrangerStore((state) => state.selectedSuggestionId)
  const addSuggestion = useArrangerStore((state) => state.addSuggestion)
  const selectSuggestion = useArrangerStore((state) => state.selectSuggestion)
  const applySuggestion = useArrangerStore((state) => state.applySuggestion)

  const selectedItem =
    suggestionHistory.find((item) => item.id === selectedSuggestionId) ?? suggestionHistory[0] ?? null

  const handleSuggestionResult = (result: AISuggestionResult) => {
    addSuggestion(result)
    setStatusMessage(getSourceMessage(result))
    setErrorMessage(result.source === 'local-mock' || result.warning ? (result.warning ?? '') : '')
  }

  const requestSuggestion = async (
    action: SuggestionAction,
    request: (signal: AbortSignal) => Promise<AISuggestionResult>,
  ) => {
    // Cancel any in-flight request before starting a new one.
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setPendingAction(action)
    setErrorMessage('')

    try {
      handleSuggestionResult(await request(controller.signal))
    } catch (error) {
      // AbortError means the request was intentionally cancelled — do not update state.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      setErrorMessage(error instanceof Error ? error.message : 'Request failed.')
    } finally {
      setPendingAction(null)
      abortControllerRef.current = null
    }
  }

  return (
    <aside className="min-w-0 xl:w-[360px] xl:shrink-0">
      <Panel title="AI Arranger Assistant" eyebrow="Backend AI" className="h-full">
        <div className="grid gap-3 p-4">
          <Button
            variant="secondary"
            icon={getActionIcon('chords', pendingAction, <ListMusic size={17} aria-hidden="true" />)}
            onClick={() => requestSuggestion('chords', (signal) => requestChordSuggestion(project, signal))}
            disabled={pendingAction !== null}
          >
            Suggest chord progression
          </Button>
          <Button
            variant="secondary"
            icon={getActionIcon('melody', pendingAction, <WandSparkles size={17} aria-hidden="true" />)}
            onClick={() => requestSuggestion('melody', (signal) => requestMelodySuggestion(project, signal))}
            disabled={pendingAction !== null}
          >
            Suggest melody variation
          </Button>
          <Button
            variant="secondary"
            icon={getActionIcon('bass', pendingAction, <Music size={17} aria-hidden="true" />)}
            onClick={() => requestSuggestion('bass', (signal) => requestBassSuggestion(project, signal))}
            disabled={pendingAction !== null}
          >
            Suggest bass line
          </Button>
          <Button
            variant="secondary"
            icon={getActionIcon('drums', pendingAction, <Drum size={17} aria-hidden="true" />)}
            onClick={() => requestSuggestion('drums', (signal) => requestDrumSuggestion(project, signal))}
            disabled={pendingAction !== null}
          >
            Suggest drum groove
          </Button>
          <div
            className="rounded-lg border border-studio-line bg-slate-950/50 p-3 text-sm leading-5 text-slate-300"
            role="status"
          >
            {pendingAction ? 'Requesting arrangement suggestion...' : statusMessage}
            {errorMessage && <p className="mt-2 text-xs text-studio-amber">{errorMessage}</p>}
          </div>
        </div>

        <div className="border-t border-studio-line p-4">
          {selectedItem ? (
            <div className="grid gap-4">
              <div>
                <div className="flex items-center gap-2 text-studio-teal">
                  <Bot size={18} aria-hidden="true" />
                  <h3 className="text-base font-semibold text-white">{selectedItem.suggestion.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{describeSuggestion(selectedItem.suggestion)}</p>
              </div>

              <SuggestionDetails suggestion={selectedItem.suggestion} />

              <Button
                variant="primary"
                icon={<Check size={17} aria-hidden="true" />}
                onClick={() => applySuggestion(selectedItem.id)}
              >
                {selectedItem.suggestion.kind === 'chords'
                  ? 'Apply progression'
                  : selectedItem.suggestion.kind === 'melody'
                    ? 'Apply melody'
                    : selectedItem.suggestion.kind === 'bass'
                      ? 'Apply bass line'
                      : 'Apply drum groove'}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-studio-line bg-slate-950/50 p-4 text-sm leading-6 text-slate-400">
              Mock suggestions are generated locally from key, scale, style, chords, and melody.
            </div>
          )}
        </div>

        <div className="border-t border-studio-line p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Clock3 size={16} className="text-studio-amber" aria-hidden="true" />
            Suggestion history
          </div>
          {suggestionHistory.length > 0 ? (
            <div className="grid max-h-64 gap-2 overflow-auto pr-1">
              {suggestionHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSuggestion(item.id)}
                  className={cn(
                    'rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-studio-teal/60',
                    selectedItem?.id === item.id
                      ? 'border-studio-teal bg-studio-teal/10'
                      : 'border-studio-line bg-slate-950/40 hover:border-studio-teal/60',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-100">{item.suggestion.title}</span>
                    {item.applied && (
                      <span className="rounded bg-studio-teal/20 px-1.5 py-0.5 text-xs text-studio-teal">Applied</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleTimeString()}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-studio-line bg-slate-950/40 p-3 text-sm text-slate-500">
              No suggestions yet.
            </p>
          )}
        </div>
      </Panel>
    </aside>
  )
}

function SuggestionDetails({ suggestion }: { suggestion: ArrangerSuggestion }) {
  if (suggestion.kind === 'chords') {
    return (
      <div className="flex flex-wrap gap-2">
        {suggestion.chords.map((chord) => (
          <span
            key={chord.id}
            className="rounded-md bg-studio-teal/10 px-3 py-2 text-sm font-semibold text-studio-teal"
          >
            {chord.symbol}
          </span>
        ))}
      </div>
    )
  }

  if (suggestion.kind === 'melody' || suggestion.kind === 'bass') {
    return <NoteList notes={suggestion.notes} />
  }

  return <DrumList pattern={suggestion.pattern} />
}

function NoteList({ notes }: { notes: NoteEvent[] }) {
  return (
    <div className="max-h-48 overflow-auto rounded-lg border border-studio-line bg-slate-950/50 p-3">
      <div className="flex flex-wrap gap-2">
        {notes.map((note) => (
          <span key={note.id} className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-300">
            {note.pitch} @ {note.startBeat + 1} / {note.durationBeats}b
          </span>
        ))}
      </div>
    </div>
  )
}

function DrumList({ pattern }: { pattern: DrumEvent[] }) {
  return (
    <div className="max-h-48 overflow-auto rounded-lg border border-studio-line bg-slate-950/50 p-3">
      <div className="flex flex-wrap gap-2">
        {pattern.map((event) => (
          <span key={event.id} className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-300">
            {event.voice} @ {event.startBeat + 1}
          </span>
        ))}
      </div>
    </div>
  )
}

function getActionIcon(
  action: SuggestionAction,
  pendingAction: SuggestionAction | null,
  idleIcon: ReactNode,
): ReactNode {
  if (pendingAction === action) {
    return <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
  }

  return idleIcon
}

function getSourceMessage(result: AISuggestionResult): string {
  if (result.source === 'backend-openai') {
    return 'Generated by backend AI.'
  }

  if (result.source === 'backend-mock') {
    return 'Backend returned a safe mock suggestion.'
  }

  return 'Backend unavailable, using local mock suggestion.'
}
