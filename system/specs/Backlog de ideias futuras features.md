# Backlog de ideias — futuras features

Lista de oportunidades identificadas ao longo da especificação do Kabru Sistema, organizadas por área. Não é compromisso de roadmap — é material de priorização para discutir com o cliente. Cada item traz o que resolve, por que importa, uma estimativa de esforço relativa (🟢 baixo · 🟡 médio · 🔴 alto) e o **valor de desenvolvimento**.

> **Base de precificação:** R$ 80/h · 🟢 Baixo = 4–8h · 🟡 Médio = 12–24h · 🔴 Alto = 32–60h

---

## 1. Pedidos e fluxo operacional

### 1.1 Baixa automática de saldo de estoque
**O que é:** ao faturar/expedir um pedido, o saldo em `EstoqueProduto` é decrementado automaticamente pelos itens do pedido, em vez de depender só de ajuste manual ou auditoria.
**Por que importa:** hoje o saldo do sistema fica desatualizado entre uma auditoria e outra — essa é a lacuna mais citada nas specs anteriores como "fora de escopo".
**Esforço:** 🟡 — exige decidir o momento exato da baixa (no faturamento? na expedição?) e como tratar saldo insuficiente.
**Depende de:** modelo de localização e saldo (já especificado).
**Valor:** R$ 1.200 (15h)

### 1.2 Separação parcial
**O que é:** permitir avançar um pedido mesmo com item faltante, gerando uma pendência separada para aquele item específico, em vez de travar o pedido inteiro esperando reposição.
**Por que importa:** evita que um único item em falta atrase a entrega de todo o resto do pedido.
**Esforço:** 🔴 — muda a state machine de "pedido tem 1 status" para "pedido tem status agregado de itens com status individuais".
**Valor:** R$ 3.200 (40h)

### 1.3 Fluxo de devolução/retorno
**O que é:** processo formal para registrar devolução de um pedido já concluído, voltando o saldo ao estoque e registrando o motivo.
**Por que importa:** operação real de distribuidora lida com troca/devolução com frequência; hoje não há como isso entrar no sistema.
**Esforço:** 🟡 — reaproveita boa parte do modelo de `HistoricoStatus` e `EstoqueProduto`, mas precisa de um novo status/fluxo dedicado.
**Valor:** R$ 1.440 (18h)

### 1.4 Aprovação de divergência de auditoria
**O que é:** em vez de a auditoria corrigir o saldo automaticamente ao final da sessão, a divergência fica pendente até um segundo usuário (ex: Admin) revisar e aprovar o ajuste.
**Por que importa:** evita que um erro de contagem do auditor corrija o sistema "errado" sem revisão — é o ponto que ficou aberto na spec de estoque.
**Esforço:** 🟢 — é um status extra (`pendente`/`aprovada`) na `SessaoAuditoria`, sem mudar o modelo de dados.
**Valor:** R$ 480 (6h)

### 1.5 Entrada de mercadoria (recebimento de fornecedor)
**O que é:** fluxo formal de recebimento — nota de entrada, conferência do que chegou do fornecedor, e só então o saldo é lançado em `EstoqueProduto`. Hoje o vínculo produto↔localização é só manual.
**Por que importa:** fecha o ciclo completo de estoque (entrada e saída), não só a saída via pedido.
**Esforço:** 🔴 — é essencialmente um novo domínio (fornecedor, nota de entrada), com modelagem própria.
**Valor:** R$ 4.000 (50h)

---

## 2. Estoque e auditoria

### 2.1 Leitura de código de barras/QR code
**O que é:** usar a câmera do celular para ler o código do produto durante conferência ou auditoria, em vez de buscar manualmente na lista.
**Por que importa:** reduz erro humano e tempo de busca — especialmente valioso na auditoria, onde o usuário percorre fisicamente o estoque.
**Esforço:** 🟡 — a parte de leitura é simples (lib de QR/barcode no navegador), mas exige que produtos tenham um código de barras cadastrado e padronizado.
**Valor:** R$ 1.120 (14h)

### 2.2 Sugestão automática de localização ideal
**O que é:** ao cadastrar um produto novo, o sistema sugere em qual rua/torre/andar alocá-lo, com base em critérios como giro de venda ou proximidade de produtos relacionados.
**Por que importa:** acelera o cadastro e melhora a logística interna (produtos de alto giro mais acessíveis).
**Esforço:** 🔴 — precisa de histórico de movimentação suficiente para a lógica de sugestão fazer sentido; não compensa antes de ter volume de dados.
**Valor:** R$ 3.600 (45h)

### 2.3 Múltiplos galpões/depósitos
**O que é:** a hierarquia rua/torre/andar passa a existir dentro de um "depósito" — permitindo várias unidades físicas no mesmo sistema.
**Por que importa:** só relevante se o cliente abrir uma segunda unidade; hoje é prematuro.
**Esforço:** 🟡 — é adicionar um nível acima na hierarquia (`Deposito` → `Localizacao`), mais simples do que parece se for pensado desde já no design da tabela.
**Valor:** R$ 1.280 (16h)

