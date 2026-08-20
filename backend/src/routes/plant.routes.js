import express from 'express';
import { getAvailablePlants } from '../controllers/upload.controller.js';

const router = express.Router();

// GET /api/plants
router.get('/', getAvailablePlants);

export default router;
