import XLSX from 'xlsx';
import BaseParser from './baseParser.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Helper to sanitize string values
 */
const sanitizeHeader = (header) => {
  if (typeof header !== 'string') return '';
  return header.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
};

/**
 * Helper to parse Excel serial date number into Date info
 */
const parseExcelDateCode = (rawVal) => {
  if (typeof rawVal === 'number') {
    const parsed = XLSX.SSF.parse_date_code(rawVal);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return { year: parsed.y, month: parsed.m, day: parsed.d };
    }
  } else if (typeof rawVal === 'string') {
    const parsed = new Date(rawVal);
    if (!isNaN(parsed.getTime())) {
      return {
        year: parsed.getUTCFullYear(),
        month: parsed.getUTCMonth() + 1,
        day: parsed.getUTCDate(),
      };
    }
  }
  return null;
};

/**
 * Parser for Korba Plant (PLANT_B) Attendance (Muster Roll & Wage Register format).
 * Extracts Worker Master identity and daily MD/OT records while excluding wage columns from UI/PDFs.
 */
export class KorbaV1Parser extends BaseParser {
  constructor() {
    super({
      name: 'KorbaV1Parser',
      formatCode: 'KORBA_V1',
    });
  }

  /**
   * Locates the primary Muster Roll sheet in workbook.
   */
  findPrimarySheet(workbook) {
    if (!workbook || !workbook.SheetNames || !Array.isArray(workbook.SheetNames)) return null;

    const sheetName = workbook.SheetNames.find((name) => {
      const lower = name.toLowerCase();
      return lower.includes('muster roll') || lower.includes('wage register') || lower.includes('korba');
    });

    return sheetName || workbook.SheetNames[0];
  }

  /**
   * Validates workbook structure, presence of required worker identity and daily MD/OT columns.
   */
  validate(workbook) {
    const errors = [];

    if (!workbook || !workbook.SheetNames || !Array.isArray(workbook.SheetNames)) {
      return {
        valid: false,
        errors: [{ code: 'INVALID_WORKBOOK', message: 'Excel file is corrupted or unreadable.' }],
      };
    }

    const sheetName = this.findPrimarySheet(workbook);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return {
        valid: false,
        errors: [{ code: 'MISSING_KORBA_SHEET', message: 'Muster Roll worksheet not found in Korba file.' }],
      };
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows || rows.length < 2) {
      return {
        valid: false,
        errors: [{ code: 'EMPTY_SHEET', message: `Sheet "${sheetName}" does not contain header rows.` }],
      };
    }

    const headerRow1 = (rows[1] || []).map(sanitizeHeader);

    // Required Identity Headers
    const empIdIdx = headerRow1.findIndex((h) => h.includes('employee id') || h.includes('emp id'));
    const empNameIdx = headerRow1.findIndex((h) => h.includes('employee name') || h.includes('emp name'));

    if (empIdIdx === -1 || empNameIdx === -1) {
      errors.push({
        code: 'MISSING_WORKER_COLUMNS',
        message: `This workbook does not match the Korba attendance format. Required Worker Identity columns (Employee ID, Employee Name) are missing in sheet "${sheetName}".`,
      });
    }

    // Daily Attendance MD & OT Columns Validation
    let mdCount = 0;
    let otCount = 0;

    headerRow1.forEach((h) => {
      if (h === 'md') mdCount++;
      if (h === 'ot') otCount++;
    });

