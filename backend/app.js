import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';

import webhookConfig from './config/webhook.js';
import attendanceRoutes from './routes/attendance.routes.js';
import dbRoutes from './src/routes/db.routes.js';
import uploadRoutes from './src/routes/upload.routes.js';
import plantRoutes from './src/routes/plant.routes.js';
import workerRoutes from './src/routes/worker.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import { requireAuth } from './src/middleware/auth.middleware.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(compression());

app.use(cors({
  origin: [
    'https://attendance.bugopsx.in',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Mock-Data']
}));

app.use(express.json());
app.use(cookieParser());

// Public operational endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    webhookConfigured: !!webhookConfig.attendanceWebhook,
    timestamp: new Date().toISOString()
  });
});

// Database health check (public)
app.use('/api/db', dbRoutes);

// Authentication endpoints (public)
app.use('/api/auth', authRoutes);

// Protected application APIs (Requires valid admin session)
app.use('/api/uploads', requireAuth, uploadRoutes);
app.use('/api/plants', requireAuth, plantRoutes);
app.use('/api/workers', requireAuth, workerRoutes);
app.use('/api/attendance', requireAuth, attendanceRoutes);

app.use(errorHandler);

export default app;