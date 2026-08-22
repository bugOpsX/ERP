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
    const bf2Count = (workbook.sheets?.find((s) => s.name === 'BF-2') || {}).recordCount || 0;
    const bf3Count = (workbook.sheets?.find((s) => s.name === 'BF-3') || {}).recordCount || 0;

    // Get plant_id from database
    const plantDbRes = await query('SELECT id FROM plants WHERE code = $1 LIMIT 1', [plant.code]);
    const plantId = plantDbRes.rows[0]?.id || null;

    const workerCount = workbook.workerCount || workbook.uniqueWorkersCount || 0;
    const totalRecords = workbook.totalRecords || (workerCount * (workbook.dailyAttendanceColumns || 31));

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
        workerCount,
        totalRecords,
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
      throw new Error(`Temporary workbook file for session "${uploadId}" is missing or expired. Please upload again.`);
    }

    // 2. Check duplicate status prior to import execution
    const duplicateRes = await query(
      `SELECT * FROM attendance_imports 
       WHERE plant_code = $1 AND month = $2 AND year = $3 AND status = 'imported' AND id != $4
       LIMIT 1`,
      [plantCode, month, year, importSession.id]
    );

    if (duplicateRes.rows.length > 0 && !replaceExisting) {
      const err = new Error(
        `Attendance dataset for ${month}/${year} (${plantCode}) already exists. Set replaceExisting=true to overwrite.`
      );
      err.statusCode = 409;
      err.isDuplicate = true;
      throw err;
    }

    // 3. Parse workbook with plant parser
    const parser = ImporterRegistry.getParserForPlant(plantCode);
    const workbookObj = XLSX.readFile(tempFilePath);
    const parseResult = parser.parse(workbookObj);

    if (!parseResult.success) {
      throw new Error(`Failed to parse attendance spreadsheet for plant "${plantCode}".`);
    }

    const { records, workers } = parseResult;

    // 4. Begin PostgreSQL Transaction
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Resolve plant_id
      const plantDbRes = await client.query('SELECT id FROM plants WHERE code = $1 LIMIT 1', [plantCode]);
      const plantId = plantDbRes.rows[0]?.id || null;

      // Resolve sites map (e.g. 'BF-2' -> site_id, 'BF-3' -> site_id, 'KORBA-MAIN' -> site_id)
      const sitesRes = await client.query('SELECT id, name, code FROM sites WHERE plant_id = $1', [plantId]);
      const sitesMap = new Map();
      sitesRes.rows.forEach((s) => {
        sitesMap.set(s.code.toUpperCase(), s.id);
        sitesMap.set(s.name.toUpperCase(), s.id);
      });

      // 5. Handle version replacement if replacing existing dataset
      if (replaceExisting && duplicateRes.rows.length > 0) {
        const oldImportId = duplicateRes.rows[0].id;
        console.log(`[IMPORT ENGINE] Replacing existing active import #${oldImportId} for ${month}/${year} (${plantCode}).`);

        // Mark old import record status as 'replaced'
        await client.query(
          `UPDATE attendance_imports SET status = 'replaced', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [oldImportId]
        );
      }

      // 6. Upsert Workers (Plant-aware worker resolution)
      const uniqueWorkersMap = new Map();
      workers.forEach((w) => {
        const key = plantCode === 'PLANT_B'
          ? `KORBA:${(w.employeeId || w.wisa).toUpperCase()}`
          : `${(w.blastFurnace || 'BF-2').toUpperCase()}:${w.wisa.toUpperCase()}`;
        if (!uniqueWorkersMap.has(key)) {
          uniqueWorkersMap.set(key, w);
        }
      });

      const workerIdMap = new Map();

      if (plantCode === 'PLANT_B') {
        // PLANT_B (Korba)
        for (const [key, rec] of uniqueWorkersMap.entries()) {
          const siteId = sitesMap.get('KORBA-MAIN') || sitesRes.rows[0]?.id || null;

          const workerRes = await client.query(
            `INSERT INTO workers (employee_id, aadhaar_no, name, designation, category, sub_contractor_name, blast_furnace, site_id, plant_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (plant_id, employee_id) WHERE employee_id IS NOT NULL DO UPDATE SET
               aadhaar_no = EXCLUDED.aadhaar_no,
               name = EXCLUDED.name,
               designation = EXCLUDED.designation,
               category = EXCLUDED.category,
               sub_contractor_name = EXCLUDED.sub_contractor_name,
               site_id = COALESCE(EXCLUDED.site_id, workers.site_id),
               updated_at = CURRENT_TIMESTAMP
             RETURNING id;`,
            [rec.employeeId, rec.aadhaarNo, rec.name, rec.designation, rec.category, rec.subContractorName, rec.blastFurnace, siteId, plantId]
          );

          workerIdMap.set(key, workerRes.rows[0].id);
        }
      } else {
        // PLANT_A (Surat)
        for (const [key, rec] of uniqueWorkersMap.entries()) {
          const siteId = sitesMap.get(rec.blastFurnace.toUpperCase()) || null;

          const workerRes = await client.query(
            `INSERT INTO workers (gate_pass, wisa, name, designation, department, blast_furnace, site_id, plant_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (blast_furnace, wisa) DO UPDATE SET
               gate_pass = EXCLUDED.gate_pass,
               name = EXCLUDED.name,
               designation = EXCLUDED.designation,
               department = EXCLUDED.department,
               site_id = COALESCE(EXCLUDED.site_id, workers.site_id),
               plant_id = COALESCE(EXCLUDED.plant_id, workers.plant_id),
               updated_at = CURRENT_TIMESTAMP
             RETURNING id;`,
            [rec.gatePass, rec.wisa, rec.name, rec.designation, rec.department, rec.blastFurnace, siteId, plantId]
          );

          workerIdMap.set(key, workerRes.rows[0].id);
        }
      }

      // 7. Batch Insert Attendance Records
      let bf2Count = 0;
      let bf3Count = 0;
      let totalManDaysSum = 0;
      let totalOTHoursSum = 0;

      for (const rec of records) {
        const workerKey = plantCode === 'PLANT_B'
          ? `KORBA:${rec.employeeId.toUpperCase()}`
          : `${rec.blastFurnace.toUpperCase()}:${rec.wisa.toUpperCase()}`;
        const workerId = workerIdMap.get(workerKey);

        if (rec.blastFurnace.toUpperCase() === 'BF-2') bf2Count++;
        if (rec.blastFurnace.toUpperCase() === 'BF-3') bf3Count++;

        totalManDaysSum += (rec.md || rec.manDay || 0);
        totalOTHoursSum += (rec.otHours || 0);

        await client.query(
          `INSERT INTO attendance_records (
            worker_id, import_id, attendance_date, day_name, is_sunday,
            day_in, day_out, night_in, night_out, shift_type,
            weekday_man_day, night_man_day, sunday_hours, sunday_ratio, man_day,
            md, ot_hours, attendance_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
            night_man_day = EXCLUDED.night_man_day,
            sunday_hours = EXCLUDED.sunday_hours,
            sunday_ratio = EXCLUDED.sunday_ratio,
            man_day = EXCLUDED.man_day,
            md = EXCLUDED.md,
            ot_hours = EXCLUDED.ot_hours,
            attendance_type = EXCLUDED.attendance_type,
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
            rec.weekdayManDay || 0,
            rec.nightManDay || 0,
            rec.sundayHours || 0,
            rec.sundayRatio || 0,
            rec.manDay || rec.md || 0,
            rec.md || 0,
            rec.otHours || 0,
            rec.attendanceType || (plantCode === 'PLANT_B' ? 'MD_OT_BASED' : 'PUNCH_BASED'),
          ]
        );
      }

      // 8. Generate & Upsert Monthly Worker Summaries
      await client.query(
        `INSERT INTO monthly_worker_summaries (
          worker_id, month, year, blast_furnace, site_id, plant_id,
          working_days, present_days, sunday_working_days,
          weekday_man_days, night_man_days, sunday_hours, sunday_ratio, total_man_days, total_ot_hours, night_shifts
        )
        SELECT
          ar.worker_id,
          EXTRACT(MONTH FROM ar.attendance_date)::INT as month,
          EXTRACT(YEAR FROM ar.attendance_date)::INT as year,
          COALESCE(w.blast_furnace, 'KORBA-MAIN') as blast_furnace,
          w.site_id,
          w.plant_id,
          COUNT(DISTINCT ar.attendance_date) as working_days,
          COUNT(DISTINCT CASE WHEN (ar.attendance_type = 'MD_OT_BASED' AND ar.md > 0) OR (ar.attendance_type != 'MD_OT_BASED' AND ar.is_sunday = FALSE) THEN ar.attendance_date END) as present_days,
          COUNT(DISTINCT CASE WHEN ar.is_sunday = TRUE AND ((ar.attendance_type = 'MD_OT_BASED' AND (ar.md > 0 OR ar.ot_hours > 0)) OR ar.attendance_type != 'MD_OT_BASED') THEN ar.attendance_date END) as sunday_working_days,
          ROUND(SUM(ar.weekday_man_day)::numeric, 2) as weekday_man_days,
          ROUND(SUM(ar.night_man_day)::numeric, 2) as night_man_days,
          ROUND(SUM(ar.sunday_hours)::numeric, 2) as sunday_hours,
          ROUND(SUM(ar.sunday_ratio)::numeric, 2) as sunday_ratio,
          ROUND(SUM(COALESCE(ar.md, ar.man_day, 0))::numeric, 2) as total_man_days,
          ROUND(SUM(COALESCE(ar.ot_hours, 0))::numeric, 2) as total_ot_hours,
          COUNT(CASE WHEN ar.shift_type = 'NIGHT' OR (ar.night_in IS NOT NULL AND ar.night_in != '') THEN 1 END) as night_shifts
        FROM attendance_records ar
        JOIN workers w ON ar.worker_id = w.id
        WHERE ar.import_id = $1
        GROUP BY ar.worker_id, EXTRACT(MONTH FROM ar.attendance_date), EXTRACT(YEAR FROM ar.attendance_date), w.blast_furnace, w.site_id, w.plant_id
        ON CONFLICT (worker_id, month, year, blast_furnace) DO UPDATE SET
          site_id = EXCLUDED.site_id,
          plant_id = EXCLUDED.plant_id,
          working_days = EXCLUDED.working_days,
          present_days = EXCLUDED.present_days,
          sunday_working_days = EXCLUDED.sunday_working_days,
          weekday_man_days = EXCLUDED.weekday_man_days,
          night_man_days = EXCLUDED.night_man_days,
          sunday_hours = EXCLUDED.sunday_hours,
          sunday_ratio = EXCLUDED.sunday_ratio,
          total_man_days = EXCLUDED.total_man_days,
          total_ot_hours = EXCLUDED.total_ot_hours,
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
        message: `Attendance data for ${month}/${year} (${plantCode}) imported successfully into PostgreSQL database.`,
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
          totalManDays: parseFloat(totalManDaysSum.toFixed(2)),
          totalOTHours: parseFloat(totalOTHoursSum.toFixed(2)),
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
   * Fetch past import history logs with optional filters.
   */
  async getImportHistory(filters = {}) {
    const { plantCode, year, month, status } = filters;
    const conditions = [];
    const params = [];

    if (plantCode && plantCode !== 'ALL') {
      params.push(plantCode);
      conditions.push(`ai.plant_code = $${params.length}`);
    }

    if (year && year !== 'ALL') {
      params.push(parseInt(year, 10));
      conditions.push(`ai.year = $${params.length}`);
    }

    if (month && month !== 'ALL') {
      params.push(parseInt(month, 10));
      conditions.push(`ai.month = $${params.length}`);
    }

    if (status && status !== 'ALL') {
      params.push(status);
      conditions.push(`ai.status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        ai.*,
        p.name as plant_name,
        p.city as plant_city,
        p.state as plant_state
      FROM attendance_imports ai
      LEFT JOIN plants p ON p.code = ai.plant_code
      ${whereClause}
      ORDER BY ai.id DESC
    `;

    const res = await query(sql, params);
    return res.rows;
  },

  /**
   * Fetch detailed breakdown for a single import session by ID.
   */
  async getImportDetails(importId) {
    const importRes = await query(
      `SELECT ai.*, p.name as plant_name, p.city as plant_city, p.state as plant_state
       FROM attendance_imports ai
       LEFT JOIN plants p ON p.code = ai.plant_code
       WHERE ai.id = $1`,
      [importId]
    );

    if (importRes.rows.length === 0) {
      throw new Error(`Import record #${importId} not found.`);
    }

    const imp = importRes.rows[0];

    // Fetch related version history for the same plant, year, month
    const relatedRes = await query(
      `SELECT id, file_name, status, uploaded_at 
       FROM attendance_imports 
       WHERE plant_code = $1 AND year = $2 AND month = $3
       ORDER BY id DESC`,
      [imp.plant_code, imp.year, imp.month]
    );

    // Fetch unit breakdown
    const unitRes = await query(
      `SELECT 
        mws.blast_furnace as unit,
        COUNT(DISTINCT mws.worker_id) as worker_count,
        SUM(mws.working_days) as record_count,
        SUM(mws.total_man_days) as total_man_days,
        SUM(COALESCE(mws.total_ot_hours, 0)) as total_ot_hours
       FROM monthly_worker_summaries mws
       JOIN workers w ON mws.worker_id = w.id
       WHERE mws.year = $1 AND mws.month = $2 AND (w.plant_id = $3 OR mws.plant_id = $3)
       GROUP BY mws.blast_furnace`,
      [imp.year, imp.month, imp.plant_id]
    );

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
      errorMessage: imp.error_message,
      storedRecordsCount: parseInt(imp.total_record_count || 0, 10),
      workerProfilesCount: parseInt(imp.worker_count || 0, 10),
      uniqueWisaCount: parseInt(imp.worker_count || 0, 10),
      units: unitRes.rows.map((u) => ({
        unit: u.unit,
        workerCount: parseInt(u.worker_count, 10),
        recordCount: parseInt(u.record_count, 10),
        totalManDays: parseFloat(u.total_man_days || 0),
        totalOTHours: parseFloat(u.total_ot_hours || 0),
      })),
      relatedImports: relatedRes.rows.map((r) => ({
        importId: r.id,
        fileName: r.file_name,
        status: r.status,
        uploadedAt: r.uploaded_at,
      })),
    };
  },
};

export default importEngineService;
