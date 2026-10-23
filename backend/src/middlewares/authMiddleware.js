/**
 * Middlewares de Autenticação e Controle de Acesso (RBAC)
 */

import { Database } from '../db/database.js';

export async function requireAuth(req, res, next) {
  try {
    // Permite identificar o usuário via header de sessão ou authorization
    const userId = req.headers['x-user-id'] || req.headers['authorization'];

    if (!userId) {
      return res.status(401).json({ error: 'Acesso negado: faça login para continuar.' });
    }

    const cleanId = userId.replace('Bearer ', '').trim();
    const user = await Database.findUserById(cleanId);

    if (!user) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao validar autenticação.' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito: permissão de Administrador requerida.' });
  }
  next();
}