### 2.4 Curva ABC de produtos
**O que é:** classificar produtos por importância (A = maior giro/valor, C = menor), para priorizar quais localizações auditar com mais frequência.
**Por que importa:** auditar tudo com a mesma frequência desperdiça tempo em itens de baixo impacto.
**Esforço:** 🟢 — é um cálculo sobre dados que já existem (histórico de `ItemPedido`), sem mudança de modelo.
**Valor:** R$ 560 (7h)

### 2.5 Exportação do mapa do estoque em PDF
**O que é:** gerar um PDF do mapa rua/torre/andar para impressão e fixação física no galpão.
**Por que importa:** nem todo colaborador do estoque vai estar com o sistema aberto o tempo todo — um mapa impresso ajuda na orientação inicial.
**Esforço:** 🟢 — é uma exportação de tela já existente, sem lógica nova.
**Valor:** R$ 400 (5h)

---

## 3. Relatórios e gestão

### 3.1 Exportação de relatórios em CSV/PDF
**O que é:** botão de exportar no relatório de desempenho (e em outras telas), gerando CSV ou PDF do que está filtrado na tela.
**Por que importa:** gestão frequentemente precisa levar o número para uma reunião ou planilha externa.
**Esforço:** 🟢 — é a interface mais pedida nas reuniões e uma das mais simples de entregar.
**Valor:** R$ 480 (6h)

### 3.2 Gráficos de evolução histórica no dashboard
**O que é:** em vez de só mostrar o período filtrado (dia/semana/mês), mostrar a tendência ao longo de várias semanas/meses.
**Por que importa:** o relatório de desempenho hoje é uma "fotografia"; um gráfico de tendência mostra se a operação está melhorando ou piorando.
**Esforço:** 🟡 — reaproveita as queries já especificadas, só precisa rodar para múltiplos períodos e plotar.
**Valor:** R$ 1.120 (14h)

### 3.3 Previsão de demanda / sugestão de reposição
**O que é:** usando o histórico de pedidos, sugerir quando e quanto repor de um produto antes que o saldo zere.
**Por que importa:** evita ruptura de estoque em itens de alto giro.
**Esforço:** 🔴 — exige um modelo de previsão (mesmo que simples, como média móvel) e dados históricos suficientes.
**Valor:** R$ 3.840 (48h)

### 3.4 SLA preditivo
**O que é:** alertar que um pedido *vai* atrasar antes de estourar o prazo (ex: com base no tempo médio histórico daquela etapa), não só depois que o badge já ficou vermelho.
**Por que importa:** dá tempo de agir preventivamente, em vez de só constatar o atraso.
**Esforço:** 🟡 — é uma extensão do cálculo de SLA já especificado, comparando tempo decorrido com a média histórica em vez de um valor fixo.
**Valor:** R$ 960 (12h)

---

## 4. Integrações e mobilidade

### 4.1 Notificações por e-mail/WhatsApp
**O que é:** disparo automático ao vendedor (ou ao cliente final) quando o pedido muda de status.
**Por que importa:** elimina a necessidade de o vendedor ficar checando o painel manualmente.
**Esforço:** 🟡 — a infraestrutura de envio é simples; o trabalho real é decidir as regras (quem recebe o quê, e quando).
**Valor:** R$ 1.280 (16h)

### 4.2 Integração com ERP ou emissor de NF-e
**O que é:** conectar o faturamento do sistema a um ERP existente ou a um emissor de nota fiscal eletrônica.
**Por que importa:** elimina retrabalho de lançar a mesma informação em dois sistemas.
**Esforço:** 🔴 — depende inteiramente do sistema de destino; cada ERP tem sua própria API/particularidades.
**Valor:** R$ 4.800 (60h) — valor mínimo; pode variar conforme o ERP

### 4.3 App mobile nativo
**O que é:** aplicativo dedicado (iOS/Android), em vez de depender só da versão responsiva no navegador do celular.
**Por que importa:** melhor experiência offline e de câmera (relevante se a feature 2.1 de QR code avançar).
**Esforço:** 🔴 — é uma frente de desenvolvimento nova e paralela ao sistema web.
**Valor:** R$ 6.400 (80h) — orçamento próprio, separado do sistema web

### 4.4 Bot de WhatsApp para consulta de status
**O que é:** vendedor manda o número do pedido num número de WhatsApp e recebe o status atual, sem precisar abrir o sistema.
**Por que importa:** reduz fricção para quem está em campo, sem acesso fácil a um computador.
**Esforço:** 🟡 — reaproveita a mesma lógica de consulta do painel, só muda o canal de entrada/saída.
**Valor:** R$ 1.440 (18h)

