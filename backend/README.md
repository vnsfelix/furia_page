# Backend - FURIA

Servidor Node.js com Express e banco de dados SQLite.

## Estrutura dos arquivos

- `server.js`: inicialização do servidor e rotas da API.
- `database.sqlite`: arquivo do banco de dados SQLite.
- `src/db/database.js`: conexão com o banco, consultas SQL e criação das tabelas.

## Rotas da API

- **Autenticação:**
  - `POST /api/auth/login` - login com e-mail e senha.
  - `POST /api/auth/register` - cadastro de novos colaboradores.

- **Chamados:**
  - `GET /api/tickets` - lista todos os chamados.
  - `GET /api/tickets/user/:userId` - busca os chamados de um usuário específico.
  - `POST /api/tickets` - abertura de novo chamado.
  - `PUT /api/tickets/:id/status` - alteração do status do chamado.
  - `DELETE /api/tickets/:id` - exclusão de chamado.

- **Usuários:**
  - `GET /api/users` - lista os colaboradores.
  - `POST /api/users` - cadastro de colaborador pelo painel admin.
  - `PUT /api/users/:id` - altera perfil ou setor.
  - `DELETE /api/users/:id` - remove usuário.

## Banco de dados

Os registros ficam salvos em `database.sqlite` nas tabelas `users` e `tickets`. Para consultar ou alterar registros diretamente, basta abrir o arquivo no VS Code com a extensão SQLite Viewer.
