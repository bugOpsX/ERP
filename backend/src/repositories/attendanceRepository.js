import { getClient } from '../db/index.js';
import WorkerModel from '../models/Worker.js';
import AttendanceRecordModel from '../models/AttendanceRecord.js';
import MonthlySummaryModel from '../models/MonthlySummary.js';
import ImportModel from '../models/Import.js';
import SiteModel from '../models/Site.js';

export const attendanceRepository = {
  /**
   * High-level transaction method to store/import worker attendance data batch.
   * @param {Object} payload Batch attendance structure.
   */
  async saveAttendanceBatch(payload) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const { fileName, month, year, bf2RecordCount, bf3RecordCount, workerCount, workersData } = payload;

      // 1. Log import event
      const importRecord = await ImportModel.create({
        fileName: fileName || 'batch_import',
        month,
        year,
        status: 'imported',
        bf2RecordCount,
        bf3RecordCount,
        workerCount,
      });

      // 2. Process workers, attendance records, and monthly summaries
      for (const workerInfo of workersData) {
        const worker = await WorkerModel.upsert(
          {
            gatePass: workerInfo.GatePass,
            wisa: workerInfo.WISA,
            name: workerInfo.Name,
            designation: workerInfo.Designation,
            department: workerInfo.Department,
            blastFurnace: workerInfo.BlastFurnace,
          },
          client
        );

        // Save daily attendance records if provided
        if (Array.isArray(workerInfo.Attendance)) {
          for (const daily of workerInfo.Attendance) {
            await AttendanceRecordModel.upsert(
              {
                workerId: worker.id,
                importId: importRecord.id,
                attendanceDate: daily.Date,
                dayName: daily.DayName,
                isSunday: daily.IsSunday,
                dayIn: daily.DayIn,
                dayOut: daily.DayOut,
                nightIn: daily.NightIn,
                nightOut: daily.NightOut,
                shiftType: daily.ShiftType,
                weekdayManDay: daily.WeekdayManDay,
                sundayHours: daily.SundayHours,
                sundayRatio: daily.SundayRatio,
                manDay: daily.ManDay,
              },
              client
            );
          }
        }

        // Save monthly summary statistics
        await MonthlySummaryModel.upsert(
          {
            workerId: worker.id,
            month: workerInfo.AttendanceMonth || month,
            year: workerInfo.AttendanceYear || year,
            blastFurnace: workerInfo.BlastFurnace,
            workingDays: workerInfo.WorkingDays,
            presentDays: workerInfo.PresentDays,
            sundayWorkingDays: workerInfo.SundayWorkingDays,
            weekdayManDays: workerInfo.WeekdayManDays,
            sundayHours: workerInfo.SundayHours,
            sundayRatio: workerInfo.SundayRatio,
            totalManDays: workerInfo.TotalManDays,
            nightShifts: workerInfo.NightShifts,
          },
          client
        );
      }

      await client.query('COMMIT');
      return importRecord;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[REPOSITORY] Error saving attendance batch:', err);
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Health check for repository & DB layer.
   */
  async checkHealth() {
    const sites = await SiteModel.findAll();
    return {
      connected: true,
      sitesCount: sites.length,
      sites: sites.map((s) => s.code),
    };
  },
};

export default attendanceRepository;
