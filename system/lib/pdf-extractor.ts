import 'server-only'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>

export async function extrairTextoPDF(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer)
  return result.text
}
