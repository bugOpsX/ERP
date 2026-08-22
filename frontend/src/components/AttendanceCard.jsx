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

  // Plant detection (Korba vs Surat)
  const plantCode = worker.PlantCode || worker.plantCode;
  const isKorba =
    plantCode === 'PLANT_B' ||
    worker.AttendanceType === 'MD_OT_BASED' ||
    (records.length > 0 && records[0].AttendanceType === 'MD_OT_BASED');

  // API fields as single source of truth
  const gatePass = worker.GatePass || worker.gatePass || '—';
  const wisa = worker.WISA || worker.wisa || '—';
  const blastFurnace = worker.BlastFurnace || worker.blastFurnace || '—';
  const department = worker.Department || worker.department || '—';
  const designation = worker.Designation || worker.designation || '—';
  const name = worker.Name || worker.name || '—';

  // Summary Metrics directly from API
  const workingDays = worker.WorkingDays ?? worker.workingDays ?? records.length;
  const presentDays = worker.PresentDays ?? worker.presentDays ?? 0;
  const sundayWorked = worker.SundayWorkingDays ?? worker.sundayWorkingDays ?? 0;
  const nightShifts = worker.NightShifts ?? worker.nightShifts ?? 0;

  const rawOT = worker.TotalOTHours ?? worker.totalOTHours ?? records.reduce((sum, r) => sum + parseFloat(r.OTHours ?? r.ot_hours ?? 0), 0);
  const totalOTHours = (typeof rawOT === 'number' ? rawOT : parseFloat(rawOT || 0)).toFixed(2);

  // Payroll Summary directly from API
  const weekdayManDays = worker.WeekdayManDays != null ? (typeof worker.WeekdayManDays === 'number' ? worker.WeekdayManDays.toFixed(2) : parseFloat(worker.WeekdayManDays || 0).toFixed(2)) : (worker.weekdayManDays != null ? (typeof worker.weekdayManDays === 'number' ? worker.weekdayManDays.toFixed(2) : parseFloat(worker.weekdayManDays || 0).toFixed(2)) : '0.00');
  const nightManDays = worker.NightManDays != null ? (typeof worker.NightManDays === 'number' ? worker.NightManDays.toFixed(2) : parseFloat(worker.NightManDays || 0).toFixed(2)) : (worker.nightManDays != null ? (typeof worker.nightManDays === 'number' ? worker.nightManDays.toFixed(2) : parseFloat(worker.nightManDays || 0).toFixed(2)) : '0.00');
  const sundayHours = worker.SundayHours != null ? (typeof worker.SundayHours === 'number' ? worker.SundayHours.toFixed(2) : parseFloat(worker.SundayHours || 0).toFixed(2)) : (worker.sundayHours != null ? (typeof worker.sundayHours === 'number' ? worker.sundayHours.toFixed(2) : parseFloat(worker.sundayHours || 0).toFixed(2)) : '0.00');
  const sundayRatio = worker.SundayRatio != null ? (typeof worker.SundayRatio === 'number' ? worker.SundayRatio.toFixed(2) : parseFloat(worker.SundayRatio || 0).toFixed(2)) : (worker.sundayRatio != null ? (typeof worker.sundayRatio === 'number' ? worker.sundayRatio.toFixed(2) : parseFloat(worker.sundayRatio || 0).toFixed(2)) : '0.00');
  const totalManDays = worker.TotalManDays != null ? (typeof worker.TotalManDays === 'number' ? worker.TotalManDays.toFixed(2) : parseFloat(worker.TotalManDays || 0).toFixed(2)) : (worker.totalManDays != null ? (typeof worker.totalManDays === 'number' ? worker.totalManDays.toFixed(2) : parseFloat(worker.totalManDays || 0).toFixed(2)) : '0.00');

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
          ? 'bg-white text-[#0f172a] p-6 font-sans border border-[#cbd5e1] max-w-[680px] mx-auto box-border shadow-sm'
          : 'bg-[#122131] text-[#d4e4fa] p-6 border border-[#45464d]/30 inner-glow font-sans'
      }`}
      style={{
        boxSizing: 'border-box',
        width: isPrintable ? '680px' : '100%',
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
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.png"
            alt="Kamla Enterprises Logo"
            className={`w-16 h-16 object-contain rounded-xl p-1 border ${
              isPrintable ? 'bg-white border-[#cbd5e1]' : 'bg-[#051424] border-white/20'
            }`}
          />
          <div>
            <h2
              className={`font-bold uppercase tracking-wider ${
                isPrintable ? 'text-lg text-white' : 'text-lg text-white'
              }`}
            >
              Kamla Enterprises
            </h2>
            <p
              className={`text-[10px] uppercase font-semibold tracking-widest ${
                isPrintable ? 'text-[#94a3b8]' : 'text-[#909097]'
              }`}
            >
              {isKorba ? 'Korba Attendance System' : 'Labor Management System'}
            </p>
          </div>
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

        {/* Expandable Details Section */}
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
                WISA ID / EMP ID
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
                Unit / Plant
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
            {isKorba ? 'Attendance Days' : 'Present Days'}
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
            {isKorba ? 'Total Man Days' : 'Sunday Worked'}
          </span>
          <span className={`text-base font-bold font-mono ${isPrintable ? 'text-[#ea580c]' : 'text-[#ffb690]'}`}>
            {isKorba ? totalManDays : sundayWorked}
          </span>
        </div>

        <div
          className={`p-2 rounded border ${
            isPrintable ? 'bg-white border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'
          }`}
        >
          <span className="block text-[9px] uppercase font-bold text-[#d97706] tracking-wider">
            {isKorba ? 'Total OT Hours' : 'Night Shifts'}
          </span>
          <span className={`text-base font-bold font-mono ${isPrintable ? 'text-[#d97706]' : 'text-amber-400'}`}>
            {isKorba ? `${totalOTHours} hrs` : nightShifts}
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
        {isKorba ? (
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {/* Man Days */}
            <div className={`p-1.5 rounded border ${isPrintable ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'}`}>
              <span className="block text-[8.5px] uppercase font-bold text-[#64748b] tracking-wider truncate">
                Man Days (MD)
              </span>
              <span className={`text-sm font-bold font-mono ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
                {totalManDays}
              </span>
              <span className="block text-[7.5px] text-[#94a3b8] tracking-tight">Daily MD Sum</span>
            </div>

            {/* OT Hours */}
            <div className={`p-1.5 rounded border ${isPrintable ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'}`}>
              <span className="block text-[8.5px] uppercase font-bold text-[#d97706] tracking-wider truncate">
                OT Hours
              </span>
              <span className={`text-sm font-bold font-mono ${isPrintable ? 'text-[#d97706]' : 'text-amber-400'}`}>
                {totalOTHours} hrs
              </span>
              <span className="block text-[7.5px] text-[#94a3b8] tracking-tight">Daily OT Sum</span>
            </div>

            {/* Attendance Days */}
            <div className={`p-1.5 rounded border ${isPrintable ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'}`}>
              <span className="block text-[8.5px] uppercase font-bold text-[#16a34a] tracking-wider truncate">
                Attendance Days
              </span>
              <span className={`text-sm font-bold font-mono ${isPrintable ? 'text-[#16a34a]' : 'text-emerald-400'}`}>
                {presentDays}
              </span>
              <span className="block text-[7.5px] text-[#94a3b8] tracking-tight">Days Worked</span>
            </div>

            {/* Total Man Days (Final Payroll) */}
            <div className={`p-1.5 rounded border-2 ${
              isPrintable
                ? 'bg-[#fff7ed] border-[#ea580c] shadow-xs'
                : 'bg-[#1c2b3c] border-[#ffb690] shadow-[0_0_12px_rgba(255,182,144,0.15)]'
            }`}>
              <span className={`block text-[8.5px] uppercase font-extrabold tracking-wider truncate ${isPrintable ? 'text-[#c2410c]' : 'text-[#ffb690]'}`}>
                Total Man Days
              </span>
              <span className={`text-sm font-extrabold font-mono ${isPrintable ? 'text-[#c2410c]' : 'text-[#ffb690]'}`}>
                {totalManDays}
              </span>
              <span className="block text-[7.5px] font-bold text-[#ea580c] tracking-tight">Final Payroll</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {/* Weekday Man Days */}
            <div className={`p-1.5 rounded border ${isPrintable ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'}`}>
              <span className="block text-[8.5px] uppercase font-bold text-[#64748b] tracking-wider truncate">
                Weekday Man Days
              </span>
              <span className={`text-sm font-bold font-mono ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
                {weekdayManDays}
              </span>
              <span className="block text-[7.5px] text-[#94a3b8] tracking-tight">12 hr basis</span>
            </div>

            {/* Night Man Days */}
            <div className={`p-1.5 rounded border ${isPrintable ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'}`}>
              <span className="block text-[8.5px] uppercase font-bold text-[#d97706] tracking-wider truncate">
                Night Man Days
              </span>
              <span className={`text-sm font-bold font-mono ${isPrintable ? 'text-[#d97706]' : 'text-amber-400'}`}>
                {nightManDays}
              </span>
              <span className="block text-[7.5px] text-[#94a3b8] tracking-tight">6 hr basis</span>
            </div>

            {/* Sunday Hours */}
            <div className={`p-1.5 rounded border ${isPrintable ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'}`}>
              <span className="block text-[8.5px] uppercase font-bold text-[#64748b] tracking-wider truncate">
                Sunday Hours
              </span>
              <span className={`text-sm font-bold font-mono ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
                {sundayHours} hrs
              </span>
              <span className="block text-[7.5px] text-[#94a3b8] tracking-tight">Total hrs</span>
            </div>

            {/* Sunday Man Days */}
            <div className={`p-1.5 rounded border ${isPrintable ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-[#0d1c2d] border-[#45464d]/20'}`}>
              <span className="block text-[8.5px] uppercase font-bold text-[#64748b] tracking-wider truncate">
                Sunday Man Days
              </span>
              <span className={`text-sm font-bold font-mono ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
                {sundayRatio}
              </span>
              <span className="block text-[7.5px] text-[#94a3b8] tracking-tight">5 hr basis</span>
            </div>

            {/* Total Man Days (Visually Emphasized) */}
            <div className={`p-1.5 rounded border-2 ${
              isPrintable
                ? 'bg-[#fff7ed] border-[#ea580c] shadow-xs'
                : 'bg-[#1c2b3c] border-[#ffb690] shadow-[0_0_12px_rgba(255,182,144,0.15)]'
            }`}>
              <span className={`block text-[8.5px] uppercase font-extrabold tracking-wider truncate ${isPrintable ? 'text-[#c2410c]' : 'text-[#ffb690]'}`}>
                Total Man Days
              </span>
              <span className={`text-sm font-extrabold font-mono ${isPrintable ? 'text-[#c2410c]' : 'text-[#ffb690]'}`}>
                {totalManDays}
              </span>
              <span className="block text-[7.5px] font-bold text-[#ea580c] tracking-tight">Final Payroll</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Compact Attendance Table Log ── */}
      <div className="mb-4 overflow-hidden rounded border border-[#cbd5e1]/40">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className={isPrintable ? 'bg-[#1e293b] text-white' : 'bg-[#1c2b3c] text-[#d4e4fa]'}>
              {isKorba ? (
                <>
                  <th className="py-2 px-3 font-semibold uppercase tracking-wider text-[9.5px]">Date</th>
                  <th className="py-2 px-2 text-center font-semibold uppercase tracking-wider text-[9.5px]">Day</th>
                  <th className="py-2 px-3 text-center font-semibold uppercase tracking-wider text-[9.5px]">MD (Man Day)</th>
                  <th className="py-2 px-3 text-center font-semibold uppercase tracking-wider text-[9.5px]">OT Hours</th>
                </>
              ) : (
                <>
                  <th className="py-2 px-2 font-semibold uppercase tracking-wider text-[9.5px]">Date</th>
                  <th className="py-2 px-1.5 font-semibold uppercase tracking-wider text-[9.5px]">Day</th>
                  <th className="py-2 px-1.5 font-semibold uppercase tracking-wider text-[9.5px]">Day In</th>
                  <th className="py-2 px-1.5 font-semibold uppercase tracking-wider text-[9.5px]">Day Out</th>
                  <th className="py-2 px-1.5 font-semibold uppercase tracking-wider text-[9.5px]">Night In</th>
                  <th className="py-2 px-1.5 font-semibold uppercase tracking-wider text-[9.5px]">Night Out</th>
                  <th className="py-2 px-1.5 font-semibold uppercase tracking-wider text-[9.5px]">Day Man Day</th>
                  <th className="py-2 px-1.5 font-semibold uppercase tracking-wider text-[9.5px]">Night Man Day</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={isKorba ? 4 : 8}
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

                if (isKorba) {
                  const mdVal = (r.MD != null ? parseFloat(r.MD) : (r.ManDay != null ? parseFloat(r.ManDay) : 0)).toFixed(2);
                  const otVal = (r.OTHours != null ? parseFloat(r.OTHours) : 0).toFixed(2);

                  return (
                    <tr key={idx} className={`${rowBg} ${borderLeftClass} border-t border-[#cbd5e1]/20 font-mono`}>
                      <td className={`py-1.5 px-3 font-semibold ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
                        {r.Date || '—'}
                      </td>
                      <td className="py-1.5 px-2 text-center font-sans font-semibold">
                        {isSun ? (
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
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
                      <td className="py-1.5 px-3 text-center">
                        <span className={`font-bold ${parseFloat(mdVal) > 0 ? (isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                          {mdVal}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span className={`font-bold ${parseFloat(otVal) > 0 ? (isPrintable ? 'text-[#d97706]' : 'text-amber-400') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                          {otVal}
                        </span>
                      </td>
                    </tr>
                  );
                }

                const dayManDayVal = r.DayManDay != null ? (typeof r.DayManDay === 'number' ? r.DayManDay.toFixed(2) : parseFloat(r.DayManDay || 0).toFixed(2)) : (r.WeekdayManDay != null ? (typeof r.WeekdayManDay === 'number' ? r.WeekdayManDay.toFixed(2) : parseFloat(r.WeekdayManDay || 0).toFixed(2)) : (r.ManDay != null ? (typeof r.ManDay === 'number' ? r.ManDay.toFixed(2) : parseFloat(r.ManDay || 0).toFixed(2)) : '0.00'));
                const nightManDayVal = r.NightManDay != null ? (typeof r.NightManDay === 'number' ? r.NightManDay.toFixed(2) : parseFloat(r.NightManDay || 0).toFixed(2)) : (r.nightManDay != null ? (typeof r.nightManDay === 'number' ? r.nightManDay.toFixed(2) : parseFloat(r.nightManDay || 0).toFixed(2)) : '0.00');
                const sundayHrsVal = r.SundayHours != null ? (typeof r.SundayHours === 'number' ? r.SundayHours.toFixed(2) : r.SundayHours) : null;

                return (
                  <tr key={idx} className={`${rowBg} ${borderLeftClass} border-t border-[#cbd5e1]/20 font-mono`}>
                    <td className={`py-1.5 px-2 font-semibold ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
                      {r.Date || '—'}
                    </td>
                    <td className="py-1.5 px-1.5 font-sans font-semibold">
                      {isSun ? (
                        <span className={`inline-block px-1 py-0.5 rounded text-[8.5px] font-bold ${
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
                    <td className={`py-1.5 px-1.5 ${r.DayIn ? (isPrintable ? 'text-[#16a34a] font-semibold' : 'text-emerald-400 font-semibold') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                      {r.DayIn || '—'}
                    </td>
                    <td className={`py-1.5 px-1.5 ${r.DayOut ? (isPrintable ? 'text-[#334155]' : 'text-[#c6c6cd]') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                      {r.DayOut || '—'}
                    </td>
                    <td className={`py-1.5 px-1.5 ${r.NightIn ? (isPrintable ? 'text-[#d97706] font-semibold' : 'text-amber-400 font-semibold') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                      {r.NightIn || '—'}
                    </td>
                    <td className={`py-1.5 px-1.5 ${r.NightOut ? (isPrintable ? 'text-[#334155]' : 'text-[#c6c6cd]') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                      {r.NightOut || '—'}
                    </td>
                    <td className="py-1.5 px-1.5">
                      <div className={`font-bold ${isPrintable ? 'text-[#0f172a]' : 'text-[#d4e4fa]'}`}>
                        {dayManDayVal}
                      </div>
                      {isSun && sundayHrsVal != null && (
                        <div className={`text-[8.5px] font-sans ${isPrintable ? 'text-[#64748b]' : 'text-[#909097]'}`}>
                          {sundayHrsVal} hrs
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 px-1.5">
                      <div className={`font-bold ${parseFloat(nightManDayVal) > 0 ? (isPrintable ? 'text-[#d97706]' : 'text-amber-400') : (isPrintable ? 'text-[#94a3b8]' : 'text-[#45464d]')}`}>
                        {nightManDayVal}
                      </div>
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
