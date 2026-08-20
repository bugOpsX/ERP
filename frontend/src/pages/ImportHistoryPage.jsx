import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../services/api';
import { useAttendance } from '../context/AttendanceContext';
import ImportDetailsDrawer from '../components/ImportDetailsDrawer';

const MONTH_NAMES = [
  'All Months',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ImportHistoryPage = () => {
  const { setPlantCode, setYear, setMonth, setUnit } = useAttendance();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [filterPlant, setFilterPlant] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Selected import for drawer
  const [selectedImportId, setSelectedImportId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (filterPlant !== 'ALL') filters.plantCode = filterPlant;
      if (filterYear !== 'ALL') filters.year = filterYear;
      if (filterMonth !== 'ALL') filters.month = filterMonth;
      if (filterStatus !== 'ALL') filters.status = filterStatus;

      const data = await attendanceService.getImportHistory(filters);
      setHistory(data);
    } catch (err) {
      console.error('Error fetching import history:', err);
      setError(err.message || 'Failed to fetch import history logs.');
    } finally {
      setLoading(false);
    }
  }, [filterPlant, filterYear, filterMonth, filterStatus]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleOpenDetails = (id) => {
    setSelectedImportId(id);
    setDrawerOpen(true);
  };

  const handleViewAttendance = (imp) => {
    setPlantCode(imp.plant_code || 'PLANT_A');
    setYear(imp.year);
    setMonth(imp.month);
    setUnit('ALL');
    window.location.hash = '#attendance';
  };

  const handleResetFilters = () => {
    setFilterPlant('ALL');
    setFilterYear('ALL');
    setFilterMonth('ALL');
    setFilterStatus('ALL');
  };

  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'imported') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ACTIVE (IMPORTED)
        </span>
      );
    }
    if (s === 'replaced') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          REPLACED
        </span>
      );
    }
    if (s === 'failed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-400">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          FAILED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400">
        {status?.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#45464d]/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-[#ffb690]">history</span>
            <h1 className="text-2xl font-bold text-[#d4e4fa] tracking-tight">
              Attendance Import History
            </h1>
          </div>
          <p className="text-xs text-[#909097] mt-1">
            Complete audit trail of attendance uploads, version replacements, and dataset statuses.
          </p>
        </div>

        <a
          href="#upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ffb690] text-[#552100] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#ffc6a8] transition-all cursor-pointer shadow-lg self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
          Upload New Dataset
        </a>
      </div>

      {/* Server-Side Filter Controls Bar */}
      <div className="p-4 bg-[#0d1c2d] border border-[#45464d]/30 rounded-2xl flex flex-wrap items-center gap-4 shadow-inner">
        {/* Plant Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#909097]">
            Plant Location
          </label>
          <select
            value={filterPlant}
            onChange={(e) => setFilterPlant(e.target.value)}
            className="bg-[#122131] text-[#d4e4fa] text-xs font-semibold px-3 py-2 rounded-lg border border-[#45464d]/30 focus:border-[#ffb690] outline-none cursor-pointer"
          >
            <option value="ALL">All Plants</option>
            <option value="PLANT_A">Surat, Gujarat (PLANT_A)</option>
          </select>
        </div>

        {/* Year Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#909097]">
            Year
          </label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="bg-[#122131] text-[#d4e4fa] text-xs font-semibold px-3 py-2 rounded-lg border border-[#45464d]/30 focus:border-[#ffb690] outline-none cursor-pointer"
          >
            <option value="ALL">All Years</option>
            <option value="2026">2026</option>
          </select>
        </div>

        {/* Month Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#909097]">
            Month
          </label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-[#122131] text-[#d4e4fa] text-xs font-semibold px-3 py-2 rounded-lg border border-[#45464d]/30 focus:border-[#ffb690] outline-none cursor-pointer"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx === 0 ? 'ALL' : idx}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#909097]">
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#122131] text-[#d4e4fa] text-xs font-semibold px-3 py-2 rounded-lg border border-[#45464d]/30 focus:border-[#ffb690] outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="imported">Active (IMPORTED)</option>
            <option value="replaced">Replaced</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(filterPlant !== 'ALL' || filterYear !== 'ALL' || filterMonth !== 'ALL' || filterStatus !== 'ALL') && (
          <button
            onClick={handleResetFilters}
            className="mt-4 px-3 py-2 text-xs text-[#909097] hover:text-[#d4e4fa] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">clear_all</span>
            Reset Filters
          </button>
        )}
      </div>

      {/* History Data Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-[#ffb690] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#909097] uppercase tracking-wider">
            Fetching import history...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
          <span className="material-symbols-outlined text-[40px] text-rose-400 mb-2">
            error_outline
          </span>
          <p className="text-sm font-semibold text-rose-400 mb-4">{error}</p>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-rose-600 transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 bg-[#0d1c2d] border border-[#45464d]/20 rounded-2xl text-center space-y-4">
          <span className="material-symbols-outlined text-[56px] text-[#909097]">
            history_toggle_off
          </span>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#d4e4fa]">No Import Records Found</h3>
            <p className="text-xs text-[#909097]">
              No attendance uploads match the selected plant, period, or status criteria.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#273647] text-[#d4e4fa] font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#32455b] transition-all cursor-pointer"
            >
              Clear Filters
            </button>
            <a
              href="#upload"
              className="px-4 py-2 bg-[#ffb690] text-[#552100] font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#ffc6a8] transition-all cursor-pointer"
            >
              Upload Attendance
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-[#0d1c2d] border border-[#45464d]/30 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#d4e4fa] border-collapse">
              <thead>
                <tr className="bg-[#051424] border-b border-[#45464d]/30 text-[10px] font-bold uppercase tracking-wider text-[#909097]">
                  <th className="py-4 px-4">Import ID</th>
                  <th className="py-4 px-4">Plant & Location</th>
                  <th className="py-4 px-4">Period</th>
                  <th className="py-4 px-4">Units</th>
                  <th className="py-4 px-4">Stored Records</th>
                  <th className="py-4 px-4">Workers</th>
                  <th className="py-4 px-4">Uploaded At</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#45464d]/20">
                {history.map((imp) => {
                  const isActive = imp.status === 'imported';
                  const monthName = MONTH_NAMES[imp.month] || `Month ${imp.month}`;

                  return (
                    <tr
                      key={imp.id}
                      className={`hover:bg-[#122131] transition-colors ${
                        isActive ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      {/* Import ID */}
                      <td className="py-4 px-4 font-mono font-bold text-[#ffb690]">
                        #{imp.id}
                      </td>

                      {/* Plant & Location */}
                      <td className="py-4 px-4">
                        <span className="font-bold block text-[#d4e4fa]">
                          {imp.plant_name || 'Kamla Enterprises Plant'}
                        </span>
                        <span className="text-[10px] text-[#909097]">
                          {imp.plant_city || 'Surat'}, {imp.plant_state || 'Gujarat'}
                        </span>
                      </td>

                      {/* Period */}
                      <td className="py-4 px-4 font-semibold text-[#d4e4fa]">
                        {monthName} {imp.year}
                      </td>

                      {/* Units */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-[10px] font-bold">
                          <span className="px-1.5 py-0.5 bg-[#051424] text-[#ffb690] rounded border border-[#45464d]/20">
                            BF-2
                          </span>
                          <span className="px-1.5 py-0.5 bg-[#051424] text-[#ffb690] rounded border border-[#45464d]/20">
                            BF-3
                          </span>
                        </div>
                      </td>

                      {/* Stored Records */}
                      <td className="py-4 px-4 font-mono">
                        {(imp.total_record_count || 0).toLocaleString()} recs
                      </td>

                      {/* Workers */}
                      <td className="py-4 px-4 font-mono">
                        {(imp.worker_count || 0).toLocaleString()} workers
                      </td>

                      {/* Uploaded At */}
                      <td className="py-4 px-4 text-[#909097] text-[11px]">
                        {new Date(imp.uploaded_at).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">{renderStatusBadge(imp.status)}</td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetails(imp.id)}
                            className="px-3 py-1.5 bg-[#273647] text-[#d4e4fa] hover:bg-[#32455b] font-semibold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            title="View Full Import Details"
                          >
                            <span className="material-symbols-outlined text-[15px]">info</span>
                            Details
                          </button>

                          {isActive && (
                            <button
                              onClick={() => handleViewAttendance(imp)}
                              className="px-3 py-1.5 bg-[#ffb690] text-[#552100] hover:bg-[#ffc6a8] font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow"
                              title="View Attendance Data"
                            >
                              <span className="material-symbols-outlined text-[15px]">visibility</span>
                              View Data
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dedicated Import Details Drawer */}
      <ImportDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        importId={selectedImportId}
      />
    </div>
  );
};

export default ImportHistoryPage;
