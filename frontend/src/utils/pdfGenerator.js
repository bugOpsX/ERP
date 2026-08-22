import { jsPDF } from 'jspdf';

/**
 * Sanitizes string for safe filename usage.
 */
const sanitizeFilename = (str) =>
  String(str || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');

/**
 * Cached Base64 logo data string
 */
let cachedLogoBase64 = null;

const getLogoBase64 = async () => {
  if (cachedLogoBase64) return cachedLogoBase64;
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 200;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        cachedLogoBase64 = canvas.toDataURL('image/png');
        resolve(cachedLogoBase64);
      } catch (err) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = '/logo.png';
  });
};

/**
 * Helper to convert Hex color strings (e.g. #0f172a or #ffffff) to RGB array [r, g, b]
 */
const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string') return [0, 0, 0];
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

/**
 * Core vector PDF renderer for an individual worker attendance card.
 * Renders selectable text, vector shapes, colors, and embedded logo.
 * Handles automatic pagination overflow for multi-page attendance tables.
 *
 * @param {jsPDF} doc - jsPDF instance (A5 portrait)
 * @param {Object} worker - Worker object containing attendance & payroll data
 * @param {String|null} logoBase64 - Base64 string of company logo
 * @param {Boolean} isFirstPage - Whether this call is for the first page in the document
 */
