import React, { useState, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import { attendanceService } from '../services/api';
import { useAttendance } from '../context/AttendanceContext';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ImportDetailsDrawer = ({ open, onClose, importId }) => {
  const { setPlantCode, setYear, setMonth, setUnit } = useAttendance();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && importId) {
      fetchDetails(importId);
    } else {
      setDetails(null);
      setError(null);
    }
  }, [open, importId]);

  const fetchDetails = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await attendanceService.getImportDetails(id);
      setDetails(data);
    } catch (err) {
      console.error('Error fetching import details:', err);
      setError(err.message || 'Failed to load import details.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = () => {
    if (!details) return;
    setPlantCode(details.plantCode);
    setYear(details.year);
    setMonth(details.month);
    setUnit('ALL');
    onClose();
    window.location.hash = '#attendance';
  };

  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'imported') {
      return (
        <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] uppercase tracking-wider rounded-md flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ACTIVE DATASET (IMPORTED)
        </span>
      );
    }
    if (s === 'replaced') {
      return (
        <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[11px] uppercase tracking-wider rounded-md flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          REPLACED VERSION
        </span>
      );
    }
    if (s === 'failed') {
      return (
        <span className="px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-[11px] uppercase tracking-wider rounded-md flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          IMPORT FAILED
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold text-[11px] uppercase tracking-wider rounded-md flex items-center gap-1.5">
        {status?.toUpperCase()}
      </span>
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 540 },
          backgroundColor: '#0d1c2d',
          color: '#d4e4fa',
          borderLeft: '1px solid rgba(69, 70, 77, 0.3)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        },
      }}
    >
      <div className="flex flex-col h-full bg-[#0d1c2d] text-[#d4e4fa]">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#45464d]/20 bg-[#051424] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb690] text-[22px]">history</span>
              <h2 className="text-lg font-bold text-[#d4e4fa] tracking-tight">
                Import Details — #{importId}
              </h2>
            </div>
            <p className="text-xs text-[#909097] mt-0.5">
              Attendance dataset metadata & historical record breakdown
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#909097] hover:text-[#d4e4fa] hover:bg-[#273647] rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Drawer Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-[#ffb690] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[#909097] uppercase tracking-wider">
                Loading dataset details...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
              <span className="material-symbols-outlined text-[40px] text-rose-400 mb-2">
                error
              </span>
              <p className="text-sm font-semibold text-rose-400">{error}</p>
            </div>
          ) : details ? (
            <>
              {/* Status Header Bar */}
              <div className="flex items-center justify-between p-4 bg-[#122131] border border-[#45464d]/20 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#909097]">
                    Dataset Status
                  </span>
                  <div className="mt-1">{renderStatusBadge(details.status)}</div>
                </div>
                {details.isActive && (
                  <button
                    onClick={handleViewAttendance}
                    className="px-3.5 py-2 bg-[#ffb690] text-[#552100] font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#ffc6a8] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    View Data
                  </button>
                )}
              </div>

              {/* General Metadata */}
              <div className="p-4 bg-[#122131] border border-[#45464d]/20 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-[#ffb690] uppercase tracking-wider border-b border-[#45464d]/20 pb-2">
                  General Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#909097] block">Plant Location</span>
                    <span className="font-semibold text-[#d4e4fa]">
                      {details.plantName} ({details.plantCity}, {details.plantState})
                    </span>
                  </div>
                  <div>
                    <span className="text-[#909097] block">Period</span>
                    <span className="font-semibold text-[#d4e4fa]">
                      {MONTH_NAMES[details.month]} {details.year}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#909097] block">Original File Name</span>
                    <span className="font-mono text-[#ffb690] truncate block" title={details.fileName}>
                      {details.fileName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#909097] block">Uploaded At</span>
                    <span className="font-semibold text-[#d4e4fa]">
                      {new Date(details.uploadedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#909097] block">Upload Session ID</span>
                    <span className="font-mono text-[11px] text-[#909097]">{details.uploadId}</span>
                  </div>
                </div>
              </div>

              {/* Error Message if Failed */}
              {details.errorMessage && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    Failure Reason
                  </h4>
                  <p className="text-xs text-rose-300 font-mono leading-relaxed">
                    {details.errorMessage}
                  </p>
                </div>
              )}

              {/* Stored Metrics */}
              <div className="p-4 bg-[#122131] border border-[#45464d]/20 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-[#ffb690] uppercase tracking-wider border-b border-[#45464d]/20 pb-2">
                  Stored Database Metrics
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[#051424] rounded-lg text-center border border-[#45464d]/20">
                    <span className="text-[10px] text-[#909097] uppercase tracking-wider block">
                      Attendance Records
                    </span>
                    <span className="text-base font-bold text-[#d4e4fa]">
                      {details.storedRecordsCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-[#051424] rounded-lg text-center border border-[#45464d]/20">
                    <span className="text-[10px] text-[#909097] uppercase tracking-wider block">
                      Worker Profiles
                    </span>
                    <span className="text-base font-bold text-[#d4e4fa]">
                      {details.workerProfilesCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-[#051424] rounded-lg text-center border border-[#45464d]/20">
                    <span className="text-[10px] text-[#909097] uppercase tracking-wider block">
                      Unique WISA
                    </span>
                    <span className="text-base font-bold text-[#ffb690]">
                      {details.uniqueWisaCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Date Range */}
                {details.dateRange?.minDate && (
                  <div className="pt-2 text-xs flex items-center justify-between text-[#909097]">
                    <span>Recorded Date Range:</span>
                    <span className="font-mono text-[#d4e4fa]">
                      {details.dateRange.minDate} → {details.dateRange.maxDate}
                    </span>
                  </div>
                )}

                {/* Consolidation Note */}
                <div className="p-2.5 bg-[#051424] border border-blue-500/20 rounded-lg text-[11px] text-blue-300 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-blue-400 shrink-0 mt-0.5">
                    info
                  </span>
                  <span>{details.consolidationNote}</span>
                </div>
              </div>

              {/* Unit Breakdown */}
              {details.units && details.units.length > 0 && (
                <div className="p-4 bg-[#122131] border border-[#45464d]/20 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-[#ffb690] uppercase tracking-wider border-b border-[#45464d]/20 pb-2">
                    Unit Breakdown
                  </h3>
                  <div className="space-y-2">
                    {details.units.map((u) => (
                      <div
                        key={u.unit}
                        className="flex items-center justify-between p-2.5 bg-[#051424] rounded-lg border border-[#45464d]/20 text-xs"
                      >
                        <div className="flex items-center gap-2 font-bold text-[#ffb690]">
                          <span className="material-symbols-outlined text-[16px]">factory</span>
                          {u.unit}
                        </div>
                        <div className="flex items-center gap-4 text-[#909097]">
                          <span>
                            <strong className="text-[#d4e4fa]">{u.workerCount}</strong> workers
                          </span>
                          <span>
                            <strong className="text-[#d4e4fa]">{u.recordCount.toLocaleString()}</strong> records
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Version History / Related Imports */}
              {details.relatedImports && details.relatedImports.length > 0 && (
                <div className="p-4 bg-[#122131] border border-[#45464d]/20 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-[#ffb690] uppercase tracking-wider border-b border-[#45464d]/20 pb-2">
                    Period Version History ({MONTH_NAMES[details.month]} {details.year})
                  </h3>
                  <div className="space-y-2">
                    {details.relatedImports.map((r) => (
                      <div
                        key={r.importId}
                        className="flex items-center justify-between p-2.5 bg-[#051424] rounded-lg border border-[#45464d]/20 text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#d4e4fa] block">
                            Import #{r.importId} — {r.fileName}
                          </span>
                          <span className="text-[10px] text-[#909097]">
                            Uploaded: {new Date(r.uploadedAt).toLocaleString()}
                          </span>
                        </div>
                        <div>{renderStatusBadge(r.status)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Archival Policy Notice */}
              <div className="p-3 bg-[#051424] border border-[#45464d]/20 rounded-xl text-[11px] text-[#909097] flex items-center justify-between">
                <span>Original Source File:</span>
                <span className="font-semibold text-amber-400/90">
                  Not archived (Deleted after commit for privacy)
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t border-[#45464d]/20 bg-[#051424] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#273647] text-[#c6c6cd] font-semibold text-xs uppercase tracking-wider rounded-lg hover:bg-[#32455b] transition-colors cursor-pointer"
          >
            Close
          </button>
          {details?.isActive && (
            <button
              onClick={handleViewAttendance}
              className="px-5 py-2.5 bg-[#ffb690] text-[#552100] font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#ffc6a8] transition-all flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              View Attendance Data
            </button>
          )}
        </div>
      </div>
    </Drawer>
  );
};

export default ImportDetailsDrawer;
