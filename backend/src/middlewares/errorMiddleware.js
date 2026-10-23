/**
 * Middleware Centralizado de Tratamento de Erros
 */

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: `Rota não encontrada: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err, req, res, next) {
  console.error('Erro na requisição:', err);

  const status = err.status || 500;
  const message = err.message || 'Ocorreu um erro interno no servidor.';

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString()
  });
}

