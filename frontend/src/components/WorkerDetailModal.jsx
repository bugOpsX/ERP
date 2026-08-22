import React, { useEffect } from 'react';

/**
 * WorkerDetailModal
 * Large, modern industrial ERP worker attendance detail workspace overlay.
 * Pure presentation layer using backend API data as single source of truth.
 */
const WorkerDetailModal = ({
  open,
  onClose,
  worker,
  onDownloadSingle,
  onPrintCard,
  isDownloading,
}) => {
  // Lock background scrolling when modal is active
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !worker) return null;

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
  const name = worker.Name || worker.name || 'Worker Details';

  // Top Summary Metrics directly from API
  const workingDays = worker.WorkingDays ?? worker.workingDays ?? records.length;
  const presentDays = worker.PresentDays ?? worker.presentDays ?? 0;
  const sundayWorked = worker.SundayWorkingDays ?? worker.sundayWorkingDays ?? 0;
  const nightShifts = worker.NightShifts ?? worker.nightShifts ?? 0;

  const rawOT = worker.TotalOTHours ?? worker.totalOTHours ?? records.reduce((sum, r) => sum + parseFloat(r.OTHours ?? r.ot_hours ?? 0), 0);
  const totalOTHours = (typeof rawOT === 'number' ? rawOT : parseFloat(rawOT || 0)).toFixed(2);

  // Payroll Summary directly from API
  const weekdayManDays =
    worker.WeekdayManDays != null
      ? typeof worker.WeekdayManDays === 'number'
        ? worker.WeekdayManDays.toFixed(2)
        : parseFloat(worker.WeekdayManDays || 0).toFixed(2)
      : worker.weekdayManDays != null
      ? typeof worker.weekdayManDays === 'number'
        ? worker.weekdayManDays.toFixed(2)
        : parseFloat(worker.weekdayManDays || 0).toFixed(2)
      : '0.00';

  const nightManDays =
    worker.NightManDays != null
      ? typeof worker.NightManDays === 'number'
        ? worker.NightManDays.toFixed(2)
        : parseFloat(worker.NightManDays || 0).toFixed(2)
      : worker.nightManDays != null
      ? typeof worker.nightManDays === 'number'
        ? worker.nightManDays.toFixed(2)
        : parseFloat(worker.nightManDays || 0).toFixed(2)
      : '0.00';

  const sundayHours =
    worker.SundayHours != null
      ? typeof worker.SundayHours === 'number'
        ? worker.SundayHours.toFixed(2)
        : parseFloat(worker.SundayHours || 0).toFixed(2)
      : worker.sundayHours != null
      ? typeof worker.sundayHours === 'number'
        ? worker.sundayHours.toFixed(2)
        : parseFloat(worker.sundayHours || 0).toFixed(2)
      : '0.00';

  const sundayRatio =
    worker.SundayRatio != null
      ? typeof worker.SundayRatio === 'number'
        ? worker.SundayRatio.toFixed(2)
        : parseFloat(worker.SundayRatio || 0).toFixed(2)
      : worker.sundayRatio != null
      ? typeof worker.sundayRatio === 'number'
        ? worker.sundayRatio.toFixed(2)
        : parseFloat(worker.sundayRatio || 0).toFixed(2)
      : '0.00';

  const totalManDays =
    worker.TotalManDays != null
      ? typeof worker.TotalManDays === 'number'
        ? worker.TotalManDays.toFixed(2)
        : parseFloat(worker.TotalManDays || 0).toFixed(2)
      : worker.totalManDays != null
      ? typeof worker.totalManDays === 'number'
        ? worker.totalManDays.toFixed(2)
        : parseFloat(worker.totalManDays || 0).toFixed(2)
      : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden">
      {/* Darkened Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Large Workspace Modal Overlay Container (80-92vw, 80-92vh) */}
      <div className="relative w-full max-w-[1400px] w-[90vw] h-[88vh] max-h-[90vh] bg-[#091522] border border-[#45464d]/40 rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-[#d4e4fa] select-text z-10 animate-scale-in">
        
        {/* ── 1. WORKSPACE HEADER ── */}
        <div className="bg-[#05101a] border-b border-[#45464d]/30 px-6 py-4 flex items-center justify-between flex-shrink-0 select-text">
          <div className="flex items-center gap-4">
            {/* Kamla Enterprises Brand Badge */}
            <div className="w-20 h-20 rounded-2xl bg-[#051424] border border-white/20 p-1 flex items-center justify-center shadow-xl shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="Kamla Enterprises Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-bold tracking-widest text-white">
                  KAMLA ENTERPRISES
                </span>
                <span className="text-[#45464d]">•</span>
                <span className="text-[11px] uppercase font-semibold tracking-wider text-white/70">
                  {isKorba ? 'Korba Plant — Worker Attendance' : 'Worker Attendance Details'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-wide mt-0.5 select-text">
                {name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#c6c6cd] mt-0.5 select-text">
                <span>{designation}</span>
                <span className="text-[#45464d]">•</span>
                <span>{department}</span>
                {blastFurnace && blastFurnace !== '—' && (
                  <>
                    <span className="text-[#45464d]">•</span>
                    <span className="px-2 py-0.5 rounded bg-[#ffb690]/10 text-[#ffb690] border border-[#ffb690]/30 font-bold uppercase text-[11px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">factory</span>
                      {blastFurnace}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ID Chips & Close Button */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 select-text">
              <div className="bg-[#142334] border border-[#45464d]/40 rounded-lg px-3 py-1.5 text-right">
                <span className="block text-[9px] uppercase font-bold text-[#909097] tracking-wider">Gate Pass</span>
                <span className="font-mono text-xs font-bold text-[#e2e8f0]">{gatePass}</span>
              </div>
              <div className="bg-[#142334] border border-[#ffb690]/30 rounded-lg px-3 py-1.5 text-right">
                <span className="block text-[9px] uppercase font-bold text-[#ffb690]/80 tracking-wider">WISA ID / EMP ID</span>
                <span className="font-mono text-xs font-bold text-[#ffb690]">{wisa}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#909097] hover:text-white hover:bg-[#1c2b3c] rounded-lg transition-colors cursor-pointer"
              title="Close Workspace"
            >
              <span className="material-symbols-outlined text-[26px]">close</span>
            </button>
          </div>
        </div>

        {/* ── 2. MAIN SCROLLABLE WORKSPACE BODY ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text custom-scrollbar">
          
          {/* TOP SUMMARY METRICS (4 CARDS) */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#909097] block mb-2">
              Monthly Operational Telemetry
            </span>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-text">
              {/* Working Days */}
              <div className="bg-[#0e1d2f] border border-[#45464d]/30 rounded-xl p-4 text-center shadow-sm">
                <span className="block text-xs uppercase font-bold text-[#94a3b8] tracking-wider mb-1">
                  Working Days
                </span>
                <span className="text-2xl font-black font-mono text-[#d4e4fa]">
                  {workingDays}
                </span>
              </div>

              {/* Present Days */}
              <div className="bg-[#0e1d2f] border border-emerald-500/30 rounded-xl p-4 text-center shadow-sm">
                <span className="block text-xs uppercase font-bold text-emerald-400 tracking-wider mb-1">
                  {isKorba ? 'Attendance Days' : 'Present Days'}
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {presentDays}
                </span>
              </div>

              {/* Sunday Worked / Total Man Days */}
              <div className="bg-[#0e1d2f] border border-[#ffb690]/30 rounded-xl p-4 text-center shadow-sm">
                <span className="block text-xs uppercase font-bold text-[#ffb690] tracking-wider mb-1">
                  {isKorba ? 'Total Man Days' : 'Sunday Worked'}
                </span>
                <span className="text-2xl font-black font-mono text-[#ffb690]">
                  {isKorba ? totalManDays : sundayWorked}
                </span>
              </div>

              {/* Night Shifts / Total OT Hours */}
              <div className="bg-[#0e1d2f] border border-amber-500/30 rounded-xl p-4 text-center shadow-sm">
                <span className="block text-xs uppercase font-bold text-amber-400 tracking-wider mb-1">
                  {isKorba ? 'Total OT Hours' : 'Night Shifts'}
                </span>
                <span className="text-2xl font-black font-mono text-amber-400">
                  {isKorba ? `${totalOTHours} hrs` : nightShifts}
                </span>
              </div>
            </div>
          </div>

          {/* ── PAYROLL SUMMARY ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ffb690] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">payments</span>
                Payroll Summary (Monthly Totals)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-text">
              {isKorba ? (
                <>
                  {/* KORBA BOX 1: MAN DAYS */}
                  <div className="bg-[#0e1d2f] border border-[#45464d]/30 rounded-xl p-4.5 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="block text-xs font-bold uppercase text-[#94a3b8] tracking-wider">
                        Man Days (MD)
                      </span>
                      <div className="text-3xl font-black font-mono text-[#d4e4fa] mt-2">
                        {totalManDays}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#45464d]/20">
                      <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                        Daily MD Sum
                      </span>
                    </div>
                  </div>

                  {/* KORBA BOX 2: OT HOURS */}
                  <div className="bg-[#0e1d2f] border border-amber-500/30 rounded-xl p-4.5 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="block text-xs font-bold uppercase text-amber-400 tracking-wider">
                        OT Hours
                      </span>
                      <div className="text-3xl font-black font-mono text-amber-400 mt-2">
                        {totalOTHours} <span className="text-base text-amber-400/80">hrs</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-amber-500/20">
                      <span className="text-[11px] font-semibold text-amber-400/80 uppercase tracking-wider">
                        Daily Overtime Sum
                      </span>
                    </div>
                  </div>

                  {/* KORBA BOX 3: TOTAL ATTENDANCE DAYS */}
                  <div className="bg-[#0e1d2f] border border-emerald-500/30 rounded-xl p-4.5 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="block text-xs font-bold uppercase text-emerald-400 tracking-wider">
                        Total Attendance Days
                      </span>
                      <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
                        {presentDays}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-emerald-500/20">
                      <span className="text-[11px] font-semibold text-emerald-400/80 uppercase tracking-wider">
                        Days Worked
                      </span>
                    </div>
                  </div>

                  {/* KORBA BOX 4: TOTAL MAN DAYS (FINAL PAYROLL) */}
                  <div className="bg-gradient-to-br from-[#1c2b3c] to-[#142334] border-2 border-[#ffb690] rounded-xl p-4.5 flex flex-col justify-between shadow-[0_0_15px_rgba(255,182,144,0.15)]">
                    <div>
                      <span className="block text-xs font-black uppercase text-[#ffb690] tracking-wider">
                        Total Man Days
                      </span>
                      <div className="text-3xl font-black font-mono text-[#ffb690] mt-2">
                        {totalManDays}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#ffb690]/30">
                      <span className="text-[11px] font-black text-[#ffb690] uppercase tracking-wider">
                        Final Payroll Total
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* SURAT BOX 1: WEEKDAY MAN DAYS */}
                  <div className="bg-[#0e1d2f] border border-[#45464d]/30 rounded-xl p-4.5 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="block text-xs font-bold uppercase text-[#94a3b8] tracking-wider">
                        Weekday Man Days
                      </span>
                      <div className="text-3xl font-black font-mono text-[#d4e4fa] mt-2">
                        {weekdayManDays}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#45464d]/20">
                      <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                        12 hr basis
                      </span>
                    </div>
                  </div>

                  {/* SURAT BOX 2: NIGHT MAN DAYS */}
                  <div className="bg-[#0e1d2f] border border-amber-500/30 rounded-xl p-4.5 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="block text-xs font-bold uppercase text-amber-400 tracking-wider">
                        Night Man Days
                      </span>
                      <div className="text-3xl font-black font-mono text-amber-400 mt-2">
                        {nightManDays}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-amber-500/20">
                      <span className="text-[11px] font-semibold text-amber-400/80 uppercase tracking-wider">
                        6 hr basis
                      </span>
                    </div>
                  </div>

                  {/* SURAT BOX 3: SUNDAY WORK */}
                  <div className="bg-[#0e1d2f] border border-orange-500/30 rounded-xl p-4.5 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="block text-xs font-bold uppercase text-[#ffb690] tracking-wider mb-2">
                        Sunday Work
                      </span>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <span className="text-xl font-bold font-mono text-[#d4e4fa]">
                            {sundayHours} <span className="text-xs text-[#94a3b8]">hrs</span>
                          </span>
                          <span className="block text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider mt-0.5">
                            Sunday Hours
                          </span>
                        </div>
                        <div>
                          <span className="text-xl font-bold font-mono text-[#ffb690]">
                            {sundayRatio}
                          </span>
                          <span className="block text-[10px] uppercase font-bold text-[#ffb690]/80 tracking-wider mt-0.5">
                            Sunday Man Days
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-orange-500/20">
                      <span className="text-[11px] font-semibold text-orange-400/80 uppercase tracking-wider">
                        5 hr basis (Hours / 5)
                      </span>
                    </div>
                  </div>

                  {/* SURAT BOX 4: TOTAL MAN DAYS */}
                  <div className="bg-gradient-to-br from-[#1c2b3c] to-[#142334] border-2 border-[#ffb690] rounded-xl p-4.5 flex flex-col justify-between shadow-[0_0_15px_rgba(255,182,144,0.15)]">
                    <div>
                      <span className="block text-xs font-black uppercase text-[#ffb690] tracking-wider">
                        Total Man Days
                      </span>
                      <div className="text-3xl font-black font-mono text-[#ffb690] mt-2">
                        {totalManDays}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#ffb690]/30">
                      <span className="text-[11px] font-black text-[#ffb690] uppercase tracking-wider">
                        Final Payroll Total
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── ATTENDANCE TABLE SECTION ── */}
          <div className="space-y-2 select-text">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#909097] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                {isKorba ? 'Korba Daily Attendance Log (MD & OT)' : 'Daily Attendance & Shift Telemetry Log'}
              </span>
              <span className="text-xs text-[#64748b]">
                Total Records: {records.length}
              </span>
            </div>

            <div className="rounded-xl border border-[#45464d]/30 overflow-hidden bg-[#0b1726] shadow-inner">
              <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs select-text">
                  <thead className="sticky top-0 z-10 bg-[#142436] text-[#94a3b8] font-bold uppercase text-[11px] tracking-wider border-b border-[#45464d]/40 shadow-sm">
                    {isKorba ? (
                      <tr>
                        <th className="py-3 px-6">Date</th>
                        <th className="py-3 px-4 text-center">Day</th>
                        <th className="py-3 px-6 text-center">MD (Man Day)</th>
                        <th className="py-3 px-6 text-center">OT Hours</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-3">Day</th>
                        <th className="py-3 px-3">Day In</th>
                        <th className="py-3 px-3">Day Out</th>
                        <th className="py-3 px-3">Night In</th>
                        <th className="py-3 px-3">Night Out</th>
                        <th className="py-3 px-3">Day Man Day</th>
                        <th className="py-3 px-3">Night Man Day</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-[#45464d]/20 font-mono">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={isKorba ? 4 : 8} className="py-8 text-center text-sm text-[#909097]">
                          No attendance entries recorded for this worker in the selected period.
                        </td>
                      </tr>
                    ) : (
                      records.map((r, idx) => {
                        const isSun =
                          r.IsSunday === true ||
                          String(r.DayName || '').toUpperCase() === 'SUN' ||
                          String(r.DayName || '').toUpperCase() === 'SUNDAY';
                        const isEven = idx % 2 === 0;

                        const rowBg = isSun
                          ? 'bg-[#ffb690]/10 hover:bg-[#ffb690]/15'
                          : isEven
                          ? 'bg-[#0d1c2d] hover:bg-[#122438]'
                          : 'bg-[#091522] hover:bg-[#122438]';

                        const borderLeftClass = isSun
                          ? 'border-l-4 border-l-[#ffb690]'
                          : 'border-l-4 border-l-transparent';

                        const dayDisplayName = (r.DayName || '').toUpperCase();
                        const formattedDay = dayDisplayName.startsWith('SUN')
                          ? 'SUN'
                          : dayDisplayName.slice(0, 3) || '—';

                        if (isKorba) {
                          const mdVal = (r.MD != null ? parseFloat(r.MD) : (r.ManDay != null ? parseFloat(r.ManDay) : 0)).toFixed(2);
                          const otVal = (r.OTHours != null ? parseFloat(r.OTHours) : 0).toFixed(2);
                          const hasMd = parseFloat(mdVal) > 0;
                          const hasOt = parseFloat(otVal) > 0;

                          return (
                            <tr
                              key={idx}
                              className={`${rowBg} ${borderLeftClass} transition-colors select-text`}
                            >
                              {/* Date */}
                              <td className="py-2.5 px-6 font-semibold text-[#d4e4fa] select-text">
                                {r.Date || '—'}
                              </td>

                              {/* Day */}
                              <td className="py-2.5 px-4 text-center font-sans font-semibold select-text">
                                {isSun ? (
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#ffb690]/20 text-[#ffb690] border border-[#ffb690]/30">
                                    SUN
                                  </span>
                                ) : (
                                  <span className="text-[#909097]">{formattedDay}</span>
                                )}
                              </td>

                              {/* MD */}
                              <td className="py-2.5 px-6 text-center select-text">
                                <span className={`font-bold font-mono text-sm ${hasMd ? 'text-[#d4e4fa]' : 'text-[#45464d]'}`}>
                                  {mdVal}
                                </span>
                              </td>

                              {/* OT Hours */}
                              <td className="py-2.5 px-6 text-center select-text">
                                <span className={`font-bold font-mono text-sm ${hasOt ? 'text-amber-400' : 'text-[#45464d]'}`}>
                                  {otVal}
                                </span>
                              </td>
                            </tr>
                          );
                        }

                        const dayManDayVal =
                          r.DayManDay != null
                            ? typeof r.DayManDay === 'number'
                              ? r.DayManDay.toFixed(2)
                              : parseFloat(r.DayManDay || 0).toFixed(2)
                            : r.WeekdayManDay != null
                            ? typeof r.WeekdayManDay === 'number'
                              ? r.WeekdayManDay.toFixed(2)
                              : parseFloat(r.WeekdayManDay || 0).toFixed(2)
                            : r.ManDay != null
                            ? typeof r.ManDay === 'number'
                              ? r.ManDay.toFixed(2)
                              : parseFloat(r.ManDay || 0).toFixed(2)
                            : '0.00';

                        const nightManDayVal =
                          r.NightManDay != null
                            ? typeof r.NightManDay === 'number'
                              ? r.NightManDay.toFixed(2)
                              : parseFloat(r.NightManDay || 0).toFixed(2)
                            : r.nightManDay != null
                            ? typeof r.nightManDay === 'number'
                              ? r.nightManDay.toFixed(2)
                              : parseFloat(r.nightManDay || 0).toFixed(2)
                            : '0.00';

                        const sundayHrsVal =
                          r.SundayHours != null
                            ? typeof r.SundayHours === 'number'
                              ? r.SundayHours.toFixed(2)
                              : r.SundayHours
                            : null;

                        return (
                          <tr
                            key={idx}
                            className={`${rowBg} ${borderLeftClass} transition-colors select-text`}
                          >
                            {/* Date */}
                            <td className="py-2.5 px-4 font-semibold text-[#d4e4fa] select-text">
                              {r.Date || '—'}
                            </td>

                            {/* Day */}
                            <td className="py-2.5 px-3 font-sans font-semibold select-text">
                              {isSun ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#ffb690]/20 text-[#ffb690] border border-[#ffb690]/30">
                                  SUN
                                </span>
                              ) : (
                                <span className="text-[#909097]">{formattedDay}</span>
                              )}
                            </td>

                            {/* Day In */}
                            <td
                              className={`py-2.5 px-3 select-text ${
                                r.DayIn ? 'text-emerald-400 font-semibold' : 'text-[#45464d]'
                              }`}
                            >
                              {r.DayIn || '—'}
                            </td>

                            {/* Day Out */}
                            <td
                              className={`py-2.5 px-3 select-text ${
                                r.DayOut ? 'text-[#c6c6cd]' : 'text-[#45464d]'
                              }`}
                            >
                              {r.DayOut || '—'}
                            </td>

                            {/* Night In */}
                            <td
                              className={`py-2.5 px-3 select-text ${
                                r.NightIn ? 'text-amber-400 font-semibold' : 'text-[#45464d]'
                              }`}
                            >
                              {r.NightIn || '—'}
                            </td>

                            {/* Night Out */}
                            <td
                              className={`py-2.5 px-3 select-text ${
                                r.NightOut ? 'text-[#c6c6cd]' : 'text-[#45464d]'
                              }`}
                            >
                              {r.NightOut || '—'}
                            </td>

                            {/* Day Man Day */}
                            <td className="py-2.5 px-3 select-text">
                              <div className="font-bold text-[#d4e4fa]">{dayManDayVal}</div>
                              {isSun && sundayHrsVal != null && (
                                <div className="text-[10px] font-sans text-[#909097]">
                                  {sundayHrsVal} hrs
                                </div>
                              )}
                            </td>

                            {/* Night Man Day */}
                            <td className="py-2.5 px-3 select-text">
                              <div
                                className={`font-bold ${
                                  parseFloat(nightManDayVal) > 0 ? 'text-amber-400' : 'text-[#45464d]'
                                }`}
                              >
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
            </div>
          </div>
        </div>

        {/* ── 3. WORKSPACE ACTIONS FOOTER ── */}
        <div className="bg-[#05101a] border-t border-[#45464d]/30 px-6 py-4 flex items-center justify-between flex-shrink-0 select-text">
          <div className="text-xs text-[#909097] hidden sm:block select-text">
            Official Telemetry & Verification • Kamla Enterprises Attendance Portal
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Print Card Button */}
            {onPrintCard && (
              <button
                onClick={() => onPrintCard(worker)}
                className="px-4 py-2 bg-[#142334] hover:bg-[#1c2b3c] border border-[#45464d]/40 text-[#d4e4fa] rounded-lg font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Print Card
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#909097] hover:text-[#d4e4fa] font-semibold text-xs uppercase tracking-wider cursor-pointer transition-colors"
            >
              Close
            </button>

            {/* Download PDF Button */}
            {onDownloadSingle && (
              <button
                onClick={() => onDownloadSingle(worker)}
                disabled={isDownloading}
                className="px-5 py-2 bg-[#ffb690] hover:bg-[#ffc6a8] disabled:opacity-50 text-[#552100] font-bold text-xs uppercase tracking-wider rounded-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isDownloading ? 'hourglass_top' : 'download'}
                </span>
                {isDownloading ? 'Exporting PDF...' : 'Download Attendance Card'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WorkerDetailModal;
