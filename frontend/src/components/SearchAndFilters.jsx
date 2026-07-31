import React from 'react';
import { useSite } from '../context/SiteContext';

/**
 * Filter & Overview header section matching Stitch design.
 * Displays page title, live shift timestamp, designation selector, and mock mode banner.
 */
const SearchAndFilters = ({
  isMock,
  selectedDesignation,
  setSelectedDesignation,
  designationList = []
}) => {
  const { currentSite } = useSite();
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="mb-6">
      {/* Mock Data Banner if backend is serving mock data */}
      {isMock && (
        <div className="mb-6 p-4 rounded-xl bg-[#1c2b3c] border border-amber-500/30 text-amber-200 flex items-start gap-3 shadow-md">
          <span className="material-symbols-outlined text-amber-400 text-[22px] mt-0.5">
            info
          </span>
          <div className="text-xs">
            <span className="font-bold block text-amber-300 mb-0.5">Local Mock Data Mode Active</span>
            The backend is currently returning mock attendance records because the n8n webhook URL is using fallback configuration. To switch to live n8n synchronization, set the <code>N8N_ATTENDANCE_WEBHOOK_URL</code> in your backend environment.
          </div>
        </div>
      )}

      {/* Overview Title & Designation Filter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#d4e4fa] tracking-tight flex items-center flex-wrap gap-3">
            <span>Daily Attendance Overview</span>
            <span className="text-sm font-bold bg-[#ffb690]/15 text-[#ffb690] px-3 py-1 rounded border border-[#ffb690]/25 flex items-center gap-1 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">factory</span>
              {currentSite === 'All' ? 'ALL UNITS' : currentSite}
            </span>
          </h2>
          <p className="text-sm text-[#909097] flex items-center gap-2 mt-1.5 font-medium">
            <span className="material-symbols-outlined text-[18px] text-[#ffb690]">event</span>
            {currentDateFormatted} • Shift A
          </p>
        </div>

        {/* Designation Filter Select */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#0d1c2d] rounded border border-[#45464d]/30">
          <span className="text-xs font-semibold text-[#909097] uppercase tracking-wider">
            Filter:
          </span>
          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="bg-transparent border-none text-sm text-[#d4e4fa] font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-[#0d1c2d] text-[#d4e4fa]">
              All Designations
            </option>
            {designationList.map((desig) => (
              <option key={desig} value={desig} className="bg-[#0d1c2d] text-[#d4e4fa]">
                {desig}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;
