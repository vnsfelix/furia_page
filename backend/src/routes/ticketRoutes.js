import { Router } from 'express';
import { ticketController } from '../controllers/ticketController.js';

export const ticketRoutes = Router();

ticketRoutes.post('/', ticketController.create);
ticketRoutes.get('/', ticketController.getAll);
ticketRoutes.get('/user/:userId', ticketController.getUserTickets);
ticketRoutes.get('/:id', ticketController.getById);
ticketRoutes.put('/:id/status', ticketController.updateStatus);
ticketRoutes.delete('/:id', ticketController.delete);

