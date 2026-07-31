import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const attendanceService = {
  /**
   * Fetches worker attendance records.
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
};

export default api;
