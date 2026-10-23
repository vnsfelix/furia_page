/**
 * FURIA Helpdesk - Servidor Backend Express
 */

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from './src/config/config.js';
import { authRoutes } from './src/routes/authRoutes.js';
import { ticketRoutes } from './src/routes/ticketRoutes.js';
import { userRoutes } from './src/routes/userRoutes.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();

// Configuração de CORS para permitir requisições de outros domínios / Live Server
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

// Parser de JSON
app.use(express.json());

// Servir arquivos estáticos do frontend (permite rodar o site completo pelo backend)
app.use(express.static(rootDir));

// Endpoint de verificação de integridade (Health Check)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'FURIA Helpdesk API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Rotas da API REST
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

// Tratamento de rotas de API não encontradas
app.use('/api/*', notFoundHandler);

// Redireciona qualquer rota web comum para o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Tratamento central de erros
app.use(errorHandler);

// Inicialização do servidor
app.listen(config.port, () => {
  console.log(`> Servidor da FURIA rodando em http://localhost:${config.port}`);
  console.log(`> Acesso de teste: admin@furia.gg (senha: admin)`);
});
