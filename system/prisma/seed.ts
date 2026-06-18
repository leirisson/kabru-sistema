import { config } from 'dotenv'
config()

import { PrismaClient, Role, StatusPedido } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const SENHA = 'senha123'
const CUSTO = 10

async function main() {
  const senhaHash = await hash(SENHA, CUSTO)

  // Usuários — um por role
  const usuarios = await Promise.all([
    prisma.usuario.upsert({
      where: { email: 'admin@kabru.local' },
      update: {},
      create: { nome: 'Administrador', email: 'admin@kabru.local', senhaHash, role: Role.ADMIN },
    }),
    prisma.usuario.upsert({
      where: { email: 'vendedor@kabru.local' },
      update: {},
      create: { nome: 'João Vendedor', email: 'vendedor@kabru.local', senhaHash, role: Role.VENDEDOR },
    }),
    prisma.usuario.upsert({
      where: { email: 'estoque@kabru.local' },
      update: {},
      create: { nome: 'Maria Estoque', email: 'estoque@kabru.local', senhaHash, role: Role.ESTOQUE },
    }),
    prisma.usuario.upsert({
      where: { email: 'conferencia@kabru.local' },
      update: {},
      create: { nome: 'Pedro Conferência', email: 'conferencia@kabru.local', senhaHash, role: Role.CONFERENCIA },
    }),
    prisma.usuario.upsert({
      where: { email: 'faturamento@kabru.local' },
      update: {},
      create: { nome: 'Ana Faturamento', email: 'faturamento@kabru.local', senhaHash, role: Role.FATURAMENTO },
    }),
    prisma.usuario.upsert({
      where: { email: 'expedicao@kabru.local' },
      update: {},
      create: { nome: 'Carlos Expedição', email: 'expedicao@kabru.local', senhaHash, role: Role.EXPEDICAO },
    }),
  ])

  const [admin, vendedor] = usuarios

  // Clientes
  const clientes = await Promise.all([
    prisma.cliente.upsert({
      where: { cnpj: '11222333000181' },
      update: {},
      create: {
        razaoSocial: 'Auto Peças Central Ltda',
        nomeFantasia: 'Central Motos',
        cnpj: '11222333000181',
        telefone: '(11) 9 9999-1111',
        email: 'compras@centralmotos.com.br',
        cidade: 'São Paulo',
        estado: 'SP',
      },
    }),
    prisma.cliente.upsert({
      where: { cnpj: '44555666000172' },
      update: {},
      create: {
        razaoSocial: 'Moto Shop Norte ME',
        nomeFantasia: 'Moto Shop',
        cnpj: '44555666000172',
        telefone: '(11) 9 8888-2222',
        cidade: 'Guarulhos',
        estado: 'SP',
      },
    }),
    prisma.cliente.upsert({
      where: { cnpj: '77888999000163' },
      update: {},
      create: {
        razaoSocial: 'Distribuidora Sul de Peças Eireli',
        nomeFantasia: 'Sul Peças',
        cnpj: '77888999000163',
        telefone: '(41) 9 7777-3333',
        cidade: 'Curitiba',
        estado: 'PR',
      },
    }),
  ])

  // Produtos
  const produtos = await Promise.all([
    prisma.produto.upsert({
      where: { codigo: 'FILTRO-AR-001' },
      update: {},
      create: { codigo: 'FILTRO-AR-001', descricao: 'Filtro de Ar Honda CG 160', unidade: 'UN' },
    }),
    prisma.produto.upsert({
      where: { codigo: 'PASTILHA-F-002' },
      update: {},
      create: { codigo: 'PASTILHA-F-002', descricao: 'Pastilha de Freio Dianteira Titan 150', unidade: 'JG' },
    }),
    prisma.produto.upsert({
      where: { codigo: 'CORRENTE-003' },
      update: {},
      create: { codigo: 'CORRENTE-003', descricao: 'Corrente Transmissão 428 x 130 Elos', unidade: 'UN' },
    }),
    prisma.produto.upsert({
      where: { codigo: 'PNEU-T-004' },
      update: {},
      create: { codigo: 'PNEU-T-004', descricao: 'Pneu Traseiro 90/90-18 Pirelli MT66', unidade: 'UN' },
    }),
    prisma.produto.upsert({
      where: { codigo: 'OLEO-M-005' },
      update: {},
      create: { codigo: 'OLEO-M-005', descricao: 'Óleo Motor 4T 10W40 Semi-Sintético 1L', unidade: 'LT' },
    }),
  ])

  // SLA Config conforme spec §5
  const slaConfigs = [
    { status: StatusPedido.SEPARACAO,              avisoMinutos: 30, criticoMinutos: 60 },
    { status: StatusPedido.CONFERENCIA,            avisoMinutos: 20, criticoMinutos: 45 },
    { status: StatusPedido.CONFERIDO,              avisoMinutos: 30, criticoMinutos: 90 },
    { status: StatusPedido.FATURAMENTO,            avisoMinutos: 20, criticoMinutos: 45 },
    { status: StatusPedido.SEPARACAO_DESTINATARIO, avisoMinutos: 30, criticoMinutos: 60 },
  ]

  for (const cfg of slaConfigs) {
    await prisma.slaConfig.upsert({
      where: { status: cfg.status },
      update: { avisoMinutos: cfg.avisoMinutos, criticoMinutos: cfg.criticoMinutos },
      create: cfg,
    })
  }

  // Pedidos distribuídos pelos status do kanban
  const agora = new Date()
  const minutosAtras = (min: number) => new Date(agora.getTime() - min * 60 * 1000)

  type PedidoSeed = {
    numero: number
    clienteId: string
    vendedorId: string
    status: StatusPedido
    criadoHaMin: number
    valor: number
  }

  const pedidosSeed: PedidoSeed[] = [
    { numero: 1001, clienteId: clientes[0].id, vendedorId: vendedor.id, status: StatusPedido.SEPARACAO,              criadoHaMin: 15,  valor: 485.90 },
    { numero: 1002, clienteId: clientes[1].id, vendedorId: vendedor.id, status: StatusPedido.SEPARACAO,              criadoHaMin: 45,  valor: 1230.00 },
    { numero: 1003, clienteId: clientes[2].id, vendedorId: vendedor.id, status: StatusPedido.CONFERENCIA,            criadoHaMin: 10,  valor: 320.50 },
    { numero: 1004, clienteId: clientes[0].id, vendedorId: vendedor.id, status: StatusPedido.CONFERENCIA,            criadoHaMin: 55,  valor: 780.00 },
    { numero: 1005, clienteId: clientes[1].id, vendedorId: vendedor.id, status: StatusPedido.CONFERIDO,              criadoHaMin: 25,  valor: 2100.00 },
    { numero: 1006, clienteId: clientes[2].id, vendedorId: vendedor.id, status: StatusPedido.CONFERIDO,              criadoHaMin: 100, valor: 560.00 },
    { numero: 1007, clienteId: clientes[0].id, vendedorId: vendedor.id, status: StatusPedido.FATURAMENTO,            criadoHaMin: 18,  valor: 945.00 },
    { numero: 1008, clienteId: clientes[1].id, vendedorId: vendedor.id, status: StatusPedido.FATURAMENTO,            criadoHaMin: 50,  valor: 3400.00 },
    { numero: 1009, clienteId: clientes[2].id, vendedorId: vendedor.id, status: StatusPedido.SEPARACAO_DESTINATARIO, criadoHaMin: 20,  valor: 670.00 },
    { numero: 1010, clienteId: clientes[0].id, vendedorId: vendedor.id, status: StatusPedido.SEPARACAO_DESTINATARIO, criadoHaMin: 65,  valor: 1890.00 },
  ]

  for (const p of pedidosSeed) {
    const jaExiste = await prisma.pedido.findUnique({ where: { numero: p.numero } })
    if (jaExiste) continue

    const transicaoEm = minutosAtras(p.criadoHaMin)

    const pedido = await prisma.pedido.create({
      data: {
        numero: p.numero,
        clienteId: p.clienteId,
        vendedorId: p.vendedorId,
        condicaoPagamento: '30/60/90 dias',
        dataEmissao: minutosAtras(p.criadoHaMin + 30),
        valorTotal: p.valor,
        statusAtual: p.status,
        createdAt: minutosAtras(p.criadoHaMin + 30),
        itens: {
          create: [
            {
              produtoId: produtos[0].id,
              quantidade: 2,
              precoLiquido: p.valor * 0.6,
              subtotal: p.valor * 0.6 * 2,
            },
            {
              produtoId: produtos[1].id,
              quantidade: 1,
              precoLiquido: p.valor * 0.4,
              subtotal: p.valor * 0.4,
            },
          ],
        },
      },
    })

    // Histórico: AGUARDANDO_SEPARACAO → status atual
    await prisma.historicoStatus.create({
      data: {
        pedidoId: pedido.id,
        status: StatusPedido.AGUARDANDO_SEPARACAO,
        usuarioId: vendedor.id,
        criadoEm: minutosAtras(p.criadoHaMin + 30),
      },
    })

    await prisma.historicoStatus.create({
      data: {
        pedidoId: pedido.id,
        status: p.status,
        usuarioId: admin.id,
        criadoEm: transicaoEm,
      },
    })
  }

  console.log('Seed concluído.')
  console.log('Credenciais: <role>@kabru.local / senha123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
