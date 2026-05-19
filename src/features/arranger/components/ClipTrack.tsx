import { Volume2, VolumeX, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Panel } from '../../../components/ui/Panel'
import { cn } from '../../../components/ui/cn'
import { SOUND_CATALOG, getClipById } from '../../soundLibrary/catalog/soundCatalog'
import { useArrangerStore } from '../store/arrangerStore'
import {
  BEATS_PER_BAR,
  PIANO_ROLL_STEP_BEATS,
  PIANO_ROLL_STEPS,
  PROJECT_BEATS,
  formatMeasureBeat,
  stepToBeat,
} from '../utils/musicTheory'

const stepColumns = Array.from({ length: PIANO_ROLL_STEPS }, (_, index) => index)
const measureCount = PROJECT_BEATS / BEATS_PER_BAR
const measures = Array.from({ length: measureCount }, (_, index) => index)
const stepsPerMeasure = BEATS_PER_BAR / PIANO_ROLL_STEP_BEATS
const gridTemplateColumns = `120px repeat(${PIANO_ROLL_STEPS}, minmax(24px, 1fr))`

export function ClipTrack() {
  const clips = useArrangerStore((state) => state.project.clips)
  const userClips = useArrangerStore((state) => state.project.userClips)
  const removeClipFromProject = useArrangerStore((state) => state.removeClipFromProject)
  const updateClipEvent = useArrangerStore((state) => state.updateClipEvent)

  const lookupClip = (id: string) => getClipById(id) ?? userClips.find((clip) => clip.id === id)

  return (
    <Panel title="Clip track" eyebrow="Audio Clips">
      <div className="overflow-auto p-4">
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
            {clips.length === 0 ? (
              <div className="grid" style={{ gridTemplateColumns }}>
                <div className="flex h-12 items-center border-r border-studio-line pr-3 text-right text-xs text-slate-500">
                  Clips
                </div>
                <div
                  className="flex h-12 items-center border-b border-r border-studio-line/70 bg-slate-950/50 px-3 text-xs italic text-slate-500"
                  style={{ gridColumn: '2 / -1' }}
                >
                  No clips added — open the Sound Library to browse {SOUND_CATALOG.length} demo sounds
                </div>
              </div>
            ) : (
              clips.map((event, index) => {
                const clip = lookupClip(event.clipId)
                const name = clip?.name ?? event.clipId
                const durationBeats = clip?.durationBeats ?? BEATS_PER_BAR
                const startStep = Math.round(event.startBeat / PIANO_ROLL_STEP_BEATS)
                const durationSteps = Math.max(1, Math.round(durationBeats / PIANO_ROLL_STEP_BEATS))
                const gainPercent = Math.round(event.gain * 100)

                return (
                  <div key={event.id} className="grid items-center pb-3" style={{ gridTemplateColumns }}>
                    <div className="flex h-16 flex-col justify-center border-r border-studio-line pr-3 text-right text-xs text-slate-500">
                      <span>Clip {index + 1}</span>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <Button
                          variant={event.muted ? 'danger' : 'ghost'}
                          size="icon"
                          aria-label={`${event.muted ? 'Unmute' : 'Mute'} clip ${index + 1}`}
                          aria-pressed={event.muted}
                          className="h-6 w-6"
                          onClick={() => updateClipEvent(event.id, { muted: !event.muted })}
                        >
                          {event.muted ? (
                            <VolumeX size={12} aria-hidden="true" />
                          ) : (
                            <Volume2 size={12} aria-hidden="true" />
                          )}
                        </Button>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={gainPercent}
                          onChange={(e) => updateClipEvent(event.id, { gain: Number(e.target.value) / 100 })}
                          className="h-1 w-16 cursor-pointer accent-studio-teal"
                          aria-label={`Clip ${index + 1} gain`}
                        />
                        <span className="w-6 text-right tabular-nums text-studio-amber">{gainPercent}</span>
                      </div>
                    </div>
                    {stepColumns.map((step) => (
                      <div
                        key={step}
                        className={cn(
                          'h-16 border-b border-r border-studio-line/70',
                          step % stepsPerMeasure === 0 ? 'border-l border-l-studio-amber/40' : '',
                          step % 2 === 0 ? 'bg-slate-900/70' : 'bg-slate-950/50',
                        )}
                      />
                    ))}
                    <div
                      className={cn(
                        'z-10 flex h-10 min-w-0 items-center justify-between self-center rounded-md border px-2 text-xs font-semibold',
                        event.muted
                          ? 'border-slate-600/40 bg-slate-600/20 text-slate-400'
                          : 'border-studio-lilac/40 bg-studio-lilac/20 text-studio-lilac',
                      )}
                      style={{ gridColumn: `${startStep + 2} / span ${durationSteps}`, gridRow: 1 }}
                    >
                      <span className="truncate">
                        {name} · {formatMeasureBeat(event.startBeat)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${name}`}
                        className="h-7 w-7 shrink-0"
                        onClick={() => removeClipFromProject(event.id)}
                      >
                        <X size={14} aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </Panel>
  )
}
