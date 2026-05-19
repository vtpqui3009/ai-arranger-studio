import { useMemo, useState } from 'react'
import { Panel } from '../../../components/ui/Panel'
import { cn } from '../../../components/ui/cn'
import type { ChordEvent, DrumEvent, NoteEvent } from '../types/music'
import { useArrangerStore } from '../store/arrangerStore'
import { BEATS_PER_BAR, PROJECT_BEATS, formatMeasureBeat } from '../utils/musicTheory'

type TimelineLane = 'chords' | 'melody' | 'bass' | 'drums'

type TimelineEvent = {
  id: string
  lane: TimelineLane
  label: string
  detail: string
  startBeat: number
  durationBeats: number
}

const beats = Array.from({ length: PROJECT_BEATS }, (_, index) => index)
const measures = Array.from({ length: PROJECT_BEATS / BEATS_PER_BAR }, (_, index) => index)
const gridTemplateColumns = `96px repeat(${PROJECT_BEATS}, minmax(42px, 1fr))`

const laneMeta: Record<
  TimelineLane,
  {
    label: string
    emptyText: string
    className: string
    activeClassName: string
  }
> = {
  chords: {
    label: 'Chords',
    emptyText: 'No chords',
    className: 'border-studio-amber/60 bg-studio-amber/20 text-amber-100 hover:bg-studio-amber/30',
    activeClassName: 'ring-studio-amber',
  },
  melody: {
    label: 'Melody',
    emptyText: 'No melody',
    className: 'border-studio-teal/60 bg-studio-teal/20 text-cyan-100 hover:bg-studio-teal/30',
    activeClassName: 'ring-studio-teal',
  },
  bass: {
    label: 'Bass',
    emptyText: 'No bass',
    className: 'border-studio-coral/60 bg-studio-coral/20 text-red-100 hover:bg-studio-coral/30',
    activeClassName: 'ring-studio-coral',
  },
  drums: {
    label: 'Drums',
    emptyText: 'No drums',
    className: 'border-studio-lilac/60 bg-studio-lilac/20 text-violet-100 hover:bg-studio-lilac/30',
    activeClassName: 'ring-studio-lilac',
  },
}

const lanes: TimelineLane[] = ['chords', 'melody', 'bass', 'drums']

