import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Sanitizes string for safe filename usage.
 */
const sanitizeFilename = (str) =>
  String(str || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');

/**
 * Renders an off-screen printable card container matching AttendanceCard layout for PDF capture.
 */
const renderOffscreenCard = (worker) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '640px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-9999';

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
  const sundayHours = worker.SundayHours != null ? (typeof worker.SundayHours === 'number' ? worker.SundayHours.toFixed(2) : worker.SundayHours) : '0.00';
  const sundayRatio = worker.SundayRatio != null ? (typeof worker.SundayRatio === 'number' ? worker.SundayRatio.toFixed(2) : worker.SundayRatio) : '0.00';
  const totalManDays = worker.TotalManDays != null ? (typeof worker.TotalManDays === 'number' ? worker.TotalManDays.toFixed(2) : worker.TotalManDays) : '0.00';

  const timestamp = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const tableRowsHtml =
    records.length === 0
      ? `<tr><td colSpan="7" style="padding: 10px; text-align: center; color: #94a3b8; font-size: 10px;">No attendance records found for this worker.</td></tr>`
      : records
          .map((r, i) => {
            const isSun = r.IsSunday === true || String(r.DayName || '').toUpperCase() === 'SUN' || String(r.DayName || '').toUpperCase() === 'SUNDAY';
            const dayDisplayName = (r.DayName || '').toUpperCase();
            const formattedDay = dayDisplayName.startsWith('SUN') ? 'SUN' : (dayDisplayName.slice(0, 3) || '—');

            const manDayVal = r.ManDay != null ? (typeof r.ManDay === 'number' ? r.ManDay.toFixed(2) : r.ManDay) : '—';
            const sundayHrsVal = r.SundayHours != null ? (typeof r.SundayHours === 'number' ? r.SundayHours.toFixed(2) : r.SundayHours) : null;

            const bg = isSun ? '#fff7ed' : (i % 2 === 0 ? '#ffffff' : '#f8fafc');
            const borderLeft = isSun ? 'border-left: 3px solid #ea580c;' : '';

            const dayCellHtml = isSun
              ? `<span style="background: rgba(255, 182, 144, 0.3); color: #c2410c; font-weight: 700; padding: 1px 4px; border-radius: 3px; font-size: 8px;">SUN</span>`
              : `<span style="color: #475569; font-weight: 600;">${formattedDay}</span>`;

            const manDayCellHtml = isSun && sundayHrsVal != null
              ? `<div><span style="font-weight: 700; color: #0f172a;">${manDayVal}</span><div style="font-size: 7.5px; color: #64748b; font-family: sans-serif;">${sundayHrsVal} hrs</div></div>`
              : `<span style="font-weight: 700; color: #0f172a;">${manDayVal}</span>`;

            return `
              <tr style="background-color: ${bg}; ${borderLeft} font-family: monospace; border-top: 1px solid #e2e8f0; font-size: 9.5px;">
                <td style="padding: 3.5px 5px; font-weight: 600; color: #0f172a;">${r.Date || '—'}</td>
                <td style="padding: 3.5px 4px; font-family: sans-serif;">${dayCellHtml}</td>
                <td style="padding: 3.5px 4px; color: ${r.DayIn ? '#16a34a' : '#94a3b8'}; font-weight: ${r.DayIn ? '600' : '400'};">${r.DayIn || '—'}</td>
                <td style="padding: 3.5px 4px; color: ${r.DayOut ? '#334155' : '#94a3b8'};">${r.DayOut || '—'}</td>
                <td style="padding: 3.5px 4px; color: ${r.NightIn ? '#d97706' : '#94a3b8'}; font-weight: ${r.NightIn ? '600' : '400'};">${r.NightIn || '—'}</td>
                <td style="padding: 3.5px 4px; color: ${r.NightOut ? '#334155' : '#94a3b8'};">${r.NightOut || '—'}</td>
                <td style="padding: 3.5px 4px;">${manDayCellHtml}</td>
              </tr>
            `;
          })
          .join('');

  container.innerHTML = `
    <div style="padding: 12px; background: #ffffff; color: #0f172a; font-family: 'Inter', Arial, sans-serif; border: 1px solid #cbd5e1; box-sizing: border-box;">
      
      <!-- Brand & Header -->
      <div style="background: #0f172a; color: #ffffff; padding: 6px 10px; border-radius: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ec6a06;">
        <div>
          <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #ffffff; line-height: 1.1;">KAMLA ENTERPRISES</div>
          <div style="font-size: 7.5px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 1px; line-height: 1;">Labor Management System</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; font-size: 9px; color: #ec6a06; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.1;">ATTENDANCE CARD</div>
          <div style="font-size: 8px; font-family: monospace; color: #cbd5e1; margin-top: 1px; line-height: 1;">Gate Pass: ${gatePass}</div>
        </div>
      </div>

      <!-- Worker Details Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
          <div>
            <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; line-height: 1.1;">${name}</div>
            <div style="font-size: 8px; color: #475569; font-weight: 600; margin-top: 2px;">
              ${designation} &bull; ${department}
              ${blastFurnace !== '—' ? `<span style="margin-left: 6px; font-weight: 800; color: #c2410c;">🏭 ${blastFurnace}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; border-top: 1px solid #e2e8f0; pt: 4px; margin-top: 4px; font-size: 8px;">
          <div>
            <div style="font-size: 6.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Gate Pass</div>
            <div style="font-family: monospace; font-weight: 700; color: #0f172a;">${gatePass}</div>
          </div>
          <div>
            <div style="font-size: 6.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">WISA ID</div>
            <div style="font-family: monospace; font-weight: 700; color: #ea580c;">${wisa}</div>
          </div>
          <div>
            <div style="font-size: 6.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Department</div>
            <div style="color: #334155;">${department}</div>
          </div>
          <div>
            <div style="font-size: 6.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Designation</div>
            <div style="color: #334155;">${designation}</div>
          </div>
          <div>
            <div style="font-size: 6.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Blast Furnace</div>
            <div style="font-weight: 700; color: #0f172a;">🏭 ${blastFurnace}</div>
          </div>
        </div>
      </div>

      <!-- Top Summary Grid (4 Cards) -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 5px; text-align: center;">
        <div style="padding: 3px 4px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
          <div style="font-size: 6.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Working Days</div>
          <div style="font-size: 10.5px; font-weight: 700; font-family: monospace; color: #0f172a;">${workingDays}</div>
        </div>
        <div style="padding: 3px 4px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
          <div style="font-size: 6.5px; font-weight: 700; text-transform: uppercase; color: #16a34a;">Present Days</div>
          <div style="font-size: 10.5px; font-weight: 700; font-family: monospace; color: #16a34a;">${presentDays}</div>
        </div>
        <div style="padding: 3px 4px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
          <div style="font-size: 6.5px; font-weight: 700; text-transform: uppercase; color: #ea580c;">Sunday Worked</div>
          <div style="font-size: 10.5px; font-weight: 700; font-family: monospace; color: #ea580c;">${sundayWorked}</div>
        </div>
        <div style="padding: 3px 4px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
          <div style="font-size: 6.5px; font-weight: 700; text-transform: uppercase; color: #d97706;">Night Shifts</div>
          <div style="font-size: 10.5px; font-weight: 700; font-family: monospace; color: #d97706;">${nightShifts}</div>
        </div>
      </div>

      <!-- Payroll Summary Block -->
      <div style="margin-bottom: 6px;">
        <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 2px;">PAYROLL SUMMARY</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; text-align: center;">
          <div style="padding: 3px 4px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
            <div style="font-size: 6.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Weekday Man Days</div>
            <div style="font-size: 10.5px; font-weight: 700; font-family: monospace; color: #0f172a;">${weekdayManDays}</div>
            <div style="font-size: 6px; color: #94a3b8;">12 hr basis</div>
          </div>
          <div style="padding: 3px 4px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
            <div style="font-size: 6.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Sunday Hours</div>
            <div style="font-size: 10.5px; font-weight: 700; font-family: monospace; color: #0f172a;">${sundayHours} hrs</div>
          </div>
          <div style="padding: 3px 4px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
            <div style="font-size: 6.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Sunday Man Days</div>
            <div style="font-size: 10.5px; font-weight: 700; font-family: monospace; color: #0f172a;">${sundayRatio}</div>
            <div style="font-size: 6px; color: #94a3b8;">5 hr basis</div>
          </div>
          <div style="padding: 3px 4px; background: #fff7ed; border: 1.5px solid #ea580c; border-radius: 4px;">
            <div style="font-size: 6.5px; font-weight: 800; text-transform: uppercase; color: #c2410c;">Total Man Days</div>
            <div style="font-size: 10.5px; font-weight: 800; font-family: monospace; color: #c2410c;">${totalManDays}</div>
            <div style="font-size: 6px; font-weight: 700; color: #ea580c;">Final Payroll</div>
          </div>
        </div>
      </div>

      <!-- Attendance Table -->
      <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 6px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #1e293b; color: #ffffff; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1;">
              <th style="padding: 4px 5px; font-weight: 600;">Date</th>
              <th style="padding: 4px 4px; font-weight: 600;">Day</th>
              <th style="padding: 4px 4px; font-weight: 600;">Day In</th>
              <th style="padding: 4px 4px; font-weight: 600;">Day Out</th>
              <th style="padding: 4px 4px; font-weight: 600;">Night In</th>
              <th style="padding: 4px 4px; font-weight: 600;">Night Out</th>
              <th style="padding: 4px 4px; font-weight: 600;">Man Day</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Footer Timestamp -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 7.5px; color: #64748b; line-height: 1;">
        <span>Official Verification &bull; Kamla Enterprises</span>
        <span>Generated: ${timestamp}</span>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  return container;
};

