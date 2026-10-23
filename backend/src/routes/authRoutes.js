import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

export const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.get('/me', requireAuth, authController.getMe);

