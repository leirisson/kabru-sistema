# Spec — Localização de estoque, conferência com verificação e auditoria interna

## 1. Contexto e objetivo

O sistema atual rastreia o *pedido*, mas não rastreia *onde* cada produto fica fisicamente guardado nem *quanto* existe em estoque — a etapa de Conferência hoje é só um botão que avança o status, sem checagem real de disponibilidade. Essa spec resolve dois problemas relacionados:

1. O conferente precisa confirmar, item por item, que a peça **realmente existe em estoque**, não só clicar "conferido".
2. Para isso (e para auditorias internas), o estoque precisa ser **endereçado fisicamente**: organizado por rua, com torres dentro da rua e andares dentro da torre — um mapa de localização.

Isso introduz um conceito novo no domínio: **saldo de estoque por localização**, que não existia antes (o sistema só tinha produto + pedido, sem quantidade física).

## 2. Modelo de localização física

Hierarquia de 3 níveis: **Rua → Torre → Andar**. Cada combinação gera um endereço único, com um código legível para facilitar a busca física (ex: `R03-T02-A01`).

```prisma
model Localizacao {
  id       String @id @default(uuid())
  rua      String
  torre    String
  andar    String
  codigo   String @unique // gerado automaticamente: R{rua}-T{torre}-A{andar}

  estoques EstoqueProduto[]

  @@unique([rua, torre, andar])
}
```

O código é gerado pelo backend a partir de rua/torre/andar (não digitado manualmente), evitando inconsistência de formatação.

## 3. Saldo de estoque por localização

Decisão de modelagem: **um produto pode estar em mais de uma localização ao mesmo tempo** (ex: parte do estoque na rua 3 e parte na rua 7, por excesso de volume). Isso é o cenário mais realista de um estoque físico e não adiciona complexidade relevante em relação a um endereço único — é a mesma estrutura de tabela, só sem a restrição de unicidade por produto.

```prisma
model EstoqueProduto {
  id            String      @id @default(uuid())
  produto       Produto     @relation(fields: [produtoId], references: [id])
  produtoId     String
  localizacao   Localizacao @relation(fields: [localizacaoId], references: [id])
  localizacaoId String
  quantidade    Int         @default(0)

  @@unique([produtoId, localizacaoId])
}
```

O saldo total de um produto é a soma de `quantidade` em todas as suas localizações. Essa tabela é o que alimenta tanto a conferência (seção 4) quanto a auditoria (seção 5).

**Importante — o que esta fase NÃO faz:** o saldo não é decrementado automaticamente quando um pedido é faturado/expedido. A baixa automática de estoque fica fora de escopo desta fase (ver seção 8) — por enquanto, o saldo é ajustado manualmente pelo Estoque/Admin e corrigido pela auditoria.

## 4. Conferência de pedido com verificação de existência

Isso **modifica a etapa de Conferência** já definida no kanban operacional (spec do painel, seção 8). Hoje, avançar de `CONFERENCIA` para `CONFERIDO` é um clique simples. Passa a exigir confirmação item por item.

### Novo modelo

```prisma
model ConferenciaItem {
  id                  String    @id @default(uuid())
  itemPedido          ItemPedido @relation(fields: [itemPedidoId], references: [id])
  itemPedidoId        String    @unique
  conferido           Boolean   @default(false)
  quantidadeConferida Int?
  usuario             Usuario   @relation(fields: [usuarioId], references: [id])
  usuarioId           String
  observacao          String?
  conferidoEm         DateTime?
}
```

### Comportamento da tela

- Ao abrir um pedido em `CONFERENCIA`, o conferente vê a lista de itens do pedido. Para cada item: código e descrição do produto, quantidade pedida, **localização(ões) cadastradas** daquele produto (ex: "R03-T02-A01 — 12 un. / R07-T01-A03 — 5 un.") e o saldo total do sistema.
- Um checkbox "confere a existência" por item. Ao marcar, opcionalmente o conferente pode registrar a quantidade que efetivamente encontrou (`quantidadeConferida`) — útil quando o saldo do sistema não bate com o que está na prateleira.
- O pedido só pode avançar de `CONFERENCIA` para `CONFERIDO` quando **todos os itens** estiverem com `conferido = true`. Tentar avançar com item pendente bloqueia a ação com mensagem clara.
- Se a quantidade conferida for menor que a quantidade pedida, o item fica sinalizado (ex: ícone de alerta), mas não bloqueia o avanço — é uma decisão operacional do conferente, registrada via `observacao`.

## 5. Auditoria interna de estoque

