import React from 'react';
import { useSite } from '../context/SiteContext';

/**
 * Sidebar component following Stitch design system.
 * Dark industrial navy palette with status indicator.
 */
const Sidebar = ({ isMock, activeTab = 'attendance' }) => {
  const { currentSite } = useSite();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-[#0d1c2d] border-r border-[#45464d]/20 z-50 flex flex-col py-8 select-none">
      {/* Brand Logo & Header */}
      <div className="px-3 mb-6 flex items-center gap-3">
        <div className="w-20 h-20 rounded-2xl bg-[#051424] p-1 border border-white/20 shrink-0 shadow-xl flex items-center justify-center overflow-hidden">
          <img
            src="/logo.png"
            alt="Kamla Enterprises Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="font-black text-base text-white tracking-tight leading-snug">Kamla Enterprises</h1>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mt-0.5">
            Labor Management
          </p>
        </div>
      </div>

      {/* Active Plant Unit Indicator */}
      <div className="px-6 mb-6">
        <div className="p-3 bg-[#051424] border border-[#ffb690]/15 rounded-lg flex flex-col gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-[#909097]">
            Active Plant Unit
          </span>
          <div className="flex items-center gap-2 text-xs font-bold text-[#ffb690] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px]">factory</span>
            {currentSite === 'All' ? 'ALL UNITS' : currentSite}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5">
        <a
          href="#dashboard"
          className={`group flex items-center gap-3 px-4 py-3 rounded transition-all text-sm font-medium ${
            activeTab === 'dashboard'
              ? 'text-[#ffb690] font-bold border-r-2 border-[#ffb690] bg-[#273647]'
              : 'text-[#c6c6cd] hover:bg-[#273647] hover:text-[#d4e4fa]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          <span className="text-xs uppercase tracking-wider font-semibold">Dashboard</span>
        </a>

        <a
          href="#workers"
          className={`group flex items-center gap-3 px-4 py-3 rounded transition-all text-sm font-medium ${
            activeTab === 'workers'
              ? 'text-[#ffb690] font-bold border-r-2 border-[#ffb690] bg-[#273647]'
              : 'text-[#c6c6cd] hover:bg-[#273647] hover:text-[#d4e4fa]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">groups</span>
          <span className="text-xs uppercase tracking-wider font-semibold">Workers</span>
        </a>

        <a
          href="#attendance"
          className={`group flex items-center gap-3 px-4 py-3 rounded transition-all text-sm font-medium ${
            activeTab === 'attendance'
              ? 'text-[#ffb690] font-bold border-r-2 border-[#ffb690] bg-[#273647]'
              : 'text-[#c6c6cd] hover:bg-[#273647] hover:text-[#d4e4fa]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">calendar_today</span>
          <span className="text-xs uppercase tracking-wider font-semibold">Attendance</span>
        </a>

        <a
          href="#reports"
          className={`group flex items-center gap-3 px-4 py-3 rounded transition-all text-sm font-medium ${
            activeTab === 'reports'
              ? 'text-[#ffb690] font-bold border-r-2 border-[#ffb690] bg-[#273647]'
              : 'text-[#c6c6cd] hover:bg-[#273647] hover:text-[#d4e4fa]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">analytics</span>
          <span className="text-xs uppercase tracking-wider font-semibold">Reports</span>
        </a>

        {/* Data Management Section */}
        <div className="pt-4 pb-1">
          <p className="px-4 text-[9px] font-bold uppercase tracking-widest text-[#909097]/70 mb-2">
            Data Management
          </p>
          <a
            href="#upload"
            className={`group flex items-center gap-3 px-4 py-3 rounded transition-all text-sm font-medium ${
              activeTab === 'upload'
                ? 'text-[#ffb690] font-bold border-r-2 border-[#ffb690] bg-[#273647]'
                : 'text-[#c6c6cd] hover:bg-[#273647] hover:text-[#d4e4fa]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
            <span className="text-xs uppercase tracking-wider font-semibold">Upload Attendance</span>
          </a>
          <a
            href="#history"
            className={`group flex items-center gap-3 px-4 py-3 rounded transition-all text-sm font-medium ${
              activeTab === 'history'
                ? 'text-[#ffb690] font-bold border-r-2 border-[#ffb690] bg-[#273647]'
                : 'text-[#c6c6cd] hover:bg-[#273647] hover:text-[#d4e4fa]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
            <span className="text-xs uppercase tracking-wider font-semibold">Import History</span>
          </a>
        </div>
      </nav>

      {/* System Status Container */}
      <div className="mt-auto px-6 py-4">
        <div className="p-4 rounded-xl bg-[#1c2b3c] border border-[#45464d]/30 shadow-inner">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#909097]">
            System Status
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isMock ? 'bg-amber-400' : 'bg-green-500'} animate-pulse`} />
            <span className="text-xs font-mono font-medium text-[#d4e4fa]">
              {isMock ? 'Mock Data Active' : 'n8n Sync Active'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
