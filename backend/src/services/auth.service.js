import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'kamla_admin_session';

/**
 * Returns standard options for session HTTP-only cookie.
 */
export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAgeSeconds = parseInt(process.env.SESSION_MAX_AGE || '86400', 10);
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: maxAgeSeconds * 1000,
    path: '/',
  };
};

export const authService = {
  /**
   * Validates administrator credentials.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Object|null>} User object and session token if valid, null otherwise.
   */
  login: async (username, password) => {
    if (!username || !password) {
      return null;
    }

    const configuredUsername = process.env.ADMIN_USERNAME || 'admin';
    const configuredHash =
      process.env.ADMIN_PASSWORD_HASH ||
      '$2b$10$k5hLCAgriibJN3jnmCw6OOAC82LfKiM23OPQ8Pac4KC7WAElt7teK'; // Default hash for 'admin123'
    const sessionSecret = process.env.SESSION_SECRET || 'kamla_enterprises_secret_key_2026_super_secure';
    const sessionMaxAge = parseInt(process.env.SESSION_MAX_AGE || '86400', 10);

    const usernameMatches = username.trim().toLowerCase() === configuredUsername.toLowerCase();
    if (!usernameMatches) {
      return null;
    }

    let passwordMatches = false;
    if (configuredHash) {
      passwordMatches = await bcrypt.compare(password, configuredHash);
    } else if (process.env.ADMIN_PASSWORD) {
      passwordMatches = (password === process.env.ADMIN_PASSWORD);
    }

    if (!passwordMatches) {
      return null;
    }

    const user = {
      username: configuredUsername,
      role: 'admin',
    };

    const token = jwt.sign(
      { username: user.username, role: user.role },
      sessionSecret,
      { expiresIn: sessionMaxAge }
    );

    return { user, token };
  },

  /**
   * Verifies JWT session token.
   * @param {string} token
   * @returns {Object|null} Decoded user payload or null.
   */
  verifyToken: (token) => {
    if (!token) return null;
    const sessionSecret = process.env.SESSION_SECRET || 'kamla_enterprises_secret_key_2026_super_secure';
    try {
      const decoded = jwt.verify(token, sessionSecret);
      return {
        username: decoded.username,
        role: decoded.role || 'admin',
      };
    } catch (err) {
      return null;
    }
  },
};

export default authService;
