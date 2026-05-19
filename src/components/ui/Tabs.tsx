import type { ReactNode } from 'react'
import { cn } from './cn'

export type TabItem<T extends string> = {
  value: T
  label: string
  icon?: ReactNode
}

type TabsProps<T extends string> = {
  items: ReadonlyArray<TabItem<T>>
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}

export function Tabs<T extends string>({ items, value, onChange, ariaLabel, className }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex gap-1 rounded-lg border border-studio-line bg-slate-950/60 p-1', className)}
    >
      {items.map((item) => {
        const isActive = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-studio-teal/60',
              isActive
                ? 'bg-studio-teal text-slate-950'
                : 'text-slate-300 hover:bg-studio-raised hover:text-white',
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
