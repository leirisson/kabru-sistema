# Spec — POC: Painel de acompanhamento de pedidos

## 1. Contexto e problema

Distribuidora de peças de moto emite orçamentos/pedidos para vendedores externos, mas o vendedor não tem visibilidade do que acontece com o pedido depois da emissão — separação, conferência, faturamento e expedição ocorrem no estoque, sem nenhum sistema que exponha esse status. O objetivo desta POC é criar um painel de acompanhamento que dê visibilidade em tempo quase real desse fluxo, sem ainda integrar emissão fiscal ou ERP existente.

## 2. Stack técnica

- Next.js (App Router)
- TypeScript
- Prisma ORM
- Docker
- PostgreSQL
- Zod (validação de entrada em server actions/rotas)
- NextAuth com Credentials Provider (autenticação)
- pdf-parse (extração de texto de PDFs no servidor)
- OpenRouter SDK (parsing inteligente do PDF via LLM)

## 3. Papéis (roles) e permissões

| Role | Pode visualizar o painel | Pode mover pedidos | Etapa que controla |
|---|---|---|---|
| ADMIN | Sim | Sim (todas) | Cadastro de usuários e papéis |
| VENDEDOR | Sim | Não | — |
| ESTOQUE | Sim | Sim | Separação |
| CONFERENCIA | Sim | Sim | Conferência → Conferido |
| FATURAMENTO | Sim | Sim | Faturamento |
| EXPEDICAO | Sim | Sim | Separação de destinatário |

Regra geral de acesso: **leitura do painel é liberada para qualquer usuário autenticado**, independente do role. **Escrita (avançar status) é restrita por role** — o botão de avançar etapa só fica habilitado para quem tem permissão sobre aquela transição específica. Não há tabela de permissões granular nesta fase; o controle é feito checando o campo `role` do usuário autenticado.

## 4. Fluxo de status (state machine)

```
AGUARDANDO_SEPARACAO → SEPARACAO → CONFERENCIA → CONFERIDO → FATURAMENTO → SEPARACAO_DESTINATARIO → CONCLUIDO
```

Cada transição é unidirecional (sem voltar status nesta POC) e só pode ser executada pelo role responsável pela etapa de destino (tabela acima). Toda transição grava um registro em `HistoricoStatus` com usuário, status anterior, status novo e timestamp — isso alimenta tanto a auditoria quanto a linha do tempo exibida no detalhe do pedido.

## 5. SLA por status

Tempos configuráveis, usados para colorir o indicador de tempo decorrido no painel (verde / amarelo / vermelho). Valores iniciais a calibrar depois com dados reais de operação:

| Status | Aviso (amarelo) | Crítico (vermelho) |
|---|---|---|
| Separação | 30 min | 60 min |
| Conferência | 20 min | 45 min |
| Conferido | 30 min | 90 min |
| Faturamento | 20 min | 45 min |
| Separação de destinatário | 30 min | 60 min |

Esses valores ficam em uma tabela `SlaConfig`, não hardcoded, para serem ajustados sem alteração de código.

## 6. Modelo de dados (Prisma)

```prisma
enum Role {
  ADMIN
  VENDEDOR
  ESTOQUE
  CONFERENCIA
  FATURAMENTO
  EXPEDICAO
}

enum StatusPedido {
  AGUARDANDO_SEPARACAO
  SEPARACAO
  CONFERENCIA
  CONFERIDO
  FATURAMENTO
  SEPARACAO_DESTINATARIO
  CONCLUIDO
}

model Usuario {
  id        String   @id @default(uuid())
  nome      String
  email     String   @unique
  senhaHash String
  role      Role
  createdAt DateTime @default(now())

  pedidosComoVendedor Pedido[]          @relation("Vendedor")
  historicos          HistoricoStatus[]
}

model Cliente {
  id                String  @id @default(uuid())
  razaoSocial       String
  nomeFantasia      String?
  cnpj              String  @unique
  inscricaoEstadual String?
  telefone          String?
  email             String?
  endereco          String?
  bairro            String?
  cep               String?
  cidade            String?
  estado            String?
  pedidos           Pedido[]
}

model Produto {
  id        String       @id @default(uuid())
  codigo    String       @unique
  descricao String
  unidade   String
  itens     ItemPedido[]
}

model Pedido {
  id                String       @id @default(uuid())
  numero            Int          @unique
  cliente           Cliente      @relation(fields: [clienteId], references: [id])
  clienteId         String
  vendedor          Usuario      @relation("Vendedor", fields: [vendedorId], references: [id])
  vendedorId        String
  condicaoPagamento String
  dataEmissao       DateTime
  valorTotal        Decimal
  statusAtual       StatusPedido @default(AGUARDANDO_SEPARACAO)
  itens             ItemPedido[]
  historico         HistoricoStatus[]
  createdAt         DateTime     @default(now())
}

model ItemPedido {
  id           String  @id @default(uuid())
  pedido       Pedido  @relation(fields: [pedidoId], references: [id])
  pedidoId     String
  produto      Produto @relation(fields: [produtoId], references: [id])
  produtoId    String
  quantidade   Int
  precoLiquido Decimal
  subtotal     Decimal
}

model HistoricoStatus {
  id         String       @id @default(uuid())
  pedido     Pedido       @relation(fields: [pedidoId], references: [id])
  pedidoId   String
  status     StatusPedido
  usuario    Usuario      @relation(fields: [usuarioId], references: [id])
  usuarioId  String
  observacao String?
  criadoEm   DateTime     @default(now())
}

model SlaConfig {
  status         StatusPedido @id
  avisoMinutos   Int
  criticoMinutos Int
}
```

