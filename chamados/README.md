# Meus Chamados

Página onde o colaborador acompanha o andamento de todos os seus chamados abertos.

## Arquivos da tela

- `index.html`: estrutura visual da lista e dos botões de filtro.
- `../assets/js/pages/chamados.js`: busca os chamados do usuário na API, aplica filtros de status e abre anexos.
- `../assets/css/pages/chamados.css`: estilização da listagem e dos cards.

## Funcionalidades

- **Histórico individual:** exibe apenas os chamados abertos pelo próprio usuário logado.
- **Filtros de status:** botões para filtrar rapidamente entre *Todos*, *Recebido*, *Em andamento* e *Concluído*.
- **Informações do chamado:** cada card mostra o identificador (`#TK-...`), título, descrição, local, urgência, data e status atual.
- **Anexos:** permite visualizar imagens anexadas em modal ampliado com opção de download.

## Proteção de acesso

Exige login ativo. Usuários deslogados são redirecionados automaticamente para a tela de login.
