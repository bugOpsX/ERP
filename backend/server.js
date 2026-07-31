import app from './app.js';
import webhookConfig from './config/webhook.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Attendance Dashboard Backend running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/attendance`);
  console.log(` Webhook URL:  ${webhookConfig.attendanceWebhook || 'NOT CONFIGURED (serving mock data)'}`);
  console.log(`==================================================`);
});
