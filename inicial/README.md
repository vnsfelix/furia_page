# Tela Inicial

Página principal do colaborador após fazer o login.

## Arquivos da tela

- `index.html`: estrutura da tela com os tipos de atendimento.
- `../assets/js/pages/inicial.js`: saudação personalizada com o nome do usuário.
- `../assets/css/pages/inicial.css`: estilização visual da tela.

## Funcionalidades

- **Boas-vindas:** exibe o primeiro nome do colaborador logado.
- **Opções de atendimento:**
  - *Relatar um Problema:* abertura de chamado para falhas em sistemas, computadores ou acessos (`/problemas`).
  - *Atendimento Presencial:* solicitação de suporte físico no escritório, arena ou estúdio (`/presencial`).
- **Acesso rápido:** atalho no rodapé para consultar o andamento dos chamados abertos (`/chamados`).

## Proteção de acesso

Exige login ativo. Usuários deslogados que tentarem acessar a página pela URL são redirecionados para a tela de login.
