import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from './cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'icon'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-studio-teal/60 bg-studio-teal text-slate-950 hover:bg-cyan-200',
  secondary: 'border-studio-line bg-studio-raised text-slate-100 hover:border-studio-teal/50 hover:bg-slate-800',
  ghost: 'border-transparent bg-transparent text-slate-300 hover:bg-white/5 hover:text-white',
  danger: 'border-red-400/40 bg-red-500/10 text-red-100 hover:bg-red-500/20',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 gap-2 px-3 text-sm',
  md: 'min-h-11 gap-2 px-4 text-sm',
  icon: 'h-10 w-10 justify-center p-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'secondary', size = 'md', icon, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center rounded-lg border font-semibold transition focus:outline-none focus:ring-2 focus:ring-studio-teal/60 focus:ring-offset-2 focus:ring-offset-studio-ink disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
