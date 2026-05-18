import { Panel } from '../../../components/ui/Panel'
import { cn } from '../../../components/ui/cn'
import { NOTE_DURATION_OPTIONS } from '../types/music'
import { useArrangerStore } from '../store/arrangerStore'
import {
  BEATS_PER_BAR,
  PIANO_ROLL_NOTES,
  PIANO_ROLL_STEP_BEATS,
  PIANO_ROLL_STEPS,
  PROJECT_BEATS,
  beatsToSteps,
  formatMeasureBeat,
  stepToBeat,
} from '../utils/musicTheory'

const stepColumns = Array.from({ length: PIANO_ROLL_STEPS }, (_, index) => index)
const measureCount = PROJECT_BEATS / BEATS_PER_BAR
const measures = Array.from({ length: measureCount }, (_, index) => index)
const stepsPerMeasure = BEATS_PER_BAR / PIANO_ROLL_STEP_BEATS
const gridTemplateColumns = `82px repeat(${PIANO_ROLL_STEPS}, minmax(24px, 1fr))`

export function PianoRoll() {
  const project = useArrangerStore((state) => state.project)
  const updateProjectMetadata = useArrangerStore((state) => state.updateProjectMetadata)
  const toggleMelodyNote = useArrangerStore((state) => state.toggleMelodyNote)

  return (
    <Panel
      title="Piano roll"
      eyebrow="Melody"
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2" role="group" aria-label="Note length">
          {NOTE_DURATION_OPTIONS.map((duration) => {
            const isActive = project.selectedNoteDurationBeats === duration

            return (
              <button
                key={duration}
                type="button"
                aria-pressed={isActive}
                onClick={() => updateProjectMetadata({ selectedNoteDurationBeats: duration })}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-studio-teal/60',
                  isActive
                    ? 'border-studio-teal bg-studio-teal text-slate-950'
                    : 'border-studio-line bg-slate-950/60 text-slate-300 hover:border-studio-teal/70',
                )}
              >
                {formatDuration(duration)}
              </button>
            )
          })}
        </div>
      }
    >
      <div className="max-h-[58vh] overflow-auto p-4">
        <div className="min-w-[1080px]">
          <div
            className="sticky top-0 z-20 grid gap-y-1 border-b border-studio-line bg-studio-panel pb-2 text-center text-xs text-slate-500"
            style={{ gridTemplateColumns }}
          >
            <div />
            {measures.map((measure) => (
              <div
                key={measure}
                className="rounded-md bg-slate-950/60 px-2 py-1 font-semibold text-studio-amber"
                style={{ gridColumn: `${measure * stepsPerMeasure + 2} / span ${stepsPerMeasure}` }}
              >
                Measure {measure + 1}
              </div>
            ))}
            <div />
            {stepColumns.map((step) => {
              const beat = stepToBeat(step)
              const isBeat = step % 2 === 0

              return (
                <div key={step} className={isBeat ? 'font-semibold text-slate-300' : 'text-slate-600'}>
                  {isBeat ? Math.floor(beat % BEATS_PER_BAR) + 1 : '+'}
                </div>
              )
            })}
          </div>

          <div className="pt-2">
            {PIANO_ROLL_NOTES.map((row) => (
              <div key={row.midi} className="grid" style={{ gridTemplateColumns }}>
                <div className="flex h-8 items-center border-r border-studio-line pr-3 text-right text-xs text-slate-500">
                  <span
                    className={
                      row.pitch.endsWith('C') || row.pitch.includes('C') ? 'font-semibold text-slate-300' : undefined
                    }
                  >
                    {row.pitch}
                  </span>
                </div>
                {stepColumns.map((step) => {
                  const startBeat = stepToBeat(step)
                  const coveredNote = project.melody.find(
                    (note) =>
                      note.midi === row.midi &&
                      startBeat >= note.startBeat &&
                      startBeat < note.startBeat + note.durationBeats,
                  )
                  const isCovered = Boolean(coveredNote)
                  const isStart = coveredNote ? Math.abs(coveredNote.startBeat - startBeat) < 0.001 : false
                  const isEnd = coveredNote
                    ? startBeat + PIANO_ROLL_STEP_BEATS >= coveredNote.startBeat + coveredNote.durationBeats - 0.001
                    : false
                  const isMeasureStart = step % stepsPerMeasure === 0

                  return (
                    <button
                      key={`${row.midi}-${step}`}
                      type="button"
                      aria-pressed={isCovered}
                      aria-label={`${isCovered ? 'Remove' : 'Add'} ${formatDuration(project.selectedNoteDurationBeats)} ${
                        row.pitch
                      } at ${formatMeasureBeat(startBeat)}`}
                      onClick={() => toggleMelodyNote(row.midi, startBeat)}
                      className={cn(
                        'h-8 border-b border-r border-studio-line/70 transition focus:relative focus:z-10 focus:outline-none focus:ring-2 focus:ring-studio-teal/70',
                        isMeasureStart ? 'border-l border-l-studio-amber/40' : '',
                        step % 2 === 0 ? 'bg-slate-900/80' : 'bg-slate-950/60',
                        isCovered
                          ? 'bg-studio-teal/85 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] hover:bg-cyan-200'
                          : 'hover:bg-studio-teal/20',
                        isStart ? 'rounded-l-md' : '',
                        isEnd ? 'rounded-r-md' : '',
                      )}
                    >
                      {isStart && coveredNote && (
                        <span className="sr-only">
                          {coveredNote.pitch} for {beatsToSteps(coveredNote.durationBeats)} steps
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

function formatDuration(duration: number): string {
  if (duration === 0.5) {
    return '1/2 beat'
  }

  return `${duration} beat${duration === 1 ? '' : 's'}`
}
