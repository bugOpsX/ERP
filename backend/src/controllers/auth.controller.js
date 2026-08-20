import authService, { COOKIE_NAME, getCookieOptions } from '../services/auth.service.js';

export const authController = {
  /**
   * POST /api/auth/login
   * Validates administrator credentials and sets HTTP-only session cookie.
   */
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body || {};

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Username and password are required.',
        });
      }

      const authResult = await authService.login(username, password);

      if (!authResult) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid administrator credentials.',
        });
      }

      // Set HTTP-only cookie
      res.cookie(COOKIE_NAME, authResult.token, getCookieOptions());

      return res.status(200).json({
        success: true,
        user: authResult.user,
        token: authResult.token, // Returned for client convenience if needed
        message: 'Signed in successfully.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   * Clears HTTP-only session cookie.
   */
  logout: (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  },

  /**
   * GET /api/auth/me
   * Validates active session on application startup / page refresh.
   */
  me: (req, res) => {
    let token = req.cookies?.[COOKIE_NAME];

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }

    const user = authService.verifyToken(token);

    if (!user) {
      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }

    return res.status(200).json({
      authenticated: true,
      user,
    });
  },
};

export default authController;