### 4.5 Roteirização de entrega + app do motorista
**O que é:** depois da expedição, organizar a rota de entrega e dar ao motorista um app simples para confirmar entrega com foto/assinatura.
**Por que importa:** estende a rastreabilidade do sistema até o momento final da entrega, não só até a expedição.
**Esforço:** 🔴 — é uma frente nova (roteirização + app separado), bem além do escopo atual do POC.
**Valor:** R$ 6.400 (80h) — orçamento próprio, separado do sistema web

---

## 5. Segurança e permissões

### 5.1 Permissões granulares por usuário individual
**O que é:** em vez de permissão só por `role`, permitir excecões por usuário específico (ex: um vendedor específico também pode ver relatório financeiro).
**Por que importa:** cobre casos de exceção que o modelo de role puro não resolve.
**Esforço:** 🟡 — exige introduzir uma tabela de permissão por usuário, hoje deliberadamente fora de escopo para manter a POC simples.
**Valor:** R$ 960 (12h)

### 5.2 Suporte multi-empresa/multi-tenant
**O que é:** o mesmo sistema atendendo mais de uma empresa, com dados isolados entre elas.
**Por que importa:** só relevante se o sistema for vendido como produto para várias distribuidoras, não só para esse cliente.
**Esforço:** 🔴 — afeta praticamente todo modelo de dados (precisa de um `empresaId` em quase toda tabela).
**Valor:** R$ 4.800 (60h)

### 5.3 Atualização em tempo real via WebSocket
**O que é:** substituir o polling (15-30s) do painel por atualização instantânea via WebSocket.
**Por que importa:** relevante só se o volume de pedidos crescer a ponto de o delay do polling incomodar visivelmente.
**Esforço:** 🟡 — straightforward tecnicamente, mas adiciona uma peça de infraestrutura (conexão persistente) que o polling evita.
**Valor:** R$ 1.120 (14h)

---

---

## Resumo de precificação

| # | Feature | Esforço | Valor |
| --- | --- | --- | --- |
| 1.1 | Baixa automática de estoque | 🟡 | R$ 1.200 |
| 1.2 | Separação parcial | 🔴 | R$ 3.200 |
| 1.3 | Fluxo de devolução/retorno | 🟡 | R$ 1.440 |
| 1.4 | Aprovação de divergência de auditoria | 🟢 | R$ 480 |
| 1.5 | Entrada de mercadoria (fornecedor) | 🔴 | R$ 4.000 |
| 2.1 | Leitura de código de barras/QR code | 🟡 | R$ 1.120 |
| 2.2 | Sugestão automática de localização | 🔴 | R$ 3.600 |
| 2.3 | Múltiplos galpões/depósitos | 🟡 | R$ 1.280 |
| 2.4 | Curva ABC de produtos | 🟢 | R$ 560 |
| 2.5 | Exportação do mapa de estoque em PDF | 🟢 | R$ 400 |
| 3.1 | Exportação de relatórios CSV/PDF | 🟢 | R$ 480 |
| 3.2 | Gráficos de evolução histórica | 🟡 | R$ 1.120 |
| 3.3 | Previsão de demanda / reposição | 🔴 | R$ 3.840 |
| 3.4 | SLA preditivo | 🟡 | R$ 960 |
| 4.1 | Notificações e-mail/WhatsApp | 🟡 | R$ 1.280 |
| 4.2 | Integração ERP / NF-e | 🔴 | R$ 4.800 |
| 4.3 | App mobile nativo | 🔴 | R$ 6.400 |
| 4.4 | Bot WhatsApp consulta de status | 🟡 | R$ 1.440 |
| 4.5 | Roteirização + app do motorista | 🔴 | R$ 6.400 |
| 5.1 | Permissões granulares por usuário | 🟡 | R$ 960 |
| 5.2 | Multi-empresa / multi-tenant | 🔴 | R$ 4.800 |
| 5.3 | Atualização em tempo real (WebSocket) | 🟡 | R$ 1.120 |
| | **Total do backlog** | | **R$ 50.880** |

---

## Valor total do sistema (base + backlog)

| Item | Valor |
|---|---|
| Sistema atual entregue (estimativa retroativa) | R$ 18.000 |
| Backlog completo | R$ 50.880 |
| **Valor total do ecossistema** | **R$ 68.880** |

> O sistema atual foi estimado em ~225h de desenvolvimento (R$ 80/h), considerando autenticação, kanban em tempo real, importação via IA, dashboard, financeiro, SLA, permissões e toda a infraestrutura de base.

---

## Prioridade sugerida para próximas entregas

Os itens 🟢 somam **R$ 1.920** e podem ser entregues rapidamente, gerando percepção imediata de valor. Os 🔴 valem uma conversa de escopo e orçamento separada antes de entrar em qualquer spec detalhada.
