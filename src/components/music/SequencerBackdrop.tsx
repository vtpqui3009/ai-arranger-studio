const VISUAL_NOTES = [
  { row: 1, column: 2, span: 2, color: 'bg-studio-teal' },
  { row: 2, column: 5, span: 1, color: 'bg-studio-amber' },
  { row: 3, column: 8, span: 3, color: 'bg-studio-coral' },
  { row: 5, column: 3, span: 2, color: 'bg-studio-lilac' },
  { row: 6, column: 10, span: 2, color: 'bg-studio-teal' },
  { row: 8, column: 6, span: 1, color: 'bg-studio-amber' },
] as const

export function SequencerBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:72px_64px]" />
      <div className="absolute inset-x-[-10%] bottom-8 top-24 rotate-[-4deg] opacity-80">
        <div className="grid h-full grid-cols-12 grid-rows-8 gap-3">
          {VISUAL_NOTES.map((note) => (
            <div
              key={`${note.row}-${note.column}`}
              className={`${note.color} rounded-lg opacity-80 blur-[0.2px]`}
              style={{
                gridColumn: `${note.column} / span ${note.span}`,
                gridRow: `${note.row}`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-studio-ink/30 via-studio-ink/70 to-studio-ink" />
    </div>
  )
}
