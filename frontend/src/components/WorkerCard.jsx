import React from 'react';

/**
 * WorkerCard component matching Stitch UI design.
 * Dynamically populated from worker API data.
 */
const WorkerCard = ({ worker, onViewDetails, onDownloadSingle, isDownloading }) => {
  if (!worker) return null;

  const records = Array.isArray(worker.Attendance) ? worker.Attendance : [];
  const totalDays = records.length || 30;
  
  // Calculate attendance statistics dynamically
  const presentDays = records.reduce((acc, curr) => {
    return (curr.DayIn || curr.NightIn) ? acc + 1 : acc;
  }, 0);

  const attendanceRatio = totalDays > 0 ? (presentDays / totalDays) : 0;

  // Determine status badge: Present (> 70%), Late/Partial (> 40%), Absent
  let status = 'PRESENT';
  let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let dotStyle = 'bg-emerald-500';

  if (attendanceRatio === 0 && totalDays > 0) {
    status = 'ABSENT';
    badgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    dotStyle = 'bg-rose-500';
  } else if (attendanceRatio < 0.6) {
    status = 'PARTIAL';
    badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    dotStyle = 'bg-amber-500';
  }

  return (
    <div className="bg-[#122131] p-6 rounded-xl border border-[#45464d]/20 hover:border-[#ffb690]/40 transition-all group flex flex-col justify-between inner-glow h-full">
      <div>
        {/* Card Header: Status Badge, Blast Furnace & WISA ID */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
              {status}
            </div>
            {worker.BlastFurnace && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ffb690]/10 text-[#ffb690] border border-[#ffb690]/20">
                <span className="material-symbols-outlined text-[12px]">factory</span>
                {worker.BlastFurnace}
              </div>
            )}
          </div>
          <span className="font-mono text-xs text-[#909097] bg-[#0d1c2d] px-2 py-0.5 rounded border border-[#45464d]/20">
            WISA: {worker.WISA}
          </span>
        </div>

        {/* Worker Name & Role/Dept */}
        <h3 className="font-semibold text-lg text-[#d4e4fa] group-hover:text-[#ffb690] transition-colors truncate">
          {worker.Name || 'Unnamed Worker'}
        </h3>
        <p className="text-xs font-semibold text-[#909097] uppercase tracking-wider mt-1 truncate">
          {worker.Designation || 'Worker'} • {worker.Department || 'General'}
        </p>
      </div>

      {/* Attendance Stats & Action Buttons */}
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-semibold text-[#c6c6cd] uppercase tracking-wider">
            Monthly Attendance
          </span>
          <span className="text-xs font-mono text-[#d4e4fa] font-medium">
            {presentDays} / {totalDays} Days
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#010f1f] h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-[#ffb690] transition-all duration-700"
            style={{ width: `${Math.min(100, Math.max(5, (presentDays / Math.max(1, totalDays)) * 100))}%` }}
          />
        </div>

        {/* Action Button Row */}
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={() => onViewDetails(worker)}
            className="col-span-4 py-2.5 bg-[#273647] border border-[#45464d]/30 rounded text-xs font-semibold uppercase tracking-wider text-[#d4e4fa] hover:bg-[#ffb690] hover:text-[#552100] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            View Worker Card
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
          
          <button
            onClick={() => onDownloadSingle(worker)}
            disabled={isDownloading}
            className="col-span-1 py-2.5 bg-[#1c2b3c] border border-[#45464d]/30 rounded text-[#c6c6cd] hover:text-[#ffb690] hover:border-[#ffb690]/40 transition-all flex items-center justify-center cursor-pointer"
            title={`Download ${worker.Name}_${worker.WISA}.pdf`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDownloading ? 'hourglass_top' : 'download'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerCard;
