import { Bot, Check, Clock3, Drum, ListMusic, LoaderCircle, Music, WandSparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Panel } from '../../../components/ui/Panel'
import { cn } from '../../../components/ui/cn'
import type { ArrangerSuggestion, DrumEvent, NoteEvent, SuggestionHistoryItem } from '../types/music'
import { useArrangerStore } from '../store/arrangerStore'
import { createId } from '../utils/musicTheory'
import type { AISuggestionResult } from '../../../lib/ai/arrangerClient'
import {
  requestBassSuggestion,
  requestChordSuggestion,
  requestDrumSuggestion,
  requestMelodySuggestion,
} from '../../../lib/ai/arrangerClient'
import { describeSuggestion } from '../../../lib/ai/mockArranger'

const MAX_HISTORY_ITEMS = 8
type SuggestionAction = 'chords' | 'melody' | 'bass' | 'drums'

export function AIAssistantPanel() {
  const [history, setHistory] = useState<SuggestionHistoryItem[]>([])
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<SuggestionAction | null>(null)
  const [statusMessage, setStatusMessage] = useState('Backend AI will be used when available.')
  const [errorMessage, setErrorMessage] = useState('')
  const project = useArrangerStore((state) => state.project)
  const replaceChords = useArrangerStore((state) => state.replaceChords)
  const replaceMelody = useArrangerStore((state) => state.replaceMelody)
  const selectedItem = history.find((item) => item.id === selectedSuggestionId) ?? history[0] ?? null

  const addSuggestion = (result: AISuggestionResult) => {
    const item: SuggestionHistoryItem = {
      id: createId('suggestion'),
      suggestion: result.suggestion,
      createdAt: new Date().toISOString(),
      applied: false,
    }

    setHistory((currentHistory) => [item, ...currentHistory].slice(0, MAX_HISTORY_ITEMS))
    setSelectedSuggestionId(item.id)
    setStatusMessage(getSourceMessage(result))
    setErrorMessage(result.source === 'local-mock' || result.warning ? (result.warning ?? '') : '')
  }

  const requestSuggestion = async (action: SuggestionAction, request: () => Promise<AISuggestionResult>) => {
    setPendingAction(action)
    setErrorMessage('')

    try {
      addSuggestion(await request())
    } finally {
      setPendingAction(null)
    }
  }

  const applySuggestion = (item: SuggestionHistoryItem) => {
    if (item.suggestion.kind === 'chords') {
      replaceChords(item.suggestion.chords)
    }

    if (item.suggestion.kind === 'melody') {
      replaceMelody(item.suggestion.notes)
    }

    setHistory((currentHistory) =>
      currentHistory.map((historyItem) =>
        historyItem.id === item.id ? { ...historyItem, applied: true } : historyItem,
      ),
    )
  }

  return (
    <aside className="min-w-0 xl:w-[360px] xl:shrink-0">
      <Panel title="AI Arranger Assistant" eyebrow="Backend AI" className="h-full">
        <div className="grid gap-3 p-4">
          <Button
            variant="secondary"
            icon={getActionIcon('chords', pendingAction, <ListMusic size={17} aria-hidden="true" />)}
            onClick={() => requestSuggestion('chords', () => requestChordSuggestion(project))}
            disabled={pendingAction !== null}
          >
            Suggest chord progression
          </Button>
          <Button
            variant="secondary"
            icon={getActionIcon('melody', pendingAction, <WandSparkles size={17} aria-hidden="true" />)}
            onClick={() => requestSuggestion('melody', () => requestMelodySuggestion(project))}
            disabled={pendingAction !== null}
          >
            Suggest melody variation
          </Button>
          <Button
            variant="secondary"
            icon={getActionIcon('bass', pendingAction, <Music size={17} aria-hidden="true" />)}
            onClick={() => requestSuggestion('bass', () => requestBassSuggestion(project))}
            disabled={pendingAction !== null}
          >
            Suggest bass line
          </Button>
          <Button
            variant="secondary"
            icon={getActionIcon('drums', pendingAction, <Drum size={17} aria-hidden="true" />)}
            onClick={() => requestSuggestion('drums', () => requestDrumSuggestion(project))}
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

              {(selectedItem.suggestion.kind === 'chords' || selectedItem.suggestion.kind === 'melody') && (
                <Button
                  variant="primary"
                  icon={<Check size={17} aria-hidden="true" />}
                  onClick={() => applySuggestion(selectedItem)}
                >
                  {selectedItem.suggestion.kind === 'chords' ? 'Apply progression' : 'Apply melody'}
                </Button>
              )}
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
          {history.length > 0 ? (
            <div className="grid max-h-64 gap-2 overflow-auto pr-1">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedSuggestionId(item.id)}
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
