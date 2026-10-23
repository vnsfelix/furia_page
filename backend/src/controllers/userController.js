/**
 * Controller de Gestão de Usuários (Painel Admin)
 */

import { Database } from '../db/database.js';

export const userController = {
  // GET /api/users
  async getAll(req, res, next) {
    try {
      const users = await Database.findUsers();
      return res.json(users);
    } catch (error) {
      next(error);
    }
  },

  // POST /api/users
  async create(req, res, next) {
    try {
      const { name, email, department, role, password } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
      }

      const user = await Database.createUser({
        name,
        email,
        department: department || 'Geral',
        role: role || 'funcionario',
        password: password || '123'
      });

      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso!',
        user
      });
    } catch (error) {
      if (error.message.includes('já está cadastrado')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },

  // PUT /api/users/:id
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { role, department, name } = req.body;
      const user = await Database.updateUser(id, { role, department, name });
      return res.json({
        message: 'Usuário atualizado com sucesso!',
        user
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/users/:id/role
  async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['funcionario', 'tecnico', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Perfil inválido. Use funcionario, tecnico ou admin.' });
      }

      const user = await Database.updateUserRole(id, role);
      return res.json({
        message: 'Função atualizada com sucesso!',
        user
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/users/:id
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      if (req.user && req.user.id === id) {
        return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário.' });
      }

      await Database.deleteUser(id);
      return res.json({ message: 'Usuário removido com sucesso!' });
    } catch (error) {
      next(error);
    }
  }
};

