# Backend - FURIA

Servidor Node.js 24 com Express e persistência exclusiva Supabase PostgreSQL. SQLite é apenas uma fonte legada para auditoria, sem abertura automática pela aplicação.

## Estrutura dos arquivos

- `server.js`: inicialização e exportação para a Vercel.
- `src/app.js`: rotas, sessões, autorização, origem e erros.
- `src/config/env.js`: configuração somente no servidor.
- `src/db/repository.js`: consultas Supabase e normalização das respostas.
- `src/services/`: senhas, validação e entrega protegida dos anexos existentes.
- `src/telegram/`: conversa e processamento de webhook/outbox.

## Rotas da API

- **Autenticação:**
  - `POST /api/auth/login` - login com e-mail e senha.
  - `POST /api/auth/register` - cadastro de novos colaboradores.
  - `GET /api/auth/me` - identidade verificada pela sessão.
  - `POST /api/auth/logout` - revogação da sessão.
  - `POST /api/auth/password` - alteração de senha com revogação das sessões anteriores.

- **Chamados:**
  - `GET /api/tickets` - lista autorizada: próprios para funcionário, todos para técnico/admin.
  - `GET /api/tickets/user/:userId` - busca os chamados de um usuário específico.
  - `POST /api/tickets` - abertura de novo chamado.
  - `PUT /api/tickets/:id/status` - alteração do status do chamado.
  - `DELETE /api/tickets/:id` - exclusão de chamado.
  - `GET /api/tickets/:id/attachment` - entrega do anexo após verificar a propriedade/perfil.

- **Usuários:**
  - `GET /api/users` - lista os colaboradores.
  - `POST /api/users` - cadastro de colaborador pelo painel admin.
  - `PUT /api/users/:id` - altera perfil ou setor.
  - `DELETE /api/users/:id` - remove usuário.

## Banco de dados

As migrações preparadas estão em `supabase/migrations`. Nenhuma é executada pelo servidor. Nunca usar chave pública como credencial administrativa. Consulte [validação e ativação](../docs/validacao-e-ativacao.md) antes de configurar ou publicar.

Telegram: `POST /api/telegram/webhook` exige segredo do webhook; `/api/telegram/link` exige sessão do site; `GET /api/internal/telegram-delivery` exige CRON_SECRET. Nenhuma inscrição de webhook é feita automaticamente.
