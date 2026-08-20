import express from 'express';
import { getDbHealth } from '../controllers/db.controller.js';

const router = express.Router();

// GET /api/db/health
router.get('/health', getDbHealth);

export default router;
