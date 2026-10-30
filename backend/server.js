import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Database, comparePassword } from './src/db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de CORS e JSON parser
app.use(cors());
app.use(express.json());

// Servir arquivos do site (HTML, CSS, JS, Imagens) diretamente pelo backend
app.use(express.static(rootDir));

// Endpoint de verificação do status da API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    banco: 'SQLite3 (backend/database.sqlite)',
    timestamp: new Date().toISOString()
  });
});

// ==============================================================================
// ROTAS DE AUTENTICAÇÃO (/api/auth)
// ==============================================================================

// POST /api/auth/login -> Login por e-mail e senha
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Informe seu e-mail e senha.' });
    }

    const user = await Database.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const isValid = comparePassword(password, user.senha || user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    // Remove as senhas do objeto de resposta
    const { senha: _s, password: _p, ...safeUser } = user;
    return res.json({
      message: 'Login realizado com sucesso!',
      user: safeUser
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register -> Cadastro de novo usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos.' });
    }

    const newUser = await Database.createUser({
      name,
      email,
      password,
      role: 'funcionario',
      department: 'Geral'
    });

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso no banco SQLite!',
      user: newUser
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ==============================================================================
// ROTAS DE CHAMADOS / TICKETS (/api/tickets)
// ==============================================================================

// GET /api/tickets -> Listar todos os chamados
app.get('/api/tickets', async (req, res) => {
  try {
    const { status } = req.query;
    const tickets = await Database.findTickets({ status });
    return res.json(tickets);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/tickets/user/:userId -> Listar chamados de um usuário
app.get('/api/tickets/user/:userId', async (req, res) => {
  try {
    const tickets = await Database.findTickets({ userId: req.params.userId });
    return res.json(tickets);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/tickets/:id -> Buscar uma Ordem de Serviço específica pelo ID
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await Database.findTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    }
    return res.json(ticket);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets -> Criar novo chamado
app.post('/api/tickets', async (req, res) => {
  try {
    const ticket = await Database.createTicket(req.body);
    return res.status(201).json({
      message: 'Chamado gravado com sucesso no SQLite!',
      ticket
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// PUT /api/tickets/:id -> Atualizar dados completos da Ordem de Serviço
app.put('/api/tickets/:id', async (req, res) => {
  try {
    const updated = await Database.updateTicket(req.params.id, req.body);
    return res.json({
      message: 'Ordem de serviço atualizada no SQLite!',
      ticket: updated
    });
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 400;
    return res.status(status).json({ error: err.message });
  }
});

// PUT /api/tickets/:id/status -> Atualizar status da Ordem de Serviço
app.put('/api/tickets/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const statusValidos = ['Recebido', 'Em andamento', 'Concluído'];
    if (!status || !statusValidos.includes(status)) {
      return res.status(400).json({
        error: 'Status inválido. Use apenas: Recebido, Em andamento ou Concluído.'
      });
    }

    const updated = await Database.updateTicketStatus(req.params.id, status);
    return res.json({
      message: 'Status atualizado no SQLite!',
      ticket: updated
    });
  } catch (err) {
    const statusCode = err.message.includes('não encontrado') ? 404 : 400;
    return res.status(statusCode).json({ error: err.message });
  }
});

// DELETE /api/tickets/:id -> Excluir chamado
app.delete('/api/tickets/:id', async (req, res) => {
  try {
    await Database.deleteTicket(req.params.id);
    return res.json({ message: 'Chamado excluído permanentemente do SQLite.' });
  } catch (err) {
    const statusCode = err.message.includes('não encontrado') ? 404 : 400;
    return res.status(statusCode).json({ error: err.message });
  }
});

// ==============================================================================
// ROTAS DE GESTÃO DE USUÁRIOS (/api/users)
// ==============================================================================

// GET /api/users -> Listar usuários (com suporte opcional a filtro por perfil ?role=tecnico)
app.get('/api/users', async (req, res) => {
  try {
    let users = await Database.findUsers();
    if (req.query.role) {
      const roleFilter = String(req.query.role).toLowerCase();
      users = users.filter(u => (u.role || '').toLowerCase() === roleFilter);
    }
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/tecnicos -> Listar apenas técnicos de suporte (CRUD de Técnicos)
app.get('/api/tecnicos', async (req, res) => {
  try {
    const users = await Database.findUsers();
    const tecnicos = users.filter(u => u.role === 'tecnico');
    return res.json(tecnicos);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/clientes -> Listar apenas clientes/funcionários solicitantes (CRUD de Clientes)
app.get('/api/clientes', async (req, res) => {
  try {
    const users = await Database.findUsers();
    const clientes = users.filter(u => u.role === 'funcionario');
    return res.json(clientes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id -> Buscar usuário por ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await Database.findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/users -> Criar usuário (pelo admin)
app.post('/api/users', async (req, res) => {
  try {
    const user = await Database.createUser(req.body);
    return res.status(201).json({
      message: 'Colaborador cadastrado no SQLite!',
      user
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// PUT /api/users/:id -> Atualizar perfil / setor
app.put('/api/users/:id', async (req, res) => {
  try {
    const updated = await Database.updateUser(req.params.id, req.body);
    return res.json({
      message: 'Colaborador atualizado no SQLite!',
      user: updated
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// DELETE /api/users/:id -> Excluir usuário
app.delete('/api/users/:id', async (req, res) => {
  try {
    await Database.deleteUser(req.params.id);
    return res.json({ message: 'Usuário removido do SQLite.' });
  } catch (err) {
    const statusCode = err.message.includes('não encontrado') ? 404 : 400;
    return res.status(statusCode).json({ error: err.message });
  }
});

// Redireciona qualquer outra rota web para o index.html principal
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`> Servidor da FURIA rodando em http://localhost:${PORT}`);
  console.log(`> Banco de dados SQLite ativo: backend/database.sqlite`);
  console.log(`> Administrador padrão: admin@furia.gg (senha: admin)`);
});

