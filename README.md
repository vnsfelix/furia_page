# FURIA Helpdesk

HTML, JavaScript e Express, com persistência Supabase PostgreSQL e Telegram opcional.

## Ambiente local

Node.js 24.x. Configure `.env` conforme `.env.example`, usando chave secreta somente no servidor. O `.env` existente não foi alterado automaticamente.

- npm start: inicia o servidor em http://localhost:3000.
- `npm test`: testes locais, sem banco externo.
- `npm run test:browser`: Chrome/Edge real, dados em memória, sem acesso externo; requer porta 3000 livre.
- `npm run audit:sqlite`: verifica o banco legado somente para leitura.

Sem credencial secreta, a API retorna 503; não existe fallback SQLite. `/api/health` verifica o processo e `/api/ready` verifica o banco e as sessões.

## Implantação

Nenhuma migração externa ou publicação foi realizada. As migrações SQL estão em `supabase/migrations` e exigem revisão, backup e autorização antes de executar. O arquivo `supabase_schema.sql` da raiz foi preservado e contém procedimento antigo inseguro; não utilizá-lo para produção.

- [Diagnóstico](docs/etapa-1-diagnostico.md)
- [Persistência e segurança](docs/etapa-2-persistencia-seguranca.md)
- [Telegram](docs/etapa-3-telegram.md)
- [Validação, limites e ativação](docs/validacao-e-ativacao.md)

As contas existentes precisam de senhas novas antes da liberação. A identidade visual e os arquivos CSS/imagens foram preservados.
