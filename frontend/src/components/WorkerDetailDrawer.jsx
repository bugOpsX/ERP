import React from 'react';
import AttendanceCard from './AttendanceCard';

/**
 * WorkerDetailDrawer
 * Dedicated right slide-over drawer for viewing and exporting worker attendance cards.
 */
const WorkerDetailDrawer = ({
  open,
  onClose,
  worker,
  onDownloadSingle,
  onPrintCard,
  isDownloading
}) => {
  if (!open || !worker) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-[#0d1c2d] border-l border-[#45464d]/30 text-[#d4e4fa] shadow-2xl flex flex-col justify-between transform transition-all duration-300">
          
          {/* Drawer Header */}
          <div className="p-6 bg-[#051424] border-b border-[#45464d]/20 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#d4e4fa]">
                  {worker.Name || 'Worker Card'}
                </h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#1c2b3c] text-[#ffb690] border border-[#45464d]/30">
                  WISA: {worker.WISA}
                </span>
              </div>
              <p className="text-xs text-[#909097] mt-0.5 flex items-center gap-1.5">
                <span>{worker.Designation || 'Worker'} • {worker.Department || 'General'}</span>
                {worker.BlastFurnace && (
                  <>
                    <span className="text-[#45464d]">•</span>
                    <span className="flex items-center gap-0.5 font-semibold text-[#ffb690] uppercase">
                      <span className="material-symbols-outlined text-[13px]">factory</span>
                      {worker.BlastFurnace}
                    </span>
                  </>
                )}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#c6c6cd] hover:text-white hover:bg-[#1c2b3c] rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Drawer Content: Attendance Card Preview */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#ffb690] block mb-1">
                Attendance Card Preview
              </span>
              <p className="text-xs text-[#909097]">
                Live preview of worker attendance telemetry. Click download below for an A5 industrial print PDF.
              </p>
            </div>

            {/* Reusable Attendance Card Component */}
            <AttendanceCard worker={worker} variant="preview" />
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-6 bg-[#051424] border-t border-[#45464d]/20 flex items-center justify-between gap-4">
            <button
              onClick={() => onPrintCard(worker)}
              className="px-4 py-2.5 bg-[#1c2b3c] hover:bg-[#273647] border border-[#45464d]/30 text-[#d4e4fa] rounded font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print Card
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-[#c6c6cd] hover:text-[#d4e4fa] font-semibold text-xs uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => onDownloadSingle(worker)}
                disabled={isDownloading}
                className="px-6 py-2.5 bg-[#ffb690] hover:bg-[#ffc6a8] disabled:opacity-50 text-[#552100] font-bold text-xs uppercase tracking-wider rounded transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isDownloading ? 'hourglass_top' : 'download'}
                </span>
                {isDownloading ? 'Exporting PDF...' : 'Download Attendance Card'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WorkerDetailDrawer;
