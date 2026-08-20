import { query } from '../db/index.js';

export const AttendanceRecordModel = {
  /**
   * Upsert a daily attendance record for a worker.
   * @param {Object} recordData
   * @param {import('pg').PoolClient} [client]
   */
  async upsert(recordData, client = null) {
    const {
      workerId,
      importId,
      attendanceDate,
      dayName,
      isSunday,
      dayIn,
      dayOut,
      nightIn,
      nightOut,
      shiftType,
      weekdayManDay,
      sundayHours,
      sundayRatio,
      manDay,
    } = recordData;

    const sql = `
      INSERT INTO attendance_records (
        worker_id, import_id, attendance_date, day_name, is_sunday,
        day_in, day_out, night_in, night_out, shift_type,
        weekday_man_day, sunday_hours, sunday_ratio, man_day
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (worker_id, attendance_date) DO UPDATE SET
        import_id = EXCLUDED.import_id,
        day_name = EXCLUDED.day_name,
        is_sunday = EXCLUDED.is_sunday,
        day_in = EXCLUDED.day_in,
        day_out = EXCLUDED.day_out,
        night_in = EXCLUDED.night_in,
        night_out = EXCLUDED.night_out,
        shift_type = EXCLUDED.shift_type,
        weekday_man_day = EXCLUDED.weekday_man_day,
        sunday_hours = EXCLUDED.sunday_hours,
        sunday_ratio = EXCLUDED.sunday_ratio,
        man_day = EXCLUDED.man_day,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      workerId,
      importId || null,
      attendanceDate,
      dayName,
      !!isSunday,
      dayIn || null,
      dayOut || null,
      nightIn || null,
      nightOut || null,
      shiftType || 'Day',
      weekdayManDay || 0,
      sundayHours || 0,
      sundayRatio || 0,
      manDay || 0,
    ];

    const res = client ? await client.query(sql, values) : await query(sql, values);
    return res.rows[0];
  },

  /**
   * Find attendance records for a worker within a date range.
   * @param {number} workerId
   * @param {string} startDate
   * @param {string} endDate
   */
  async findByWorkerAndDateRange(workerId, startDate, endDate) {
    const res = await query(
      `SELECT * FROM attendance_records 
       WHERE worker_id = $1 AND attendance_date >= $2 AND attendance_date <= $3
       ORDER BY attendance_date ASC`,
      [workerId, startDate, endDate]
    );
    return res.rows;
  },
};

export default AttendanceRecordModel;
