import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { captureError } from '../lib/monitoring/errorMonitoring'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    captureError(error, { componentStack: info.componentStack ?? '' })
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: '' })
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-900/60 bg-red-950/20 p-8 text-center">
        <p className="text-sm font-semibold text-red-400">Something went wrong</p>
        <p className="max-w-xs text-xs leading-5 text-slate-400">{this.state.message}</p>
        <button
          type="button"
          onClick={this.handleReload}
          className="rounded-lg bg-studio-teal/20 px-4 py-2 text-sm font-semibold text-studio-teal transition hover:bg-studio-teal/30 focus:outline-none focus:ring-2 focus:ring-studio-teal/60"
        >
          Try again
        </button>
      </div>
    )
  }
}
