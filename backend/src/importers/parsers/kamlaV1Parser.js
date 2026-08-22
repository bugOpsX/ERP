import XLSX from 'xlsx';
import BaseParser from './baseParser.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Clean column header names by removing newlines and redundant spaces.
 */
const sanitizeHeader = (header) => {
  if (typeof header !== 'string') return '';
  return header.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
};

/**
 * Helper to parse dates into ISO YYYY-MM-DD string and month/year info.
 */
const parseDateValue = (rawVal) => {
  if (rawVal === undefined || rawVal === null || rawVal === '') return null;

  let year, month, day;

  if (typeof rawVal === 'number') {
    // Excel serial date number
    const parsed = XLSX.SSF.parse_date_code(rawVal);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      year = parsed.y;
      month = parsed.m;
      day = parsed.d;
    }
  } else if (rawVal instanceof Date) {
    // Adjust timezone offset
    const d = new Date(rawVal.getTime() + (rawVal.getTimezoneOffset() + 330) * 60000);
    year = d.getUTCFullYear();
    month = d.getUTCMonth() + 1;
    day = d.getUTCDate();
  } else if (typeof rawVal === 'string') {
    const trimmed = rawVal.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.split('T')[0].split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(trimmed)) {
      const parts = trimmed.split(/[-/]/);
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        year = parsed.getUTCFullYear();
        month = parsed.getUTCMonth() + 1;
        day = parsed.getUTCDate();
      }
    }
  }

  if (!year || !month || !day) return null;

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dayOfWeek = dateObj.getUTCDay(); // 0 is Sunday
  const isSunday = dayOfWeek === 0;

  return {
    isoDate,
    year,
    month,
    day,
    isSunday,
    dayName: dateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
  };
};

/**
 * Parser implementation for Current Plant (Kamla Enterprises Plant A - BF-2 / BF-3 format).
 */
export class KamlaV1Parser extends BaseParser {
  constructor() {
    super({
      name: 'KamlaV1Parser',
      formatCode: 'KAMLA_V1',
    });
    this.expectedSheets = ['BF-2', 'BF-3'];
  }

  /**
   * Validate workbook readable structure, expected sheets, and column headers.
   */
  validate(workbook) {
    const errors = [];

    if (!workbook || !workbook.SheetNames || !Array.isArray(workbook.SheetNames)) {
      return {
        valid: false,
        errors: [{ code: 'INVALID_WORKBOOK', message: 'Excel file is corrupted or unreadable.' }],
      };
    }

    // Check sheet existence
    const availableSheets = workbook.SheetNames;
    const foundExpectedSheets = this.expectedSheets.filter((sheetName) =>
      availableSheets.includes(sheetName)
    );

    if (foundExpectedSheets.length === 0) {
      errors.push({
        code: 'MISSING_PLANT_SHEETS',
        message: `Workbook does not contain expected plant unit sheets (${this.expectedSheets.join(', ')}). Found sheets: ${availableSheets.join(', ')}`,
      });
      return { valid: false, errors };
    }

    // Validate headers in at least one expected sheet
    for (const sheetName of foundExpectedSheets) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!rows || rows.length === 0) {
        errors.push({
          code: 'EMPTY_SHEET',
          message: `Sheet "${sheetName}" is empty.`,
        });
        continue;
      }

      const headers = (rows[0] || []).map(sanitizeHeader);
      const requiredKeywords = ['wisa', 'date', 'name'];
      const missingKeywords = requiredKeywords.filter(
        (kw) => !headers.some((h) => h.includes(kw))
      );

