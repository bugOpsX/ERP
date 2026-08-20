import React, { createContext, useContext } from 'react';
import { useAttendance } from './AttendanceContext';

const SiteContext = createContext();

/**
 * SiteProvider (Backward-compatibility wrapper around AttendanceContext).
 * Preserves the existing `useSite()` interface across the application.
 */
export const SiteProvider = ({ children }) => {
  const attendance = useAttendance();

  // Map supportedUnits: 'ALL' -> 'All' for legacy component compatibility
  const units = (attendance.supportedUnits || ['ALL', 'BF-2', 'BF-3']).map((u) =>
    u === 'ALL' ? 'All' : u
  );

  const currentSite = attendance.unit === 'ALL' ? 'All' : attendance.unit;

  const setCurrentSite = (site) => {
    const unitVal = site === 'All' ? 'ALL' : site;
    attendance.setUnit(unitVal);
  };

  const value = {
    workers: attendance.workers,
    units,
    currentSite,
    setCurrentSite,
    allFilteredWorkers: attendance.allFilteredWorkers,
    filteredWorkers: attendance.filteredWorkers,
    loading: attendance.loading,
    error: attendance.error,
    searchQuery: attendance.searchQuery,
    setSearchQuery: attendance.setSearchQuery,
    isMock: false,
    refresh: attendance.reload,
    forceMockFetch: attendance.reload,
  };

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};

/**
 * Custom hook to consume the SiteContext.
 */
export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
};

export default SiteContext;
