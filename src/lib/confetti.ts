import type { Options } from 'canvas-confetti'

/**
 * Lazy-loads canvas-confetti only when an approval actually fires.
 * The library ships its own ~10KB chunk under vite's manualChunks config.
 */
export async function pop(opts?: Options) {
  const { default: confetti } = await import('canvas-confetti')
  confetti(opts)
}
