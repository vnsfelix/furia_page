/**
 * Controller de Autenticação (Login e Cadastro por E-mail e Senha)
 */

import { Database, comparePassword } from '../db/database.js';

export const authController = {
  // POST /api/auth/register
  async register(req, res, next) {
    try {
      const { name, email, password, department, role } = req.body;

      if (!name || name.trim().length < 3) {
        return res.status(400).json({ error: 'O nome deve ter no mínimo 3 caracteres.' });
      }

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Informe um endereço de e-mail válido.' });
      }

      if (!password || password.length < 3) {
        return res.status(400).json({ error: 'A senha deve ter no mínimo 3 caracteres.' });
      }

      const user = await Database.createUser({
        name,
        email,
        password,
        department: department || 'Geral',
        role: role || 'funcionario'
      });

      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso!',
        user,
        token: user.id
      });
    } catch (error) {
      if (error.message.includes('já está cadastrado')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Informe o e-mail e a senha.' });
      }

      const user = await Database.findUserByEmail(email);

      if (!user) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      const isPasswordValid = comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      const { password: _p, senha: _s, ...safeUser } = user;

      return res.json({
        message: 'Login realizado com sucesso!',
        user: safeUser,
        token: safeUser.id
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/auth/me
  async getMe(req, res) {
    return res.json({ user: req.user });
  }
};

