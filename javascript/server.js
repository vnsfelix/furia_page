import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

const db = {
  clientes: [],
  tecnicos: [],
  ordensServico: [],
  statusPermitidos: ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']
};

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';
  return res.status(statusCode).json({ status: 'error', statusCode, message });
};

const validateCliente = (req, res, next) => {
  const { nome, email } = req.body;
  if (!nome || !email) throw new AppError('Nome e email são obrigatórios.', 400);
  next();
};

const validateTecnico = (req, res, next) => {
  const { nome, especialidade } = req.body;
  if (!nome || !especialidade) throw new AppError('Nome e especialidade são obrigatórios.', 400);
  next();
};

const validateOS = (req, res, next) => {
  const { clienteId, tecnicoId, descricao } = req.body;
  if (!clienteId || !tecnicoId || !descricao) {
    throw new AppError('clienteId, tecnicoId e descricao são obrigatórios.', 400);
  }
  const clienteExists = dfb.clientes.find(c => c.id === clienteId);
  if (!clienteExists) throw new AppError('Cliente não encontrado.', 404);
  const tecnicoExists = db.tecnicos.find(t => t.id === tecnicoId);
  if (!tecnicoExists) throw new AppError('Técnico não encontrado.', 404);
  next();
};

app.post('/api/clientes', validateCliente, (req, res) => {
  const { nome, email, telefone } = req.body;
  const novoCliente = { id: String(Date.now()), nome, email, telefone };
  db.clientes.push(novoCliente);
  res.status(201).json(novoCliente);
});

app.get('/api/clientes', (req, res) => {
  res.json(db.clientes);
});

app.get('/api/clientes/:id', (req, res) => {
  const cliente = db.clientes.find(c => c.id === req.params.id);
  if (!cliente) throw new AppError('Cliente não encontrado.', 404);
  res.json(cliente);
});

app.put('/api/clientes/:id', validateCliente, (req, res) => {
  const index = db.clientes.findIndex(c => c.id === req.params.id);
  if (index === -1) throw new AppError('Cliente não encontrado.', 404);
  const { nome, email, telefone } = req.body;
  db.clientes[index] = { ...db.clientes[index], nome, email, telefone };
  res.json(db.clientes[index]);
});

app.delete('/api/clientes/:id', (req, res) => {
  const index = db.clientes.findIndex(c => c.id === req.params.id);
  if (index === -1) throw new AppError('Cliente não encontrado.', 404);
  db.clientes.splice(index, 1);
  res.status(204).send();
});

app.post('/api/tecnicos', validateTecnico, (req, res) => {
  const { nome, especialidade } = req.body;
  const novoTecnico = { id: String(Date.now()), nome, especialidade };
  db.tecnicos.push(novoTecnico);
  res.status(201).json(novoTecnico);
});

app.get('/api/tecnicos', (req, res) => {
  res.json(db.tecnicos);
});

app.get('/api/tecnicos/:id', (req, res) => {
  const tecnico = db.tecnicos.find(t => t.id === req.params.id);
  if (!tecnico) throw new AppError('Técnico não encontrado.', 404);
  res.json(tecnico);
});

app.put('/api/tecnicos/:id', validateTecnico, (req, res) => {
  const index = db.tecnicos.findIndex(t => t.id === req.params.id);
  if (index === -1) throw new AppError('Técnico não encontrado.', 404);
  const { nome, especialidade } = req.body;
  db.tecnicos[index] = { ...db.tecnicos[index], nome, especialidade };
  res.json(db.tecnicos[index]);
});

app.delete('/api/tecnicos/:id', (req, res) => {
  const index = db.tecnicos.findIndex(t => t.id === req.params.id);
  if (index === -1) throw new AppError('Técnico não encontrado.', 404);
  db.tecnicos.splice(index, 1);
  res.status(204).send();
});

app.post('/api/ordens-servico', validateOS, (req, res) => {
  const { clienteId, tecnicoId, descricao } = req.body;
  const novaOS = {
    id: String(Date.now()),
    clienteId,
    tecnicoId,
    descricao,
    status: 'PENDENTE',
    dataCriacao: new Date().toISOString(),
    dataAtualizacao: new Date().toISOString()
  };
  db.ordensServico.push(novaOS);
  res.status(201).json(novaOS);
});

app.get('/api/ordens-servico', (req, res) => {
  res.json(db.ordensServico);
});

app.get('/api/ordens-servico/:id', (req, res) => {
  const os = db.ordensServico.find(o => o.id === req.params.id);
  if (!os) throw new AppError('Ordem de serviço não encontrada.', 404);
  res.json(os);
});

app.patch('/api/ordens-servico/:id/status', (req, res) => {
  const { status } = req.body;
  const os = db.ordensServico.find(o => o.id === req.params.id);
  if (!os) throw new AppError('Ordem de serviço não encontrada.', 404);
  if (!db.statusPermitidos.includes(status)) {
    throw new AppError(`Status inválido. Permitidos: ${db.statusPermitidos.join(', ')}`, 400);
  }
  os.status = status;
  os.dataAtualizacao = new Date().toISOString();
  res.json(os);
});

app.put('/api/ordens-servico/:id', validateOS, (req, res) => {
  const index = db.ordensServico.findIndex(o => o.id === req.params.id);
  if (index === -1) throw new AppError('Ordem de serviço não encontrada.', 404);
  const { clienteId, tecnicoId, descricao } = req.body;
  db.ordensServico[index] = {
    ...db.ordensServico[index],
    clienteId,
    tecnicoId,
    descricao,
    dataAtualizacao: new Date().toISOString()
  };
  res.json(db.ordensServico[index]);
});

app.delete('/api/ordens-servico/:id', (req, res) => {
  const index = db.ordensServico.findIndex(o => o.id === req.params.id);
  if (index === -1) throw new AppError('Ordem de serviço não encontrada.', 404);
  db.ordensServico.splice(index, 1);
  res.status(204).send();
});

app.use(errorHandler);

app.listen(3000, () => {
  console.log('Servidor a rodar na porta 3000');
});