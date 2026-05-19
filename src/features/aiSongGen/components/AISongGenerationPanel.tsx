import { LoaderCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Panel } from '../../../components/ui/Panel'
import { SelectField } from '../../../components/ui/SelectField'
import { ARRANGEMENT_STYLES, type ArrangementStyle } from '../../arranger/types/music'
import { useArrangerStore } from '../../arranger/store/arrangerStore'
import { useSongGenStore } from '../store/songGenStore'

const styleOptions = ARRANGEMENT_STYLES.map((style) => ({
  value: style,
  label: style === 'rnb' ? 'R&B' : style.charAt(0).toUpperCase() + style.slice(1),
}))

export function AISongGenerationPanel() {
  const projectStyle = useArrangerStore((state) => state.project.style)
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<ArrangementStyle>(projectStyle)
  const requests = useSongGenStore((state) => state.requests)
  const generate = useSongGenStore((state) => state.generate)
  const isPending = requests.some((request) => request.status === 'pending')

  return (
    <Panel title="AI Song Generator" eyebrow="Demo — No Real AI">
      <div className="grid gap-4 p-4">
        <p className="text-xs leading-5 text-slate-500">
          This is a demo mock generator. It creates synthesized placeholder clips locally with no AI model call.
        </p>

        <textarea
          rows={3}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe your sound idea — style, mood, energy..."
          className="w-full resize-none rounded-lg border border-studio-line bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-studio-teal focus:ring-2 focus:ring-studio-teal/20"
        />

        <SelectField
          id="gen-style"
          label="Style"
          value={style}
          options={styleOptions}
          onChange={(value) => setStyle(toArrangementStyle(value))}
        />

        <Button
          variant="primary"
          icon={
            isPending ? (
              <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
            ) : (
              <Sparkles size={17} aria-hidden="true" />
            )
          }
          disabled={isPending || prompt.trim().length === 0}
          onClick={() => void generate(prompt, style)}
        >
          {isPending ? 'Generating demo...' : 'Generate (Demo)'}
        </Button>

        {isPending && (
          <div className="h-1 overflow-hidden rounded-full bg-studio-teal/20">
            <div className="h-full w-1/2 rounded-full bg-studio-teal animate-pulse" />
          </div>
        )}

        {requests.length > 0 && (
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Demo Results</p>
            {requests.slice(0, 3).map((request) => (
              <div key={request.id} className="rounded-lg border border-studio-line bg-slate-950/50 p-3 text-xs">
                <p className="truncate font-semibold text-slate-200">{request.prompt}</p>
                <p
                  className={
                    request.status === 'done'
                      ? 'mt-1 text-studio-teal'
                      : request.status === 'error'
                        ? 'mt-1 text-studio-coral'
                        : 'mt-1 text-slate-400'
                  }
                >
                  {request.status === 'done'
                    ? 'Added to Sound Library'
                    : request.status === 'error'
                      ? request.errorMessage
                      : 'Generating...'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  )
}

function toArrangementStyle(value: string): ArrangementStyle {
  return ARRANGEMENT_STYLES.find((style) => style === value) ?? 'lofi'
}
