import type { InputHTMLAttributes } from 'react'
import { cn } from './cn'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
}

export function TextField({ id, label, className, ...props }: TextFieldProps) {
  return (
    <label className="grid gap-2 text-sm text-slate-300" htmlFor={id}>
      <span className="font-medium">{label}</span>
      <input
        id={id}
        className={cn(
          'min-h-10 rounded-lg border border-studio-line bg-slate-950/70 px-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-studio-teal focus:ring-2 focus:ring-studio-teal/20',
          className,
        )}
        {...props}
      />
    </label>
  )
}