Fluxo independente do pedido — percorre o mapa físico (rua/torre/andar) e confere o saldo de cada produto encontrado naquela localização, registrando divergências.

```prisma
model SessaoAuditoria {
  id            String    @id @default(uuid())
  localizacao   Localizacao @relation(fields: [localizacaoId], references: [id])
  localizacaoId String
  usuario       Usuario   @relation(fields: [usuarioId], references: [id])
  usuarioId     String
  iniciadoEm    DateTime  @default(now())
  finalizadoEm  DateTime?
  itens         ItemAuditoria[]
}

model ItemAuditoria {
  id                String   @id @default(uuid())
  sessao            SessaoAuditoria @relation(fields: [sessaoId], references: [id])
  sessaoId          String
  produto           Produto  @relation(fields: [produtoId], references: [id])
  produtoId         String
  quantidadeSistema Int      // saldo no EstoqueProduto no momento da auditoria
  quantidadeContada Int      // o que foi efetivamente contado
  divergencia       Int      // quantidadeContada - quantidadeSistema
  observacao        String?
}
```

### Fluxo

1. Usuário seleciona uma localização (rua/torre/andar) no mapa do estoque e inicia uma `SessaoAuditoria`.
2. O sistema lista todos os produtos com `EstoqueProduto` cadastrado naquela localização, mostrando a quantidade esperada (`quantidadeSistema`, copiada do saldo atual).
3. O usuário informa a quantidade contada fisicamente para cada produto.
4. O sistema calcula a divergência automaticamente e permite observação por item (ex: "3 unidades avariadas").
5. Ao finalizar a sessão, o saldo em `EstoqueProduto` é atualizado para refletir a contagem física — a auditoria é a forma de corrigir o saldo do sistema.

### Quem executa

Reaproveita os roles já existentes — `ESTOQUE` e `ADMIN` — sem necessidade de um perfil novo dedicado a auditoria, consistente com o restante do sistema (sem tabela de permissões granular nesta fase).

## 6. Mapa do estoque (visualização)

Tela que representa visualmente a hierarquia Rua → Torre → Andar, permitindo navegação até a localização desejada (para iniciar uma auditoria ou simplesmente localizar um produto). Cada localização mostra quantos produtos distintos e qual saldo total está alocado ali, dando uma visão rápida de ocupação antes de entrar em detalhe.

## 7. Telas

- **Cadastro de localizações** (Admin/Estoque): criar rua, torre, andar — código gerado automaticamente.
- **Vínculo produto ↔ localização** (Admin/Estoque): atribuir saldo inicial de um produto a uma ou mais localizações.
- **Mapa do estoque**: navegação visual pela hierarquia rua/torre/andar (seção 6).
- **Conferência de pedido** (atualização da tela existente): checklist por item com localização, saldo e checkbox de confirmação (seção 4).
- **Auditoria de estoque**: seleção de localização, contagem por produto, cálculo de divergência, finalização da sessão (seção 5).
- **Histórico de auditorias**: lista de sessões passadas por localização, com divergências encontradas — útil para identificar localizações com problema recorrente.

## 8. Fora de escopo desta fase

- Baixa automática de saldo ao faturar/expedir um pedido (o saldo só é ajustado manualmente ou via auditoria).
- Entrada de mercadoria/compra (recebimento de fornecedor) como fluxo formal — só o vínculo manual produto↔localização.
- Leitura de código de barras/QR code para conferência ou auditoria.
- Suporte a múltiplos galpões/depósitos (a hierarquia rua/torre/andar assume um único estoque físico).
- Sugestão automática de localização ideal para um novo produto (alocação manual nesta fase).

## 9. Critérios de aceite

- Um pedido em `CONFERENCIA` não avança para `CONFERIDO` enquanto houver pelo menos um item sem `conferido = true`.
- A tela de conferência exibe a localização e o saldo cadastrado de cada item, permitindo ao conferente saber onde procurar fisicamente.
- Um produto pode ter saldo em mais de uma localização simultaneamente, e o saldo total exibido é a soma de todas elas.
- Iniciar uma auditoria numa localização lista corretamente todos os produtos com saldo cadastrado ali, com a quantidade esperada pré-preenchida.
- Finalizar uma sessão de auditoria atualiza o saldo em `EstoqueProduto` para refletir a contagem física, e a divergência de cada item fica registrada para consulta posterior.
- O mapa do estoque permite navegar até uma localização específica e ver quantos produtos/saldo estão alocados ali, sem precisar abrir cada produto individualmente.