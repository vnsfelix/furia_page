# Central de Documentação – Portal FURIA Helpdesk

Guia geral da arquitetura, organização dos arquivos, padronização de nomes e conexão com o banco de dados SQLite.

---

## 📁 Como as pastas estão organizadas

Optamos por manter um padrão simples: **o nome da página, do CSS e do JS são sempre iguais**. Então se você abrir a parte de login, vai encontrar `login` em três lugares diferentes — no HTML, no CSS e no JS. Achei mais fácil de achar as coisas assim, principalmente quando preciso mexer em algo depois.

Também tirei todo o CSS e JS que estava dentro do HTML e joguei cada um no seu arquivo separado. Confesso que no começo deu um pouco de trabalho pra reorganizar, mas agora o código ficou bem mais limpo e dá pra entender melhor o que é cada parte.

Abaixo está a lista completa de páginas e onde ficam seus arquivos:

| Página        | Arquivo HTML            | JavaScript                        |
| :---          | :---                    | :---                              |
| Login         | `index.html`            | `assets/js/pages/login.js`        |
| Cadastro      | `cadastro.html`         | `assets/js/pages/cadastro.js`     |
| Inicial       | `inicial/index.html`    | `assets/js/pages/inicial.js`      |
| Painel Admin  | `admin/index.html`      | `assets/js/pages/admin.js`        |
| Meus Chamados | `chamados/index.html`   | `assets/js/pages/chamados.js`     |
| Minha Conta   | `conta/index.html`      | `assets/js/pages/conta.js`        |
| Presencial    | `presencial/index.html` | `assets/js/pages/presencial.js`   |
| Problema      | `problemas/index.html`  | `assets/js/pages/problemas.js`    |
| Aviso de Erro | `errado/index.html`     | `assets/js/pages/errado.js`       |
| Confirmação   | `enviados/index.html`   | `assets/js/pages/enviados.js`     |



## 🗄️ Banco de Dados SQLite3 (`backend/database.sqlite`)

Todos os cadastros de usuários e chamados são gravados **diretamente no banco de dados SQLite** (`backend/database.sqlite`).

### Por que não fica no Console do navegador?
- Anteriormente, o projeto gravava listas no `localStorage` do navegador para testes estáticos.
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
👉 `http://localhost:3000`