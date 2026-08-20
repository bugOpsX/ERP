import express from 'express';
import authController from '../controllers/auth.controller.js';
import { loginRateLimiter } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', loginRateLimiter, authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/me
router.get('/me', authController.me);

export default router;
