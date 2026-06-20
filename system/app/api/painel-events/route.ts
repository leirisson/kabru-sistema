import { sseBus } from '@/lib/sse-bus'

const encoder = new TextEncoder()

export function emitirAtualizacao() {
  const chunk = encoder.encode('data: update\n\n')
  for (const fn of sseBus) {
    fn(chunk)
  }
}

export async function GET() {
  let subscriber: ((chunk: Uint8Array) => void) | undefined

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'))

      subscriber = (chunk) => {
        try {
          controller.enqueue(chunk)
        } catch {
          if (subscriber) sseBus.delete(subscriber)
        }
      }

      sseBus.add(subscriber)

      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(keepalive)
          if (subscriber) sseBus.delete(subscriber)
        }
      }, 15000)

      ;(controller as unknown as { _ka: ReturnType<typeof setInterval> })._ka = keepalive
    },
    cancel(controller) {
      const ka = (controller as unknown as { _ka: ReturnType<typeof setInterval> })._ka
      if (ka) clearInterval(ka)
      if (subscriber) sseBus.delete(subscriber)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
