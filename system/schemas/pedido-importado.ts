import { z } from 'zod'

export const itemImportadoSchema = z.object({
  codigoProduto: z.string(),
  descricao: z.string(),
  quantidade: z.number().int().positive(),
  unidade: z.string(),
  precoLiquido: z.number().positive(),
  subtotal: z.number().positive(),
})

export const pedidoImportadoSchema = z.object({
  numeroPedido: z.number().int().positive(),
  dataEmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  condicaoPagamento: z.string(),
  vendedorNome: z.string(),
  cliente: z.object({
    razaoSocial: z.string(),
    nomeFantasia: z.string().nullable(),
    cnpj: z.string(),
    inscricaoEstadual: z.string().nullable(),
    telefone: z.string().nullable(),
    email: z.union([z.email(), z.literal(''), z.null()]).nullable(),
    endereco: z.string().nullable(),
    bairro: z.string().nullable(),
    cep: z.string().nullable(),
    cidade: z.string().nullable(),
    estado: z.string().nullable(),
  }),
  itens: z.array(itemImportadoSchema).min(1),
  valorTotal: z.number().positive(),
})

export type ItemImportado = z.infer<typeof itemImportadoSchema>
export type PedidoImportado = z.infer<typeof pedidoImportadoSchema>
