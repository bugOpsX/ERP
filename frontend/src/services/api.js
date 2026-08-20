import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://attendance-api.bugopsx.in';

const getApiBaseUrl = (url) => {
  let cleaned = url.trim().replace(/\/+$/, '');
  if (cleaned.endsWith('/attendance')) {
    cleaned = cleaned.replace(/\/attendance$/, '');
  }
  if (!cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`;
  }
  return cleaned;
};

const API_BASE_URL = getApiBaseUrl(rawUrl);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  /**
   * Authenticates administrator with username and password.
   */
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  /**
   * Logs out administrator and clears session cookie.
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Checks current administrator session status on page refresh/startup.
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const attendanceService = {
  /**
   * Fetches worker attendance records (n8n / legacy endpoint).
   * @param {boolean} forceMock - Set to true to force backend to return mock data.
   * @returns {Promise<Array>} List of worker attendance data.
   */
  getAttendance: async (forceMock = false) => {
    const response = await api.get('/attendance', {
      params: forceMock ? { mock: 'true' } : {},
    });
    return {
      workers: response.data,
      isMock: response.headers['x-mock-data'] === 'true' || response.headers['X-Mock-Data'] === 'true'
    };
  },

  /**
   * Fetches available plant locations for selection.
   * @returns {Promise<Array>} List of plant locations.
   */
  getPlants: async () => {
    try {
      const response = await api.get('/plants');
      return response.data?.plants || [];
    } catch (err) {
      console.warn('Failed to fetch plant locations from backend, using default fallback.', err);
      return [
        { code: 'PLANT_A', name: 'Kamla Enterprises Plant', city: 'Surat', state: 'Gujarat', supportedUnits: ['BF-2', 'BF-3'], isImplemented: true },
        { code: 'PLANT_B', name: 'Future Plant Location', city: 'Other City', supportedUnits: ['UNIT-1'], isImplemented: false }
      ];
    }
  },

  /**
   * Fetches available imported periods (years and months) for a plant.
   * @param {string} plantCode
   */
  getPeriods: async (plantCode = 'PLANT_A') => {
    const response = await api.get('/attendance/periods', { params: { plantCode } });
    return response.data?.periods || [];
  },

  /**
   * Fetches historical attendance data for a plant, year, month, and unit from PostgreSQL.
   */
  getHistoricalAttendance: async ({ plantCode = 'PLANT_A', year, month, unit = 'ALL' }) => {
    const response = await api.get('/attendance/history', {
      params: { plantCode, year, month, unit }
    });
    return response.data;
  },

  /**
   * Fetches monthly summary metrics for a plant, year, month, and unit from PostgreSQL.
   */
  getMonthlySummary: async ({ plantCode = 'PLANT_A', year, month, unit = 'ALL' }) => {
    const response = await api.get('/attendance/summary', {
      params: { plantCode, year, month, unit }
    });
    return response.data?.summary || null;
  },

  /**
   * Fetches worker roster list matching selected context.
   */
  getWorkers: async ({ plantCode = 'PLANT_A', year, month, unit = 'ALL' }) => {
    const response = await api.get('/workers', {
      params: { plantCode, year, month, unit }
    });
    return response.data?.workers || [];
  },

  /**
   * Uploads an attendance Excel spreadsheet (.xlsx / .xls) for a specific plant location.
   */
  uploadAttendance: async (file, plantCode = 'PLANT_A') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('plantCode', plantCode);
    const response = await api.post('/uploads/attendance', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Confirms and commits transactional database import.
   */
  commitImport: async (uploadId, plantCode = 'PLANT_A', replaceExisting = false) => {
    const response = await api.post(`/uploads/attendance/${uploadId}/import`, {
      plantCode,
      replaceExisting,
    });
    return response.data;
  },

  /**
   * Fetches past import history logs.
   */
  getImportHistory: async (filters = {}) => {
    const response = await api.get('/uploads/attendance/history', { params: filters });
    return response.data?.history || [];
  },

  /**
   * Fetches detailed breakdown for a single import session.
   */
  getImportDetails: async (importId) => {
    const response = await api.get(`/uploads/attendance/${importId}`);
    return response.data?.details || null;
  },
};

export default api;