      if (missingKeywords.length > 0) {
        errors.push({
          code: 'MISSING_COLUMNS',
          message: `Sheet "${sheetName}" is missing required attendance columns: ${missingKeywords.join(', ')}.`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Inspect workbook record counts, sheets, detected month and year.
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

    const sheetsMetadata = [];
    const monthsDetected = new Set();
    const yearsDetected = new Set();
    const datesDetected = [];
    let totalRecords = 0;
    const uniqueWisashSet = new Set();

    this.expectedSheets.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;

      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      let sheetRecordCount = 0;

      rawRows.forEach((row) => {
        const wisaKey = Object.keys(row).find((k) => sanitizeHeader(k).includes('wisa'));
        const dateKey = Object.keys(row).find((k) => sanitizeHeader(k).includes('date'));

        const wisaVal = wisaKey ? String(row[wisaKey]).trim() : '';
        const dateVal = dateKey ? row[dateKey] : '';

        if (wisaVal) {
          sheetRecordCount++;
          uniqueWisashSet.add(wisaVal);

          const parsedDate = parseDateValue(dateVal);
          if (parsedDate) {
            monthsDetected.add(parsedDate.month);
            yearsDetected.add(parsedDate.year);
            datesDetected.push(parsedDate.isoDate);
          }
        }
      });

      totalRecords += sheetRecordCount;
      sheetsMetadata.push({
        name: sheetName,
        recordCount: sheetRecordCount,
      });
    });

    let detectedMonth = null;
    let detectedYear = null;
    let periodString = 'Unknown';
    const warnings = [];
    const errors = [];

    const monthList = Array.from(monthsDetected);
    const yearList = Array.from(yearsDetected);

    if (monthList.length === 1 && yearList.length === 1) {
      detectedMonth = monthList[0];
      detectedYear = yearList[0];
      const monthName = MONTH_NAMES[detectedMonth - 1] || `Month ${detectedMonth}`;
      periodString = `${monthName} ${detectedYear}`;
    } else if (monthList.length > 1) {
      errors.push({
        code: 'MULTIPLE_MONTHS_DETECTED',
        message: `Multiple attendance months detected (${monthList.map(m => MONTH_NAMES[m-1]).join(', ')}). Please ensure single-month attendance files.`,
      });
    }

    datesDetected.sort();
    const minDate = datesDetected.length > 0 ? datesDetected[0] : null;
    const maxDate = datesDetected.length > 0 ? datesDetected[datesDetected.length - 1] : null;

    const isValid = errors.length === 0;

    return {
      valid: isValid,
      fileName,
      format: {
        code: this.formatCode,
        name: 'Kamla Plant Excel V1 Format',
      },
      workbook: {
        fileName,
        month: detectedMonth ? MONTH_NAMES[detectedMonth - 1] : null,
        monthNumber: detectedMonth,
        year: detectedYear,
        period: periodString,
        dateRange: minDate && maxDate ? `${minDate} to ${maxDate}` : 'N/A',
        minDate,
        maxDate,
        sheets: sheetsMetadata,
        totalRecords,
        uniqueWorkersCount: uniqueWisashSet.size,
      },
      warnings,
      errors,
    };
  }

