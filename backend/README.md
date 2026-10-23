# Backend da FURIA – Servidor e Banco SQLite3

Esta pasta contém o servidor Node.js (Express) e o banco de dados relacional **SQLite3** nativo do projeto.

---

## 🗄️ Banco de Dados SQLite3 (`backend/database.sqlite`)

O banco de dados já está configurado e ativo no arquivo:
👉 `backend/database.sqlite`

### Como abrir no SQLite3 Editor / SQLite Viewer (VS Code)
1. Instale a extensão **SQLite Viewer** ou **SQLite3 Editor** no VS Code (se ainda não tiver).
2. Na árvore de arquivos do VS Code, clique com o botão direito no arquivo `backend/database.sqlite`.
3. Escolha **"Open With..."** -> **"SQLite Viewer"** (ou clique diretamente no arquivo).
4. Você verá imediatamente as duas tabelas criadas:
   - **`users`**: Tabela de usuários e colaboradores.
   - **`tickets`**: Tabela de chamados e solicitações de suporte.
5. Você pode editar linhas, adicionar novos registros, excluir e rodar consultas SQL diretamente pela interface!

---

## 📋 Estrutura Exata das Tabelas SQL

```sql
-- Tabela de Usuários
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'funcionario',
  department VARCHAR(50) DEFAULT 'Geral',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Chamados / Tickets
CREATE TABLE tickets (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  categoria VARCHAR(50),
  local VARCHAR(50),
  tiposervico VARCHAR(50),
  descricao TEXT NOT NULL,
  urgencia VARCHAR(20) DEFAULT 'media',
  anexo VARCHAR(255),
  status VARCHAR(30) DEFAULT 'Recebido',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔑 Administrador Padrão

O banco já vem inicializado com o Administrador padrão de testes:
- **E-mail**: `admin@furia.gg`
- **Senha**: `admin`
- **Perfil**: `admin`
- **Departamento**: `Tecnologia & Operações`

> 💡 **Dica sobre edição manual de senhas no SQLite Editor**:
> O sistema foi programado de forma humanizada. Se você cadastrar pelo site, a senha é protegida em hash SHA-256. Mas se você abrir o SQLite Editor e digitar uma senha em texto puro diretamente na coluna `senha` (ex: `123456`), o login funcionará normalmente!

---

## 💡 Para que serve a pasta `src`?

A palavra **`src`** é uma abreviação mundialmente usada para **Source** (Código-fonte).

### Por que ela existe?
A pasta **`src`** separa o código que você programa das configurações de ferramentas do projeto:
- **Fora de `src`**: Arquivos de configuração (`package.json`, `.env.example`, `server.js`, `database.sqlite`).
- **Dentro de `src`**: Todo o código da aplicação, separado por responsabilidade:

```text
backend/
|── database.sqlite        # Arquivo do Banco de Dados SQLite3 (abra no SQLite Editor)
|── server.js              # Ponto de entrada simples que liga o servidor
|── package.json           # Dependências do Node.js
|── .env.example           # Exemplo de variáveis de ambiente
  ── src/                   # CÓDIGO-FONTE DA APLICAÇÃO:
    |── config/            # Guarda configurações (porta, CORS)
    |── controllers/       # Regras de negócio (login, criar chamado, listar usuários)
    |── db/                # Conexão e repositório SQLite (database.js)
    |── middlewares/       # Proteção de rotas e tratamento de erros
    |── routes/            # Rotas da API (/api/auth, /api/tickets, /api/users)
```

---

## Como rodar o servidor?

No terminal:
```bash
npm start
```

O terminal exibirá:
```text
> Servidor da FURIA rodando em http://localhost:3000
> Acesso de teste: admin@furia.gg (senha: admin)
```
