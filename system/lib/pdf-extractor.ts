import 'server-only'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs'

// Injeta o WorkerMessageHandler no globalThis para que o pdfjs use
// o fake worker em-processo, sem precisar de URL externa nem worker thread.
// É o mecanismo oficial do pdfjs para ambientes Node.js / sem worker support.
;(globalThis as Record<string, unknown>).pdfjsWorker = pdfjsWorker

export async function extrairTextoPDF(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer)

  const doc = await pdfjsLib.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    isOffscreenCanvasSupported: false,
  }).promise

  const paginas: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const pagina = await doc.getPage(i)
    const conteudo = await pagina.getTextContent()
    const textoDaPagina = conteudo.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    paginas.push(textoDaPagina)
    pagina.cleanup()
  }

  await doc.destroy()

  return paginas.join('\n\n')
}
