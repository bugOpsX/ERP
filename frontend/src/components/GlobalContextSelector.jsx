import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { LocationOn, CalendarMonth, Factory, CheckCircle, WarningAmber } from '@mui/icons-material';

const GlobalContextSelector = () => {
  const {
    plantCode,
    selectedPlant,
    year,
    month,
    unit,
    plants,
    availableYears,
    availableMonths,
    supportedUnits,
    isDataAvailable,
    setPlantCode,
    setYear,
    setMonth,
    setUnit,
  } = useAttendance();

  return (
    <div className="bg-[#0a1e38] border border-[#1e3a8a]/40 rounded-xl p-3 shadow-lg mb-6 flex flex-wrap items-center justify-between gap-4">
      {/* Left: Plant & Location Info */}
      <div className="flex items-center gap-3">
        <div className="bg-[#1e3a8a]/30 p-2 rounded-lg text-[#00f2fe] border border-[#00f2fe]/20">
          <LocationOn fontSize="small" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <select
              value={plantCode}
              onChange={(e) => setPlantCode(e.target.value)}
              className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer border-b border-dashed border-[#00f2fe]/40 pr-2 hover:border-[#00f2fe]"
            >
              {plants.map((p) => (
                <option key={p.code} value={p.code} className="bg-[#0a1e38] text-white">
                  {p.name} {p.city ? `(${p.city}, ${p.state || ''})` : ''} {!p.isImplemented ? '[Future]' : ''}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-400">
            {selectedPlant.city ? `${selectedPlant.city}, ${selectedPlant.state || ''}` : 'Location'} • {selectedPlant.code}
          </p>
        </div>
      </div>

      {/* Middle: Controls Group (Year, Month, Unit) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Year Selector */}
        <div className="flex items-center gap-1.5 bg-[#051424] border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
          <CalendarMonth fontSize="small" className="text-[#00f2fe]" />
          <span className="text-slate-400 font-medium">Year:</span>
          <select
            value={year || ''}
            onChange={(e) => setYear(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer pr-1"
          >
            {availableYears.map((y) => (
              <option key={y} value={y} className="bg-[#051424] text-white">
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-1.5 bg-[#051424] border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
          <span className="text-slate-400 font-medium">Month:</span>
          <select
            value={month || ''}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer pr-1"
          >
            {availableMonths.map((m) => (
              <option key={m.month} value={m.month} className="bg-[#051424] text-white">
                {m.monthName} {m.recordCount > 0 ? `(${m.recordCount} recs)` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Unit Selector */}
        <div className="flex items-center gap-1.5 bg-[#051424] border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
          <Factory fontSize="small" className="text-[#ff9f43]" />
          <span className="text-slate-400 font-medium">Unit:</span>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer pr-1"
          >
            {supportedUnits.map((u) => (
              <option key={u} value={u} className="bg-[#051424] text-white">
                {u === 'ALL' ? 'ALL UNITS' : u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Data Availability Status Indicator */}
      <div className="flex items-center gap-2">
        {isDataAvailable ? (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-medium">
            <CheckCircle fontSize="inherit" />
            PostgreSQL Data Available
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-medium">
            <WarningAmber fontSize="inherit" />
            Not Imported
          </span>
        )}
      </div>
    </div>
  );
};

export default GlobalContextSelector;
