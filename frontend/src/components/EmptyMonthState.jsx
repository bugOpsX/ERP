import React from 'react';
import { CloudUpload, EventBusy } from '@mui/icons-material';
import { useAttendance } from '../context/AttendanceContext';

const EmptyMonthState = () => {
  const { selectedPlant, year, monthName, unit } = useAttendance();

  const handleGoToUpload = () => {
    window.location.hash = '#upload';
  };

  const unitLabel = unit === 'ALL' ? 'all units' : unit;

  return (
    <div className="bg-[#0a1e38]/60 border border-slate-800 rounded-2xl p-12 text-center my-8 shadow-xl max-w-2xl mx-auto backdrop-blur-sm">
      <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <EventBusy className="text-3xl" />
      </div>

      <h3 className="text-2xl font-bold text-white mb-2">No Attendance Data</h3>

      <p className="text-slate-300 text-sm max-w-md mx-auto mb-6 leading-relaxed">
        Attendance data for <span className="text-[#00f2fe] font-semibold">{monthName} {year}</span> has not been imported for{' '}
        <span className="text-[#ff9f43] font-semibold">{unitLabel}</span> at {selectedPlant.name} ({selectedPlant.city}).
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={handleGoToUpload}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          <CloudUpload fontSize="small" />
          Upload Attendance File
        </button>
      </div>
    </div>
  );
};

export default EmptyMonthState;
