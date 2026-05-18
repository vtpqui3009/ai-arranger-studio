type MonitoringContext = Record<string, string | number | boolean | null | undefined>

const MONITORING_DSN = import.meta.env.VITE_ERROR_MONITORING_DSN?.trim()

export function initializeErrorMonitoring(): void {
  if (!MONITORING_DSN) {
    return
  }

  console.info('[monitoring] Error monitoring placeholder initialized.')
}

export function captureError(error: unknown, context: MonitoringContext = {}): void {
  if (!MONITORING_DSN) {
    return
  }

  console.error('[monitoring] Captured error placeholder', {
    error: normalizeError(error),
    context,
  })
}

function normalizeError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    }
  }

  return {
    name: 'UnknownError',
    message: String(error),
  }
}
