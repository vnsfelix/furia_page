# Central de Documentação – Portal FURIA Helpdesk

Guia geral da arquitetura, organização dos arquivos, padronização de nomes e conexão com o banco de dados SQLite.

---

## 📁 Organização de Pastas e Arquivos Padronizados (1:1)

Todas as páginas do sistema possuem agora nomes **idênticos** entre sua pasta, seu arquivo CSS externo e seu script JavaScript. Nenhum arquivo HTML possui CSS ou JS inline.

| Seção / Página | HTML | CSS Externo | JavaScript |
| :--- | :--- | :--- | :--- |
| **Login** | [`index.html`](index.html) | [`assets/css/pages/login.css`](assets/css/pages/login.css) | [`assets/js/pages/login.js`](assets/js/pages/login.js) |
| **Cadastro** | [`cadastro.html`](cadastro.html) | [`assets/css/pages/cadastro.css`](assets/css/pages/cadastro.css) | [`assets/js/pages/cadastro.js`](assets/js/pages/cadastro.js) |
| **Inicial** | [`inicial/index.html`](inicial/index.html) | [`assets/css/pages/inicial.css`](assets/css/pages/inicial.css) | [`assets/js/pages/inicial.js`](assets/js/pages/inicial.js) |
| **Painel Admin** | [`admin/index.html`](admin/index.html) | [`assets/css/pages/admin.css`](assets/css/pages/admin.css) | [`assets/js/pages/admin.js`](assets/js/pages/admin.js) |
| **Meus Chamados** | [`chamados/index.html`](chamados/index.html) | [`assets/css/pages/chamados.css`](assets/css/pages/chamados.css) | [`assets/js/pages/chamados.js`](assets/js/pages/chamados.js) |
| **Minha Conta** | [`conta/index.html`](conta/index.html) | [`assets/css/pages/conta.css`](assets/css/pages/conta.css) | [`assets/js/pages/conta.js`](assets/js/pages/conta.js) |
| **Atendimento Presencial** | [`presencial/index.html`](presencial/index.html) | [`assets/css/pages/presencial.css`](assets/css/pages/presencial.css) | [`assets/js/pages/presencial.js`](assets/js/pages/presencial.js) |
| **Relatar Problema** | [`problemas/index.html`](problemas/index.html) | [`assets/css/pages/problemas.css`](assets/css/pages/problemas.css) | [`assets/js/pages/problemas.js`](assets/js/pages/problemas.js) |
| **Confirmação de Envio** | [`enviados/index.html`](enviados/index.html) | [`assets/css/pages/enviados.css`](assets/css/pages/enviados.css) | [`assets/js/pages/enviados.js`](assets/js/pages/enviados.js) |
| **Aviso de Erro** | [`errado/index.html`](errado/index.html) | [`assets/css/pages/errado.css`](assets/css/pages/errado.css) | [`assets/js/pages/errado.js`](assets/js/pages/errado.js) |

---

## 🗄️ Banco de Dados SQLite3 (`backend/database.sqlite`)

Todos os cadastros de usuários e chamados são gravados **diretamente no banco de dados SQLite** (`backend/database.sqlite`).

### Por que não fica no Console do navegador?
- Anteriormente, o projeto gravava listas mock no `localStorage` do navegador para testes estáticos.
- Agora, a gravação é feita via chamadas HTTP (`fetch`) para a API do backend, persistindo na tabela SQLite.
- O navegador guarda apenas a sessão do usuário conectado no momento (`furia_user`).
- **Nenhuma senha e nenhuma lista de outros usuários ou chamados fica acessível no Console.**

### Como visualizar e editar o banco no VS Code:
1. Instale a extensão **SQLite Viewer** ou **SQLite3 Editor** no VS Code.
2. Clique no arquivo [`backend/database.sqlite`](backend/database.sqlite).
3. Você verá as tabelas:
   - **`users`**: `id`, `nome`, `email`, `senha`, `role`, `department`, `created_at`.
   - **`tickets`**: `id`, `user_id`, `user_name`, `user_email`, `tipo`, `titulo`, `categoria`, `local`, `tiposervico`, `descricao`, `urgencia`, `anexo`, `status`, `created_at`.

---

## 🚀 Como Iniciar o Sistema

No terminal:
```bash
cd backend
npm start
```

O terminal exibirá:
```text
> Servidor da FURIA rodando em http://localhost:3000
> Banco de dados SQLite ativo: backend/database.sqlite
> Administrador padrão: admin@furia.gg (senha: admin)
```

Abra no navegador:
👉 **`http://localhost:3000`**