/**
 * Downloads a single worker's attendance card as an A5 portrait PDF.
 * Filename format: <WorkerName>_<GatePass>.pdf
 */
export const downloadAttendancePDF = async (worker) => {
  if (!worker) return;

  const container = renderOffscreenCard(worker);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.85);

    // A5 Portrait format: 148 mm x 210 mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 148 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210 mm

    const marginX = 8;
    const marginY = 8;
    const usableWidth = pdfWidth - marginX * 2; // 132 mm
    const maxH = pdfHeight - marginY * 2; // 194 mm

    let w = usableWidth;
    let h = (canvas.height * w) / canvas.width;
    if (h > maxH) {
      h = maxH;
      w = (canvas.width * h) / canvas.height;
    }

    const posX = marginX + (usableWidth - w) / 2;
    const posY = marginY + (maxH - h) / 2;

    pdf.addImage(imgData, 'JPEG', posX, posY, w, h);

    const identifier = worker.GatePass || worker.WISA || 'Card';
    const filename = `${sanitizeFilename(worker.Name)}_${sanitizeFilename(identifier)}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
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
 * Core PDF generation function for multi-card side-by-side exports.
 */
export const generateAttendancePDF = async (workers = [], filename = 'Attendance.pdf') => {
  if (!workers || workers.length === 0) return;

  // A4 Landscape format: 297 mm x 210 mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const slotWidth = 133;
  const maxH = 190;
  const leftSlotStartX = 10;
  const rightSlotStartX = 154;

  for (let i = 0; i < workers.length; i += 2) {
    if (i > 0) {
      pdf.addPage();
    }

    // Left Column Card (Card 1 of pair)
    const worker1 = workers[i];
    const container1 = renderOffscreenCard(worker1);
    try {
      const canvas1 = await html2canvas(container1, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData1 = canvas1.toDataURL('image/jpeg', 0.85);
      
      let w1 = slotWidth;
      let h1 = (canvas1.height * w1) / canvas1.width;
      if (h1 > maxH) {
        h1 = maxH;
        w1 = (canvas1.width * h1) / canvas1.height;
      }
      const posX1 = leftSlotStartX + (slotWidth - w1) / 2;
      const posY1 = 10 + (maxH - h1) / 2;

      pdf.addImage(imgData1, 'JPEG', posX1, posY1, w1, h1);
    } finally {
      document.body.removeChild(container1);
    }

    // Right Column Card (Card 2 of pair)
    if (i + 1 < workers.length) {
      const worker2 = workers[i + 1];
      const container2 = renderOffscreenCard(worker2);
      try {
        const canvas2 = await html2canvas(container2, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        const imgData2 = canvas2.toDataURL('image/jpeg', 0.85);

        let w2 = slotWidth;
        let h2 = (canvas2.height * w2) / canvas2.width;
        if (h2 > maxH) {
          h2 = maxH;
          w2 = (canvas2.width * h2) / canvas2.height;
        }
        const posX2 = rightSlotStartX + (slotWidth - w2) / 2;
        const posY2 = 10 + (maxH - h2) / 2;

        pdf.addImage(imgData2, 'JPEG', posX2, posY2, w2, h2);
      } finally {
        document.body.removeChild(container2);
      }
    }
  }

  pdf.save(filename);
};

export const downloadAllAttendanceCardsPDF = async (workers = []) => {
  const monthYear = getMonthYearString(workers);
  const filename = monthYear ? `Attendance_All_${monthYear}.pdf` : `Attendance_All.pdf`;
  await generateAttendancePDF(workers, filename);
};

export const downloadSiteAttendanceCardsPDF = async (workers = [], siteName = 'All') => {
  const monthYear = getMonthYearString(workers);
  const siteSuffix = siteName === 'All' ? 'All' : sanitizeFilename(siteName);
  const filename = monthYear
    ? `Attendance_${siteSuffix}_${monthYear}.pdf`
    : `Attendance_${siteSuffix}.pdf`;
  await generateAttendancePDF(workers, filename);
};

export const printAttendanceCard = (worker) => {
  if (!worker) return;

  const container = renderOffscreenCard(worker);
  const cardHtml = container.innerHTML;
  document.body.removeChild(container);

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${worker.Name} (${worker.GatePass || worker.WISA}) — Attendance Card</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #ffffff; font-family: 'Inter', Arial, sans-serif; padding: 20px; }
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
