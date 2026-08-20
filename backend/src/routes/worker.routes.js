import express from 'express';
import { getWorkers } from '../controllers/historical.controller.js';

const router = express.Router();

// GET /api/workers?plantCode=PLANT_A&year=2026&month=6&unit=BF-2
router.get('/', getWorkers);

export default router;
