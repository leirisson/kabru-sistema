import 'server-only'
import * as pdfjsLib from 'pdfjs-dist'
import * as pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs'

// Configure pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export async function extrairTextoPDF(buffer: Buffer): Promise<string> {
  const typedArray = new Uint8Array(buffer)
  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise
  
  let fullText = ''
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    fullText += pageText + '\n'
  }
  
  return fullText
}
