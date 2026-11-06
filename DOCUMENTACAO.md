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

## Banco de dados

O banco é o arquivo `backend/database.sqlite` e tem duas tabelas:

- **users:** dados dos usuários (nome, e-mail, senha criptografada e cargo: admin, tecnico ou funcionario).
- **tickets:** todos os chamados abertos (título, descrição, tipo, urgência, anexo e status).

Para visualizar ou editar os registros no VS Code, use a extensão SQLite Viewer.