const renderWorkerCardToPDF = (doc, worker, logoBase64 = null, isFirstPage = true) => {
  if (!isFirstPage) {
    doc.addPage('a5', 'portrait');
  }

  const pageWidth = doc.internal.pageSize.getWidth(); // 148 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm

  const marginX = 8;
  const usableWidth = pageWidth - marginX * 2; // 132 mm

  // Worker Data Extraction
  const records = Array.isArray(worker.Attendance) ? worker.Attendance : [];

  const plantCode = worker.PlantCode || worker.plantCode;
  const isKorba =
    plantCode === 'PLANT_B' ||
    worker.AttendanceType === 'MD_OT_BASED' ||
    (records.length > 0 && records[0].AttendanceType === 'MD_OT_BASED');

  const gatePass = worker.GatePass || worker.gatePass || worker.WISA || '—';
  const wisa = worker.WISA || worker.wisa || '—';
  const blastFurnace = worker.BlastFurnace || worker.blastFurnace || '—';
  const department = worker.Department || worker.department || '—';
  const designation = worker.Designation || worker.designation || '—';
  const name = worker.Name || worker.name || 'Unnamed Worker';

  const workingDays = worker.WorkingDays ?? worker.workingDays ?? records.length;
  const presentDays = worker.PresentDays ?? worker.presentDays ?? 0;
  const sundayWorked = worker.SundayWorkingDays ?? worker.sundayWorkingDays ?? 0;
  const nightShifts = worker.NightShifts ?? worker.nightShifts ?? 0;

  const rawOT = worker.TotalOTHours ?? worker.totalOTHours ?? records.reduce((sum, r) => sum + parseFloat(r.OTHours ?? r.ot_hours ?? 0), 0);
  const totalOTHours = (typeof rawOT === 'number' ? rawOT : parseFloat(rawOT || 0)).toFixed(2);

  const weekdayManDays = worker.WeekdayManDays != null
    ? (typeof worker.WeekdayManDays === 'number' ? worker.WeekdayManDays.toFixed(2) : worker.WeekdayManDays)
    : (worker.weekdayManDays != null ? (typeof worker.weekdayManDays === 'number' ? worker.weekdayManDays.toFixed(2) : worker.weekdayManDays) : '0.00');

  const nightManDays = worker.NightManDays != null
    ? (typeof worker.NightManDays === 'number' ? worker.NightManDays.toFixed(2) : worker.NightManDays)
    : (worker.nightManDays != null ? (typeof worker.nightManDays === 'number' ? worker.nightManDays.toFixed(2) : worker.nightManDays) : '0.00');

  const sundayHours = worker.SundayHours != null
    ? (typeof worker.SundayHours === 'number' ? worker.SundayHours.toFixed(2) : worker.SundayHours)
    : (worker.sundayHours != null ? (typeof worker.sundayHours === 'number' ? worker.sundayHours.toFixed(2) : worker.sundayHours) : '0.00');

  const sundayRatio = worker.SundayRatio != null
    ? (typeof worker.SundayRatio === 'number' ? worker.SundayRatio.toFixed(2) : worker.SundayRatio)
    : (worker.sundayRatio != null ? (typeof worker.sundayRatio === 'number' ? worker.sundayRatio.toFixed(2) : worker.sundayRatio) : '0.00');

  const totalManDays = worker.TotalManDays != null
    ? (typeof worker.TotalManDays === 'number' ? worker.TotalManDays.toFixed(2) : worker.TotalManDays)
    : (worker.totalManDays != null ? (typeof worker.totalManDays === 'number' ? worker.totalManDays.toFixed(2) : worker.totalManDays) : '0.00');

  const timestamp = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  let currentPageNumber = 1;

  // Header Banner Drawer
  const drawHeaderBanner = (yPos) => {
    // Header Bar Background
    doc.setFillColor(...hexToRgb('#0f172a'));
    doc.roundedRect(marginX, yPos, usableWidth, 14, 2, 2, 'F');

    // Logo
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', marginX + 2, yPos + 1, 12, 12);
      } catch (err) {
        // Fallback gracefully if logo rendering fails
      }
    }

    // Title Text
    const titleX = logoBase64 ? marginX + 16 : marginX + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb('#ffffff'));
    doc.text('KAMLA ENTERPRISES', titleX, yPos + 5.5);

    // Subtitle Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb('#94a3b8'));
    doc.text(isKorba ? 'Korba Attendance System' : 'Labor Management System', titleX, yPos + 10.5);

    // Right Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb('#ec6a06'));
    doc.text('ATTENDANCE CARD', marginX + usableWidth - 4, yPos + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb('#cbd5e1'));
    doc.text(`Gate Pass: ${gatePass}`, marginX + usableWidth - 4, yPos + 10.5, { align: 'right' });

    // Accent line below header
    doc.setDrawColor(...hexToRgb('#ec6a06'));
    doc.setLineWidth(0.6);
    doc.line(marginX, yPos + 14, marginX + usableWidth, yPos + 14);
  };

  // Continuation Header Drawer for Page 2+
  const drawContinuationHeader = (yPos) => {
    doc.setFillColor(...hexToRgb('#0f172a'));
    doc.roundedRect(marginX, yPos, usableWidth, 8, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb('#ffffff'));
    doc.text(`KAMLA ENTERPRISES • ${String(name).toUpperCase()} (${gatePass})`, marginX + 3, yPos + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb('#ec6a06'));
    doc.text(`Page ${currentPageNumber}`, marginX + usableWidth - 3, yPos + 5.5, { align: 'right' });
  };

  // Footer Drawer
  const drawFooter = () => {
    const footerY = pageHeight - 8;
    doc.setDrawColor(...hexToRgb('#e2e8f0'));
    doc.setLineWidth(0.2);
    doc.line(marginX, footerY - 2, marginX + usableWidth, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...hexToRgb('#64748b'));
    doc.text('Official Verification • Kamla Enterprises', marginX, footerY + 1.5);
    doc.text(`Generated: ${timestamp}`, marginX + usableWidth, footerY + 1.5, { align: 'right' });
  };

  // 1. Header (Y = 8 to 22)
  let currentY = 8;
  drawHeaderBanner(currentY);
  currentY += 16; // Y = 24

  // 2. Worker Identity Box (Y = 24 to 44)
  const workerBoxHeight = 20;
  doc.setFillColor(...hexToRgb('#f8fafc'));
  doc.setDrawColor(...hexToRgb('#e2e8f0'));
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, usableWidth, workerBoxHeight, 2, 2, 'DF');

  // Worker Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb('#0f172a'));
  doc.text(String(name).toUpperCase(), marginX + 3, currentY + 5);

  // Designation & Department
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...hexToRgb('#475569'));
  doc.text(`${designation} • ${department}`, marginX + 3, currentY + 9.5);

  // Unit Badge
  if (blastFurnace && blastFurnace !== '—') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...hexToRgb('#c2410c'));
    doc.text(`Unit: ${blastFurnace}`, marginX + usableWidth - 3, currentY + 5, { align: 'right' });
  }

  // Divider Line inside Worker Box
  doc.setDrawColor(...hexToRgb('#e2e8f0'));
  doc.setLineWidth(0.2);
  doc.line(marginX + 3, currentY + 11.5, marginX + usableWidth - 3, currentY + 11.5);

  // Grid Info (5 Columns)
  const colWidth = usableWidth / 5;
  const infoCols = [
    { label: 'GATE PASS', val: gatePass, color: '#0f172a' },
    { label: 'WISA / EMP ID', val: wisa, color: '#ea580c' },
    { label: 'DEPARTMENT', val: department, color: '#334155' },
    { label: 'DESIGNATION', val: designation, color: '#334155' },
    { label: 'UNIT / PLANT', val: blastFurnace, color: '#0f172a' },
  ];

  infoCols.forEach((col, idx) => {
    const colX = marginX + idx * colWidth + 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...hexToRgb('#64748b'));
    doc.text(col.label, colX, currentY + 14.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(col.color));
    const truncatedVal = String(col.val).length > 15 ? String(col.val).substring(0, 14) + '…' : String(col.val);
    doc.text(truncatedVal, colX, currentY + 18);
  });

  currentY += workerBoxHeight + 2; // Y = 46

  // 3. Top Operational Telemetry Summary (4 Cards across 132mm) -> Y = 46 to 55.5
  const telemetryHeight = 9.5;
  const cardWidth4 = (usableWidth - 6) / 4;
  const telemetryCards = isKorba
    ? [
        { label: 'WORKING DAYS', val: String(workingDays), color: '#0f172a' },
        { label: 'ATTENDANCE DAYS', val: String(presentDays), color: '#16a34a' },
        { label: 'TOTAL MAN DAYS', val: String(totalManDays), color: '#ea580c' },
        { label: 'TOTAL OT HOURS', val: `${totalOTHours} hrs`, color: '#d97706' },
      ]
    : [
        { label: 'WORKING DAYS', val: String(workingDays), color: '#0f172a' },
        { label: 'PRESENT DAYS', val: String(presentDays), color: '#16a34a' },
        { label: 'SUNDAY WORKED', val: String(sundayWorked), color: '#ea580c' },
        { label: 'NIGHT SHIFTS', val: String(nightShifts), color: '#d97706' },
      ];

  telemetryCards.forEach((c, i) => {
    const cx = marginX + i * (cardWidth4 + 2);
    doc.setFillColor(...hexToRgb('#ffffff'));
    doc.setDrawColor(...hexToRgb('#e2e8f0'));
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, currentY, cardWidth4, telemetryHeight, 1.5, 1.5, 'DF');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...hexToRgb(c.color));
    doc.text(c.label, cx + cardWidth4 / 2, currentY + 3.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...hexToRgb(c.color));
    doc.text(c.val, cx + cardWidth4 / 2, currentY + 7.5, { align: 'center' });
  });

  currentY += telemetryHeight + 2; // Y = 57.5

  // 4. Payroll Summary Block -> Y = 57.5 to 73.5
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...hexToRgb('#0f172a'));
  doc.text('PAYROLL SUMMARY', marginX, currentY);
  currentY += 2; // Y = 59.5

  const payrollHeight = 12;
  const payrollCards = isKorba
    ? [
        { label: 'MAN DAYS (MD)', val: String(totalManDays), sub: 'Daily MD Sum', color: '#0f172a', bg: '#f8fafc', border: '#e2e8f0' },
        { label: 'OT HOURS', val: `${totalOTHours} hrs`, sub: 'Daily OT Sum', color: '#d97706', bg: '#f8fafc', border: '#e2e8f0' },
        { label: 'ATTENDANCE DAYS', val: String(presentDays), sub: 'Days Worked', color: '#16a34a', bg: '#f8fafc', border: '#e2e8f0' },
        { label: 'TOTAL MAN DAYS', val: String(totalManDays), sub: 'Final Payroll', color: '#c2410c', bg: '#fff7ed', border: '#ea580c', highlight: true },
      ]
    : [
        { label: 'WEEKDAY MAN DAYS', val: String(weekdayManDays), sub: '12 hr basis', color: '#0f172a', bg: '#f8fafc', border: '#e2e8f0' },
        { label: 'NIGHT MAN DAYS', val: String(nightManDays), sub: '6 hr basis', color: '#d97706', bg: '#f8fafc', border: '#e2e8f0' },
        { label: 'SUNDAY HOURS', val: `${sundayHours} hrs`, sub: 'Total hrs', color: '#0f172a', bg: '#f8fafc', border: '#e2e8f0' },
        { label: 'SUNDAY MAN DAYS', val: String(sundayRatio), sub: '5 hr basis', color: '#0f172a', bg: '#f8fafc', border: '#e2e8f0' },
        { label: 'TOTAL MAN DAYS', val: String(totalManDays), sub: 'Final Payroll', color: '#c2410c', bg: '#fff7ed', border: '#ea580c', highlight: true },
      ];

  const cardWidthPayroll = (usableWidth - (payrollCards.length - 1) * 2) / payrollCards.length;

  payrollCards.forEach((c, i) => {
    const cx = marginX + i * (cardWidthPayroll + 2);
    doc.setFillColor(...hexToRgb(c.bg));
    doc.setDrawColor(...hexToRgb(c.border));
    doc.setLineWidth(c.highlight ? 0.6 : 0.3);
    doc.roundedRect(cx, currentY, cardWidthPayroll, payrollHeight, 1.5, 1.5, 'DF');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    doc.setTextColor(...hexToRgb(c.color));
    doc.text(c.label, cx + cardWidthPayroll / 2, currentY + 3.2, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(c.color));
    doc.text(c.val, cx + cardWidthPayroll / 2, currentY + 7.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(...hexToRgb(c.highlight ? '#ea580c' : '#94a3b8'));
    doc.text(c.sub, cx + cardWidthPayroll / 2, currentY + 10.5, { align: 'center' });
  });

  currentY += payrollHeight + 3; // Y = 74.5

  // 5. Daily Attendance Table
  const cols = isKorba
    ? [
        { header: 'DATE', width: 33, align: 'left' },
        { header: 'DAY', width: 25, align: 'center' },
        { header: 'MD (MAN DAY)', width: 37, align: 'center' },
        { header: 'OT HOURS', width: 37, align: 'center' },
      ]
    : [
        { header: 'DATE', width: 22, align: 'left' },
        { header: 'DAY', width: 12, align: 'center' },
        { header: 'DAY IN', width: 16, align: 'center' },
        { header: 'DAY OUT', width: 16, align: 'center' },
        { header: 'NIGHT IN', width: 16, align: 'center' },
        { header: 'NIGHT OUT', width: 16, align: 'center' },
        { header: 'DAY MAN DAY', width: 17, align: 'center' },
        { header: 'NIGHT MAN DAY', width: 17, align: 'center' },
      ];

  const drawTableHeader = (yPos) => {
    const tableHeaderHeight = 5.5;
    doc.setFillColor(...hexToRgb('#1e293b'));
    doc.rect(marginX, yPos, usableWidth, tableHeaderHeight, 'F');

    let curX = marginX;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...hexToRgb('#ffffff'));

    cols.forEach((col) => {
      let textX = curX + 2;
      if (col.align === 'center') textX = curX + col.width / 2;
      else if (col.align === 'right') textX = curX + col.width - 2;

      doc.text(col.header, textX, yPos + 3.8, { align: col.align });
      curX += col.width;
    });

    return yPos + tableHeaderHeight;
  };

  currentY = drawTableHeader(currentY); // Y = 80

  const rowHeight = 3.8;
  const maxTableY = pageHeight - 12; // Stop before footer line at 201mm

  if (records.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb('#94a3b8'));
    doc.text('No attendance records found for this worker.', marginX + usableWidth / 2, currentY + 6, { align: 'center' });
  } else {
    records.forEach((r, i) => {
      // Automatic page break when overflow occurs
      if (currentY + rowHeight > maxTableY) {
        drawFooter();
        doc.addPage('a5', 'portrait');
        currentPageNumber++;

        let contY = 8;
        drawContinuationHeader(contY);
        contY += 10;
        currentY = drawTableHeader(contY);
      }

      const isSun = r.IsSunday === true || String(r.DayName || '').toUpperCase() === 'SUN' || String(r.DayName || '').toUpperCase() === 'SUNDAY';
      const dayDisplayName = (r.DayName || '').toUpperCase();
      const formattedDay = dayDisplayName.startsWith('SUN') ? 'SUN' : (dayDisplayName.slice(0, 3) || '—');

      // Row background color
      const bg = isSun ? '#fff7ed' : (i % 2 === 0 ? '#ffffff' : '#f8fafc');
      doc.setFillColor(...hexToRgb(bg));
      doc.rect(marginX, currentY, usableWidth, rowHeight, 'F');

      // Sunday left accent border line
      if (isSun) {
        doc.setDrawColor(...hexToRgb('#ea580c'));
        doc.setLineWidth(0.5);
        doc.line(marginX, currentY, marginX, currentY + rowHeight);
      }

      // Row Bottom Line
      doc.setDrawColor(...hexToRgb('#e2e8f0'));
      doc.setLineWidth(0.1);
      doc.line(marginX, currentY + rowHeight, marginX + usableWidth, currentY + rowHeight);

      // Render Columns Text
      let curX = marginX;

      if (isKorba) {
        const mdVal = (r.MD != null ? parseFloat(r.MD) : (r.ManDay != null ? parseFloat(r.ManDay) : 0)).toFixed(2);
        const otVal = (r.OTHours != null ? parseFloat(r.OTHours) : 0).toFixed(2);

        // 1. Date
        doc.setFont('courier', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...hexToRgb('#0f172a'));
        doc.text(String(r.Date || '—'), curX + 2, currentY + 2.7);
        curX += cols[0].width;

        // 2. Day Name
        doc.setFont('helvetica', isSun ? 'bold' : 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...hexToRgb(isSun ? '#c2410c' : '#475569'));
        doc.text(formattedDay, curX + cols[1].width / 2, currentY + 2.7, { align: 'center' });
        curX += cols[1].width;

        // 3. MD
        doc.setFont('courier', parseFloat(mdVal) > 0 ? 'bold' : 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...hexToRgb(parseFloat(mdVal) > 0 ? '#0f172a' : '#94a3b8'));
        doc.text(mdVal, curX + cols[2].width / 2, currentY + 2.7, { align: 'center' });
        curX += cols[2].width;

        // 4. OT Hours
        doc.setFont('courier', parseFloat(otVal) > 0 ? 'bold' : 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...hexToRgb(parseFloat(otVal) > 0 ? '#d97706' : '#94a3b8'));
        doc.text(otVal, curX + cols[3].width / 2, currentY + 2.7, { align: 'center' });
      } else {
        const dayManDayVal = r.DayManDay != null
          ? (typeof r.DayManDay === 'number' ? r.DayManDay.toFixed(2) : parseFloat(r.DayManDay || 0).toFixed(2))
          : (r.WeekdayManDay != null ? (typeof r.WeekdayManDay === 'number' ? r.WeekdayManDay.toFixed(2) : parseFloat(r.WeekdayManDay || 0).toFixed(2)) : (r.ManDay != null ? (typeof r.ManDay === 'number' ? r.ManDay.toFixed(2) : parseFloat(r.ManDay || 0).toFixed(2)) : '0.00'));

        const nightManDayVal = r.NightManDay != null
          ? (typeof r.NightManDay === 'number' ? r.NightManDay.toFixed(2) : parseFloat(r.NightManDay || 0).toFixed(2))
          : (r.nightManDay != null ? (typeof r.nightManDay === 'number' ? r.nightManDay.toFixed(2) : parseFloat(r.nightManDay || 0).toFixed(2)) : '0.00');

        // 1. Date
        doc.setFont('courier', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...hexToRgb('#0f172a'));
        doc.text(String(r.Date || '—'), curX + 2, currentY + 2.7);
        curX += cols[0].width;

        // 2. Day Name
        doc.setFont('helvetica', isSun ? 'bold' : 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...hexToRgb(isSun ? '#c2410c' : '#475569'));
        doc.text(formattedDay, curX + cols[1].width / 2, currentY + 2.7, { align: 'center' });
        curX += cols[1].width;

        // 3. Day In
        doc.setFont('courier', r.DayIn ? 'bold' : 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...hexToRgb(r.DayIn ? '#16a34a' : '#94a3b8'));
        doc.text(String(r.DayIn || '—'), curX + cols[2].width / 2, currentY + 2.7, { align: 'center' });
        curX += cols[2].width;

        // 4. Day Out
        doc.setFont('courier', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...hexToRgb(r.DayOut ? '#334155' : '#94a3b8'));
        doc.text(String(r.DayOut || '—'), curX + cols[3].width / 2, currentY + 2.7, { align: 'center' });
        curX += cols[3].width;

        // 5. Night In
        doc.setFont('courier', r.NightIn ? 'bold' : 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...hexToRgb(r.NightIn ? '#d97706' : '#94a3b8'));
        doc.text(String(r.NightIn || '—'), curX + cols[4].width / 2, currentY + 2.7, { align: 'center' });
        curX += cols[4].width;

        // 6. Night Out
        doc.setFont('courier', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...hexToRgb(r.NightOut ? '#334155' : '#94a3b8'));
        doc.text(String(r.NightOut || '—'), curX + cols[5].width / 2, currentY + 2.7, { align: 'center' });
        curX += cols[5].width;

        // 7. Day Man Day
        doc.setFont('courier', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(...hexToRgb('#0f172a'));
        doc.text(dayManDayVal, curX + cols[6].width / 2, currentY + 2.7, { align: 'center' });
        curX += cols[6].width;

        // 8. Night Man Day
        doc.setFont('courier', parseFloat(nightManDayVal) > 0 ? 'bold' : 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...hexToRgb(parseFloat(nightManDayVal) > 0 ? '#d97706' : '#94a3b8'));
        doc.text(nightManDayVal, curX + cols[7].width / 2, currentY + 2.7, { align: 'center' });
        // 7. Day Man Day
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...hexToRgb('#0f172a'));
        let dayManDayText = String(dayManDayVal);
        if (isSun && sundayHrsVal != null) {
          dayManDayText += ` (${sundayHrsVal}h)`;
        }
        doc.text(dayManDayText, curX + cols[6].width / 2, currentY + 2.7, { align: 'center' });
        curX += cols[6].width;

        // 8. Night Man Day
        const isNight = parseFloat(nightManDayVal) > 0;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...hexToRgb(isNight ? '#d97706' : '#94a3b8'));
        doc.text(String(nightManDayVal), curX + cols[7].width / 2, currentY + 2.7, { align: 'center' });
      }

      currentY += rowHeight;
    });
  }

  // Draw Footer on final page
  drawFooter();
};

