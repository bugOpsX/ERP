import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { getClient, query } from '../db/index.js';
import ImporterRegistry from '../importers/registry/importerRegistry.js';
import uploadService from './upload.service.js';

export const importEngineService = {
  /**
   * Step 1: Upload, inspect, validate, and register a pending upload session.
   * @param {Express.Multer.File} file
   * @param {string} plantCode
   */
  async createUploadSession(file, plantCode = 'PLANT_A') {
    const ext = path.extname(file.originalname).toLowerCase();
    const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Process workbook with plant parser
    const inspectionResult = uploadService.processAttendanceUpload(file, plantCode);

    if (!inspectionResult.valid) {
      // Clean up temporary file if validation failed
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return inspectionResult;
    }

    const { plant, format, workbook, warnings } = inspectionResult;

    // Check for duplicate imported data in PostgreSQL
    const duplicateRes = await query(
      `SELECT * FROM attendance_imports 
       WHERE plant_code = $1 AND month = $2 AND year = $3 AND status = 'imported' 
       LIMIT 1`,
      [plant.code, workbook.monthNumber, workbook.year]
    );

    const isDuplicate = duplicateRes.rows.length > 0;
    const existingImport = isDuplicate ? duplicateRes.rows[0] : null;

    // Get sheet record counts
    const bf2Count = (workbook.sheets.find((s) => s.name === 'BF-2') || {}).recordCount || 0;
    const bf3Count = (workbook.sheets.find((s) => s.name === 'BF-3') || {}).recordCount || 0;

    // Get plant_id from database
    const plantDbRes = await query('SELECT id FROM plants WHERE code = $1 LIMIT 1', [plant.code]);
    const plantId = plantDbRes.rows[0]?.id || null;

    // Save pending/validated import session into database
    await query(
      `INSERT INTO attendance_imports (
        upload_id, file_name, plant_code, plant_id, month, year, status,
        bf2_record_count, bf3_record_count, worker_count, total_record_count, temp_file_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        uploadId,
        file.originalname,
        plant.code,
        plantId,
        workbook.monthNumber,
        workbook.year,
        'validated',
        bf2Count,
        bf3Count,
        workbook.uniqueWorkersCount,
        workbook.totalRecords,
        file.path,
      ]
    );

    return {
      success: true,
      valid: true,
      uploadId,
      isDuplicate,
      existingImportId: existingImport ? existingImport.id : null,
      existingImportDate: existingImport ? existingImport.uploaded_at : null,
      duplicateWarning: isDuplicate
        ? `Attendance data for ${workbook.period} already exists in database (Import ID: #${existingImport.id}, Uploaded: ${new Date(existingImport.uploaded_at).toLocaleString()}). Importing again will replace existing data.`
        : null,
      message: 'Attendance file inspected and validated successfully. Ready for import.',
      plant,
      format,
      workbook,
      warnings,
      upload: {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadId,
      },
    };
  },

  /**
   * Step 2: Execute transactional database import for a validated session.
   * @param {string} uploadId
   * @param {Object} options - { replaceExisting: boolean }
   */
  async executeImport(uploadId, options = {}) {
    const { replaceExisting = false } = options;

    // 1. Fetch import session from DB
    const importRes = await query('SELECT * FROM attendance_imports WHERE upload_id = $1', [uploadId]);
    if (importRes.rows.length === 0) {
      throw new Error(`Upload session "${uploadId}" not found or expired.`);
    }

    const importSession = importRes.rows[0];

    if (importSession.status === 'imported') {
      throw new Error(`Upload session "${uploadId}" has already been imported.`);
    }

    const { temp_file_path: tempFilePath, plant_code: plantCode, month, year, file_name: fileName } = importSession;

    if (!tempFilePath || !fs.existsSync(tempFilePath)) {
      throw new Error(`Temporary upload file for session "${uploadId}" is no longer available.`);
    }

    // 2. Check duplicate import status
    const existingImportRes = await query(
      `SELECT * FROM attendance_imports 
       WHERE plant_code = $1 AND month = $2 AND year = $3 AND status = 'imported' AND upload_id != $4`,
      [plantCode, month, year, uploadId]
    );

    if (existingImportRes.rows.length > 0 && !replaceExisting) {
      const err = new Error(`Attendance data for month ${month}/${year} already exists in database.`);
      err.statusCode = 409;
      err.isDuplicate = true;
      throw err;
    }

    // 3. Begin Transaction
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // If replacing existing import, mark old imports as replaced and delete their attendance records
      if (existingImportRes.rows.length > 0 && replaceExisting) {
        for (const oldImp of existingImportRes.rows) {
          // Delete old attendance records
          await client.query('DELETE FROM attendance_records WHERE import_id = $1', [oldImp.id]);
          // Mark old import status as 'replaced'
          await client.query(
            'UPDATE attendance_imports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['replaced', oldImp.id]
          );
        }
      }

      // Update current import session status to 'importing'
      await client.query(
        'UPDATE attendance_imports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['importing', importSession.id]
      );

      // 4. Read Excel workbook and run parser
      const workbook = XLSX.readFile(tempFilePath);
      const parser = ImporterRegistry.getParserForPlant(plantCode);
      const parseResult = parser.parse(workbook);
      const { records } = parseResult;

      // 5. Resolve site/unit mapping from DB
      const sitesRes = await client.query('SELECT * FROM sites');
      const sitesMap = new Map();
      sitesRes.rows.forEach((s) => sitesMap.set(s.code.toUpperCase(), s.id));

      // 6. Batch Upsert Workers
      const workerIdMap = new Map(); // key: "BF-2:WISA123" -> workerId
      const uniqueWorkersMap = new Map();

      records.forEach((rec) => {
        const key = `${rec.blastFurnace.toUpperCase()}:${rec.wisa.toUpperCase()}`;
        if (!uniqueWorkersMap.has(key)) {
          uniqueWorkersMap.set(key, rec);
        }
      });

      for (const [key, rec] of uniqueWorkersMap.entries()) {
        const siteId = sitesMap.get(rec.blastFurnace.toUpperCase()) || null;

        const workerRes = await client.query(
          `INSERT INTO workers (gate_pass, wisa, name, designation, department, blast_furnace, site_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (blast_furnace, wisa) DO UPDATE SET
             gate_pass = EXCLUDED.gate_pass,
             name = EXCLUDED.name,
             designation = EXCLUDED.designation,
             department = EXCLUDED.department,
             site_id = COALESCE(EXCLUDED.site_id, workers.site_id),
             updated_at = CURRENT_TIMESTAMP
           RETURNING id;`,
          [rec.gatePass, rec.wisa, rec.name, rec.designation, rec.department, rec.blastFurnace, siteId]
        );

        workerIdMap.set(key, workerRes.rows[0].id);
      }

      // 7. Batch Insert Attendance Records
      let bf2Count = 0;
      let bf3Count = 0;

      for (const rec of records) {
        const key = `${rec.blastFurnace.toUpperCase()}:${rec.wisa.toUpperCase()}`;
        const workerId = workerIdMap.get(key);

        if (rec.blastFurnace.toUpperCase() === 'BF-2') bf2Count++;
        if (rec.blastFurnace.toUpperCase() === 'BF-3') bf3Count++;

        await client.query(
          `INSERT INTO attendance_records (
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
            updated_at = CURRENT_TIMESTAMP;`,
          [
            workerId,
            importSession.id,
            rec.attendanceDate,
            rec.dayName,
            rec.isSunday,
            rec.dayIn,
            rec.dayOut,
            rec.nightIn,
            rec.nightOut,
            rec.shiftType,
            rec.weekdayManDay,
            rec.sundayHours,
            rec.sundayRatio,
            rec.manDay,
          ]
        );
      }

      // 8. Generate & Upsert Monthly Worker Summaries
      await client.query(
        `INSERT INTO monthly_worker_summaries (
          worker_id, month, year, blast_furnace, site_id,
          working_days, present_days, sunday_working_days,
          weekday_man_days, sunday_hours, sunday_ratio, total_man_days, night_shifts
        )
        SELECT
          ar.worker_id,
          EXTRACT(MONTH FROM ar.attendance_date)::INT as month,
          EXTRACT(YEAR FROM ar.attendance_date)::INT as year,
          w.blast_furnace,
          w.site_id,
          COUNT(DISTINCT ar.attendance_date) as working_days,
          COUNT(DISTINCT CASE WHEN ar.is_sunday = FALSE THEN ar.attendance_date END) as present_days,
          COUNT(DISTINCT CASE WHEN ar.is_sunday = TRUE THEN ar.attendance_date END) as sunday_working_days,
          ROUND(SUM(ar.weekday_man_day)::numeric, 2) as weekday_man_days,
          ROUND(SUM(ar.sunday_hours)::numeric, 2) as sunday_hours,
          ROUND(SUM(ar.sunday_ratio)::numeric, 2) as sunday_ratio,
          ROUND((SUM(ar.weekday_man_day) + SUM(ar.sunday_ratio))::numeric, 2) as total_man_days,
          COUNT(CASE WHEN ar.shift_type = 'NIGHT' OR (ar.night_in IS NOT NULL AND ar.night_in != '') THEN 1 END) as night_shifts
        FROM attendance_records ar
        JOIN workers w ON ar.worker_id = w.id
        WHERE ar.import_id = $1
        GROUP BY ar.worker_id, EXTRACT(MONTH FROM ar.attendance_date), EXTRACT(YEAR FROM ar.attendance_date), w.blast_furnace, w.site_id
        ON CONFLICT (worker_id, month, year, blast_furnace) DO UPDATE SET
          site_id = EXCLUDED.site_id,
          working_days = EXCLUDED.working_days,
          present_days = EXCLUDED.present_days,
          sunday_working_days = EXCLUDED.sunday_working_days,
          weekday_man_days = EXCLUDED.weekday_man_days,
          sunday_hours = EXCLUDED.sunday_hours,
          sunday_ratio = EXCLUDED.sunday_ratio,
          total_man_days = EXCLUDED.total_man_days,
          night_shifts = EXCLUDED.night_shifts,
          updated_at = CURRENT_TIMESTAMP;`,
        [importSession.id]
      );

      // 9. Update Import Session Status to 'imported'
      const updatedImportRes = await client.query(
        `UPDATE attendance_imports SET 
          status = 'imported',
          bf2_record_count = $1,
          bf3_record_count = $2,
          worker_count = $3,
          total_record_count = $4,
          uploaded_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *;`,
        [bf2Count, bf3Count, workerIdMap.size, records.length, importSession.id]
      );

      await client.query('COMMIT');

      // 10. File Cleanup after successful commit
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupErr) {
          console.warn('[IMPORT ENGINE] Temp file cleanup warning:', cleanupErr.message);
        }
      }

      const importedRecord = updatedImportRes.rows[0];

      return {
        success: true,
        message: `Attendance data for ${month}/${year} imported successfully into PostgreSQL database.`,
        importId: importedRecord.id,
        uploadId,
        fileName,
        plantCode,
        month,
        year,
        importedAt: importedRecord.uploaded_at,
        stats: {
          totalRecords: records.length,
          uniqueWorkers: workerIdMap.size,
          bf2RecordCount: bf2Count,
          bf3RecordCount: bf3Count,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});

      // Mark session as failed in DB
      await query(
        `UPDATE attendance_imports SET status = 'failed', error_message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [err.message, importSession.id]
      ).catch(() => {});

      // Clean up temp file on failure
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupErr) {}
      }

      console.error('[IMPORT ENGINE] Import execution failed:', err);
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Retrieve import history list with optional filters.
   */
  async getImportHistory(filters = {}) {
    const { plantCode, year, month, status } = filters;
    let sql = `
      SELECT 
        ai.id,
        ai.upload_id,
        ai.file_name,
        ai.plant_code,
        p.name as plant_name,
        p.city as plant_city,
        p.state as plant_state,
        ai.month,
        ai.year,
        ai.status,
        ai.bf2_record_count,
        ai.bf3_record_count,
        ai.worker_count,
        ai.total_record_count,
        ai.error_message,
        ai.uploaded_at,
        ai.updated_at
      FROM attendance_imports ai
      LEFT JOIN plants p ON p.code = ai.plant_code
      WHERE 1=1
    `;
    const params = [];

    if (plantCode && plantCode !== 'ALL') {
      params.push(plantCode);
      sql += ` AND ai.plant_code = $${params.length}`;
    }
    if (year && year !== 'ALL') {
      params.push(parseInt(year, 10));
      sql += ` AND ai.year = $${params.length}`;
    }
    if (month && month !== 'ALL') {
      params.push(parseInt(month, 10));
      sql += ` AND ai.month = $${params.length}`;
    }
    if (status && status !== 'ALL') {
      params.push(status);
      sql += ` AND ai.status = $${params.length}`;
    }

    sql += ' ORDER BY ai.uploaded_at DESC, ai.id DESC';

    const res = await query(sql, params);
    return res.rows;
  },

  /**
   * Retrieve detailed breakdown for a single import session.
   */
  async getImportDetails(importIdOrUploadId) {
    const isNumeric = /^\d+$/.test(String(importIdOrUploadId));

    const impRes = await query(
      `SELECT 
        ai.*,
        p.name as plant_name,
        p.city as plant_city,
        p.state as plant_state
      FROM attendance_imports ai
      LEFT JOIN plants p ON p.code = ai.plant_code
      WHERE ${isNumeric ? 'ai.id = $1' : 'ai.upload_id = $1'}`,
      [importIdOrUploadId]
    );

    if (impRes.rows.length === 0) {
      throw new Error(`Import record "${importIdOrUploadId}" not found.`);
    }

    const imp = impRes.rows[0];

    // Stats for stored records
    const statsRes = await query(
      `SELECT 
        COUNT(*) as stored_records_count,
        COUNT(DISTINCT ar.worker_id) as worker_profiles_count,
        COUNT(DISTINCT w.wisa) as unique_wisa_count,
        MIN(ar.attendance_date) as min_date,
        MAX(ar.attendance_date) as max_date
      FROM attendance_records ar
      JOIN workers w ON ar.worker_id = w.id
      WHERE ar.import_id = $1`,
      [imp.id]
    );

    // Unit breakdown
    const unitRes = await query(
      `SELECT 
        w.blast_furnace,
        COUNT(DISTINCT ar.worker_id) as worker_count,
        COUNT(ar.id) as record_count
      FROM attendance_records ar
      JOIN workers w ON ar.worker_id = w.id
      WHERE ar.import_id = $1
      GROUP BY w.blast_furnace
      ORDER BY w.blast_furnace ASC`,
      [imp.id]
    );

    // Fetch related import versions for the same plant, year, month
    const relatedRes = await query(
      `SELECT id, upload_id, file_name, status, uploaded_at 
       FROM attendance_imports 
       WHERE plant_code = $1 AND year = $2 AND month = $3 AND id != $4
       ORDER BY uploaded_at DESC`,
      [imp.plant_code, imp.year, imp.month, imp.id]
    );

    const stats = statsRes.rows[0] || {};

    return {
      importId: imp.id,
      uploadId: imp.upload_id,
      fileName: imp.file_name,
      plantCode: imp.plant_code,
      plantName: imp.plant_name || 'Kamla Enterprises Plant',
      plantCity: imp.plant_city || 'Surat',
      plantState: imp.plant_state || 'Gujarat',
      month: imp.month,
      year: imp.year,
      status: imp.status,
      isActive: imp.status === 'imported',
      uploadedAt: imp.uploaded_at,
      updatedAt: imp.updated_at,
      errorMessage: imp.error_message,
      storedRecordsCount: parseInt(stats.stored_records_count || imp.total_record_count || 0, 10),
      workerProfilesCount: parseInt(stats.worker_profiles_count || imp.worker_count || 0, 10),
      uniqueWisaCount: parseInt(stats.unique_wisa_count || 0, 10),
      dateRange: {
        minDate: stats.min_date ? new Date(stats.min_date).toISOString().split('T')[0] : null,
        maxDate: stats.max_date ? new Date(stats.max_date).toISOString().split('T')[0] : null,
      },
      units: unitRes.rows.map((u) => ({
        unit: u.blast_furnace,
        workerCount: parseInt(u.worker_count, 10),
        recordCount: parseInt(u.record_count, 10),
      })),
      relatedImports: relatedRes.rows.map((r) => ({
        importId: r.id,
        fileName: r.file_name,
        status: r.status,
        uploadedAt: r.uploaded_at,
      })),
      consolidationNote:
        'Multiple shift entries for the same worker and date are consolidated into one attendance record.',
    };
  },
};

export default importEngineService;
