import attendanceService from '../services/attendance.service.js';

export const attendanceController = {
  /**
   * GET /api/attendance
   * Handler to get worker attendance records.
   */
  getAttendance: async (req, res, next) => {
    const forceMock = req.query.mock === 'true';

    try {
      const { workers, isMock } = await attendanceService.getAttendanceData(forceMock);

      if (isMock) {
        res.setHeader('X-Mock-Data', 'true');
      }

      return res.status(200).json(workers);
    } catch (error) {
      // Check if error is due to response status or request failure (Axios errors)
      const status = error.response ? error.response.status : 502;
      const message = error.response 
        ? `n8n webhook returned status code ${error.response.status}`
        : `Failed to connect to n8n webhook: ${error.message}`;

      // In controller, we return a structured error response
      return res.status(status).json({
        error: 'Webhook Integration Error',
        message: message,
        details: error.response ? error.response.data : null,
        tip: 'You can test the frontend by appending ?mock=true to the URL or leaving the N8N_ATTENDANCE_WEBHOOK_URL environment variable empty.'
      });
    }
  }
};

export default attendanceController;
