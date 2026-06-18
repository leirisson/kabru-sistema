'use server'
import { extrairTextoPDF } from '@/lib/pdf-extractor'
import { openrouter } from '@/lib/openrouter'
import { verifySession } from '@/lib/dal'
import { pedidoImportadoSchema, type PedidoImportado } from '@/schemas/pedido-importado'
import { prisma } from '@/lib/prisma'

const SYSTEM_PROMPT = `
Você é um extrator de dados de pedidos de peças automotivas.
Analise o texto do pedido e retorne SOMENTE um JSON válido, sem markdown, sem explicações.

Estrutura esperada:
{
  "numeroPedido": number,
  "dataEmissao": "YYYY-MM-DD",
  "condicaoPagamento": string,
  "vendedorNome": string,
  "cliente": {
    "razaoSocial": string,
    "nomeFantasia": string | null,
    "cnpj": string,
    "inscricaoEstadual": string | null,
    "telefone": string | null,
    "email": string | null,
    "endereco": string | null,
    "bairro": string | null,
    "cep": string | null,
    "cidade": string | null,
    "estado": string | null
  },
  "itens": [
    {
      "codigoProduto": string,
      "descricao": string,
      "quantidade": number,
      "unidade": string,
      "precoLiquido": number,
      "subtotal": number
    }
  ],
  "valorTotal": number
}
`

export type ImportacaoResult =
  | { data: PedidoImportado; entidades: EntidadesExistentes; erro?: never }
  | { erro: string; data?: never }

export type EntidadesExistentes = {
  clienteExiste: boolean
  produtosExistentes: Record<string, boolean>
}

export async function importarPedidoPDF(formData: FormData): Promise<ImportacaoResult> {
  const session = await verifySession()
  if (session.role !== 'VENDEDOR' && session.role !== 'ADMIN') {
    return { erro: 'Sem permissão para importar pedidos' }
  }

  const file = formData.get('pdf') as File | null
  if (!file || file.type !== 'application/pdf') {
    return { erro: 'Arquivo inválido. Envie um PDF.' }
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let texto: string
  try {
    texto = await extrairTextoPDF(buffer)
  } catch (e) {
    console.error('[pdf-parse] erro:', e)
    return { erro: 'Não foi possível ler o PDF. Verifique se o arquivo não está corrompido.' }
  }

  if (!texto.trim()) {
    return { erro: 'O PDF não contém texto extraível.' }
  }

  const modelo = process.env.OPENROUTER_MODEL ?? 'google/gemini-flash-1.5-8b'
  let raw: string
  try {
    const completion = await openrouter.chat.completions.create({
      model: modelo,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: texto },
      ],
      temperature: 0,
    })
    raw = completion.choices[0].message.content ?? ''
  } catch (e) {
    console.error('[openrouter] erro:', e)
    return { erro: 'Falha ao comunicar com o serviço de extração. Tente novamente.' }
  }

  let jsonBruto: unknown
  try {
    const limpo = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    jsonBruto = JSON.parse(limpo)
  } catch {
    return { erro: 'O serviço de extração retornou uma resposta inválida. Tente novamente.' }
  }

  const parsed = pedidoImportadoSchema.safeParse(jsonBruto)
  if (!parsed.success) {
    return { erro: 'Não foi possível extrair todos os dados do PDF. Verifique o arquivo e tente novamente.' }
  }

  const entidades = await verificarEntidades(
    parsed.data.cliente.cnpj,
    parsed.data.itens.map((i) => i.codigoProduto),
  )

  return { data: parsed.data, entidades }
}

export async function verificarEntidades(
  cnpj: string,
  codigosProduto: string[],
): Promise<EntidadesExistentes> {
  const [cliente, produtos] = await Promise.all([
    prisma.cliente.findUnique({ where: { cnpj }, select: { id: true } }),
    prisma.produto.findMany({
      where: { codigo: { in: codigosProduto } },
      select: { codigo: true },
    }),
  ])

  const codigosExistentes = new Set(produtos.map((p) => p.codigo))
  const produtosExistentes: Record<string, boolean> = {}
  for (const codigo of codigosProduto) {
    produtosExistentes[codigo] = codigosExistentes.has(codigo)
  }

  return {
    clienteExiste: !!cliente,
    produtosExistentes,
  }
}
