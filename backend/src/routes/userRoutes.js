import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';

export const userRoutes = Router();

// Todas as rotas de gerenciamento de usuários exigem autenticação de Administrador
userRoutes.get('/', userController.getAll);
userRoutes.get('/:id', userController.getById);
userRoutes.post('/', userController.create);
userRoutes.put('/:id', userController.updateUser);
userRoutes.put('/:id/role', userController.updateRole);
userRoutes.delete('/:id', userController.delete);

