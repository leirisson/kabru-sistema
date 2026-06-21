'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { NEXT_STATUS, getPermissoesUsuario } from '@/lib/status-flow'
import { sseBus } from '@/lib/sse-bus'

function emitirAtualizacao() {
  const encoder = new TextEncoder()
  const chunk = encoder.encode('data: update\n\n')
  for (const fn of sseBus) {
    fn(chunk)
  }
}
import type { StatusPedido } from '@prisma/client'

type ActionResult = { erro?: string; ok?: boolean }

export async function avancarStatus(pedidoId: string): Promise<ActionResult> {
  const session = await verifySession()

  const parsed = z.string().uuid().safeParse(pedidoId)
  if (!parsed.success) return { erro: 'ID inválido' }

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } })
  if (!pedido) return { erro: 'Pedido não encontrado' }

  const proximoStatus = NEXT_STATUS[pedido.statusAtual] as StatusPedido | null
  if (!proximoStatus) return { erro: 'Pedido já está concluído' }

  const { podeAvancarPara } = await getPermissoesUsuario(session.userId, session.role)
  const podeAvancar = podeAvancarPara.includes(proximoStatus)
  if (!podeAvancar) return { erro: `Sem permissão para avançar para ${proximoStatus}` }

  await prisma.$transaction([
    prisma.pedido.update({
      where: { id: pedidoId },
      data: { statusAtual: proximoStatus },
    }),
    prisma.historicoStatus.create({
      data: {
        pedidoId,
        status: proximoStatus,
        usuarioId: session.userId,
      },
    }),
  ])

  revalidatePath('/painel', 'page')
  emitirAtualizacao()
  return { ok: true }
}

export async function salvarPedidoImportado(dados: {
  numeroPedido: number
  dataEmissao: string
  condicaoPagamento: string
  vendedorId: string
  cliente: {
    razaoSocial: string
    nomeFantasia: string | null
    cnpj: string
    inscricaoEstadual: string | null
    telefone: string | null
    email: string | null
    endereco: string | null
    bairro: string | null
    cep: string | null
    cidade: string | null
    estado: string | null
  }
  itens: Array<{
    codigoProduto: string
    descricao: string
    quantidade: number
    unidade: string
    precoLiquido: number
    subtotal: number
  }>
  valorTotal: number
}): Promise<ActionResult & { pedidoId?: string }> {
  const session = await verifySession()
  if (session.role !== 'VENDEDOR' && session.role !== 'ADMIN') {
    return { erro: 'Sem permissão para importar pedidos' }
  }

  // Check if pedido already exists
  const pedidoExistente = await prisma.pedido.findUnique({
    where: { numero: dados.numeroPedido },
  })

  if (pedidoExistente) {
    return { erro: `Pedido número ${dados.numeroPedido} já existe no sistema.` }
  }

  const vendedorExiste = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { id: true },
  })
  if (!vendedorExiste) {
    return { erro: 'Usuário da sessão não encontrado no banco. Faça logout e entre novamente.' }
  }

  const cliente = await prisma.cliente.upsert({
    where: { cnpj: dados.cliente.cnpj },
    update: {},
    create: dados.cliente,
  })

  const produtosUpserted = await Promise.all(
    dados.itens.map((item) =>
      prisma.produto.upsert({
        where: { codigo: item.codigoProduto },
        update: {},
        create: {
          codigo: item.codigoProduto,
          descricao: item.descricao,
          unidade: item.unidade,
        },
      }),
    ),
  )

  const pedido = await prisma.pedido.create({
    data: {
      numero: dados.numeroPedido,
      clienteId: cliente.id,
      vendedorId: session.userId,
      condicaoPagamento: dados.condicaoPagamento,
      dataEmissao: new Date(dados.dataEmissao),
      valorTotal: dados.valorTotal,
      statusAtual: 'AGUARDANDO_SEPARACAO',
      itens: {
        create: dados.itens.map((item, i) => ({
          produtoId: produtosUpserted[i].id,
          quantidade: item.quantidade,
          precoLiquido: item.precoLiquido,
          subtotal: item.subtotal,
        })),
      },
      historico: {
        create: {
          status: 'AGUARDANDO_SEPARACAO',
          usuarioId: session.userId,
        },
      },
    },
  })

  revalidatePath('/painel', 'page')
  revalidatePath('/pedidos', 'page')
  return { ok: true, pedidoId: pedido.id }
}
