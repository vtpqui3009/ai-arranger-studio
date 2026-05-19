import { Sparkles, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { Tabs, type TabItem } from '../../../components/ui/Tabs'
import { AIAssistantPanel } from '../../arranger/components/AIAssistantPanel'
import { AISongGenerationPanel } from './AISongGenerationPanel'

type AITab = 'suggest' | 'generate'

const TAB_ITEMS: ReadonlyArray<TabItem<AITab>> = [
  { value: 'suggest', label: 'Suggest parts', icon: <Wand2 size={14} aria-hidden="true" /> },
  { value: 'generate', label: 'Generate clip', icon: <Sparkles size={14} aria-hidden="true" /> },
]

export function AIStudioPanel() {
  const [tab, setTab] = useState<AITab>('suggest')

  return (
    <aside className="min-w-0 xl:w-[360px] xl:shrink-0">
      <div className="rounded-lg border border-studio-line bg-studio-panel/90 shadow-glow">
        <div className="border-b border-studio-line/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-teal">AI Studio</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">Demo — No real AI</h2>
          <div className="mt-3">
            <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} ariaLabel="AI Studio mode" />
          </div>
        </div>
        <div>
          {tab === 'suggest' ? (
            <div className="-mt-px">
              <EmbeddedAssistant />
            </div>
          ) : (
            <div className="-mt-px">
              <EmbeddedGenerator />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

// The two existing panels render their own <Panel> shells with their own header;
// inside the unified AI Studio we suppress the inner shell so we have one frame and one title.
// "[&_section>div:first-child]:hidden" hides the Panel's title/eyebrow row.
const embedClasses =
  '[&_section]:rounded-none [&_section]:border-0 [&_section]:bg-transparent [&_section]:shadow-none ' +
  '[&_aside]:w-full [&_aside]:xl:w-full ' +
  '[&_section>div:first-child]:hidden'

function EmbeddedAssistant() {
  return (
    <div className={embedClasses}>
      <AIAssistantPanel />
    </div>
  )
}

function EmbeddedGenerator() {
  return (
    <div className={embedClasses}>
      <AISongGenerationPanel />
    </div>
  )
}
