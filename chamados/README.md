# Sessão: Meus Chamados (`/chamados`)

Esta tela permite que cada colaborador acompanhe todos os tickets que abriu no portal.

---

## Como funciona?
- **Isolamento de dados**: O usuário comum só enxerga os chamados vinculados ao seu próprio e-mail e ID. Ele não vê solicitações de outros membros da equipe.
- **Filtros por status**:
  - **Todos**: Mostra o histórico completo.
  - **Recebidos**: Chamados recém-abertos que ainda aguardam triagem.
  - **Em andamento**: Chamados que já estão sendo atendidos por um técnico.
  - **Concluídos**: Solicitações que já foram finalizadas e resolvidas.
- **Visual dos Cards**:
  - Código único de identificação (ex.: `#TK-1002`).
  - Badge colorido de status (*amarelo* para recebido, *azul* para em andamento, *verde* para concluído).
  - Título e descrição do problema.
  - Categoria, local da ocorrência e nível de urgência.
  - Data e hora formatadas no padrão brasileiro (`DD/MM/AAAA às HH:MM`).

---

## O que acontece se o usuário ainda não tiver chamados?
Aparece uma mensagem amigável explicando que ainda não há chamados registrados, junto com um botão de atalho para abrir o primeiro chamado.

---

## Quando você for conectar o Banco de Dados:
Basta buscar os tickets através da rota:
`GET /api/tickets/user/:userId`
O backend retornará a lista em JSON diretamente da tabela `tickets` do seu banco de dados.

