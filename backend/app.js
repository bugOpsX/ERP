import express from 'express';
import cors from 'cors';
import webhookConfig from './config/webhook.js';
import attendanceRoutes from './routes/attendance.routes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Enable CORS with exposed headers
app.use(cors({
  exposedHeaders: ['X-Mock-Data']
}));

// Body parser
app.use(express.json());

// Base diagnostic endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    webhookConfigured: !!webhookConfig.attendanceWebhook,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/attendance', attendanceRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
