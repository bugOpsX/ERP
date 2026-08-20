import { query } from '../db/index.js';

export const ImportModel = {
  /**
   * Create an import tracking log.
   * @param {Object} importData
   */
  async create(importData) {
    const { fileName, month, year, status, bf2RecordCount, bf3RecordCount, workerCount } = importData;
    const res = await query(
      `INSERT INTO attendance_imports (
        file_name, month, year, status, bf2_record_count, bf3_record_count, worker_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [fileName, month, year, status || 'imported', bf2RecordCount || 0, bf3RecordCount || 0, workerCount || 0]
    );
    return res.rows[0];
  },

  /**
   * Update the status of an existing import.
   * @param {number} id
   * @param {string} status
   */
  async updateStatus(id, status) {
    const res = await query(
      'UPDATE attendance_imports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return res.rows[0];
  },

  /**
   * List all import history entries.
   */
  async findAll() {
    const res = await query('SELECT * FROM attendance_imports ORDER BY uploaded_at DESC');
    return res.rows;
  },

  /**
   * Find imports by month and year.
   * @param {number} month
   * @param {number} year
   */
  async findByMonthAndYear(month, year) {
    const res = await query('SELECT * FROM attendance_imports WHERE month = $1 AND year = $2 ORDER BY uploaded_at DESC', [
      month,
      year,
    ]);
    return res.rows;
  },
};

export default ImportModel;
