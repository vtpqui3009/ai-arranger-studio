import { Panel } from '../../../components/ui/Panel'
import { useArrangerStore } from '../store/arrangerStore'
import { BEATS_PER_BAR, PROJECT_BEATS, formatMeasureBeat } from '../utils/musicTheory'

const beats = Array.from({ length: PROJECT_BEATS }, (_, index) => index)
const measures = Array.from({ length: PROJECT_BEATS / BEATS_PER_BAR }, (_, index) => index)

export function ChordTimeline() {
  const chords = useArrangerStore((state) => state.project.chords)
  const setChordSymbol = useArrangerStore((state) => state.setChordSymbol)

  return (
    <Panel title="Chord progression" eyebrow="Harmony">
      <div className="overflow-x-auto p-4">
        <div className="min-w-[760px]">
          <div
            className="grid gap-1 text-center text-xs text-slate-500"
            style={{ gridTemplateColumns: `repeat(${PROJECT_BEATS}, minmax(36px, 1fr))` }}
          >
            {measures.map((measure) => (
              <div
                key={measure}
                className="rounded-md bg-slate-950/60 px-2 py-1 font-semibold text-studio-amber"
                style={{ gridColumn: `${measure * BEATS_PER_BAR + 1} / span ${BEATS_PER_BAR}` }}
              >
                Measure {measure + 1}
              </div>
            ))}
            {beats.map((beat) => (
              <div key={beat} className={beat % 4 === 0 ? 'text-studio-amber' : undefined}>
                B{(beat % BEATS_PER_BAR) + 1}
              </div>
            ))}
          </div>
          <div
            className="mt-2 grid min-h-24 gap-2 rounded-lg bg-slate-950/70 p-2"
            style={{ gridTemplateColumns: `repeat(${PROJECT_BEATS}, minmax(36px, 1fr))` }}
          >
            {chords.map((chord) => (
              <label
                key={chord.id}
                className="flex min-h-20 flex-col justify-between rounded-lg border border-studio-line bg-studio-raised/90 p-3"
                style={{
                  gridColumn: `${Math.floor(chord.startBeat) + 1} / span ${Math.max(1, Math.round(chord.durationBeats))}`,
                }}
              >
                <span className="text-xs text-slate-500">{formatMeasureBeat(chord.startBeat)}</span>
                <input
                  value={chord.symbol}
                  onChange={(event) => setChordSymbol(chord.id, event.target.value)}
                  aria-label={`Chord starting at beat ${chord.startBeat + 1}`}
                  className="w-full rounded-md border border-transparent bg-slate-950/50 px-2 py-2 text-center text-lg font-semibold text-white outline-none transition focus:border-studio-teal focus:ring-2 focus:ring-studio-teal/20"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}