## 7. Painel de acompanhamento (requisito principal desta fase)

- Visão padrão: kanban com uma coluna por status (`SEPARACAO`, `CONFERENCIA`, `CONFERIDO`, `FATURAMENTO`, `SEPARACAO_DESTINATARIO`), mostrando todos os pedidos de todos os vendedores.
- Filtro opcional por vendedor via query param (`/painel?vendedorId=...`), sem restringir o acesso — qualquer usuário autenticado pode visualizar tanto a visão geral quanto a filtrada.
- Cada card de pedido mostra: número do pedido, cliente (nome fantasia), vendedor, valor total e um indicador de tempo decorrido no status atual, colorido conforme `SlaConfig`.
- Métricas agregadas no topo: pedidos em andamento, concluídos no dia, tempo médio por etapa, quantidade de pedidos em estado crítico de SLA.
- Atualização dos dados via polling client-side (revalidação a cada 15–30s); WebSocket fica fora de escopo nesta fase.
- Detalhe do pedido exibe a linha do tempo completa de `HistoricoStatus` (quem moveu, quando, de qual status para qual).

## 8. Autenticação

NextAuth com Credentials Provider, senha com hash bcrypt, sessão JWT. Middleware/guard nas server actions de transição de status valida o `role` da sessão antes de permitir a mutação. Leitura do painel não passa por checagem de role, apenas de sessão válida.

## 9. Importação de pedido via PDF

### Objetivo

Permitir que o vendedor faça upload do PDF do pedido (gerado externamente, como o exemplo da KABRU) e tenha o formulário de cadastro pré-preenchido automaticamente, reduzindo retrabalho de digitação e erros manuais.

### Fluxo completo

```
Vendedor faz upload do PDF
        ↓
Server Action extrai texto bruto via pdf-parse
        ↓
Texto enviado ao OpenRouter (modelo: google/gemini-flash-1.5)
        ↓
LLM devolve JSON estruturado com os dados do pedido
        ↓
JSON validado com Zod antes de qualquer uso
        ↓
Formulário de revisão exibido pré-preenchido para o vendedor
        ↓
Vendedor confirma, corrige ou complementa os dados
        ↓
Pedido salvo no banco após confirmação explícita
```

O LLM nunca salva dados diretamente — ele apenas estrutura o conteúdo extraído. A confirmação humana é obrigatória antes do `INSERT`.

### Integração OpenRouter

```typescript
// lib/openrouter.ts
import OpenAI from 'openai'

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
    'X-Title': 'POC Painel de Pedidos',
  },
})
```

OpenRouter usa o SDK `openai` como cliente — apenas a `baseURL` e a chave mudam. O modelo padrão para esta feature é `google/gemini-flash-1.5` (rápido e barato para extração estruturada), mas pode ser trocado via variável de ambiente `OPENROUTER_MODEL` sem alteração de código.

### Prompt de extração

```typescript
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
```

### Schema Zod de validação do retorno

```typescript
// schemas/pedido-importado.ts
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
    email: z.string().email().nullable(),
    endereco: z.string().nullable(),
    bairro: z.string().nullable(),
    cep: z.string().nullable(),
    cidade: z.string().nullable(),
    estado: z.string().nullable(),
  }),
  itens: z.array(itemImportadoSchema).min(1),
  valorTotal: z.number().positive(),
})

export type PedidoImportado = z.infer<typeof pedidoImportadoSchema>
```

