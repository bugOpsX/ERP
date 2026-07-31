import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { attendanceService } from '../services/api';

const SiteContext = createContext();

/**
 * SiteProvider
 * Provides global state and filtering logic based on the selected Blast Furnace / Plant Unit.
 */
export const SiteProvider = ({ children }) => {
  const [workers, setWorkers] = useState([]);
  const [apiUnits, setApiUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMock, setIsMock] = useState(false);

  // Load selection from localStorage, defaulting to 'All'
  const [currentSite, setCurrentSiteState] = useState(() => {
    const saved = localStorage.getItem('kamla_current_site');
    return saved || 'All';
  });

  const setCurrentSite = useCallback((site) => {
    setCurrentSiteState(site);
    localStorage.setItem('kamla_current_site', site);
  }, []);

  const fetchAttendance = useCallback(async (forceMock = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await attendanceService.getAttendance(forceMock);
      const data = result.workers;

      // Handle both formats: direct array or nested { workers, units }
      let workerList = [];
      let unitList = [];

      if (Array.isArray(data)) {
        workerList = data;
      } else if (data && Array.isArray(data.workers)) {
        workerList = data.workers;
        if (Array.isArray(data.units)) {
          unitList = data.units;
        }
      } else {
        throw new Error('Invalid telemetry format received from server.');
      }

      setWorkers(workerList);
      setApiUnits(unitList);
      setIsMock(result.isMock);
    } catch (err) {
      console.error('Error fetching attendance in SiteContext:', err);
      const message = err.response?.data?.message || err.message || 'Failed to connect to the server.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial telemetry
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Derive unique units/blast furnaces dynamically
  const units = useMemo(() => {
    const derived = new Set(apiUnits);
    workers.forEach((worker) => {
      if (worker.BlastFurnace) {
        derived.add(worker.BlastFurnace);
      }
    });
    // Return sorted list with 'All' at the start
    return ['All', ...Array.from(derived).sort()];
  }, [workers, apiUnits]);

  // If the active site is no longer present in the updated units list (and isn't 'All'), reset to 'All'
  useEffect(() => {
    if (currentSite !== 'All' && units.length > 1 && !units.includes(currentSite)) {
      setCurrentSite('All');
    }
  }, [units, currentSite, setCurrentSite]);

  // Filter workers based ONLY on current selected site (useful for stats and aggregations)
  const allFilteredWorkers = useMemo(() => {
    if (currentSite === 'All') {
      return workers;
    }
    return workers.filter(
      (worker) => worker.BlastFurnace?.toUpperCase() === currentSite.toUpperCase()
    );
  }, [workers, currentSite]);

  // Filter workers based on site AND search query (Name or WISA)
  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) {
      return allFilteredWorkers;
    }
    const query = searchQuery.toLowerCase().trim();
    return allFilteredWorkers.filter((worker) => {
      const nameMatch = worker.Name?.toLowerCase().includes(query);
      const wisaMatch = worker.WISA?.toString().includes(query);
      return nameMatch || wisaMatch;
    });
  }, [allFilteredWorkers, searchQuery]);

  const value = {
    workers,
    units,
    currentSite,
    setCurrentSite,
    allFilteredWorkers,
    filteredWorkers,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    isMock,
    refresh: () => fetchAttendance(false),
    forceMockFetch: () => fetchAttendance(true),
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
