import React, { useState } from 'react';

/**
 * AttendanceCard
 * Reusable attendance card component for Preview (Drawer), Print, Single PDF, and Bulk PDF.
 * Pure presentation layer using backend API response as single source of truth.
 *
 * @param {Object} props
 * @param {Object} props.worker - Worker object from backend API.
 * @param {string} props.variant - 'preview' (dark theme drawer view) or 'printable' (light high-density print theme for PDF export).
 * @param {string} props.id - Optional element ID for canvas capture.
 */
const AttendanceCard = ({ worker, variant = 'preview', id }) => {
  const [showFullDetails, setShowFullDetails] = useState(false);

  if (!worker) return null;

  const records = Array.isArray(worker.Attendance) ? worker.Attendance : [];

  // API fields as single source of truth
  const gatePass = worker.GatePass || '—';
  const wisa = worker.WISA || '—';
  const blastFurnace = worker.BlastFurnace || '—';
  const department = worker.Department || '—';
  const designation = worker.Designation || '—';
  const name = worker.Name || '—';

  // Summary Metrics directly from API
  const workingDays = worker.WorkingDays ?? records.length;
  const presentDays = worker.PresentDays ?? 0;
  const sundayWorked = worker.SundayWorkingDays ?? 0;
  const nightShifts = worker.NightShifts ?? 0;

  // Payroll Summary directly from API
  const weekdayManDays = worker.WeekdayManDays != null ? (typeof worker.WeekdayManDays === 'number' ? worker.WeekdayManDays.toFixed(2) : worker.WeekdayManDays) : '0.00';
  const sundayHours = worker.SundayHours != null ? (typeof worker.SundayHours === 'number' ? worker.SundayHours.toFixed(2) : worker.SundayHours) : '0.00';
  const sundayRatio = worker.SundayRatio != null ? (typeof worker.SundayRatio === 'number' ? worker.SundayRatio.toFixed(2) : worker.SundayRatio) : '0.00';
  const totalManDays = worker.TotalManDays != null ? (typeof worker.TotalManDays === 'number' ? worker.TotalManDays.toFixed(2) : worker.TotalManDays) : '0.00';

  const timestamp = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const isPrintable = variant === 'printable';

  return (
    <div
      id={id}
      className={`rounded-lg transition-all ${
        isPrintable
          ? 'bg-white text-[#0f172a] p-6 font-sans border border-[#cbd5e1] max-w-[650px] mx-auto box-border shadow-sm'
          : 'bg-[#122131] text-[#d4e4fa] p-6 border border-[#45464d]/30 inner-glow font-sans'
      }`}
      style={{
        boxSizing: 'border-box',
        width: isPrintable ? '650px' : '100%',
      }}
    >
      {/* ── Brand & Card Header ── */}
      <div
        className={`flex justify-between items-center p-4 rounded-md mb-4 ${
          isPrintable
            ? 'bg-[#0f172a] text-white border-b-2 border-[#ec6a06]'
            : 'bg-[#0d1c2d] border border-[#45464d]/40'
        }`}
      >
        <div>
          <h2
            className={`font-bold uppercase tracking-wider ${
              isPrintable ? 'text-lg text-white' : 'text-lg text-[#d4e4fa]'
            }`}
          >
            Kamla Enterprises
          </h2>
          <p
            className={`text-[10px] uppercase font-semibold tracking-widest ${
              isPrintable ? 'text-[#94a3b8]' : 'text-[#909097]'
            }`}
          >
            Labor Management System
          </p>
        </div>

        <div className="text-right">
          <span
            className={`block font-bold text-xs uppercase tracking-widest ${
              isPrintable ? 'text-[#ec6a06]' : 'text-[#ffb690]'
            }`}
          >
            Attendance Card
          </span>
          <span
            className={`text-[11px] font-mono ${
              isPrintable ? 'text-[#cbd5e1]' : 'text-[#909097]'
            }`}
          >
            Gate Pass: {gatePass}
          </span>
        </div>
      </div>

      {/* ── Worker Profile Header & Expandable Details ── */}
      <div
        className={`p-4 rounded-md mb-4 ${
          isPrintable
            ? 'bg-[#f8fafc] border border-[#e2e8f0]'
            : 'bg-[#1c2b3c] border border-[#45464d]/20'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`font-bold text-base uppercase tracking-wide ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
              {name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold ${isPrintable ? 'text-[#475569]' : 'text-[#c6c6cd]'}`}>
                {designation} • {department}
              </span>
              {blastFurnace && blastFurnace !== '—' && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isPrintable ? 'bg-[#ffb690]/20 text-[#c2410c] border border-[#ffb690]/40' : 'bg-[#ffb690]/10 text-[#ffb690] border border-[#ffb690]/20'
                }`}>
                  🏭 {blastFurnace}
                </span>
              )}
            </div>
          </div>

          {/* Toggle Full Details button (for preview mode) */}
          {!isPrintable && (
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="text-[11px] font-semibold text-[#ffb690] hover:underline flex items-center gap-1 cursor-pointer bg-[#0d1c2d] px-2.5 py-1 rounded border border-[#45464d]/30"
            >
              <span>{showFullDetails ? 'Hide Details' : 'View Full Details'}</span>
              <span className="material-symbols-outlined text-[14px]">
                {showFullDetails ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          )}
        </div>

        {/* Expandable Details Section (always visible in printable mode, toggleable in preview mode) */}
        {(showFullDetails || isPrintable) && (
          <div className={`mt-3 pt-3 border-t grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs ${
            isPrintable ? 'border-[#e2e8f0]' : 'border-[#45464d]/30'
          }`}>
            <div>
              <span className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5">
                Gate Pass
              </span>
              <span className={`font-mono font-bold ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
                {gatePass}
              </span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5">
                WISA ID
              </span>
              <span className={`font-mono font-bold ${isPrintable ? 'text-[#0f172a]' : 'text-[#ffb690]'}`}>
                {wisa}
              </span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5">
                Department
              </span>
              <span className={`font-medium ${isPrintable ? 'text-[#334155]' : 'text-[#c6c6cd]'}`}>
                {department}
              </span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5">
                Designation
              </span>
              <span className={`font-medium ${isPrintable ? 'text-[#334155]' : 'text-[#c6c6cd]'}`}>
                {designation}
              </span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5">
                Blast Furnace
              </span>
              <span className={`font-bold ${isPrintable ? 'text-[#0f172a]' : 'text-[#ffb690]'}`}>
                🏭 {blastFurnace}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Top Summary Grid (4 Cards) ── */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-center">
        <div
          className={`p-2 rounded border ${
            isPrintable ? 'bg-white border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'
          }`}
        >
          <span className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider">
            Working Days
          </span>
          <span className={`text-base font-bold font-mono ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
            {workingDays}
          </span>
        </div>

        <div
          className={`p-2 rounded border ${
            isPrintable ? 'bg-white border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'
          }`}
        >
          <span className="block text-[9px] uppercase font-bold text-[#16a34a] tracking-wider">
            Present Days
          </span>
          <span className={`text-base font-bold font-mono ${isPrintable ? 'text-[#16a34a]' : 'text-emerald-400'}`}>
            {presentDays}
          </span>
        </div>

        <div
          className={`p-2 rounded border ${
            isPrintable ? 'bg-white border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'
          }`}
        >
          <span className="block text-[9px] uppercase font-bold text-[#ea580c] tracking-wider">
            Sunday Worked
          </span>
          <span className={`text-base font-bold font-mono ${isPrintable ? 'text-[#ea580c]' : 'text-[#ffb690]'}`}>
            {sundayWorked}
          </span>
        </div>

        <div
          className={`p-2 rounded border ${
            isPrintable ? 'bg-white border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'
          }`}
        >
          <span className="block text-[9px] uppercase font-bold text-[#d97706] tracking-wider">
            Night Shifts
          </span>
          <span className={`text-base font-bold font-mono ${isPrintable ? 'text-[#d97706]' : 'text-amber-400'}`}>
            {nightShifts}
          </span>
        </div>
      </div>

      {/* ── Payroll Summary Section ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isPrintable ? 'text-[#0f172a]' : 'text-[#ffb690]'}`}>
            Payroll Summary
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {/* Weekday Man Days */}
          <div className={`p-2 rounded border ${isPrintable ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'}`}>
            <span className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider">
              Weekday Man Days
            </span>
            <span className={`text-base font-bold font-mono ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
              {weekdayManDays}
            </span>
            <span className="block text-[8px] text-[#94a3b8] tracking-tight">12 hr basis</span>
          </div>

          {/* Sunday Hours */}
          <div className={`p-2 rounded border ${isPrintable ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'}`}>
            <span className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider">
              Sunday Hours
            </span>
            <span className={`text-base font-bold font-mono ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
              {sundayHours} hrs
            </span>
          </div>

          {/* Sunday Man Days */}
          <div className={`p-2 rounded border ${isPrintable ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'}`}>
            <span className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider">
              Sunday Man Days
            </span>
            <span className={`text-base font-bold font-mono ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
              {sundayRatio}
            </span>
            <span className="block text-[8px] text-[#94a3b8] tracking-tight">5 hr basis</span>
          </div>

          {/* Total Man Days (Visually Emphasized) */}
          <div className={`p-2 rounded border-2 ${
            isPrintable
              ? 'bg-[#fff7ed] border-[#ea580c] shadow-xs'
              : 'bg-[#1c2b3c] border-[#ffb690] shadow-[0_0_12px_rgba(255,182,144,0.15)]'
          }`}>
            <span className={`block text-[9px] uppercase font-extrabold tracking-wider ${isPrintable ? 'text-[#c2410c]' : 'text-[#ffb690]'}`}>
              Total Man Days
            </span>
            <span className={`text-base font-extrabold font-mono ${isPrintable ? 'text-[#c2410c]' : 'text-[#ffb690]'}`}>
              {totalManDays}
            </span>
            <span className="block text-[8px] font-bold text-[#ea580c] tracking-tight">Final Payroll</span>
          </div>
        </div>
      </div>

      {/* ── Compact Attendance Table Log ── */}
      <div className="mb-4 overflow-hidden rounded border border-[#cbd5e1]/40">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className={isPrintable ? 'bg-[#1e293b] text-white' : 'bg-[#1c2b3c] text-[#d4e4fa]'}>
              <th className="py-2 px-2.5 font-semibold uppercase tracking-wider text-[10px]">Date</th>
              <th className="py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Day</th>
              <th className="py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Day In</th>
              <th className="py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Day Out</th>
              <th className="py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Night In</th>
              <th className="py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Night Out</th>
              <th className="py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Man Day</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className={`py-4 text-center text-xs ${
                    isPrintable ? 'text-[#94a3b8]' : 'text-[#909097]'
                  }`}
                >
                  No attendance entries recorded for this worker.
                </td>
              </tr>
            ) : (
              records.map((r, idx) => {
                const isSun = r.IsSunday === true || String(r.DayName || '').toUpperCase() === 'SUN' || String(r.DayName || '').toUpperCase() === 'SUNDAY';
                const isEven = idx % 2 === 0;

                let rowBg = isPrintable
                  ? isSun ? 'bg-[#fff7ed]' : (isEven ? 'bg-white' : 'bg-[#f8fafc]')
                  : isSun ? 'bg-[#ffb690]/10' : (isEven ? 'bg-[#122131]' : 'bg-[#0d1c2d]');

                const borderLeftClass = isSun
                  ? (isPrintable ? 'border-l-4 border-l-[#ea580c]' : 'border-l-4 border-l-[#ffb690]')
                  : 'border-l-4 border-l-transparent';

                const dayDisplayName = (r.DayName || '').toUpperCase();
                const formattedDay = dayDisplayName.startsWith('SUN') ? 'SUN' : (dayDisplayName.slice(0, 3) || '—');

                const manDayVal = r.ManDay != null ? (typeof r.ManDay === 'number' ? r.ManDay.toFixed(2) : r.ManDay) : '—';
                const sundayHrsVal = r.SundayHours != null ? (typeof r.SundayHours === 'number' ? r.SundayHours.toFixed(2) : r.SundayHours) : null;

                return (
                  <tr key={idx} className={`${rowBg} ${borderLeftClass} border-t border-[#cbd5e1]/20 font-mono`}>
                    <td className={`py-1.5 px-2.5 font-semibold ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
                      {r.Date || '—'}
                    </td>
                    <td className="py-1.5 px-2 font-sans font-semibold">
                      {isSun ? (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isPrintable ? 'bg-[#ffb690]/30 text-[#c2410c]' : 'bg-[#ffb690]/20 text-[#ffb690]'
                        }`}>
                          SUN
                        </span>
                      ) : (
                        <span className={isPrintable ? 'text-[#475569]' : 'text-[#909097]'}>
                          {formattedDay}
                        </span>
                      )}
                    </td>
                    <td className={`py-1.5 px-2 ${r.DayIn ? (isPrintable ? 'text-[#16a34a] font-semibold' : 'text-emerald-400 font-semibold') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                      {r.DayIn || '—'}
                    </td>
                    <td className={`py-1.5 px-2 ${r.DayOut ? (isPrintable ? 'text-[#334155]' : 'text-[#c6c6cd]') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                      {r.DayOut || '—'}
                    </td>
                    <td className={`py-1.5 px-2 ${r.NightIn ? (isPrintable ? 'text-[#d97706] font-semibold' : 'text-amber-400 font-semibold') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                      {r.NightIn || '—'}
                    </td>
                    <td className={`py-1.5 px-2 ${r.NightOut ? (isPrintable ? 'text-[#334155]' : 'text-[#c6c6cd]') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                      {r.NightOut || '—'}
                    </td>
                    <td className="py-1.5 px-2">
                      <div className={`font-bold ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
                        {manDayVal}
                      </div>
                      {isSun && sundayHrsVal != null && (
                        <div className={`text-[9px] font-sans ${isPrintable ? 'text-[#64748b]' : 'text-[#909097]'}`}>
                          {sundayHrsVal} hrs
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer Timestamp & Verification ── */}
      <div className={`flex justify-between items-center pt-2 border-t text-[10px] ${
        isPrintable ? 'border-[#cbd5e1] text-[#64748b]' : 'border-[#45464d]/30 text-[#909097]'
      }`}>
        <span>Official Verification • Kamla Enterprises</span>
        <span>Generated: {timestamp}</span>
      </div>
    </div>
  );
};

export default AttendanceCard;