    if (mdCount < 28 || otCount < 28) {
      errors.push({
        code: 'MISSING_DAILY_COLUMNS',
        message: `This workbook does not match the Korba attendance format. Daily MD (${mdCount}) or OT (${otCount}) columns are incomplete. Expected at least 28-31 daily attendance columns.`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Inspects workbook details, period detection, and worker count without wage totals.
   */
  inspect(workbook, fileName = '') {
    const validation = this.validate(workbook);
    if (!validation.valid) {
      return {
        valid: false,
        fileName,
        errors: validation.errors,
      };
    }

    const sheetName = this.findPrimarySheet(workbook);
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const headerRow0 = rows[0] || [];
    const headerRow1 = rows[1] || [];

    // Period Detection from Header Row 0 (Excel Serial Dates) or Sheet Name
    let detectedMonth = null;
    let detectedYear = null;
    const datesDetected = [];

    // Search for serial dates in Header Row 0 up to daily columns (col 8 to col 68)
    for (let c = 8; c < Math.min(70, headerRow0.length); c++) {
      const cellVal = headerRow0[c];
      const parsed = parseExcelDateCode(cellVal);
      if (parsed) {
        if (!detectedMonth) detectedMonth = parsed.month;
        if (!detectedYear) detectedYear = parsed.year;

        const isoDate = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
        datesDetected.push(isoDate);
      }
    }

    // Fallback period detection from sheet name if date codes not present
    if (!detectedMonth || !detectedYear) {
      const match = sheetName.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
      if (match) {
        const monthStr = match[1].toLowerCase();
        const monthIndex = MONTH_NAMES.findIndex((m) => m.toLowerCase().startsWith(monthStr));
        if (monthIndex !== -1) {
          detectedMonth = monthIndex + 1;
        }
      }
      const yearMatch = sheetName.match(/(20\d{2})/);
      detectedYear = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
    }

    datesDetected.sort();
    const minDate = datesDetected.length > 0 ? datesDetected[0] : null;
    const maxDate = datesDetected.length > 0 ? datesDetected[datesDetected.length - 1] : null;

    const monthName = detectedMonth ? (MONTH_NAMES[detectedMonth - 1] || `Month ${detectedMonth}`) : 'Unknown';
    const periodString = detectedYear ? `${monthName} ${detectedYear}` : 'Unknown';

    // Locate daily MD and OT column indices
    const mdOtColPairs = [];
    let currentColIndex = 8;
    while (currentColIndex < headerRow1.length && mdOtColPairs.length < 31) {
      const h1 = sanitizeHeader(headerRow1[currentColIndex]);
      const h2 = sanitizeHeader(headerRow1[currentColIndex + 1]);
      if (h1 === 'md' && h2 === 'ot') {
        mdOtColPairs.push({ mdCol: currentColIndex, otCol: currentColIndex + 1 });
        currentColIndex += 2;
      } else {
        currentColIndex++;
      }
    }

    // Count valid workers & sum MD / OT totals (excluding Grand Total row)
    let workerCount = 0;
    let grandTotalFound = false;
    let totalManDays = 0;
    let totalOTHours = 0;

    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const empId = String(row[1] || '').trim();
      const empName = String(row[3] || '').trim();

      if (empId.toLowerCase().includes('grand total') || empName.toLowerCase().includes('grand total')) {
        grandTotalFound = true;
        continue;
      }

      if (empId && empName) {
        workerCount++;
        mdOtColPairs.forEach((pair) => {
          const mdVal = parseFloat(row[pair.mdCol]);
          const otVal = parseFloat(row[pair.otCol]);
          if (!isNaN(mdVal)) totalManDays += mdVal;
          if (!isNaN(otVal)) totalOTHours += otVal;
        });
      }
    }

    const totalRecords = workerCount * (mdOtColPairs.length || 31);

    return {
      valid: true,
      fileName,
      format: {
        code: this.formatCode,
        name: 'Korba Wage Sheet V1 Format (MD + OT Attendance)',
      },
      workbook: {
        fileName,
        sheetName,
        month: monthName,
        monthNumber: detectedMonth,
        year: detectedYear,
        period: periodString,
        dateRange: minDate && maxDate ? `${minDate} to ${maxDate}` : `${periodString}`,
        minDate,
        maxDate,
        workerCount,
        uniqueWorkersCount: workerCount,
        totalRecords,
        totalManDays: parseFloat(totalManDays.toFixed(2)),
        totalOTHours: parseFloat(totalOTHours.toFixed(2)),
        grandTotalExcluded: grandTotalFound,
        dailyAttendanceColumns: mdOtColPairs.length || 31,
        mdAvailability: true,
        otAvailability: true,
        attendanceType: 'MD_OT_BASED',
        supportedUnits: ['KORBA-MAIN'],
      },
      warnings: [],
      errors: [],
    };
  }

  /**
   * Parses full Korba workbook into normalized attendance data structure.
   */
  parse(workbook) {
    const inspection = this.inspect(workbook);
    if (!inspection.valid) {
      throw new Error(`Workbook inspection failed: ${JSON.stringify(inspection.errors)}`);
    }

    const sheetName = this.findPrimarySheet(workbook);
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const headerRow0 = rows[0] || [];
    const headerRow1 = rows[1] || [];

    const monthNumber = inspection.workbook.monthNumber || 7;
    const yearNumber = inspection.workbook.year || 2026;

    // Identify daily MD and OT column indices (stop at total summary column 70 or when max days reached)
    const dailyCols = [];
    const maxDaysInMonth = new Date(yearNumber, monthNumber, 0).getDate();

    let currentColIndex = 8;
    while (currentColIndex < headerRow1.length && dailyCols.length < maxDaysInMonth) {
      const h1 = sanitizeHeader(headerRow1[currentColIndex]);
      const h2 = sanitizeHeader(headerRow1[currentColIndex + 1]);

      if (h1 === 'md' && h2 === 'ot') {
        const dateCodeVal = headerRow0[currentColIndex];
        let dayNum = dailyCols.length + 1;
        let isoDate = null;

        const parsedDate = parseExcelDateCode(dateCodeVal);
        if (parsedDate && parsedDate.month === monthNumber) {
          dayNum = parsedDate.day;
          isoDate = `${parsedDate.year}-${String(parsedDate.month).padStart(2, '0')}-${String(parsedDate.day).padStart(2, '0')}`;
        } else {
          isoDate = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        }

        const dateObj = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNum));
        const isSunday = dateObj.getUTCDay() === 0;
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();

        dailyCols.push({
          dayNum,
          isoDate,
          isSunday,
          dayName,
          mdCol: currentColIndex,
          otCol: currentColIndex + 1,
        });

        currentColIndex += 2;
      } else {
        currentColIndex++;
      }
    }

    const workers = [];
    const records = [];

    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const empId = String(row[1] || '').trim();
      const empName = String(row[3] || '').trim();

      // Explicitly exclude Grand Total row
      if (empId.toLowerCase().includes('grand total') || empName.toLowerCase().includes('grand total')) {
        continue;
      }

      if (!empId || !empName) continue;

      const workerIdentity = {
        plantCode: 'PLANT_B',
        blastFurnace: 'KORBA-MAIN',
        employeeId: empId,
        aadhaarNo: String(row[2] || '').trim(),
        name: empName,
        subContractorName: String(row[4] || '').trim(),
        designation: String(row[5] || '').trim(),
        category: String(row[6] || '').trim(),
        rate: parseFloat(row[7]) || 0, // Preserved internally for future payroll module
      };

      let presentDays = 0;
      let totalManDays = 0;
      let totalOTHours = 0;
      let sundayWorkingDays = 0;
      const workerRecords = [];

      dailyCols.forEach((col) => {
        const rawMD = row[col.mdCol];
        const rawOT = row[col.otCol];

        const mdVal = rawMD !== undefined && rawMD !== null && rawMD !== '' ? parseFloat(rawMD) : 0;
        const otVal = rawOT !== undefined && rawOT !== null && rawOT !== '' ? parseFloat(rawOT) : 0;

        const parsedMD = isNaN(mdVal) ? 0 : mdVal;
        const parsedOT = isNaN(otVal) ? 0 : otVal;

        if (parsedMD > 0) presentDays++;
        totalManDays += parsedMD;
        totalOTHours += parsedOT;

        if (col.isSunday && (parsedMD > 0 || parsedOT > 0)) {
          sundayWorkingDays++;
        }

        let shiftType = 'ABSENT';
        if (parsedOT > 0) {
          shiftType = 'OVERTIME';
        } else if (parsedMD > 0) {
          shiftType = col.isSunday ? 'SUNDAY' : 'DAY';
        }

        const record = {
          plantCode: 'PLANT_B',
          blastFurnace: 'KORBA-MAIN',
          attendanceType: 'MD_OT_BASED',
          employeeId: empId,
          aadhaarNo: workerIdentity.aadhaarNo,
          name: empName,
          designation: workerIdentity.designation,
          category: workerIdentity.category,
          attendanceDate: col.isoDate,
          dayName: col.dayName,
          isSunday: col.isSunday,
          md: parsedMD,
          otHours: parsedOT,
          dayIn: null,
          dayOut: null,
          nightIn: null,
          nightOut: null,
          shiftType,
          weekdayManDay: 0,
          nightManDay: 0,
          sundayHours: 0,
          sundayRatio: 0,
          manDay: parsedMD,
        };

        records.push(record);
        workerRecords.push(record);
      });

      const workerSummary = {
        ...workerIdentity,
        workingDays: dailyCols.length,
        presentDays,
        sundayWorkingDays,
        totalManDays: parseFloat(totalManDays.toFixed(2)),
        totalOTHours: parseFloat(totalOTHours.toFixed(2)),
        attendance: workerRecords,
      };

      workers.push(workerSummary);
    }

    return {
      success: true,
      formatCode: this.formatCode,
      inspection,
      recordsCount: records.length,
      workersCount: workers.length,
      records,
      workers,
    };
  }
}

export default KorbaV1Parser;
