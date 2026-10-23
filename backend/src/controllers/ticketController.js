/**
 * Controller de Chamados / Tickets
 */

import { Database } from '../db/database.js';

export const ticketController = {
  // POST /api/tickets
  async create(req, res, next) {
    try {
      const { titulo, descricao, tipo, categoria, local, tiposervico, urgencia, anexo } = req.body;

      if (!descricao) {
        return res.status(400).json({ error: 'A descrição da solicitação é obrigatória.' });
      }

      const user = req.user || {
        id: req.body.userId || 'usr_anon',
        name: req.body.userName || 'Usuário',
        email: req.body.userEmail || 'usuario@furia.gg'
      };

      const ticket = await Database.createTicket({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        tipo: tipo || 'problemas',
        titulo: titulo || (tipo === 'presencial' ? 'Chamado Presencial' : 'Relato de Problema'),
        categoria,
        local,
        tiposervico,
        descricao,
        urgencia: urgencia || 'media',
        anexo
      });

      return res.status(201).json({
        message: 'Chamado aberto com sucesso!',
        ticket
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/tickets (Todos os chamados ou filtrados por status)
  async getAll(req, res, next) {
    try {
      const { status } = req.query;
      const tickets = await Database.findTickets({ status });
      return res.json(tickets);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/tickets/user/:userId (Chamados de um usuário específico)
  async getUserTickets(req, res, next) {
    try {
      const { userId } = req.params;
      const tickets = await Database.findTickets({ userId });
      return res.json(tickets);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/tickets/:id (Chamado por ID)
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await Database.findTicketById(id);
      if (!ticket) {
        return res.status(404).json({ error: 'Chamado não encontrado.' });
      }
      return res.json(ticket);
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/tickets/:id/status
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['Recebido', 'Em andamento', 'Concluído'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido. Use: Recebido, Em andamento ou Concluído.' });
      }

      const updated = await Database.updateTicketStatus(id, status);
      return res.json({
        message: 'Status atualizado com sucesso!',
        ticket: updated
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/tickets/:id
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await Database.deleteTicket(id);
      return res.json({ message: 'Chamado removido com sucesso!' });
    } catch (error) {
      next(error);
    }
  }
};

