import 'server-only'
import PDFParser from 'pdf2json'

export async function extrairTextoPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true)

    pdfParser.on('pdfParser_dataError', (errData) => {
      reject(new Error(errData.parserError))
    })

    pdfParser.on('pdfParser_dataReady', () => {
      const text = pdfParser.getRawTextContent()
      resolve(text)
    })

    pdfParser.parseBuffer(buffer)
  })
}