/**
 * Downloads a single worker's attendance card as a true text/vector A5 PDF.
 * Filename format: <WorkerName>_<GatePass>.pdf
 */
export const downloadAttendancePDF = async (worker) => {
  if (!worker) return;

  const logoBase64 = await getLogoBase64();
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
    compress: true,
  });

  renderWorkerCardToPDF(pdf, worker, logoBase64, true);

  const identifier = worker.GatePass || worker.WISA || 'Card';
  const filename = `${sanitizeFilename(worker.Name)}_${sanitizeFilename(identifier)}.pdf`;
  pdf.save(filename);
};

/**
 * Extracts Month and Year string from worker object or attendance records.
 */
export const getMonthYearString = (workers) => {
  if (!workers || workers.length === 0) return null;

  for (const worker of workers) {
    if (worker.AttendanceMonthName && worker.AttendanceYear) {
      return `${worker.AttendanceMonthName}_${worker.AttendanceYear}`;
    }
  }

  return null;
};

/**
 * Core bulk PDF generation function for multiple worker attendance cards.
 * Generates a clean multi-page document with true text/vector rendering.
 */
export const generateAttendancePDF = async (workers = [], filename = 'Attendance.pdf') => {
  if (!workers || workers.length === 0) return;

  const logoBase64 = await getLogoBase64();
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
    compress: true,
  });

  workers.forEach((worker, index) => {
    renderWorkerCardToPDF(pdf, worker, logoBase64, index === 0);
  });

  pdf.save(filename);
};

