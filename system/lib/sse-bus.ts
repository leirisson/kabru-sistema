// Singleton via globalThis para sobreviver ao hot-reload do Next.js dev
// e ser compartilhado entre server actions e route handlers no mesmo processo.

type Subscriber = (chunk: Uint8Array) => void

declare global {
  // eslint-disable-next-line no-var
  var __sseBus: Set<Subscriber> | undefined
}

if (!globalThis.__sseBus) {
  globalThis.__sseBus = new Set<Subscriber>()
}

export const sseBus = globalThis.__sseBus
