import axios from 'axios';
import webhookConfig from '../config/webhook.js';
import { mockAttendanceData } from '../data/mockAttendance.js';

export const attendanceService = {
  /**
   * Fetches attendance data from the n8n webhook or retrieves mock data if not configured/forced.
   * @param {boolean} forceMock - Whether to skip the webhook and return mock data directly.
   * @returns {Promise<{ workers: Array, isMock: boolean }>} Attendance data and mock indicator.
   */
  getAttendanceData: async (forceMock = false) => {
    const webhookUrl = webhookConfig.attendanceWebhook;

    // If webhook is not configured or mock is explicitly requested, return mock data
    if (!webhookUrl || forceMock) {
      console.log(`[SERVICE] Serving mock attendance data (Reason: ${forceMock ? 'Forced mock' : 'Webhook not configured'})`);
      return {
        workers: mockAttendanceData,
        isMock: true
      };
    }

    try {
      console.log(`[SERVICE] Calling n8n webhook: ${webhookUrl}`);
      
      const response = await axios.get(webhookUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Attendance-Dashboard-Backend'
        }
      });

      console.log('[SERVICE] Webhook response received successfully');

      // Normalize: ensure every worker has an Attendance array
      const workers = Array.isArray(response.data) ? response.data.map(w => ({
        ...w,
        Attendance: Array.isArray(w.Attendance) ? w.Attendance : []
      })) : response.data;

      return {
        workers,
        isMock: false
      };
    } catch (error) {
      console.error('[SERVICE] Failed to fetch data from n8n webhook:', error.message);
      // Propagate the original error with context so the controller can handle it appropriately
      throw error;
    }
  }
};

export default attendanceService;