/**
 * Downloads all attendance cards as a single multi-page text/vector PDF document.
 */
export const downloadAllAttendanceCardsPDF = async (workers = []) => {
  const monthYear = getMonthYearString(workers);
  const filename = monthYear ? `Attendance_All_${monthYear}.pdf` : `Attendance_All.pdf`;
  await generateAttendancePDF(workers, filename);
};

/**
 * Downloads site-specific attendance cards as a single multi-page text/vector PDF document.
 */
export const downloadSiteAttendanceCardsPDF = async (workers = [], siteName = 'All') => {
  const monthYear = getMonthYearString(workers);
  const siteSuffix = siteName === 'All' ? 'All' : sanitizeFilename(siteName);
  const filename = monthYear
    ? `Attendance_${siteSuffix}_${monthYear}.pdf`
    : `Attendance_${siteSuffix}.pdf`;
  await generateAttendancePDF(workers, filename);
};

/**
 * Native print utility for worker attendance card.
 */
export const printAttendanceCard = (worker) => {
  if (!worker) return;

  const records = Array.isArray(worker.Attendance) ? worker.Attendance : [];

  const gatePass = worker.GatePass || '—';
  const wisa = worker.WISA || '—';
  const blastFurnace = worker.BlastFurnace || '—';
  const department = worker.Department || '—';
  const designation = worker.Designation || '—';
  const name = worker.Name || '—';

  const workingDays = worker.WorkingDays ?? records.length;
  const presentDays = worker.PresentDays ?? 0;
  const sundayWorked = worker.SundayWorkingDays ?? 0;
  const nightShifts = worker.NightShifts ?? 0;

  const weekdayManDays = worker.WeekdayManDays != null ? (typeof worker.WeekdayManDays === 'number' ? worker.WeekdayManDays.toFixed(2) : worker.WeekdayManDays) : '0.00';
  const nightManDays = worker.NightManDays != null ? (typeof worker.NightManDays === 'number' ? worker.NightManDays.toFixed(2) : worker.NightManDays) : '0.00';
  const sundayHours = worker.SundayHours != null ? (typeof worker.SundayHours === 'number' ? worker.SundayHours.toFixed(2) : worker.SundayHours) : '0.00';
  const sundayRatio = worker.SundayRatio != null ? (typeof worker.SundayRatio === 'number' ? worker.SundayRatio.toFixed(2) : worker.SundayRatio) : '0.00';
  const totalManDays = worker.TotalManDays != null ? (typeof worker.TotalManDays === 'number' ? worker.TotalManDays.toFixed(2) : worker.TotalManDays) : '0.00';

  const timestamp = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const tableRowsHtml = records.length === 0
    ? `<tr><td colSpan="8" style="padding: 10px; text-align: center; color: #94a3b8; font-size: 10px;">No attendance records found for this worker.</td></tr>`
    : records.map((r, i) => {
        const isSun = r.IsSunday === true || String(r.DayName || '').toUpperCase() === 'SUN' || String(r.DayName || '').toUpperCase() === 'SUNDAY';
        const dayDisplayName = (r.DayName || '').toUpperCase();
        const formattedDay = dayDisplayName.startsWith('SUN') ? 'SUN' : (dayDisplayName.slice(0, 3) || '—');

        const dayManDayVal = r.DayManDay != null ? (typeof r.DayManDay === 'number' ? r.DayManDay.toFixed(2) : parseFloat(r.DayManDay || 0).toFixed(2)) : '0.00';
        const nightManDayVal = r.NightManDay != null ? (typeof r.NightManDay === 'number' ? r.NightManDay.toFixed(2) : parseFloat(r.NightManDay || 0).toFixed(2)) : '0.00';
        const sundayHrsVal = r.SundayHours != null ? (typeof r.SundayHours === 'number' ? r.SundayHours.toFixed(2) : r.SundayHours) : null;

        const bg = isSun ? '#fff7ed' : (i % 2 === 0 ? '#ffffff' : '#f8fafc');
        const borderLeft = isSun ? 'border-left: 3px solid #ea580c;' : '';

        const dayCellHtml = isSun
          ? `<span style="background: rgba(255, 182, 144, 0.3); color: #c2410c; font-weight: 700; padding: 1px 4px; border-radius: 3px; font-size: 8px;">SUN</span>`
          : `<span style="color: #475569; font-weight: 600;">${formattedDay}</span>`;

        const dayManDayCellHtml = isSun && sundayHrsVal != null
          ? `<div><span style="font-weight: 700; color: #0f172a;">${dayManDayVal}</span><div style="font-size: 7.5px; color: #64748b;">${sundayHrsVal} hrs</div></div>`
          : `<span style="font-weight: 700; color: #0f172a;">${dayManDayVal}</span>`;

        const nightManDayCellHtml = `<span style="font-weight: 700; color: ${parseFloat(nightManDayVal) > 0 ? '#d97706' : '#94a3b8'};">${nightManDayVal}</span>`;

        return `
          <tr style="background-color: ${bg}; ${borderLeft} font-family: monospace; border-top: 1px solid #e2e8f0; font-size: 9.5px;">
            <td style="padding: 3.5px 5px; font-weight: 600; color: #0f172a;">${r.Date || '—'}</td>
            <td style="padding: 3.5px 4px; font-family: sans-serif;">${dayCellHtml}</td>
            <td style="padding: 3.5px 4px; color: ${r.DayIn ? '#16a34a' : '#94a3b8'}; font-weight: ${r.DayIn ? '600' : '400'};">${r.DayIn || '—'}</td>
            <td style="padding: 3.5px 4px; color: ${r.DayOut ? '#334155' : '#94a3b8'};">${r.DayOut || '—'}</td>
            <td style="padding: 3.5px 4px; color: ${r.NightIn ? '#d97706' : '#94a3b8'}; font-weight: ${r.NightIn ? '600' : '400'};">${r.NightIn || '—'}</td>
            <td style="padding: 3.5px 4px; color: ${r.NightOut ? '#334155' : '#94a3b8'};">${r.NightOut || '—'}</td>
            <td style="padding: 3.5px 4px;">${dayManDayCellHtml}</td>
            <td style="padding: 3.5px 4px;">${nightManDayCellHtml}</td>
          </tr>
        `;
      }).join('');

  const cardHtml = `
    <div style="padding: 12px; background: #ffffff; color: #0f172a; font-family: Arial, sans-serif; border: 1px solid #cbd5e1;">
      <div style="background: #0f172a; color: #ffffff; padding: 6px 10px; border-radius: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ec6a06;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="/logo.png" style="height: 24px; width: auto;" alt="Logo" />
          <div>
            <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; color: #ffffff;">KAMLA ENTERPRISES</div>
            <div style="font-size: 7.5px; color: #94a3b8; text-transform: uppercase;">Labor Management System</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; font-size: 9px; color: #ec6a06; text-transform: uppercase;">ATTENDANCE CARD</div>
          <div style="font-size: 8px; font-family: monospace; color: #cbd5e1;">Gate Pass: ${gatePass}</div>
        </div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px; margin-bottom: 6px;">
        <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${name}</div>
        <div style="font-size: 8px; color: #475569; font-weight: 600; margin-top: 2px;">
          ${designation} &bull; ${department} ${blastFurnace !== '—' ? `<span style="margin-left: 6px; font-weight: 800; color: #c2410c;">🏭 ${blastFurnace}</span>` : ''}
        </div>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px; font-size: 8px;">
          <div><div style="font-size: 6.5px; font-weight: 700; color: #64748b;">GATE PASS</div><div style="font-family: monospace; font-weight: 700;">${gatePass}</div></div>
          <div><div style="font-size: 6.5px; font-weight: 700; color: #64748b;">WISA ID</div><div style="font-family: monospace; font-weight: 700; color: #ea580c;">${wisa}</div></div>
          <div><div style="font-size: 6.5px; font-weight: 700; color: #64748b;">DEPARTMENT</div><div>${department}</div></div>
          <div><div style="font-size: 6.5px; font-weight: 700; color: #64748b;">DESIGNATION</div><div>${designation}</div></div>
          <div><div style="font-size: 6.5px; font-weight: 700; color: #64748b;">BLAST FURNACE</div><div style="font-weight: 700;">🏭 ${blastFurnace}</div></div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 5px; text-align: center;">
        <div style="padding: 3px 4px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;"><div style="font-size: 6.5px; font-weight: 700; color: #64748b;">Working Days</div><div style="font-size: 10.5px; font-weight: 700;">${workingDays}</div></div>
        <div style="padding: 3px 4px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;"><div style="font-size: 6.5px; font-weight: 700; color: #16a34a;">Present Days</div><div style="font-size: 10.5px; font-weight: 700; color: #16a34a;">${presentDays}</div></div>
        <div style="padding: 3px 4px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;"><div style="font-size: 6.5px; font-weight: 700; color: #ea580c;">Sunday Worked</div><div style="font-size: 10.5px; font-weight: 700; color: #ea580c;">${sundayWorked}</div></div>
        <div style="padding: 3px 4px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;"><div style="font-size: 6.5px; font-weight: 700; color: #d97706;">Night Shifts</div><div style="font-size: 10.5px; font-weight: 700; color: #d97706;">${nightShifts}</div></div>
      </div>
      <div style="margin-bottom: 6px;">
        <div style="font-size: 8px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">PAYROLL SUMMARY</div>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; text-align: center;">
          <div style="padding: 3px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;"><div style="font-size: 6px; font-weight: 700; color: #64748b;">Weekday Man Days</div><div style="font-size: 9.5px; font-weight: 700;">${weekdayManDays}</div><div style="font-size: 5.5px; color: #94a3b8;">12 hr basis</div></div>
          <div style="padding: 3px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;"><div style="font-size: 6px; font-weight: 700; color: #d97706;">Night Man Days</div><div style="font-size: 9.5px; font-weight: 700; color: #d97706;">${nightManDays}</div><div style="font-size: 5.5px; color: #94a3b8;">6 hr basis</div></div>
          <div style="padding: 3px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;"><div style="font-size: 6px; font-weight: 700; color: #64748b;">Sunday Hours</div><div style="font-size: 9.5px; font-weight: 700;">${sundayHours} hrs</div><div style="font-size: 5.5px; color: #94a3b8;">Total hrs</div></div>
          <div style="padding: 3px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;"><div style="font-size: 6px; font-weight: 700; color: #64748b;">Sunday Man Days</div><div style="font-size: 9.5px; font-weight: 700;">${sundayRatio}</div><div style="font-size: 5.5px; color: #94a3b8;">5 hr basis</div></div>
          <div style="padding: 3px; background: #fff7ed; border: 1.5px solid #ea580c; border-radius: 4px;"><div style="font-size: 6px; font-weight: 800; color: #c2410c;">Total Man Days</div><div style="font-size: 9.5px; font-weight: 800; color: #c2410c;">${totalManDays}</div><div style="font-size: 5.5px; font-weight: 700; color: #ea580c;">Final Payroll</div></div>
        </div>
      </div>
      <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 6px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #1e293b; color: #ffffff; font-size: 7px; text-transform: uppercase;">
              <th style="padding: 4px;">Date</th>
              <th style="padding: 4px;">Day</th>
              <th style="padding: 4px;">Day In</th>
              <th style="padding: 4px;">Day Out</th>
              <th style="padding: 4px;">Night In</th>
              <th style="padding: 4px;">Night Out</th>
              <th style="padding: 4px;">Day Man Day</th>
              <th style="padding: 4px;">Night Man Day</th>
            </tr>
          </thead>
          <tbody>${tableRowsHtml}</tbody>
        </table>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 7.5px; color: #64748b;">
        <span>Official Verification &bull; Kamla Enterprises</span>
        <span>Generated: ${timestamp}</span>
      </div>
    </div>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${name} (${gatePass}) — Attendance Card</title>
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #ffffff; font-family: Arial, sans-serif; padding: 20px; }
        @media print {
          body { padding: 0; }
          @page { margin: 10mm; size: A5 portrait; }
        }
      </style>
    </head>
    <body>
      ${cardHtml}
      <script>
        window.onload = function () {
          window.print();
          setTimeout(function () { window.close(); }, 700);
        };
      <\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
};

export const CARD_CAPTURE_ID = 'attendance-card-capture';
