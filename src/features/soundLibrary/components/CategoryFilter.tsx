import type { ReactNode } from 'react'
import type { SoundCategory } from '../types/soundClip'
import { SOUND_CATEGORIES } from '../types/soundClip'
import { cn } from '../../../components/ui/cn'

type CategoryFilterProps = {
  selected: SoundCategory | null
  onChange: (category: SoundCategory | null) => void
}

const accentClasses: Record<SoundCategory, string> = {
  drums: 'text-studio-coral',
  bass: 'text-studio-amber',
  atmosphere: 'text-studio-lilac',
  melody: 'text-studio-teal',
  fx: 'text-slate-400',
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto p-4" role="group" aria-label="Sound category filter">
      <Pill isActive={selected === null} onClick={() => onChange(null)}>
        All
      </Pill>
      {SOUND_CATEGORIES.map((category) => (
        <Pill key={category} isActive={selected === category} onClick={() => onChange(category)}>
          <span className={cn('text-lg leading-none', accentClasses[category])}>●</span>
          {labelFor(category)}
        </Pill>
      ))}
    </div>
  )
}

function Pill({ children, isActive, onClick }: { children: ReactNode; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-studio-teal/60',
        isActive
          ? 'border-transparent bg-studio-teal font-semibold text-slate-950'
          : 'border-studio-line bg-studio-raised text-slate-300 hover:border-studio-teal/50',
      )}
    >
      {children}
    </button>
  )
}

function labelFor(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
