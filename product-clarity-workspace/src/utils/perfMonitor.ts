// Performance monitoring utility for development mode
// Only active when import.meta.env.DEV is true

const timers = new Map<string, number>()

export function startTimer(label: string): void {
  if (!import.meta.env.DEV) return
  timers.set(label, performance.now())
}

export function endTimer(label: string): number | null {
  if (!import.meta.env.DEV) return null

  const start = timers.get(label)
  if (!start) {
    console.warn(`[Perf] No timer found for: ${label}`)
    return null
  }

  const duration = performance.now() - start
  timers.delete(label)

  logPerf(label, duration)
  return duration
}

export function logPerf(label: string, duration: number): void {
  if (!import.meta.env.DEV) return

  const durationMs = Math.round(duration * 100) / 100
  let emoji = '✅'

  // Color code based on operation type and duration
  if (label.includes('analysis') || label.includes('generation')) {
    emoji = duration > 500 ? '🔴' : duration > 300 ? '🟡' : '✅'
  } else if (label.includes('export')) {
    emoji = duration > 3000 ? '🔴' : duration > 2000 ? '🟡' : '✅'
  } else if (label.includes('load')) {
    emoji = duration > 2000 ? '🔴' : duration > 1500 ? '🟡' : '✅'
  }

  console.log(`${emoji} [Perf] ${label}: ${durationMs}ms`)
}

// Decorator for async functions
export function measurePerf<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  label: string
): T {
  return (async (...args: any[]) => {
    startTimer(label)
    try {
      const result = await fn(...args)
      endTimer(label)
      return result
    } catch (error) {
      endTimer(label)
      throw error
    }
  }) as T
}
