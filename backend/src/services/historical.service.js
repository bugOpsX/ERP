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
    let filterClause = '';
    const params = [];

    if (plantCode && plantCode !== 'ALL') {
      params.push(plantCode);
      filterClause = 'AND ai.plant_code = $1';
    }

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
      WHERE ai.status = 'imported' ${filterClause}
      ORDER BY ai.year DESC, ai.month DESC
    `;

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
        SUM(mws.night_man_days) as total_night_man_days,
        SUM(mws.sunday_hours) as total_sunday_hours,
        SUM(mws.sunday_ratio) as total_sunday_ratio,
        SUM(mws.total_man_days) as total_man_days,
        SUM(COALESCE(mws.total_ot_hours, 0)) as total_ot_hours,
        SUM(mws.night_shifts) as total_night_shifts
      FROM monthly_worker_summaries mws
      JOIN workers w ON mws.worker_id = w.id
      JOIN plants p ON p.code = $1
      JOIN attendance_imports ai ON ai.plant_code = p.code AND ai.year = $2 AND ai.month = $3 AND ai.status = 'imported'
      WHERE mws.month = $3 AND mws.year = $2 AND (w.plant_id = p.id OR mws.plant_id = p.id) ${unitFilter}
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
        nightManDays: 0,
        sundayHours: 0,
        sundayRatio: 0,
        totalManDays: 0,
        totalOTHours: 0,
        nightShifts: 0,
        units: [],
      };
    }

    let totalWorkerCount = 0;
    let totalWorkingDays = 0;
    let totalPresentDays = 0;
    let totalSundayWorkingDays = 0;
    let totalWeekdayManDays = 0;
    let totalNightManDays = 0;
    let totalSundayHours = 0;
    let totalSundayRatio = 0;
    let totalManDays = 0;
    let totalOTHours = 0;
    let totalNightShifts = 0;

    const unitSummaries = res.rows.map((row) => {
      const wCount = parseInt(row.worker_count, 10);
      const workDays = parseInt(row.total_working_days, 10);
      const presDays = parseInt(row.total_present_days, 10);
      const sunWorkDays = parseInt(row.total_sunday_working_days, 10);
      const wkManDays = parseFloat(row.total_weekday_man_days || 0);
      const ntManDays = parseFloat(row.total_night_man_days || 0);
      const sunHours = parseFloat(row.total_sunday_hours || 0);
      const sunRatio = parseFloat(row.total_sunday_ratio || 0);
      const tManDays = parseFloat(row.total_man_days || 0);
      const tOTHours = parseFloat(row.total_ot_hours || 0);
      const nShifts = parseInt(row.total_night_shifts || 0, 10);

      totalWorkerCount += wCount;
      totalWorkingDays += workDays;
      totalPresentDays += presDays;
      totalSundayWorkingDays += sunWorkDays;
      totalWeekdayManDays += wkManDays;
      totalNightManDays += ntManDays;
      totalSundayHours += sunHours;
      totalSundayRatio += sunRatio;
      totalManDays += tManDays;
      totalOTHours += tOTHours;
      totalNightShifts += nShifts;

      return {
        unit: row.blast_furnace,
        workerCount: wCount,
        workingDays: workDays,
        presentDays: presDays,
        sundayWorkingDays: sunWorkDays,
        weekdayManDays: parseFloat(wkManDays.toFixed(2)),
        nightManDays: parseFloat(ntManDays.toFixed(2)),
        sundayHours: parseFloat(sunHours.toFixed(2)),
        sundayRatio: parseFloat(sunRatio.toFixed(2)),
        totalManDays: parseFloat(tManDays.toFixed(2)),
        totalOTHours: parseFloat(tOTHours.toFixed(2)),
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
      nightManDays: parseFloat(totalNightManDays.toFixed(2)),
      sundayHours: parseFloat(totalSundayHours.toFixed(2)),
      sundayRatio: parseFloat(totalSundayRatio.toFixed(2)),
      totalManDays: parseFloat(totalManDays.toFixed(2)),
      totalOTHours: parseFloat(totalOTHours.toFixed(2)),
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
        w.employee_id,
        w.wisa,
        w.gate_pass,
        w.name,
        w.designation,
        w.category,
        w.sub_contractor_name,
        w.department,
        COALESCE(w.blast_furnace, 'KORBA-MAIN') as blast_furnace,
        mws.working_days,
        mws.present_days,
        mws.sunday_working_days,
        mws.weekday_man_days,
        mws.night_man_days,
        mws.sunday_hours,
        mws.sunday_ratio,
        mws.total_man_days,
        COALESCE(mws.total_ot_hours, 0) as total_ot_hours,
        mws.night_shifts
      FROM workers w
      JOIN plants p ON p.code = $1
      JOIN monthly_worker_summaries mws ON mws.worker_id = w.id AND mws.year = $2 AND mws.month = $3
      JOIN attendance_imports ai ON ai.plant_code = p.code AND ai.year = $2 AND ai.month = $3 AND ai.status = 'imported'
      WHERE (w.plant_id = p.id OR mws.plant_id = p.id) ${unitFilter}
      ORDER BY w.name ASC
    `;

    const res = await query(sql, params);

    return res.rows.map((row) => {
      const isKorba = plantCode === 'PLANT_B';
      return {
        id: row.id,
        employeeId: row.employee_id || row.wisa || '',
        PlantCode: plantCode,
        plantCode: plantCode,
        EmployeeID: row.employee_id || row.wisa || '',
        wisa: row.wisa || row.employee_id || '',
        WISA: row.wisa || row.employee_id || '',
        gatePass: row.gate_pass || (isKorba ? 'N/A' : 'N/A'),
        GatePass: row.gate_pass || (isKorba ? 'N/A' : 'N/A'),
        name: row.name,
        Name: row.name,
        designation: row.designation || 'N/A',
        Designation: row.designation || 'N/A',
        category: row.category || 'N/A',
        Category: row.category || 'N/A',
        subContractorName: row.sub_contractor_name || 'KAMLA ENTERPRISES',
        SubContractorName: row.sub_contractor_name || 'KAMLA ENTERPRISES',
        department: row.department || (isKorba ? 'Production' : 'N/A'),
        Department: row.department || (isKorba ? 'Production' : 'N/A'),
        blastFurnace: row.blast_furnace,
        BlastFurnace: row.blast_furnace,
        workingDays: parseInt(row.working_days, 10),
        WorkingDays: parseInt(row.working_days, 10),
        presentDays: parseInt(row.present_days, 10),
        PresentDays: parseInt(row.present_days, 10),
        sundayWorkingDays: parseInt(row.sunday_working_days, 10),
        SundayWorkingDays: parseInt(row.sunday_working_days, 10),
        weekdayManDays: parseFloat(row.weekday_man_days || 0),
        WeekdayManDays: parseFloat(row.weekday_man_days || 0),
        nightManDays: parseFloat(row.night_man_days || 0),
        NightManDays: parseFloat(row.night_man_days || 0),
        sundayHours: parseFloat(row.sunday_hours || 0),
        SundayHours: parseFloat(row.sunday_hours || 0),
        sundayRatio: parseFloat(row.sunday_ratio || 0),
        SundayRatio: parseFloat(row.sunday_ratio || 0),
        totalManDays: parseFloat(row.total_man_days || 0),
        TotalManDays: parseFloat(row.total_man_days || 0),
        totalOTHours: parseFloat(row.total_ot_hours || 0),
        TotalOTHours: parseFloat(row.total_ot_hours || 0),
        nightShifts: parseInt(row.night_shifts || 0, 10),
        NightShifts: parseInt(row.night_shifts || 0, 10),
      };
    });
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
        w.employee_id as "EmployeeID",
        w.wisa as "WISA",
        w.gate_pass as "GatePass",
        w.name as "Name",
        w.designation as "Designation",
        w.category as "Category",
        w.sub_contractor_name as "SubContractorName",
        w.department as "Department",
        COALESCE(w.blast_furnace, 'KORBA-MAIN') as "BlastFurnace",
        mws.working_days as "WorkingDays",
        mws.present_days as "PresentDays",
        mws.sunday_working_days as "SundayWorkingDays",
        mws.weekday_man_days as "WeekdayManDays",
        mws.night_man_days as "NightManDays",
        mws.sunday_hours as "SundayHours",
        mws.sunday_ratio as "SundayRatio",
        mws.total_man_days as "TotalManDays",
        COALESCE(mws.total_ot_hours, 0) as "TotalOTHours",
        mws.night_shifts as "NightShifts",
        ar.attendance_date,
        ar.day_name,
        ar.is_sunday,
        ar.day_in,
        ar.day_out,
        ar.night_in,
        ar.night_out,
        ar.shift_type,
        ar.weekday_man_day,
        ar.night_man_day,
        ar.man_day,
        ar.md,
        ar.ot_hours,
        ar.attendance_type
      FROM workers w
      JOIN plants p ON p.code = $1
      JOIN monthly_worker_summaries mws ON mws.worker_id = w.id AND mws.year = $2 AND mws.month = $3
      JOIN attendance_imports ai ON ai.plant_code = p.code AND ai.year = $2 AND ai.month = $3 AND ai.status = 'imported'
      JOIN attendance_records ar ON ar.worker_id = w.id AND ar.import_id = ai.id
      WHERE (w.plant_id = p.id OR mws.plant_id = p.id) ${unitFilter}
      ORDER BY COALESCE(w.employee_id, w.wisa) ASC, ar.attendance_date ASC
    `;

    const res = await query(sql, params);

    const workerMap = new Map();
    res.rows.forEach((row) => {
      if (!workerMap.has(row.worker_id)) {
        workerMap.set(row.worker_id, {
          PlantCode: plantCode,
          plantCode: plantCode,
          EmployeeID: row.EmployeeID || row.WISA || '',
          WISA: row.WISA || row.EmployeeID || '',
          GatePass: row.GatePass || 'N/A',
          Name: row.Name,
          Designation: row.Designation || 'N/A',
          Category: row.Category || 'N/A',
          SubContractorName: row.SubContractorName || 'KAMLA ENTERPRISES',
          Department: row.Department || 'N/A',
          BlastFurnace: row.BlastFurnace,
          WorkingDays: parseInt(row.WorkingDays, 10),
          PresentDays: parseInt(row.PresentDays, 10),
          SundayWorkingDays: parseInt(row.SundayWorkingDays, 10),
          WeekdayManDays: parseFloat(row.WeekdayManDays || 0),
          NightManDays: parseFloat(row.NightManDays || 0),
          SundayHours: parseFloat(row.SundayHours || 0),
          SundayRatio: parseFloat(row.SundayRatio || 0),
          TotalManDays: parseFloat(row.TotalManDays || 0),
          TotalOTHours: parseFloat(row.TotalOTHours || 0),
          NightShifts: parseInt(row.NightShifts || 0, 10),
          Attendance: [],
        });
      }

      const worker = workerMap.get(row.worker_id);
      let formattedDate = '';
      if (row.attendance_date instanceof Date) {
        const y = row.attendance_date.getFullYear();
        const m = String(row.attendance_date.getMonth() + 1).padStart(2, '0');
        const d = String(row.attendance_date.getDate()).padStart(2, '0');
        formattedDate = `${d}-${m}-${y}`;
      } else {
        const parts = String(row.attendance_date).split('T')[0].split('-');
        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      worker.Attendance.push({
        Date: formattedDate,
        DayName: row.day_name,
        IsSunday: row.is_sunday,
        DayIn: row.day_in || '',
        DayOut: row.day_out || '',
        NightIn: row.night_in || '',
        NightOut: row.night_out || '',
        ShiftType: row.shift_type,
        DayManDay: parseFloat(row.weekday_man_day || 0),
        WeekdayManDay: parseFloat(row.weekday_man_day || 0),
        NightManDay: parseFloat(row.night_man_day || 0),
        ManDay: parseFloat(row.man_day || row.md || 0),
        MD: parseFloat(row.md || 0),
        OTHours: parseFloat(row.ot_hours || 0),
        AttendanceType: row.attendance_type || (plantCode === 'PLANT_B' ? 'MD_OT_BASED' : 'PUNCH_BASED'),
      });
    });

    return Array.from(workerMap.values());
  },
};

export default historicalService;
