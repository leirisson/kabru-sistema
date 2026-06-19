import 'server-only'
import { PDFParse } from 'pdf-parse'

export async function extrairTextoPDF(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer })
  const resultado = await parser.getText()
  return resultado.text
}
