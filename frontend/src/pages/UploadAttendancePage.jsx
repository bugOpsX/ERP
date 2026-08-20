import React, { useState, useEffect, useRef } from 'react';
import { attendanceService } from '../services/api';
import { useAttendance } from '../context/AttendanceContext';
import ReplacementConfirmDialog from '../components/ReplacementConfirmDialog';

/**
 * Format file size in human-readable bytes (KB, MB).
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const UploadAttendancePage = () => {
  const { setPlantCode, setYear, setMonth, setUnit } = useAttendance();

  const [plants, setPlants] = useState([
    { code: 'PLANT_A', name: 'Kamla Enterprises Plant', city: 'Surat', isImplemented: true },
    { code: 'PLANT_B', name: 'Future Plant Location', city: 'Other City', isImplemented: false },
  ]);
  const [selectedPlantCode, setSelectedPlantCode] = useState('PLANT_A');

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Upload & Import Lifecycle States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const [serverError, setServerError] = useState('');
  const [importHistory, setImportHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch plant locations and import history on mount
  useEffect(() => {
    let isMounted = true;

    attendanceService.getPlants().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setPlants(data);
      }
    });

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await attendanceService.getImportHistory();
      setImportHistory(history || []);
    } catch (err) {
      console.warn('Failed to load import history:', err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const validateAndSetFile = (file) => {
    setValidationError('');
    setServerError('');
    setUploadResult(null);
    setImportResult(null);
    setReplaceExisting(false);

    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isExcel) {
      setValidationError('Unsupported file type. Please upload an Excel file (.xlsx or .xls).');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const handleResetForm = () => {
    setSelectedFile(null);
    setValidationError('');
    setServerError('');
    setUploadResult(null);
    setImportResult(null);
    setReplaceExisting(false);
    setShowConfirmDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Step 1: Upload spreadsheet for inspection & session preview
  const handleUploadAndInspect = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setServerError('');
    setUploadResult(null);
    setImportResult(null);

    try {
      const response = await attendanceService.uploadAttendance(selectedFile, selectedPlantCode);
      if (response && response.success && response.valid) {
        setUploadResult(response);
        if (response.isDuplicate) {
          setReplaceExisting(true);
        }
      } else {
        const errMsg =
          response?.errors?.[0]?.message ||
          response?.error ||
          'Upload validation failed. Please check the uploaded workbook.';
        setServerError(errMsg);
      }
    } catch (err) {
      console.error('Attendance upload error:', err);
      const errMsg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.error ||
        err.message ||
        'Server error occurred during upload inspection.';
      setServerError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // Step 2: Confirm and execute transactional import into PostgreSQL
  const handleCommitImport = async (forceReplace = false) => {
    if (!uploadResult?.uploadId || isImporting) return;

    const doReplace = forceReplace || replaceExisting;

    setIsImporting(true);
    setServerError('');
    setShowConfirmDialog(false);

    try {
      const response = await attendanceService.commitImport(
        uploadResult.uploadId,
        selectedPlantCode,
        doReplace
      );

      if (response && response.success) {
        setImportResult(response);
        setUploadResult(null);
        setSelectedFile(null);
        loadHistory(); // Refresh history list
      } else {
        setServerError(response?.error || 'Database import failed.');
      }
    } catch (err) {
      console.error('Import commit error:', err);
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Failed to persist attendance data to PostgreSQL database.';
      setServerError(errMsg);
    } finally {
      setIsImporting(false);
    }
  };

  const handleViewExistingData = () => {
    if (!uploadResult?.workbook) return;
    setPlantCode(selectedPlantCode);
    setYear(uploadResult.workbook.year);
    setMonth(uploadResult.workbook.monthNumber);
    setUnit('ALL');
    window.location.hash = '#attendance';
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#d4e4fa] tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-[32px] text-[#ffb690]">
            cloud_upload
          </span>
          Upload & Import Attendance
        </h1>
        <p className="text-sm text-[#909097] mt-1">
          Validate and persist monthly attendance data into PostgreSQL database (Phase 2C Engine)
        </p>
      </div>

      {/* Plant Selector Section */}
      <div className="bg-[#122131] border border-[#45464d]/30 rounded-2xl p-6 shadow-xl">
        <label className="block text-xs font-bold uppercase tracking-widest text-[#909097] mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#ffb690]">location_on</span>
          Target Plant Location
        </label>
        <div className="relative">
          <select
            value={selectedPlantCode}
            onChange={(e) => {
              setSelectedPlantCode(e.target.value);
              setServerError('');
              if (selectedFile) setUploadResult(null);
            }}
            disabled={isUploading || isImporting || !!uploadResult}
            className="w-full bg-[#0a1826] border border-[#45464d]/40 text-[#d4e4fa] font-semibold text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-[#ffb690] disabled:opacity-60 cursor-pointer transition-all"
          >
            {plants.map((plant) => (
              <option key={plant.code} value={plant.code} className="bg-[#0a1826] text-[#d4e4fa]">
                {plant.name} {plant.city ? `(${plant.city})` : ''} {!plant.isImplemented ? '— [Parser Pending]' : ''}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#909097] pointer-events-none">
            expand_more
          </span>
        </div>
        <p className="text-[11px] text-[#909097]/70 mt-2">
          Parser contract automatically matches column layout and site mapping for the selected plant.
        </p>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300">
          <span className="material-symbols-outlined text-rose-400">warning</span>
          <span className="text-xs font-semibold">{validationError}</span>
        </div>
      )}

      {/* STEP 1: Upload & File Inspection Area */}
      {!uploadResult && !importResult && (
        <div className="bg-[#122131] border border-[#45464d]/30 rounded-2xl p-8 shadow-xl">
          {!selectedFile ? (
            /* Drag and Drop Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-[#ffb690] bg-[#1c2b3c] scale-[1.01]'
                  : 'border-[#45464d]/40 bg-[#0a1826] hover:border-[#ffb690]/50 hover:bg-[#122131]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-full bg-[#1c2b3c] flex items-center justify-center mb-4 text-[#ffb690] shadow-inner">
                <span className="material-symbols-outlined text-[36px]">upload_file</span>
              </div>
              <p className="text-base font-bold text-[#d4e4fa] mb-1 text-center">
                Drop Excel file here
              </p>
              <p className="text-xs text-[#909097] mb-4 text-center">or</p>
              <button
                type="button"
                className="px-5 py-2.5 bg-[#1c2b3c] border border-[#ffb690]/30 hover:border-[#ffb690] text-[#ffb690] text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
              >
                Browse Files
              </button>
              <span className="text-[11px] text-[#909097]/70 mt-6 tracking-wide">
                Supported formats: .xlsx, .xls
              </span>
            </div>
          ) : (
            /* Selected File Preview Box */
            <div className="space-y-6">
              <div className="p-5 bg-[#0a1826] border border-[#45464d]/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#1c2b3c] border border-[#ffb690]/20 flex items-center justify-center text-[#ffb690]">
                    <span className="material-symbols-outlined text-[28px]">description</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#d4e4fa] truncate max-w-md">
                      {selectedFile.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-[#ffb690]/15 text-[#ffb690] text-[10px] font-bold uppercase tracking-wider rounded">
                        {selectedFile.name.split('.').pop()?.toUpperCase()}
                      </span>
                      <span className="text-xs text-[#909097]">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                  </div>
                </div>

                {!isUploading && (
                  <button
                    onClick={handleResetForm}
                    className="p-2 text-[#909097] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                    Remove
                  </button>
                )}
              </div>

              {/* Server Error Notice */}
              {serverError && (
                <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300">
                  <span className="material-symbols-outlined text-rose-400">error</span>
                  <div className="text-xs">
                    <p className="font-bold">Validation Error</p>
                    <p className="text-rose-300/80 mt-0.5">{serverError}</p>
                  </div>
                </div>
              )}

              {/* Inspect Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleUploadAndInspect}
                  disabled={isUploading}
                  className={`px-8 py-3 bg-[#ffb690] text-[#552100] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#ffc6a8] hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#552100] border-t-transparent rounded-full animate-spin" />
                      <span>Inspecting Workbook Structure...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">manage_search</span>
                      <span>Inspect Workbook</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Workbook Inspection Preview & Confirmation */}
      {uploadResult && !importResult && (
        <div className="bg-[#122131] border border-[#ffb690]/40 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#ffb690]/15 border border-[#ffb690]/30 flex items-center justify-center text-[#ffb690]">
              <span className="material-symbols-outlined text-[28px]">verified</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#d4e4fa]">Inspection Preview & Duplicate Check</h2>
              <p className="text-xs text-[#909097]">
                Review period, worker counts, and duplicate status before committing to PostgreSQL.
              </p>
            </div>
          </div>

          {/* Duplicate Warning Banner */}
          {uploadResult.isDuplicate && (
            <div className="p-5 bg-amber-950/50 border border-amber-500/40 rounded-xl space-y-4">
              <div className="flex items-start gap-3 text-amber-300 text-xs">
                <span className="material-symbols-outlined text-[24px] text-amber-400 shrink-0">warning</span>
                <div>
                  <p className="font-bold text-amber-200 text-sm">Attendance Already Exists</p>
                  <p className="mt-1 text-amber-300/90 leading-relaxed">
                    An active attendance dataset already exists for <strong className="text-white">{uploadResult.workbook?.period}</strong> at <strong className="text-white">{uploadResult.plant?.name} ({uploadResult.plant?.city})</strong>.
                  </p>
                  <p className="text-[11px] text-amber-400/80 mt-1 font-mono">
                    {uploadResult.duplicateWarning}
                  </p>
                </div>
              </div>

              {/* Duplicate Action Options */}
              <div className="pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleResetForm}
                  className="px-4 py-2 bg-[#122131] text-[#909097] hover:text-[#d4e4fa] border border-amber-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel Upload
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleViewExistingData}
                    className="px-4 py-2 bg-[#1c2b3c] hover:bg-[#273647] text-[#ffb690] border border-[#ffb690]/30 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    View Existing Data
                  </button>

                  <button
                    onClick={() => setShowConfirmDialog(true)}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                    Replace Existing Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inspection Metadata Table */}
          <div className="p-5 bg-[#0a1826] border border-[#45464d]/30 rounded-xl space-y-3 text-xs">
            <div className="flex justify-between border-b border-[#45464d]/20 pb-2">
              <span className="text-[#909097] font-semibold">Target Plant:</span>
              <span className="text-[#d4e4fa] font-bold">
                {uploadResult.plant?.name} ({uploadResult.plant?.city})
              </span>
            </div>
            <div className="flex justify-between border-b border-[#45464d]/20 pb-2">
              <span className="text-[#909097] font-semibold">Detected Period:</span>
              <span className="text-[#ffb690] font-bold text-sm">{uploadResult.workbook?.period || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-[#45464d]/20 pb-2">
              <span className="text-[#909097] font-semibold">Date Range:</span>
              <span className="text-[#d4e4fa] font-mono">{uploadResult.workbook?.dateRange}</span>
            </div>
            <div className="flex justify-between border-b border-[#45464d]/20 pb-2">
              <span className="text-[#909097] font-semibold">File Name:</span>
              <span className="text-[#d4e4fa] font-medium truncate max-w-[280px]">
                {uploadResult.upload?.originalName}
              </span>
            </div>

            {/* Units Record Breakdown */}
            {uploadResult.workbook?.sheets && (
              <div className="border-b border-[#45464d]/20 pb-2">
                <span className="text-[#909097] font-semibold block mb-1.5">Parsed Unit Breakdown:</span>
                <div className="grid grid-cols-2 gap-3">
                  {uploadResult.workbook.sheets.map((s, idx) => (
                    <div key={idx} className="p-2.5 bg-[#122131] border border-[#45464d]/30 rounded-lg flex justify-between items-center">
                      <span className="font-bold text-[#ffb690]">{s.name}</span>
                      <span className="font-mono font-bold text-[#d4e4fa]">{s.recordCount.toLocaleString()} records</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between border-b border-[#45464d]/20 pb-2">
              <span className="text-[#909097] font-semibold">Total Attendance Records:</span>
              <span className="text-[#d4e4fa] font-bold font-mono text-sm">
                {uploadResult.workbook?.totalRecords?.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-b border-[#45464d]/20 pb-2">
              <span className="text-[#909097] font-semibold">Unique Workers Identified:</span>
              <span className="text-[#d4e4fa] font-bold font-mono text-sm">
                {uploadResult.workbook?.uniqueWorkersCount?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Server Error Notice */}
          {serverError && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
              <span className="material-symbols-outlined text-rose-400">error</span>
              <div>
                <p className="font-bold">Import Error</p>
                <p className="mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          {/* Normal Action Buttons (for non-duplicates) */}
          {!uploadResult.isDuplicate && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleResetForm}
                disabled={isImporting}
                className="px-5 py-2.5 bg-[#1c2b3c] border border-[#45464d]/40 text-[#909097] hover:text-[#d4e4fa] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancel / Select Different File
              </button>

              <button
                onClick={() => handleCommitImport(false)}
                disabled={isImporting}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                    <span>Persisting into PostgreSQL Database...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">database</span>
                    <span>Confirm & Import to PostgreSQL</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUCCESS STATE */}
      {importResult && (
        <div className="bg-[#122131] border border-emerald-500/40 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <span className="material-symbols-outlined text-[36px]">task_alt</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#d4e4fa]">Import Successfully Committed</h2>
              <p className="text-xs text-[#909097] mt-0.5">
                Attendance records and monthly worker summaries stored in PostgreSQL.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#0a1826] border border-[#45464d]/30 rounded-xl">
              <span className="text-[11px] text-[#909097] uppercase font-bold tracking-wider block">Import ID</span>
              <span className="text-lg font-bold font-mono text-[#ffb690]">#{importResult.importId}</span>
            </div>
            <div className="p-4 bg-[#0a1826] border border-[#45464d]/30 rounded-xl">
              <span className="text-[11px] text-[#909097] uppercase font-bold tracking-wider block">Attendance Records</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{importResult.stats?.totalRecords?.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-[#0a1826] border border-[#45464d]/30 rounded-xl">
              <span className="text-[11px] text-[#909097] uppercase font-bold tracking-wider block">Unique Workers</span>
              <span className="text-lg font-bold font-mono text-[#d4e4fa]">{importResult.stats?.uniqueWorkers?.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-[#0a1826] border border-[#45464d]/30 rounded-xl">
              <span className="text-[11px] text-[#909097] uppercase font-bold tracking-wider block">Unit Breakdown</span>
              <span className="text-xs font-bold font-mono text-[#d4e4fa] mt-1 block">
                BF-2: {importResult.stats?.bf2RecordCount} | BF-3: {importResult.stats?.bf3RecordCount}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-2">
            <button
              onClick={handleResetForm}
              className="px-6 py-2.5 bg-[#1c2b3c] border border-[#ffb690]/30 hover:border-[#ffb690] text-[#ffb690] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Upload Another File
            </button>
            <a
              href="#attendance"
              className="px-6 py-2.5 bg-[#ffb690] text-[#552100] font-bold text-xs uppercase tracking-wider rounded-xl transition-all hover:bg-[#ffc6a8] shadow flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              View Attendance Data
            </a>
          </div>
        </div>
      )}

      {/* IMPORT HISTORY SUMMARY SECTION */}
      <div className="bg-[#122131] border border-[#45464d]/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#d4e4fa] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#ffb690]">history</span>
            Recent Upload Logs
          </h2>
          <a
            href="#history"
            className="text-xs text-[#ffb690] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            View Full History →
          </a>
        </div>

        {importHistory.length === 0 ? (
          <p className="text-xs text-[#909097] italic p-4 text-center">No past imports recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#45464d]/30 text-[#909097] font-semibold">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Plant</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Records</th>
                  <th className="py-2.5 px-3">Workers</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Uploaded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#45464d]/20 text-[#d4e4fa]">
                {importHistory.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-[#0a1826]/50">
                    <td className="py-2.5 px-3 font-mono text-[#ffb690]">#{item.id}</td>
                    <td className="py-2.5 px-3 font-medium truncate max-w-[200px]">{item.file_name}</td>
                    <td className="py-2.5 px-3">{item.plant_code}</td>
                    <td className="py-2.5 px-3 font-bold">{item.month}/{item.year}</td>
                    <td className="py-2.5 px-3 font-mono">{item.total_record_count?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono">{item.worker_count?.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'imported'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : item.status === 'replaced'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#909097] text-[11px]">
                      {new Date(item.uploaded_at || item.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safe Replacement Double Confirmation Dialog */}
      <ReplacementConfirmDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => handleCommitImport(true)}
        plantName={uploadResult?.plant ? `${uploadResult.plant.name} (${uploadResult.plant.city})` : 'Surat, Gujarat'}
        period={uploadResult?.workbook?.period || 'June 2026'}
        existingImportId={uploadResult?.existingImportId}
        isImporting={isImporting}
      />
    </div>
  );
};

export default UploadAttendancePage;
