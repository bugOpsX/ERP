import dotenv from 'dotenv';
dotenv.config();

export default {
  attendanceWebhook: process.env.N8N_ATTENDANCE_WEBHOOK_URL || "http://localhost:5678/webhook/attendance_bf2_bf3"
};