### Server Action de importação

```typescript
// app/actions/importar-pedido.ts
'use server'

import pdfParse from 'pdf-parse'
import { openrouter } from '@/lib/openrouter'
import { pedidoImportadoSchema } from '@/schemas/pedido-importado'

export async function importarPedidoPDF(formData: FormData) {
  const file = formData.get('pdf') as File
  if (!file || file.type !== 'application/pdf') {
    return { error: 'Arquivo inválido. Envie um PDF.' }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { text } = await pdfParse(buffer)

  const completion = await openrouter.chat.completions.create({
    model: process.env.OPENROUTER_MODEL ?? 'google/gemini-flash-1.5',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0,
  })

  const raw = completion.choices[0].message.content ?? ''

  const parsed = pedidoImportadoSchema.safeParse(JSON.parse(raw))
  if (!parsed.success) {
    return { error: 'Não foi possível extrair os dados do PDF. Verifique o arquivo e tente novamente.' }
  }

  return { data: parsed.data }
}
```

### Resolução de entidades no formulário de revisão

Antes de exibir o formulário ao vendedor, o sistema faz uma checagem no banco:

| Entidade | Já existe no banco? | Comportamento |
|---|---|---|
| Cliente (por CNPJ) | Sim | Vinculado automaticamente — exibido em verde |
| Cliente (por CNPJ) | Não | Formulário permite criar novo cadastro inline |
| Produto (por código) | Sim | Vinculado automaticamente — exibido em verde |
| Produto (por código) | Não | Exibido em amarelo — vendedor confirma criação ou vincula a produto existente |
| Vendedor (por nome) | Sim | Vinculado automaticamente ao usuário logado |

O vendedor só consegue submeter o formulário depois de resolver todos os itens destacados em amarelo.

### Variáveis de ambiente necessárias

```env
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=google/gemini-flash-1.5   # opcional, esse é o padrão
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

## 10. Telas

- Login
- Painel de pedidos (kanban geral + filtro por vendedor) — acesso liberado a todos os roles
- Detalhe do pedido (dados do pedido + linha do tempo de status)
- Importar pedido via PDF (Vendedor/Admin): upload, revisão com resolução de entidades, confirmação e salvamento
- Gestão de usuários (Admin): cadastro, edição de role
- Configuração de SLA (Admin): edição dos tempos de aviso/crítico por status

## 11. Fora de escopo da POC

- Emissão fiscal real de NF-e
- Integração com ERP/sistema legado existente
- Notificações push ou WhatsApp sobre mudança de status
- Permissões granulares customizáveis por empresa
- Suporte multi-empresa/multi-tenant
- Atualização em tempo real via WebSocket

## 12. Roadmap de implementação

1. **Fundação**: schema Prisma completo, migrations, seed com cliente/produtos de exemplo e um usuário por role.
2. **Autenticação e gestão de usuários**: login via NextAuth, CRUD de usuário pelo Admin, middleware de role nas rotas de mutação.
3. **Importação de PDF**: server action de extração com pdf-parse + integração OpenRouter + formulário de revisão com resolução de entidades.
4. **Fluxo de status e painel**: server actions de transição validadas com Zod (respeitando regras de role), tela de kanban com polling, cálculo de SLA e cores, tela de detalhe com linha do tempo.

## 13. Critérios de aceite

- Um pedido criado percorre todos os status na ordem definida, sem pular etapas.
- Cada transição de status só é executada com sucesso se o usuário tiver o role correspondente; caso contrário, a ação é bloqueada e reportada.
- O painel exibe todos os pedidos em andamento agrupados por status, atualizando automaticamente em até 30 segundos.
- O indicador de tempo no status muda de cor (verde/amarelo/vermelho) de acordo com os valores definidos em `SlaConfig`.
- Qualquer usuário autenticado, independente do role, consegue visualizar o painel completo e o histórico de um pedido específico.
- O upload de um PDF de pedido válido pré-preenche o formulário corretamente com todos os campos extraídos do documento.
- O sistema impede salvar um pedido importado enquanto houver produtos ou clientes não resolvidos (em amarelo) na tela de revisão.
- A chave da OpenRouter nunca é exposta no cliente — toda chamada à API ocorre exclusivamente em server actions.
