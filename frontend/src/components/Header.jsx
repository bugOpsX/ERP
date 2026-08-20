import React, { useState } from 'react';
import { useSite } from '../context/SiteContext';
import { useAuth } from '../context/AuthContext';

/**
 * Top Navigation Bar matching Stitch design.
 * Includes Search bar, Global Site (Blast Furnace) selector, "Download All Attendance Cards" action button, and live status.
 */
const Header = ({
  onDownloadAll,
  isGeneratingBulk,
  isMock
}) => {
  const {
    currentSite,
    setCurrentSite,
    units,
    searchQuery,
    setSearchQuery,
    loading,
    refresh
  } = useSite();

  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-[240px] h-16 bg-[#051424] border-b border-[#45464d]/20 z-40 flex items-center justify-between px-8">
      {/* Search & Site Selector Area */}
      <div className="flex items-center gap-6 w-full max-w-2xl">
        {/* Search Input Bar */}
        <div className="relative flex-1 group">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c6c6cd] text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search workers inside ${currentSite === 'All' ? 'all units' : currentSite}...`}
            className="w-full bg-[#0d1c2d] border border-[#45464d]/30 rounded px-10 py-2 text-sm text-[#d4e4fa] placeholder-[#909097] focus:outline-none focus:border-[#ffb690] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#909097] hover:text-[#d4e4fa] text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Global Site Selector Dropdown */}
        <div className="flex items-center gap-2 bg-[#0d1c2d] border border-[#45464d]/30 rounded px-3 py-1.5 focus-within:border-[#ffb690] transition-all">
          <span className="material-symbols-outlined text-[#ffb690] text-[18px]">factory</span>
          <select
            value={currentSite}
            onChange={(e) => setCurrentSite(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#d4e4fa] focus:outline-none cursor-pointer pr-2 uppercase tracking-wider"
          >
            {units.map((unit) => (
              <option key={unit} value={unit} className="bg-[#0d1c2d] text-[#d4e4fa] uppercase">
                {unit === 'All' ? 'All Units' : unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Actions Bar */}
      <div className="flex items-center gap-4">
        {/* Download All Attendance Cards Button */}
        <button
          onClick={onDownloadAll}
          disabled={isGeneratingBulk}
          className="bg-[#ffb690] text-[#552100] hover:bg-[#ffc6a8] disabled:opacity-50 px-5 py-2 rounded font-semibold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 shadow-sm cursor-pointer"
          title={`Export single PDF containing all attendance cards for ${currentSite === 'All' ? 'all units' : currentSite}`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isGeneratingBulk ? 'hourglass_top' : 'download'}
          </span>
          {isGeneratingBulk ? 'Generating PDF...' : 'Download All Attendance Cards'}
        </button>

        {/* Refresh Button */}
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 text-[#c6c6cd] hover:text-[#ffb690] hover:bg-[#1c2b3c] rounded transition-colors"
          title="Refresh Data"
        >
          <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
        </button>

        {/* Notifications & Settings */}
        <div className="flex items-center gap-1 border-l border-[#45464d]/20 pl-3">
          <button className="p-2 text-[#c6c6cd] hover:text-[#ffb690] hover:bg-[#1c2b3c] rounded transition-colors">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
          <button className="p-2 text-[#c6c6cd] hover:text-[#ffb690] hover:bg-[#1c2b3c] rounded transition-colors">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>

        {/* Administrator Profile & Logout Dropdown */}
        <div className="relative border-l border-[#45464d]/20 pl-3">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1c2d] hover:bg-[#16273b] border border-[#233549] hover:border-[#ffb690]/40 rounded transition-all cursor-pointer text-xs font-semibold text-[#d4e4fa]"
          >
            <span className="material-symbols-outlined text-[18px] text-[#ffb690]">
              account_circle
            </span>
            <span>{user?.username || 'Admin'}</span>
            <span className="material-symbols-outlined text-[16px] text-[#8ca3ba]">
              arrow_drop_down
            </span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#0d1c2d] border border-[#233549] rounded-xl shadow-2xl p-3 z-50 animate-fadeIn">
              <div className="px-2 py-1.5 mb-2 border-b border-[#1c2c3e]">
                <p className="text-[11px] font-bold text-[#8ca3ba] uppercase tracking-wider">
                  Administrator
                </p>
                <p className="text-xs font-semibold text-white mt-0.5">
                  Logged in as: <span className="text-[#ffb690]">{user?.username || 'admin'}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
