# Documentação do Projeto

Visão geral da estrutura de pastas, páginas e banco de dados.

## Estrutura das páginas

Cada tela tem seu HTML e seus respectivos arquivos de script e estilo em `assets/`:

| Página             | HTML                    | JavaScript                      | CSS                                |
| :---               | :---                    | :---                            | :---                               |
| Login              | `index.html`            | `assets/js/pages/login.js`      | `assets/css/pages/login.css`       |
| Cadastro           | `cadastro.html`         | `assets/js/pages/cadastro.js`   | `assets/css/pages/cadastro.css`    |
| Inicial            | `inicial/index.html`    | `assets/js/pages/inicial.js`    | `assets/css/pages/inicial.css`     |
| Painel Admin       | `admin/index.html`      | `assets/js/pages/admin.js`      | `assets/css/pages/admin.css`       |
| Painel Técnico     | `tecnico/index.html`    | `assets/js/pages/tecnico.js`    | `assets/css/pages/tecnico.css`     |
| Meus Chamados      | `chamados/index.html`   | `assets/js/pages/chamados.js`   | `assets/css/pages/chamados.css`    |
| Minha Conta        | `conta/index.html`      | `assets/js/pages/conta.js`      | `assets/css/pages/conta.css`       |
| Chamado Presencial | `presencial/index.html` | `assets/js/pages/presencial.js` | `assets/css/pages/presencial.css`  |
| Chamado Técnico    | `problemas/index.html`  | `assets/js/pages/problemas.js`  | `assets/css/pages/problemas.css`   |
| Sucesso / Enviado  | `enviados/index.html`   | `assets/js/pages/enviados.js`   | `assets/css/pages/enviados.css`    |
| Erro / Não Enviado | `errado/index.html`     | `assets/js/pages/errado.js`     | `assets/css/pages/errado.css`      |

Arquivos compartilhados por todas as telas:
- `assets/js/app.js`: utilitários comuns (sessão, controle do menu e chamadas da API).
- `assets/css/base.css` e `assets/css/components.css`: temas, variáveis e componentes visuais.

## Banco de dados e backend atual

O runtime utiliza Supabase PostgreSQL. O arquivo `backend/database.sqlite` foi preservado como fonte legada e não é utilizado como fallback. As tabelas principais continuam sendo:

- **users:** dados dos usuários (nome, e-mail, senha criptografada e cargo: admin, tecnico ou funcionario).
- **tickets:** todos os chamados abertos (título, descrição, tipo, urgência, anexo e status).

As migrações versionadas em `supabase/migrations` acrescentam sessões, limites de requisições, geração de protocolos e integração Telegram. Elas não foram aplicadas externamente. O backend não executa migrações no início.

`backend/src/app.js` aplica autenticação e permissões; `src/db/repository.js` acessa o Supabase; `src/telegram` implementa o bot. O frontend consulta identidade e listas pela API e mantém dados públicos do usuário apenas como cache de apresentação.

Consulte os [resultados de validação e pendências de ativação](docs/validacao-e-ativacao.md). O SQL antigo da raiz foi preservado por conter alterações anteriores do usuário e não deve ser usado para ativação.
