# Etapa 3 — Telegram e atualização das telas

Implementação preparada localmente. O bot não foi criado/configurado, o webhook não foi registrado e nenhuma mensagem real foi enviada.

## Fluxo

Minha Conta → Vincular Telegram → link temporário de 10 minutos → /start com token → /chamado → tipo → categoria ou local/serviço → título → descrição → urgência → confirmar.

O código temporário é armazenado apenas pelo hash e consumido uma única vez. Nome/username/e-mail informado no Telegram não identifica uma conta. O backend e a função SQL procuram o usuário interno pelo vínculo. Desvincular invalida os códigos de vínculo pendentes.

Nesta versão o Telegram recebe mensagens privadas de texto. Grupos, mensagens editadas e bots são ignorados. Imagens/PDFs continuam disponíveis pelo site; armazenamento em Storage e recebimento de arquivos pelo bot ficam para etapa posterior.

O chamado tem o mesmo formato e a mesma tabela do site, com origem `telegram`, status Recebido e solicitante real. Os protocolos novos usam sequência PostgreSQL a partir de TK-10000, preservando os antigos e o tamanho compacto na interface. Admin e técnico veem os registros; o funcionário vê os seus. As listas consultam a API a cada 15 segundos, pausam em abas ocultas/controles em edição e preservam filtros e busca.

## Confiabilidade

- Webhook exige segredo independente da sessão do site.
- A RPC `helpdesk_process_telegram` grava ticket, estado, marca de deduplicação e outbox numa transação.
- Chave de deduplicação: bot + update_id. Os registros não são apagados com o chamado, evitando recriação por replay após exclusão.
- Estado por bot/chat, controle de versão otimista e bloqueio de linha. Mensagens mais antigas que a última processada são ignoradas para impedir regressão da conversa. Telegram configurado inicialmente com max_connections=1.
- Rascunhos expiram em 30 minutos.
- Falha de gravação retorna erro para permitir reentrega. Confirmação só é enviada depois do commit.
- Outbox usa lease, tentativas e backoff; um agendador autorizado chama GET `/api/internal/telegram-delivery` com `Authorization: Bearer CRON_SECRET`.
- Envios de confirmação têm garantia de tentativa com repetição. Uma falha entre envio ao Telegram e confirmação no banco pode repetir a mensagem de confirmação; não duplica o chamado.
- Requisições abusivas são limitadas no PostgreSQL. Payloads e URLs com token não são registrados em logs.

## Ativação dependente do proprietário

1. Criar bot pelo BotFather, guardar token somente no servidor.
2. Autorizar e testar `002_telegram.sql` depois de `001_persistence_security.sql` em homologação.
3. Configurar TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME (sem @), TELEGRAM_WEBHOOK_SECRET aleatório com pelo menos 32 caracteres e CRON_SECRET.
4. Autorizar o deploy e confirmar `/api/ready`. A rota do webhook precisa estar acessível ao Telegram; o próprio segredo a protege.
5. Configurar um agendador com frequência compatível com o plano contratado. Nenhum cron foi instalado/publicado automaticamente.
6. `node scripts/telegram-webhook.mjs` apenas mostra uma prévia local sem segredos; depois de autorização específica, `--register` registra o webhook externo.
7. Homologar com conta real: vincular, cancelar, concluir, conferir solicitante/site e desvincular. Usar outro bot e outro banco para homologação.

## Anexos

Permanecem no PostgreSQL como Base64/JSON; não houve migração para Storage. Foi necessário retirar o binário das listagens e servir o mesmo arquivo por rota autenticada, para não exceder o limite de resposta da Vercel. Uploads novos têm limite de 3 MiB serializados; PNG/JPEG/GIF/WebP e PDF são aceitos. Formatos ativos como SVG não são exibidos. Anexos legados maiores que a hospedagem suporta precisam da etapa posterior de Storage.

## Validação

Testes de conversa, reinício de estado serializado, retry de concorrência, expiração, segredo do webhook, chave do agendador, autoria, limites, outbox e atualização do frontend foram executados sem rede externa. As transações SQL e a integração com Telegram real exigem homologação posterior autorizada. Não tratar os testes com mocks como prova de operação no PostgreSQL.
