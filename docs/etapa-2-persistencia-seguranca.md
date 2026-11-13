# Etapa 2 — persistência e segurança

Implementação local: Supabase por HTTPS sem fallback SQLite; nenhuma conexão ao banco ao importar módulos. Configuração incorreta mantém `/api/health` disponível, enquanto operações retornam 503. `/api/ready` faz consultas ao banco e à tabela de sessões.

Sessões aleatórias em cookies HttpOnly, SameSite Strict e Secure em produção, armazenadas somente pelo hash no PostgreSQL. Perfil e identidade são consultados no servidor em cada requisição. Lembrar usuário: 30 dias; sessão comum: até 24 horas e cookie de sessão. Logout revoga a sessão. O navegador mantém dados públicos do usuário apenas para apresentação.

Senhas novas usam scrypt com salt. SHA-256 legado é aceito e atualizado no login; texto puro não é aceito. Cadastros novos exigem oito caracteres. Administradores informam uma senha inicial em campo protegido, substituindo a senha fixa 123. Contas de demonstração existentes precisam de senhas novas antes da publicação.

Matriz: funcionário abre e consulta os próprios chamados; técnico consulta e atualiza chamados; administrador gerencia usuários e chamados. O próprio perfil administrativo não pode ser removido nem a própria conta excluída pelo administrador conectado. O backend ignora a autoria enviada pelo cliente. Exclusão de usuário mantém a relação cascade existente e exige cuidado operacional.

## Testes locais da etapa

Primeira validação: **16 testes passaram, zero falhas**. Validação final: **39 testes passaram, zero falhas**, abrangendo também Telegram, frontend e anexos. Cinco fluxos adicionais passaram em Chrome headless real com servidor local em memória e rede externa bloqueada.

São testes HTTP reais em loopback com repositório em memória e testes do cliente Supabase real com transporte HTTP simulado. Nenhuma escrita em Supabase, SQLite original ou Vercel ocorreu. Não equivalem a validar migrações num PostgreSQL real.

## Ativação pendente

1. Revisar e autorizar separadamente `supabase/migrations/001_persistence_security.sql` em ambiente de homologação, depois em produção com backup.
2. Configurar SUPABASE_URL, SUPABASE_SECRET_KEY e APP_URL no servidor.
3. Fixar Node 24.x na Vercel; não confiar na configuração local como confirmação do painel.
4. Rotacionar senhas das contas existentes de demonstração usando Minha Conta. A troca invalida as sessões anteriores numa transação; uma nova sessão é criada após a alteração.
5. Executar teste integrado no PostgreSQL e homologação visual no navegador.
6. Autorizar deploy em outra etapa. Esta implementação não foi publicada.

`supabase_schema.sql` da raiz foi preservado por conter alterações anteriores do usuário; não executar seu procedimento antigo de desabilitar RLS e inserir contas padrão.
