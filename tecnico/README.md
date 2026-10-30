# Sessão: Painel do Técnico (`/tecnico`)

Esta é a central operacional voltada aos técnicos de suporte e infraestrutura da FURIA.

---

## Quem pode acessar?
**Usuários com perfil de Técnico (`role: 'tecnico'`) e Administradores (`role: 'admin'`).**
Se qualquer funcionário comum ou visitante não autenticado tentar acessar esta página, a proteção de rota (`Furia.requireAuth(['tecnico', 'admin'])`) bloqueia o acesso e o redireciona automaticamente para a área inicial.

---

## Funcionalidades principais:

### 1. Indicadores Operacionais (Cards do topo)
- **Total de Chamados**: Contagem de todas as solicitações abertas pelos usuários no SQLite.
- **Em Aberto / Andamento**: Quantidade de tickets que necessitam de intervenção técnica.
- **Concluídos**: Quantidade de chamados finalizados com sucesso.

### 2. Gestão de Chamados e Atualização de Status
- **Tabela dinâmica**: Exibe título da solicitação, identificador `#TK-...`, tipo (*Presencial* ou *Problema*), dados do solicitante, detalhes do relato, data e status atual.
- **Busca em tempo real**: O campo de pesquisa filtra instantaneamente pelo título, autor, id, categoria ou local da ocorrência.
- **Filtros rápidos por Status**: Botões de filtro (*Todos*, *Recebidos*, *Em Andamento*, *Concluídos*).
- **Alteração de Status em tempo real**: O seletor em cada chamado permite mudar diretamente entre *Recebido*, *Em andamento* e *Concluído*, persistindo via chamada `PUT /api/tickets/:id/status`.

### 3. Visualização de Imagens e Anexos dos Chamados
- **Miniatura interativa**: Exibe a thumbnail da imagem anexada pelo solicitante.
- **Modal de Imagem em Tela Cheia**: Ao clicar em *Ver Imagem*, uma janela modal de alta resolução é exibida.
- **Opções no Modal**:
  - Download direto da imagem do chamado.
  - Abertura em nova aba do navegador em resolução original.
  - Fechamento intuitivo via botão, clique fora ou tecla `ESC`.

### 4. Controle de Permissões: Sem Gestão de Usuários
- Diferente do Painel Administrativo, o técnico **não possui acesso para criar, editar, alterar perfis ou excluir usuários**.
- A interface foca 100% no atendimento rápido e eficaz às demandas de suporte técnico.

