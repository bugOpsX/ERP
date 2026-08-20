import express from 'express';
import { handleAttendanceUpload } from '../middleware/upload.middleware.js';
import {
  uploadAttendanceFile,
  executeAttendanceImport,
  getAvailablePlants,
  getImportHistory,
  getImportDetails,
} from '../controllers/upload.controller.js';

const router = express.Router();

// GET /api/uploads/plants
router.get('/plants', getAvailablePlants);

// GET /api/uploads/attendance/history
router.get('/attendance/history', getImportHistory);

// GET /api/uploads/attendance/:id (Fetch single import details breakdown)
router.get('/attendance/:id', getImportDetails);

// POST /api/uploads/attendance (Step 1: Upload & Validate Preview)
router.post('/attendance', handleAttendanceUpload, uploadAttendanceFile);

// POST /api/uploads/attendance/:uploadId/import (Step 2: Commit Transactional Database Import)
router.post('/attendance/:uploadId/import', executeAttendanceImport);

export default router;
