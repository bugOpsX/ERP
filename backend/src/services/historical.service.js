import { query } from '../db/index.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const historicalService = {
  /**
   * Get available periods (years and months) imported in PostgreSQL.
   */
  getAvailablePeriods: async (plantCode = 'PLANT_A') => {
    const sql = `
      SELECT DISTINCT 
        ai.year, 
        ai.month, 
        ai.plant_code,
        p.name as plant_name,
        p.city as plant_city,
        p.state as plant_state,
        ai.total_record_count as record_count,
        ai.worker_count as worker_count
      FROM attendance_imports ai
      JOIN plants p ON p.code = ai.plant_code
      WHERE ai.status = 'imported' ${plantCode ? 'AND ai.plant_code = $1' : ''}
      ORDER BY ai.year DESC, ai.month DESC
    `;

    const params = plantCode ? [plantCode] : [];
    const res = await query(sql, params);

    const periods = res.rows.map((row) => ({
      year: row.year,
      month: row.month,
      monthName: MONTH_NAMES[row.month - 1] || `Month ${row.month}`,
      recordCount: parseInt(row.record_count || 0, 10),
      workerCount: parseInt(row.worker_count || 0, 10),
      status: 'available',
      plantCode: row.plant_code,
      plantName: row.plant_name,
      plantCity: row.plant_city,
      plantState: row.plant_state,
    }));

    return periods;
  },

  /**
   * Get monthly summary statistics for a given plant, year, month, and unit.
   */
  getMonthlySummary: async ({ plantCode = 'PLANT_A', year, month, unit = 'ALL' }) => {
    let unitFilter = '';
    const params = [plantCode, parseInt(year, 10), parseInt(month, 10)];

    if (unit && unit !== 'ALL') {
      params.push(unit);
      unitFilter = 'AND mws.blast_furnace = $4';
    }

    const sql = `
      SELECT 
        mws.blast_furnace,
        COUNT(DISTINCT mws.worker_id) as worker_count,
        SUM(mws.working_days) as total_working_days,
        SUM(mws.present_days) as total_present_days,
        SUM(mws.sunday_working_days) as total_sunday_working_days,
        SUM(mws.weekday_man_days) as total_weekday_man_days,
        SUM(mws.sunday_hours) as total_sunday_hours,
        SUM(mws.sunday_ratio) as total_sunday_ratio,
        SUM(mws.total_man_days) as total_man_days,
        SUM(mws.night_shifts) as total_night_shifts
      FROM monthly_worker_summaries mws
      JOIN workers w ON mws.worker_id = w.id
      JOIN attendance_imports ai ON ai.plant_code = $1 AND ai.year = $2 AND ai.month = $3 AND ai.status = 'imported'
      WHERE 1=1 ${unitFilter}
      GROUP BY mws.blast_furnace
    `;

    const res = await query(sql, params);

    if (res.rows.length === 0) {
      return {
        available: false,
        workerCount: 0,
        workingDays: 0,
        presentDays: 0,
        sundayWorkingDays: 0,
        weekdayManDays: 0,
        sundayHours: 0,
        sundayRatio: 0,
        totalManDays: 0,
        nightShifts: 0,
        units: [],
      };
    }

    let totalWorkerCount = 0;
    let totalWorkingDays = 0;
    let totalPresentDays = 0;
    let totalSundayWorkingDays = 0;
    let totalWeekdayManDays = 0;
    let totalSundayHours = 0;
    let totalSundayRatio = 0;
    let totalManDays = 0;
    let totalNightShifts = 0;

    const unitSummaries = res.rows.map((row) => {
      const wCount = parseInt(row.worker_count, 10);
      const workDays = parseInt(row.total_working_days, 10);
      const presDays = parseInt(row.total_present_days, 10);
      const sunWorkDays = parseInt(row.total_sunday_working_days, 10);
      const wkManDays = parseFloat(row.total_weekday_man_days);
      const sunHours = parseFloat(row.total_sunday_hours);
      const sunRatio = parseFloat(row.total_sunday_ratio);
      const tManDays = parseFloat(row.total_man_days);
      const nShifts = parseInt(row.total_night_shifts, 10);

      totalWorkerCount += wCount;
      totalWorkingDays += workDays;
      totalPresentDays += presDays;
      totalSundayWorkingDays += sunWorkDays;
      totalWeekdayManDays += wkManDays;
      totalSundayHours += sunHours;
      totalSundayRatio += sunRatio;
      totalManDays += tManDays;
      totalNightShifts += nShifts;

      return {
        unit: row.blast_furnace,
        workerCount: wCount,
        workingDays: workDays,
        presentDays: presDays,
        sundayWorkingDays: sunWorkDays,
        weekdayManDays: parseFloat(wkManDays.toFixed(2)),
        sundayHours: parseFloat(sunHours.toFixed(2)),
        sundayRatio: parseFloat(sunRatio.toFixed(2)),
        totalManDays: parseFloat(tManDays.toFixed(2)),
        nightShifts: nShifts,
      };
    });

    return {
      available: true,
      workerCount: totalWorkerCount,
      workingDays: totalWorkingDays,
      presentDays: totalPresentDays,
      sundayWorkingDays: totalSundayWorkingDays,
      weekdayManDays: parseFloat(totalWeekdayManDays.toFixed(2)),
      sundayHours: parseFloat(totalSundayHours.toFixed(2)),
      sundayRatio: parseFloat(totalSundayRatio.toFixed(2)),
      totalManDays: parseFloat(totalManDays.toFixed(2)),
      nightShifts: totalNightShifts,
      units: unitSummaries,
    };
  },

  /**
   * Get workers list matching plant, year, month, and unit.
   */
  getWorkers: async ({ plantCode = 'PLANT_A', year, month, unit = 'ALL' }) => {
    let unitFilter = '';
    const params = [plantCode, parseInt(year, 10), parseInt(month, 10)];

    if (unit && unit !== 'ALL') {
      params.push(unit);
      unitFilter = 'AND w.blast_furnace = $4';
    }

    const sql = `
      SELECT 
        w.id,
        w.wisa,
        w.gate_pass,
        w.name,
        w.designation,
        w.department,
        w.blast_furnace,
        mws.working_days,
        mws.present_days,
        mws.sunday_working_days,
        mws.weekday_man_days,
        mws.sunday_hours,
        mws.sunday_ratio,
        mws.total_man_days,
        mws.night_shifts
      FROM workers w
      JOIN monthly_worker_summaries mws ON mws.worker_id = w.id AND mws.year = $2 AND mws.month = $3
      JOIN attendance_imports ai ON ai.plant_code = $1 AND ai.year = $2 AND ai.month = $3 AND ai.status = 'imported'
      WHERE 1=1 ${unitFilter}
      ORDER BY w.name ASC
    `;

    const res = await query(sql, params);

    return res.rows.map((row) => ({
      id: row.id,
      wisa: row.wisa,
      WISA: row.wisa,
      gatePass: row.gate_pass || 'N/A',
      GatePass: row.gate_pass || 'N/A',
      name: row.name,
      Name: row.name,
      designation: row.designation || 'N/A',
      Designation: row.designation || 'N/A',
      department: row.department || 'N/A',
      Department: row.department || 'N/A',
      blastFurnace: row.blast_furnace,
      BlastFurnace: row.blast_furnace,
      workingDays: parseInt(row.working_days, 10),
      WorkingDays: parseInt(row.working_days, 10),
      presentDays: parseInt(row.present_days, 10),
      PresentDays: parseInt(row.present_days, 10),
      sundayWorkingDays: parseInt(row.sunday_working_days, 10),
      SundayWorkingDays: parseInt(row.sunday_working_days, 10),
      weekdayManDays: parseFloat(row.weekday_man_days),
      WeekdayManDays: parseFloat(row.weekday_man_days),
      sundayHours: parseFloat(row.sunday_hours),
      SundayHours: parseFloat(row.sunday_hours),
      sundayRatio: parseFloat(row.sunday_ratio),
      SundayRatio: parseFloat(row.sunday_ratio),
      totalManDays: parseFloat(row.total_man_days),
      TotalManDays: parseFloat(row.total_man_days),
      nightShifts: parseInt(row.night_shifts, 10),
      NightShifts: parseInt(row.night_shifts, 10),
    }));
  },

  /**
   * Get full historical attendance data array for workers matching plant, year, month, and unit.
   */
  getHistoricalAttendance: async ({ plantCode = 'PLANT_A', year, month, unit = 'ALL' }) => {
    let unitFilter = '';
    const params = [plantCode, parseInt(year, 10), parseInt(month, 10)];

    if (unit && unit !== 'ALL') {
      params.push(unit);
      unitFilter = 'AND w.blast_furnace = $4';
    }

    const sql = `
      SELECT 
        w.id as worker_id,
        w.wisa as "WISA",
        w.gate_pass as "GatePass",
        w.name as "Name",
        w.designation as "Designation",
        w.department as "Department",
        w.blast_furnace as "BlastFurnace",
        mws.working_days as "WorkingDays",
        mws.present_days as "PresentDays",
        mws.sunday_working_days as "SundayWorkingDays",
        mws.weekday_man_days as "WeekdayManDays",
        mws.sunday_hours as "SundayHours",
        mws.sunday_ratio as "SundayRatio",
        mws.total_man_days as "TotalManDays",
        mws.night_shifts as "NightShifts",
        ar.attendance_date,
        ar.day_name,
        ar.is_sunday,
        ar.day_in,
        ar.day_out,
        ar.night_in,
        ar.night_out,
        ar.shift_type,
        ar.man_day
      FROM workers w
      JOIN monthly_worker_summaries mws ON mws.worker_id = w.id AND mws.year = $2 AND mws.month = $3
      JOIN attendance_imports ai ON ai.plant_code = $1 AND ai.year = $2 AND ai.month = $3 AND ai.status = 'imported'
      JOIN attendance_records ar ON ar.worker_id = w.id AND ar.import_id = ai.id
      WHERE 1=1 ${unitFilter}
      ORDER BY w.wisa ASC, ar.attendance_date ASC
    `;

    const res = await query(sql, params);

    const workerMap = new Map();
    res.rows.forEach((row) => {
      if (!workerMap.has(row.worker_id)) {
        workerMap.set(row.worker_id, {
          WISA: row.WISA,
          GatePass: row.GatePass || 'N/A',
          Name: row.Name,
          Designation: row.Designation || 'N/A',
          Department: row.Department || 'N/A',
          BlastFurnace: row.BlastFurnace,
          WorkingDays: parseInt(row.WorkingDays, 10),
          PresentDays: parseInt(row.PresentDays, 10),
          SundayWorkingDays: parseInt(row.SundayWorkingDays, 10),
          WeekdayManDays: parseFloat(row.WeekdayManDays),
          SundayHours: parseFloat(row.SundayHours),
          SundayRatio: parseFloat(row.SundayRatio),
          TotalManDays: parseFloat(row.TotalManDays),
          NightShifts: parseInt(row.NightShifts, 10),
          Attendance: [],
        });
      }

      const worker = workerMap.get(row.worker_id);
      const dateObj = new Date(row.attendance_date);
      const formattedDate = `${String(dateObj.getUTCDate()).padStart(2, '0')}-${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}-${dateObj.getUTCFullYear()}`;

      worker.Attendance.push({
        Date: formattedDate,
        DayName: row.day_name,
        IsSunday: row.is_sunday,
        DayIn: row.day_in || '',
        DayOut: row.day_out || '',
        NightIn: row.night_in || '',
        NightOut: row.night_out || '',
        ShiftType: row.shift_type,
        ManDay: parseFloat(row.man_day),
      });
    });

    return Array.from(workerMap.values());
  },
};

export default historicalService;
