import authService, { COOKIE_NAME } from '../services/auth.service.js';

// In-memory rate limiting map for login attempts
const loginAttempts = new Map();

/**
 * Middleware to protect sensitive administrative API routes.
 */
export const requireAuth = (req, res, next) => {
  let token = req.cookies?.[COOKIE_NAME];

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required. Please sign in to access this API.',
    });
  }

  const user = authService.verifyToken(token);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Session invalid or expired. Please sign in again.',
    });
  }

  req.user = user;
  next();
};

/**
 * Rate limiter middleware for /api/auth/login.
 * Allows maximum 10 attempts per 15-minute window per IP.
 */
export const loginRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10;

  const record = loginAttempts.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  if (record.count >= maxAttempts) {
    return res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Too many failed login attempts. Please try again after 15 minutes.',
    });
  }

  record.count += 1;
  loginAttempts.set(ip, record);
  next();
};
