import { cn } from './cn'

type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps = {
  id: string
  label: string
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
  className?: string
}

export function SelectField({ id, label, value, options, onChange, className }: SelectFieldProps) {
  return (
    <label className={cn('grid gap-2 text-sm text-slate-300', className)} htmlFor={id}>
      <span className="font-medium">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-lg border border-studio-line bg-slate-950/70 px-3 text-slate-50 outline-none transition focus:border-studio-teal focus:ring-2 focus:ring-studio-teal/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
