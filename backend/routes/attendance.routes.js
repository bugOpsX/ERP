import express from 'express';
import attendanceController from '../controllers/attendance.controller.js';

const router = express.Router();

// GET /api/attendance (router mounts at /api/attendance or we mount router at /api/attendance in app.js)
router.get('/', attendanceController.getAttendance);

export default router;
