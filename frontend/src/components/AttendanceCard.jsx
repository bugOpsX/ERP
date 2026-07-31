import React from 'react';

/**
 * AttendanceCard
 * Reusable attendance card component for Preview (Drawer), Print, Single PDF, and Bulk PDF.
 * Designed with a clean, high-density industrial layout.
 *
 * @param {Object} props
 * @param {Object} props.worker - Worker object containing Name, WISA, Designation, Department, Attendance array.
 * @param {string} props.variant - 'preview' (dark theme drawer view) or 'printable' (light high-density print theme for PDF export).
 * @param {string} props.id - Optional element ID for canvas capture.
 */
const AttendanceCard = ({ worker, variant = 'preview', id }) => {
  if (!worker) return null;

  const records = Array.isArray(worker.Attendance) ? worker.Attendance : [];
  
  // Dynamic monthly statistics calculation
  const workingDays = records.length;
  const presentDays = records.filter(r => r.DayIn || r.NightIn).length;
  const nightShifts = records.filter(r => r.NightIn).length;
  const absentDays = workingDays - presentDays;

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
            WISA: {worker.WISA}
          </span>
        </div>
      </div>

      {/* ── Worker Profile Summary ── */}
      <div
        className={`grid grid-cols-3 gap-3 p-3.5 rounded-md mb-4 ${
          isPrintable
            ? 'bg-[#f8fafc] border border-[#e2e8f0]'
            : 'bg-[#1c2b3c] border border-[#45464d]/20'
        }`}
      >
        <div>
          <span className="block text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-0.5">
            Worker Name
          </span>
          <span className={`font-semibold text-sm ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
            {worker.Name || '—'}
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-0.5">
            WISA Identifier
          </span>
          <span className={`font-mono font-semibold text-sm ${isPrintable ? 'text-[#0f172a]' : 'text-[#ffb690]'}`}>
            {worker.WISA || '—'}
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-0.5">
            Plant Unit / Site
          </span>
          <span className={`font-bold text-sm ${isPrintable ? 'text-[#0f172a]' : 'text-[#ffb690]'}`}>
            🏭 {worker.BlastFurnace || 'ALL'}
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-0.5">
            Department
          </span>
          <span className={`font-medium text-xs ${isPrintable ? 'text-[#334155]' : 'text-[#c6c6cd]'}`}>
            {worker.Department || 'General'}
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-0.5">
            Designation
          </span>
          <span className={`font-medium text-xs ${isPrintable ? 'text-[#334155]' : 'text-[#c6c6cd]'}`}>
            {worker.Designation || 'Worker'}
          </span>
        </div>
      </div>

      {/* ── Monthly Statistics Grid ── */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-center">
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
          <span className="block text-[9px] uppercase font-bold text-[#d97706] tracking-wider">
            Night Shifts
          </span>
          <span className={`text-base font-bold font-mono ${isPrintable ? 'text-[#d97706]' : 'text-amber-400'}`}>
            {nightShifts}
          </span>
        </div>

        <div
          className={`p-2 rounded border ${
            isPrintable ? 'bg-white border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'
          }`}
        >
          <span className="block text-[9px] uppercase font-bold text-[#dc2626] tracking-wider">
            Absent Days
          </span>
          <span className={`text-base font-bold font-mono ${isPrintable ? 'text-[#dc2626]' : 'text-rose-400'}`}>
            {absentDays < 0 ? 0 : absentDays}
          </span>
        </div>
      </div>

      {/* ── Compact Attendance Table Log ── */}
      <div className="mb-4 overflow-hidden rounded border border-[#cbd5e1]/40">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className={isPrintable ? 'bg-[#1e293b] text-white' : 'bg-[#1c2b3c] text-[#d4e4fa]'}>
              <th className="py-2 px-3 font-semibold uppercase tracking-wider text-[10px]">Date</th>
              <th className="py-2 px-3 font-semibold uppercase tracking-wider text-[10px]">Day In</th>
              <th className="py-2 px-3 font-semibold uppercase tracking-wider text-[10px]">Day Out</th>
              <th className="py-2 px-3 font-semibold uppercase tracking-wider text-[10px]">Night In</th>
              <th className="py-2 px-3 font-semibold uppercase tracking-wider text-[10px]">Night Out</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className={`py-4 text-center text-xs ${
                    isPrintable ? 'text-[#94a3b8]' : 'text-[#909097]'
                  }`}
                >
                  No attendance entries recorded for this worker.
                </td>
              </tr>
            ) : (
              records.map((r, idx) => {
                const isEven = idx % 2 === 0;
                let rowBg = isPrintable
                  ? isEven ? 'bg-white' : 'bg-[#f8fafc]'
                  : isEven ? 'bg-[#122131]' : 'bg-[#0d1c2d]';

                return (
                  <tr key={idx} className={`${rowBg} border-t border-[#cbd5e1]/20 font-mono`}>
                    <td className={`py-1.5 px-3 font-semibold ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
                      {r.Date || '—'}
                    </td>
                    <td className={`py-1.5 px-3 ${r.DayIn ? (isPrintable ? 'text-[#16a34a] font-semibold' : 'text-emerald-400 font-semibold') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                      {r.DayIn || '—'}
                    </td>
                    <td className={`py-1.5 px-3 ${r.DayOut ? (isPrintable ? 'text-[#334155]' : 'text-[#c6c6cd]') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                      {r.DayOut || '—'}
                    </td>
                    <td className={`py-1.5 px-3 ${r.NightIn ? (isPrintable ? 'text-[#d97706] font-semibold' : 'text-amber-400 font-semibold') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                      {r.NightIn || '—'}
                    </td>
                    <td className={`py-1.5 px-3 ${r.NightOut ? (isPrintable ? 'text-[#334155]' : 'text-[#c6c6cd]') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                      {r.NightOut || '—'}
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
