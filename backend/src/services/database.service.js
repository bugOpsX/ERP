import { query } from '../db/index.js';

export const databaseService = {
  /**
   * Ping database and retrieve operational statistics.
   */
  async getHealthStatus() {
    try {
      const nowResult = await query('SELECT NOW() as current_time, current_database() as database_name');
      const tablesResult = await query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );

      return {
        status: 'healthy',
        database: nowResult.rows[0].database_name,
        timestamp: nowResult.rows[0].current_time,
        tablesCount: tablesResult.rows.length,
        tables: tablesResult.rows.map((r) => r.table_name),
      };
    } catch (err) {
      console.error('[DB SERVICE] Health check error:', err);
      return {
        status: 'error',
        message: err.message,
      };
    }
  },
};

export default databaseService;