  /**
   * Parse full workbook into consolidated normalized attendance data structure.
   */
  parse(workbook) {
    const inspection = this.inspect(workbook);
    if (!inspection.valid) {
      throw new Error(`Workbook inspection failed: ${JSON.stringify(inspection.errors)}`);
    }

    const recordsMap = new Map();

    this.expectedSheets.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;

      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      rawRows.forEach((row) => {
        const wisaKey = Object.keys(row).find((k) => sanitizeHeader(k).includes('wisa'));
        const dateKey = Object.keys(row).find((k) => sanitizeHeader(k).includes('date'));
        const nameKey = Object.keys(row).find((k) => sanitizeHeader(k) === 'name');
        const desgKey = Object.keys(row).find((k) => sanitizeHeader(k).includes('designation') || sanitizeHeader(k) === 'desg');
        const deptKey = Object.keys(row).find((k) => sanitizeHeader(k) === 'dept' || sanitizeHeader(k).includes('department'));
        const gatePassKey = Object.keys(row).find((k) => sanitizeHeader(k).includes('scrum') || sanitizeHeader(k).includes('gate pass') || sanitizeHeader(k).includes('aadhar'));
        const manDaysKey = Object.keys(row).find((k) => sanitizeHeader(k).includes('man days'));
        const manHrsKey = Object.keys(row).find((k) => sanitizeHeader(k).includes('man hrs') || sanitizeHeader(k).includes('man hours'));
        const inTimeKey = Object.keys(row).find((k) => sanitizeHeader(k).includes('actual in') || sanitizeHeader(k) === 'in time');
        const outTimeKey = Object.keys(row).find((k) => sanitizeHeader(k).includes('actual out') || sanitizeHeader(k) === 'out time');

        const wisa = wisaKey ? String(row[wisaKey]).trim() : '';
        if (!wisa) return;

        const dateObj = parseDateValue(row[dateKey]);
        if (!dateObj) return;

        const manDays = parseFloat(row[manDaysKey] || 0) || 0;
        const manHrs = parseFloat(row[manHrsKey] || 0) || 0;

        const rawIn = inTimeKey ? String(row[inTimeKey]).trim() : '';
        const rawOut = outTimeKey ? String(row[outTimeKey]).trim() : '';

        // Detect 12h/24h night shift (InTime between 20:00 and 06:00)
        let isNightShift = false;
        if (rawIn) {
          const match = rawIn.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
          if (match) {
            let hr = parseInt(match[1], 10);
            const ampm = match[3] ? match[3].toUpperCase() : null;
            if (ampm === 'PM' && hr < 12) hr += 12;
            if (ampm === 'AM' && hr === 12) hr = 0;
            if (hr >= 20 || hr < 6) isNightShift = true;
          }
        }

        const key = `${sheetName.toUpperCase()}:${wisa.toUpperCase()}:${dateObj.isoDate}`;

        if (!recordsMap.has(key)) {
          const isSunday = dateObj.isSunday;
          const sundayHours = isSunday ? (isNightShift ? 0 : manHrs) : 0;
          const sundayRatio = isSunday ? (isNightShift ? 0 : parseFloat((manHrs / 5).toFixed(2))) : 0;
          const weekdayManDay = isSunday ? 0 : (isNightShift ? 0 : manDays);
          const nightManDay = isNightShift ? parseFloat((manHrs / 6).toFixed(3)) : 0;

          recordsMap.set(key, {
            blastFurnace: sheetName,
            wisa,
            gatePass: gatePassKey ? String(row[gatePassKey]).trim() : '',
            name: nameKey ? String(row[nameKey]).trim() : '',
            designation: desgKey ? String(row[desgKey]).trim() : '',
            department: deptKey ? String(row[deptKey]).trim() : '',
            attendanceDate: dateObj.isoDate,
            dayName: dateObj.dayName,
            isSunday,
            dayIn: isNightShift ? '' : rawIn,
            dayOut: isNightShift ? '' : rawOut,
            nightIn: isNightShift ? rawIn : '',
            nightOut: isNightShift ? rawOut : '',
            shiftType: isNightShift ? 'NIGHT' : (isSunday ? 'SUNDAY' : 'DAY'),
            weekdayManDay,
            nightManDay,
            sundayHours,
            sundayRatio,
            manDay: isSunday ? sundayRatio : weekdayManDay,
          });
        } else {
          const existing = recordsMap.get(key);
          if (isNightShift) {
            existing.nightIn = rawIn || existing.nightIn;
            existing.nightOut = rawOut || existing.nightOut;
            const shiftNightManDay = parseFloat((manHrs / 6).toFixed(3));
            existing.nightManDay = parseFloat((existing.nightManDay + shiftNightManDay).toFixed(3));
          } else {
            existing.dayIn = rawIn || existing.dayIn;
            existing.dayOut = rawOut || existing.dayOut;
            if (!dateObj.isSunday) {
              existing.weekdayManDay = parseFloat((existing.weekdayManDay + manDays).toFixed(3));
            }
          }

          if ((existing.dayIn || existing.dayOut) && (existing.nightIn || existing.nightOut)) {
            existing.shiftType = 'Day + Night';
          } else if (isNightShift) {
            existing.shiftType = 'NIGHT';
          }

          if (dateObj.isSunday) {
            if (!isNightShift) {
              existing.sundayHours = parseFloat((existing.sundayHours + manHrs).toFixed(2));
              existing.sundayRatio = parseFloat((existing.sundayHours / 5).toFixed(2));
            }
            existing.manDay = existing.sundayRatio;
          } else {
            existing.manDay = existing.weekdayManDay;
          }
        }
      });
    });

    const normalizedRecords = Array.from(recordsMap.values());

    return {
      success: true,
      formatCode: this.formatCode,
      inspection,
      recordsCount: normalizedRecords.length,
      records: normalizedRecords,
    };
  }
}

export default KamlaV1Parser;
