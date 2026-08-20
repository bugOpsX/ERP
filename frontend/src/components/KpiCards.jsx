import React, { useMemo } from 'react';
import { useSite } from '../context/SiteContext';

/**
 * KPI Metric Cards matching industrial design system.
 * Pure presentation component displaying high-density summary statistics using API values.
 */
const KpiCards = ({ workers = [] }) => {
  const { currentSite } = useSite();
  const unitLabel = currentSite === 'All' ? 'all units' : currentSite;

  const stats = useMemo(() => {
    const total = workers.length;
    if (total === 0) {
      return { present: 0, total: 0, nightShifts: 0, totalManDays: '0.00' };
    }

    let present = 0;
    let nightShifts = 0;
    let sumTotalManDays = 0;

    workers.forEach((w) => {
      const pDays = w.PresentDays ?? (Array.isArray(w.Attendance) ? w.Attendance.filter(r => r.DayIn || r.NightIn).length : 0);
      const nShifts = w.NightShifts ?? (Array.isArray(w.Attendance) ? w.Attendance.filter(r => r.NightIn).length : 0);
      const mDays = typeof w.TotalManDays === 'number' ? w.TotalManDays : parseFloat(w.TotalManDays || 0);

      if (pDays > 0) {
        present++;
      }
      nightShifts += nShifts;
      sumTotalManDays += mDays;
    });

    return {
      present,
      total,
      nightShifts,
      totalManDays: sumTotalManDays.toFixed(2),
    };
  }, [workers]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Present Workforce */}
      <div className="bg-[#1c2b3c] p-5 rounded-xl border border-[#45464d]/20 inner-glow flex flex-col justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#909097] mb-2">
            Present Workforce
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#d4e4fa]">{stats.present}</span>
            <span className="text-emerald-400 text-xs font-semibold font-mono">Active</span>
          </div>
        </div>
        <p className="text-[10px] font-semibold text-[#909097]/80 uppercase tracking-widest mt-4 pt-2 border-t border-[#45464d]/10 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px] text-[#ffb690]">factory</span>
          For {unitLabel}
        </p>
      </div>

      {/* Total Strength */}
      <div className="bg-[#1c2b3c] p-5 rounded-xl border border-[#45464d]/20 inner-glow flex flex-col justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#909097] mb-2">
            Total Roster
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#d4e4fa]">{stats.total}</span>
            <span className="text-[#909097] text-xs font-mono">Workers</span>
          </div>
        </div>
        <p className="text-[10px] font-semibold text-[#909097]/80 uppercase tracking-widest mt-4 pt-2 border-t border-[#45464d]/10 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px] text-[#ffb690]">factory</span>
          For {unitLabel}
        </p>
      </div>

      {/* Night Shifts */}
      <div className="bg-[#1c2b3c] p-5 rounded-xl border border-[#45464d]/20 inner-glow flex flex-col justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#909097] mb-2">
            Night Shift Activity
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#d4e4fa]">{stats.nightShifts}</span>
            <span className="text-[#ffb690] text-xs font-mono">Shifts</span>
          </div>
        </div>
        <p className="text-[10px] font-semibold text-[#909097]/80 uppercase tracking-widest mt-4 pt-2 border-t border-[#45464d]/10 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px] text-[#ffb690]">factory</span>
          For {unitLabel}
        </p>
      </div>

      {/* Total Payroll Man Days */}
      <div className="bg-[#1c2b3c] p-5 rounded-xl border border-[#45464d]/20 inner-glow flex flex-col justify-between border-l-4 border-l-[#ffb690]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ffb690] mb-2">
            Total Payroll Man Days
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#ffb690]">{stats.totalManDays}</span>
            <span className="text-[#ffb690]/80 text-xs font-mono">Man Days</span>
          </div>
        </div>
        <p className="text-[10px] font-semibold text-[#909097]/80 uppercase tracking-widest mt-4 pt-2 border-t border-[#45464d]/10 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px] text-[#ffb690]">factory</span>
          For {unitLabel}
        </p>
      </div>
    </div>
  );
};

export default KpiCards;
