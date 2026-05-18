import type { ReactNode } from 'react'
import { cn } from './cn'

type PanelProps = {
  title?: string
  eyebrow?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function Panel({ title, eyebrow, actions, children, className }: PanelProps) {
  return (
    <section className={cn('min-w-0 rounded-lg border border-studio-line bg-studio-panel/90 shadow-glow', className)}>
      {(title || eyebrow || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-studio-line/80 px-4 py-3">
          <div>
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-teal">{eyebrow}</p>}
            {title && <h2 className="mt-1 text-base font-semibold text-slate-50">{title}</h2>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}
