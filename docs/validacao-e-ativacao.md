# Resultado e limites da validação local

## Executado

- Consultas autorizadas de leitura: Supabase 2 usuários / 0 chamados; instância Vercel 2 usuários / 0 chamados e health informando SQLite.
- Preflight SQLite com abertura somente leitura: integridade OK, 2 usuários, 0 chamados, nenhum conflito de e-mail nem referência órfã.
- 39 testes automatizados de backend, cliente Supabase com transporte simulado, frontend e Telegram, todos aprovados na execução final de `npm.cmd test`.
- 5 fluxos em Chrome real, com dados sintéticos em memória e requisições externas bloqueadas: administração, abertura/histórico, atualização sem reload, conta/troca de senha e atendimento técnico/mobile.
- Capturas locais: `tests/artifacts/login-desktop.png`, `conta-desktop.png`, `tecnico-mobile.png`.
- CSS e imagens existentes não foram modificados. Componentes de senha e vínculo usam classes e identidade existentes.
- Sintaxe de 31 arquivos JavaScript verificada; `git diff --check` sem erros de whitespace.

## Ainda não executado

- Migrações ou importação em qualquer banco externo.
- `supabase/tests/integration.sql`: preparado para PostgreSQL de homologação; não há PostgreSQL/psql disponível localmente. Deve ser executado somente com autorização para escrita no ambiente de teste.
- Verificação de concorrência real das RPCs em múltiplas conexões PostgreSQL.
- Registro de webhook, agendamento, envio ao Telegram real, deploy ou alteração de variáveis na Vercel.
- Comparação visual pixel a pixel com um baseline aprovado. As capturas do teste usam fontes locais porque fontes externas foram bloqueadas.

## Ordem de ativação

1. Confirmar backups/outros deployments e preservar a fonte oficial. SQLite temporário não garante histórico entre instâncias.
2. Fornecer credencial secreta Supabase no servidor e projeto separado para homologação; a chave pública atual é recusada pelo backend novo.
3. Autorizar e aplicar 001 e, para o bot, 002 no ambiente de teste. Executar o SQL de integração e testes HTTP contra esse ambiente sem dados reais.
4. Homologar a interface. Rotacionar as contas conhecidas e conferir permissões.
5. Autorizar separadamente o corte/migração e deploy em produção. Até isso ocorrer, a aplicação publicada continua com o código antigo.
6. Configurar o bot e agendador; registrar webhook somente depois de autorização explícita.

Sessões, limites, RPCs e RLS são necessários para o código novo funcionar. Não publicar somente o frontend ou somente o backend: fazer o corte coordenado, com banco preparado e `APP_URL` correto.

Rollback de código não restaura dados. Depois de aceitar gravações no PostgreSQL, usar uma versão compatível com PostgreSQL para rollback; não voltar automaticamente ao SQLite.
