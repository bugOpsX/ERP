import React, { useState, useMemo, useEffect } from 'react';
import { useSite } from './context/SiteContext';
import { useAttendance } from './context/AttendanceContext';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SearchAndFilters from './components/SearchAndFilters';
import KpiCards from './components/KpiCards';
import WorkerTable from './components/WorkerTable';
import WorkerDetailDrawer from './components/WorkerDetailDrawer';
import DownloadDialog from './components/DownloadDialog';
import GlobalContextSelector from './components/GlobalContextSelector';
import EmptyMonthState from './components/EmptyMonthState';
import UploadAttendancePage from './pages/UploadAttendancePage';
import ImportHistoryPage from './pages/ImportHistoryPage';
import LoginPage from './pages/LoginPage';
import {
  downloadAttendancePDF,
  downloadSiteAttendanceCardsPDF,
  printAttendanceCard,
} from './utils/pdfGenerator';

function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [redirectTarget, setRedirectTarget] = useState(null);

  const {
    workers,
    units,
    currentSite,
    filteredWorkers,
    loading,
    error,
    isMock,
    refresh,
  } = useSite();

  const { isDataAvailable } = useAttendance();

  const [selectedWorker, setSelectedWorker] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState('ALL');
  const [generatingWisa, setGeneratingWisa] = useState(null);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  // Active hash / route tracking
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#attendance');

  useEffect(() => {
    const handleHashChange = () => {
      const hashOnly = window.location.hash.split('?')[0] || '#attendance';
      setCurrentHash(hashOnly);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Protected route navigation guard
  useEffect(() => {
    if (!authLoading) {
      const hashOnly = currentHash.split('?')[0];
      if (!isAuthenticated && hashOnly !== '#login') {
        setRedirectTarget(window.location.hash || '#attendance');
        window.location.hash = '#login';
      } else if (isAuthenticated && hashOnly === '#login') {
        const destination = redirectTarget || '#attendance';
        setRedirectTarget(null);
        window.location.hash = destination;
      }
    }
  }, [isAuthenticated, authLoading, currentHash, redirectTarget]);

  const activeTab = useMemo(() => {
    const hashOnly = currentHash.split('?')[0];
    if (hashOnly === '#upload') return 'upload';
    if (hashOnly === '#history') return 'history';
    if (hashOnly === '#reports') return 'reports';
    if (hashOnly === '#workers') return 'workers';
    if (hashOnly === '#dashboard') return 'dashboard';
    if (hashOnly === '#login') return 'login';
    return 'attendance';
  }, [currentHash]);

  // Extract unique designations list for filter dropdown
  const designationList = useMemo(() => {
    const list = new Set();
    filteredWorkers.forEach((w) => {
      if (w.Designation) list.add(w.Designation);
    });
    return Array.from(list);
  }, [filteredWorkers]);

  // Apply designation filter on top of search query
  const displayedWorkers = useMemo(() => {
    if (selectedDesignation === 'ALL') {
      return filteredWorkers;
    }
    return filteredWorkers.filter((w) => w.Designation === selectedDesignation);
  }, [filteredWorkers, selectedDesignation]);

  const handleOpenDetails = (worker) => {
    setSelectedWorker(worker);
    setDrawerOpen(true);
  };

  const handleCloseDetails = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setSelectedWorker(null);
    }, 250);
  };

  const handleDownloadSingle = async (worker) => {
    if (!worker) return;
    setGeneratingWisa(worker.WISA);
    try {
      await downloadAttendancePDF(worker);
    } catch (err) {
      console.error('Error generating single worker PDF:', err);
    } finally {
      setGeneratingWisa(null);
    }
  };

  const handleDownloadAll = () => {
    if (workers.length === 0) return;
    setDownloadDialogOpen(true);
  };

  const handleExecuteDownload = async ({ mode, site }) => {
    setIsGeneratingBulk(true);
    try {
      if (mode === 'current') {
        const siteWorkers =
          currentSite === 'All'
            ? workers
            : workers.filter((w) => w.BlastFurnace?.toUpperCase() === currentSite.toUpperCase());
        await downloadSiteAttendanceCardsPDF(siteWorkers, currentSite);
      } else if (mode === 'separate') {
        if (currentSite !== 'All') {
          const siteWorkers = workers.filter(
            (w) => w.BlastFurnace?.toUpperCase() === currentSite.toUpperCase()
          );
          await downloadSiteAttendanceCardsPDF(siteWorkers, currentSite);
        } else {
          const individualSites = units.filter((u) => u && u !== 'All');
          for (const siteName of individualSites) {
            const siteWorkers = workers.filter(
              (w) => w.BlastFurnace?.toUpperCase() === siteName.toUpperCase()
            );
            if (siteWorkers.length > 0) {
              await downloadSiteAttendanceCardsPDF(siteWorkers, siteName);
            }
          }
        }
      } else if (mode === 'individual' && site) {
        const siteWorkers = workers.filter(
          (w) => w.BlastFurnace?.toUpperCase() === site.toUpperCase()
        );
        await downloadSiteAttendanceCardsPDF(siteWorkers, site);
      }
    } catch (err) {
      console.error('Error executing bulk site download:', err);
    } finally {
      setIsGeneratingBulk(false);
      setDownloadDialogOpen(false);
    }
  };

  // 1. Initial Session Restoration Loading Screen
  if (authLoading) {
    return (
      <div className="bg-[#051424] text-[#d4e4fa] font-sans min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#ffb690] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#8ca3ba] tracking-widest uppercase">
          Verifying administrator session...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated / Login View
  if (!isAuthenticated || activeTab === 'login') {
    return (
      <LoginPage
        onLoginSuccess={() => {
          const destination = redirectTarget || '#attendance';
          setRedirectTarget(null);
          window.location.hash = destination;
        }}
      />
    );
  }

  // 3. Authenticated Dashboard Application Shell
  return (
    <div className="bg-[#051424] text-[#d4e4fa] font-sans min-h-screen selection:bg-[#ffb690] selection:text-[#552100]">
      {/* Fixed Sidebar */}
      <Sidebar isMock={isMock} activeTab={activeTab} />

      {/* Top Navigation Bar */}
      <Header
        onDownloadAll={handleDownloadAll}
        isGeneratingBulk={isGeneratingBulk}
        isMock={isMock}
      />

      {/* Main Canvas Area */}
      <main className="ml-[240px] pt-16 min-h-screen p-8">
        <div className="max-w-[1440px] mx-auto">
          {activeTab === 'upload' ? (
            /* Upload Attendance Page */
            <UploadAttendancePage />
          ) : activeTab === 'history' ? (
            /* Import History & Data Management Center Page */
            <ImportHistoryPage />
          ) : (
            <>
              {/* Global Context Filter Bar (Plant, Year, Month, Unit) */}
              <GlobalContextSelector />

              {!isDataAvailable ? (
                /* Clean Empty Month State when data is not imported for selected period */
                <EmptyMonthState />
              ) : loading && displayedWorkers.length === 0 ? (
                /* Initial Loading Screen */
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                  <div className="w-12 h-12 border-4 border-[#ffb690] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-[#909097] tracking-wider uppercase">
                    Loading attendance telemetry...
                  </p>
                </div>
              ) : error && displayedWorkers.length === 0 ? (
                /* Error State Panel */
                <div className="flex justify-center items-center min-h-[50vh]">
                  <div className="p-8 max-w-md w-full bg-[#122131] border border-rose-500/30 rounded-xl text-center shadow-xl inner-glow">
                    <span className="material-symbols-outlined text-[56px] text-rose-400 mb-3">
                      error_outline
                    </span>
                    <h3 className="text-lg font-bold text-rose-400 mb-2">Data Connection Error</h3>
                    <p className="text-xs text-[#909097] mb-6 leading-relaxed">{error}</p>
                    <button
                      onClick={refresh}
                      className="px-6 py-2.5 bg-[#ffb690] text-[#552100] font-bold text-xs uppercase tracking-wider rounded hover:bg-[#ffc6a8] transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">refresh</span>
                      Retry Connection
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search and Designation Filters */}
                  <SearchAndFilters
                    isMock={isMock}
                    selectedDesignation={selectedDesignation}
                    setSelectedDesignation={setSelectedDesignation}
                    designationList={designationList}
                  />

                  {/* KPI Summary Metric Cards */}
                  <KpiCards workers={displayedWorkers} />

                  {/* Dynamic Worker Cards Grid */}
                  <WorkerTable
                    workers={displayedWorkers}
                    onViewDetails={handleOpenDetails}
                    onDownloadSingle={handleDownloadSingle}
                    generatingWisa={generatingWisa}
                  />
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#ffb690] text-[#552100] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 cursor-pointer"
        title="Scroll to Top"
      >
        <span className="material-symbols-outlined text-[28px]">arrow_upward</span>
      </button>

      {/* Dedicated Worker Details Drawer */}
      <WorkerDetailDrawer
        open={drawerOpen}
        onClose={handleCloseDetails}
        worker={selectedWorker}
        onDownloadSingle={handleDownloadSingle}
        onPrintCard={printAttendanceCard}
        isDownloading={generatingWisa === selectedWorker?.WISA}
      />

      {/* Download Options Dialog */}
      <DownloadDialog
        open={downloadDialogOpen}
        onClose={() => setDownloadDialogOpen(false)}
        currentSite={currentSite}
        availableSites={units}
        onDownload={handleExecuteDownload}
        isGenerating={isGeneratingBulk}
      />
    </div>
  );
}

export default App;
