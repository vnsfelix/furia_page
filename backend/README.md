# Backend da FURIA – Servidor e API

Esta pasta contém o servidor Node.js (usando Express) responsável pela API do projeto.

---

## 💡 Para que serve a pasta `src`?

A palavra **`src`** é uma abreviação mundialmente usada para **Source** (Código-fonte).

### Por que ela existe?
Imagine se todos os arquivos do backend ficassem soltos na pasta `backend/`:
- `server.js`, `package.json`, `.env.example`, `node_modules`...
- Mais os arquivos de rotas, controllers, validações de senha, conexões de banco...
Em pouco tempo a pasta viraria uma bagunça difícil de entender.

A pasta **`src`** serve exatamente para **separar o código que você escreve e mantém** dos arquivos de configuração e ferramentas do projeto:
- **Fora de `src`**: Ficam apenas os arquivos de configuração do projeto (`package.json`, `.env.example`, `server.js`).
- **Dentro de `src`**: Fica todo o código da sua aplicação, separado por função:

```text
backend/
├── server.js              # Ponto de entrada simples que liga o servidor
├── package.json           # Lista de dependências (Express, Cors)
├── .env.example           # Exemplo de variáveis de ambiente
└── src/                   # CÓDIGO-FONTE DA APLICAÇÃO:
    ├── config/            # Guarda configurações (porta, origens permitidas de CORS)
    ├── controllers/       # O que fazer em cada ação (login, criar ticket, listar usuários)
    ├── db/                # Onde fica a conexão e as tabelas do Banco de Dados
    ├── middlewares/       # Checagens de segurança (verificar se está logado e se é admin)
    └── routes/            # Os caminhos da URL (/api/auth, /api/tickets, /api/users)
```

Essa divisão é o padrão da indústria. Quando outro programador entrar no seu projeto, ele saberá exatamente onde procurar cada coisa sem se perder.

---

## Como rodar o servidor?

No terminal, dentro desta pasta:
```bash
npm install
npm start
```

O terminal exibirá uma mensagem limpa e direta:
```text
> Servidor da FURIA rodando em http://localhost:3000
> Acesso de teste: admin@furia.gg (senha: admin) ou usuario@furia.gg (senha: 123)
```

---

## 🗄️ Como você vai conectar seu Banco de Dados quando estiver pronto:

Toda a lógica de banco está centralizada no arquivo:
👉 `backend/src/db/database.js`

Você não precisa mexer nas rotas nem nos controllers! Basta trocar a forma como o `database.js` busca e salva os dados.

### 1. Esquema das Tabelas (SQL pronto para usar):

```sql
-- Tabela de Usuários
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
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

### 2. Para conectar com PostgreSQL:
Instale o driver:
```bash
npm install pg
```
Em `backend/src/db/database.js`, crie um pool e faça as consultas `SELECT * FROM users WHERE email = $1`.

### 3. Para conectar com MySQL:
Instale o driver:
```bash
npm install mysql2
```
Em `backend/src/db/database.js`, use `mysql.createConnection(...)`.

### 4. Para usar Prisma ORM:
```bash
npm install prisma @prisma/client
npx prisma init
```
Defina os models no schema do Prisma e use `prisma.user.findUnique()` ou `prisma.ticket.create()`.

