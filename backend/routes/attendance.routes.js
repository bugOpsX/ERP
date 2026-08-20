import express from 'express';
import attendanceController from '../controllers/attendance.controller.js';
import {
  getAvailablePeriods,
  getMonthlySummary,
  getHistoricalAttendance,
} from '../src/controllers/historical.controller.js';

const router = express.Router();

// GET /api/attendance (legacy/n8n live endpoint - preserved for backward compatibility)
router.get('/', attendanceController.getAttendance);

// GET /api/attendance/periods
router.get('/periods', getAvailablePeriods);

// GET /api/attendance/summary
router.get('/summary', getMonthlySummary);

// GET /api/attendance/history
router.get('/history', getHistoricalAttendance);

export default router;