export function ArrangementTimeline() {
  const project = useArrangerStore((state) => state.project)
  const playback = useArrangerStore((state) => state.playback)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const timelineEvents = useMemo(() => buildTimelineEvents(project), [project])
  const selectedEvent = selectedEventId ? timelineEvents.find((event) => event.id === selectedEventId) : null
  const showCursor = playback.status === 'playing'

  return (
    <Panel
      title="Arrangement timeline"
      eyebrow="Overview"
      actions={
        <div className="flex flex-wrap justify-end gap-2 text-xs text-slate-400">
          <span className="rounded-md bg-slate-950/60 px-2 py-1">{PROJECT_BEATS} beats</span>
          <span className="rounded-md bg-slate-950/60 px-2 py-1">{project.tempo} BPM</span>
        </div>
      }
    >
      <div className="overflow-x-auto p-4">
        <div className="min-w-[820px]">
          <div
            className="grid gap-y-1 border-b border-studio-line pb-2 text-center text-xs text-slate-500"
            style={{ gridTemplateColumns }}
          >
            <div />
            {measures.map((measure) => (
              <div
                key={measure}
                className="rounded-md bg-slate-950/60 px-2 py-1 font-semibold text-studio-amber"
                style={{ gridColumn: `${measure * BEATS_PER_BAR + 2} / span ${BEATS_PER_BAR}` }}
              >
                Measure {measure + 1}
              </div>
            ))}
            <div />
            {beats.map((beat) => (
              <div key={beat} className={beat % BEATS_PER_BAR === 0 ? 'font-semibold text-studio-amber' : undefined}>
                B{(beat % BEATS_PER_BAR) + 1}
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-2">
            {lanes.map((lane) => (
              <TimelineLaneRow
                key={lane}
                lane={lane}
                events={timelineEvents.filter((event) => event.lane === lane)}
                selectedEventId={selectedEventId}
                onSelectEvent={setSelectedEventId}
                cursorBeat={showCursor ? playback.currentBeat : null}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-md border border-studio-line bg-slate-950/50 p-3 text-sm text-slate-300">
          {selectedEvent ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-semibold text-slate-50">{selectedEvent.label}</span>
              <span>{laneMeta[selectedEvent.lane].label}</span>
              <span>{formatMeasureBeat(selectedEvent.startBeat)}</span>
              <span>
                {selectedEvent.durationBeats} beat{selectedEvent.durationBeats === 1 ? '' : 's'}
              </span>
              <span className="text-slate-400">{selectedEvent.detail}</span>
            </div>
          ) : (
            <span className="text-slate-500">Select an event to inspect its timing and source lane.</span>
          )}
        </div>
      </div>
    </Panel>
  )
}

function TimelineLaneRow({
  lane,
  events,
  selectedEventId,
  onSelectEvent,
  cursorBeat,
}: {
  lane: TimelineLane
  events: TimelineEvent[]
  selectedEventId: string | null
  onSelectEvent: (id: string) => void
  cursorBeat: number | null
}) {
  const meta = laneMeta[lane]

  return (
    <div className="grid items-stretch" style={{ gridTemplateColumns }}>
      <div className="flex items-center border-r border-studio-line pr-3 text-right text-xs font-semibold text-slate-300">
        {meta.label}
      </div>
      <div
        className="relative col-span-16 min-h-14 overflow-hidden rounded-md border border-studio-line bg-slate-950/60"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, rgba(40, 50, 68, 0.75) 0, rgba(40, 50, 68, 0.75) 1px, transparent 1px, transparent 6.25%)',
        }}
      >
        {cursorBeat !== null && (
          <div
            className="pointer-events-none absolute inset-y-0 z-10 w-px bg-studio-teal shadow-[0_0_14px_rgba(57,217,200,0.9)]"
            style={{ left: `${clampPercent((cursorBeat / PROJECT_BEATS) * 100)}%` }}
          />
        )}
        {events.length === 0 && (
          <div className="flex h-full items-center px-3 text-xs text-slate-600">{meta.emptyText}</div>
        )}
        {events.map((event, index) => {
          const isSelected = selectedEventId === event.id
          const topOffset = 8 + (index % 2) * 22

          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelectEvent(event.id)}
              aria-pressed={isSelected}
              aria-label={`${meta.label}: ${event.label} at ${formatMeasureBeat(event.startBeat)}`}
              title={`${event.label} - ${event.detail}`}
              className={cn(
                'absolute h-5 min-w-5 truncate rounded border px-2 text-left text-[11px] font-semibold leading-5 transition focus:outline-none focus:ring-2',
                meta.className,
                isSelected ? `ring-2 ${meta.activeClassName}` : '',
              )}
              style={{
                left: `${clampPercent((event.startBeat / PROJECT_BEATS) * 100)}%`,
                top: topOffset,
                width: `${Math.max(3, (event.durationBeats / PROJECT_BEATS) * 100)}%`,
              }}
            >
              {event.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function buildTimelineEvents(project: {
  chords: ChordEvent[]
  melody: NoteEvent[]
  bass: NoteEvent[]
  drums: DrumEvent[]
}): TimelineEvent[] {
  return [
    ...project.chords.map((chord) => ({
      id: `chords-${chord.id}`,
      lane: 'chords' as const,
      label: chord.symbol,
      detail: 'Chord progression event',
      startBeat: chord.startBeat,
      durationBeats: chord.durationBeats,
    })),
    ...project.melody.map((note) => noteToTimelineEvent(note, 'melody')),
    ...project.bass.map((note) => noteToTimelineEvent(note, 'bass')),
    ...project.drums.map((event) => ({
      id: `drums-${event.id}`,
      lane: 'drums' as const,
      label: formatDrumVoice(event.voice),
      detail: `Velocity ${event.velocity.toFixed(2)}`,
      startBeat: event.startBeat,
      durationBeats: event.durationBeats,
    })),
  ].sort((left, right) => left.startBeat - right.startBeat || left.lane.localeCompare(right.lane))
}

function noteToTimelineEvent(note: NoteEvent, lane: 'melody' | 'bass'): TimelineEvent {
  return {
    id: `${lane}-${note.id}`,
    lane,
    label: note.pitch,
    detail: `MIDI ${note.midi} / velocity ${note.velocity.toFixed(2)}`,
    startBeat: note.startBeat,
    durationBeats: note.durationBeats,
  }
}

function formatDrumVoice(voice: DrumEvent['voice']): string {
  if (voice === 'closedHat') return 'Closed hat'
  if (voice === 'openHat') return 'Open hat'
  return voice[0].toUpperCase() + voice.slice(1)
}

function clampPercent(percent: number): number {
  return Math.min(100, Math.max(0, percent))
}
