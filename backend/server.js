import app from './app.js';
import webhookConfig from './config/webhook.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(` Attendance Dashboard Backend running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Webhook URL: ${webhookConfig.attendanceWebhook || 'NOT CONFIGURED (serving mock data)'}`);
  console.log(`==================================================`);
});

