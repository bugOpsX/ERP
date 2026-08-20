import { query } from '../db/index.js';

export const MonthlySummaryModel = {
  /**
   * Upsert a monthly summary for a worker.
   * @param {Object} summaryData
   * @param {import('pg').PoolClient} [client]
   */
  async upsert(summaryData, client = null) {
    const {
      workerId,
      month,
      year,
      blastFurnace,
      siteId,
      workingDays,
      presentDays,
      sundayWorkingDays,
      weekdayManDays,
      sundayHours,
      sundayRatio,
      totalManDays,
      nightShifts,
    } = summaryData;

    const sql = `
      INSERT INTO monthly_worker_summaries (
        worker_id, month, year, blast_furnace, site_id,
        working_days, present_days, sunday_working_days,
        weekday_man_days, sunday_hours, sunday_ratio, total_man_days, night_shifts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (worker_id, month, year, blast_furnace) DO UPDATE SET
        site_id = COALESCE(EXCLUDED.site_id, monthly_worker_summaries.site_id),
        working_days = EXCLUDED.working_days,
        present_days = EXCLUDED.present_days,
        sunday_working_days = EXCLUDED.sunday_working_days,
        weekday_man_days = EXCLUDED.weekday_man_days,
        sunday_hours = EXCLUDED.sunday_hours,
        sunday_ratio = EXCLUDED.sunday_ratio,
        total_man_days = EXCLUDED.total_man_days,
        night_shifts = EXCLUDED.night_shifts,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      workerId,
      month,
      year,
      blastFurnace,
      siteId || null,
      workingDays || 0,
      presentDays || 0,
      sundayWorkingDays || 0,
      weekdayManDays || 0,
      sundayHours || 0,
      sundayRatio || 0,
      totalManDays || 0,
      nightShifts || 0,
    ];

    const res = client ? await client.query(sql, values) : await query(sql, values);
    return res.rows[0];
  },

  /**
   * Fetch summaries for a specific month and year.
   * @param {number} month
   * @param {number} year
   * @param {string} [blastFurnace]
   */
  async findByMonthAndYear(month, year, blastFurnace = null) {
    if (blastFurnace && blastFurnace.toUpperCase() !== 'ALL') {
      const res = await query(
        `SELECT mws.*, w.name, w.wisa, w.gate_pass, w.designation, w.department 
         FROM monthly_worker_summaries mws
         JOIN workers w ON mws.worker_id = w.id
         WHERE mws.month = $1 AND mws.year = $2 AND mws.blast_furnace = $3
         ORDER BY w.name ASC`,
        [month, year, blastFurnace]
      );
      return res.rows;
    }
    const res = await query(
      `SELECT mws.*, w.name, w.wisa, w.gate_pass, w.designation, w.department 
       FROM monthly_worker_summaries mws
       JOIN workers w ON mws.worker_id = w.id
       WHERE mws.month = $1 AND mws.year = $2
       ORDER BY w.name ASC`,
      [month, year]
    );
    return res.rows;
  },
};

export default MonthlySummaryModel;
