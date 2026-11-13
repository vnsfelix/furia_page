# Etapa 1 — diagnóstico (13/11/2026)

Verificações realizadas sem gravações externas:

- SQLite local aberto com `readOnly: true`: 2 usuários, 0 chamados.
- `.env`: URL Supabase válida e chave **publishable**, sem credencial administrativa.
- HEAD na Data API Supabase com `Prefer: count=exact`: `users` HTTP 200, 2 registros; `tickets` HTTP 200, 0 registros.
- A chave pública consegue acessar as tabelas. Isso confirma acesso anônimo indevido; a migração local 001 revoga permissões públicas e habilita RLS, mas **não foi aplicada**.
- `vercel.json`: Express via `@vercel/node`, arquivos estáticos separados e `/api/*` encaminhado ao backend.
- Ausência de `.vercel/project.json` e de token Vercel nos locais convencionais. As variáveis do painel não foram acessadas.
- URL de produção informada: `https://furiapage.vercel.app/`. GET `/api/health` retornou HTTP 200 e **SQLite3 (backend/database.sqlite)**; `/` e `/assets/js/app.js` retornaram 200. O frontend publicado ainda não utiliza cookies de autenticação.
- A produção consultada escolhe SQLite, não Supabase. Pelo código atual, esse arquivo fica no diretório temporário da instância na Vercel. Contagens de uma chamada não comprovam a inexistência de arquivos em outras instâncias.
- A consulta das listagens de produção foi bloqueada pela revisão automática por poder trazer dados sensíveis; foi solicitada autorização específica e não houve contorno do bloqueio.
- Após autorização explícita das duas listagens, GET `/api/users` retornou 200 e 2 usuários; GET `/api/tickets` retornou 200 e 0 chamados. Apenas contagens foram reportadas. Isso descreve a instância consultada, não garante histórico de outras instâncias.

Não se pode concluir que não há histórico de produção: é necessário conferir variáveis do deployment e backups existentes. A origem SQLite local e o Supabase configurado estão vazios de chamados. Dados descartados de instâncias temporárias podem não ser recuperáveis.

## Pendências do proprietário

1. Confirmar se há outros deployments, backups ou históricos a preservar.
2. Conferir projeto, região, Node e variáveis nos ambientes Production/Preview da Vercel.
3. Disponibilizar `SUPABASE_SECRET_KEY` (ou service_role legado) somente no servidor; nunca no frontend nem no chat.
4. Autorizar separadamente a execução das migrações e o deploy, após backup e homologação.

O arquivo raiz `supabase_schema.sql` já tinha alterações locais e foi preservado. Ele contém instruções antigas que desabilitam RLS e criam contas conhecidas: **não utilizá-lo como procedimento de produção**. Usar as migrações versionadas revisadas.
