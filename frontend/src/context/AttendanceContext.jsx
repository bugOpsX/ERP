import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { attendanceService } from '../services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AttendanceContext = createContext();

/**
 * Parses query params from current URL hash or location search.
 */
const getUrlParams = () => {
  let searchStr = window.location.search;
  if (!searchStr && window.location.hash.includes('?')) {
    searchStr = '?' + window.location.hash.split('?')[1];
  }
  const params = new URLSearchParams(searchStr);
  return {
    plant: params.get('plant') || localStorage.getItem('kamla_plant') || 'PLANT_A',
    year: params.get('year') ? parseInt(params.get('year'), 10) : null,
    month: params.get('month') ? parseInt(params.get('month'), 10) : null,
    unit: params.get('unit') || localStorage.getItem('kamla_unit') || 'ALL',
  };
};

/**
 * Updates URL search/hash query parameters without full page reload.
 */
const syncUrlParams = (plant, year, month, unit) => {
  try {
    const hashBase = window.location.hash.split('?')[0] || '#attendance';
    const params = new URLSearchParams();
    if (plant) params.set('plant', plant);
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    if (unit) params.set('unit', unit);

    const newHash = `${hashBase}?${params.toString()}`;
    window.history.replaceState(null, '', newHash);
  } catch (e) {
    console.warn('Failed to update URL parameters:', e);
  }
};

export const AttendanceProvider = ({ children }) => {
  const initialParams = getUrlParams();

  const [plants, setPlants] = useState([
    { code: 'PLANT_A', name: 'Kamla Enterprises Plant', city: 'Surat', state: 'Gujarat', supportedUnits: ['BF-2', 'BF-3'], isImplemented: true },
    { code: 'PLANT_B', name: 'Future Plant Location', city: 'Other City', supportedUnits: ['UNIT-1'], isImplemented: false }
  ]);

  const [plantCode, setPlantCodeState] = useState(initialParams.plant);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [year, setYearState] = useState(initialParams.year);
  const [month, setMonthState] = useState(initialParams.month);
  const [unit, setUnitState] = useState(initialParams.unit);

  const [workers, setWorkers] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch available plants from API
  const fetchPlants = useCallback(async () => {
    try {
      const fetchedPlants = await attendanceService.getPlants();
      if (Array.isArray(fetchedPlants) && fetchedPlants.length > 0) {
        setPlants(fetchedPlants);
      }
    } catch (err) {
      console.warn('Failed to fetch plants list:', err);
    }
  }, []);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  // Selected Plant Object
  const selectedPlant = useMemo(() => {
    return plants.find((p) => p.code === plantCode) || plants[0] || {
      code: 'PLANT_A',
      name: 'Kamla Enterprises Plant',
      city: 'Surat',
      state: 'Gujarat',
      supportedUnits: ['BF-2', 'BF-3'],
      isImplemented: true
    };
  }, [plants, plantCode]);

  // 2. Fetch available periods for selected plant
  const fetchPeriods = useCallback(async (pCode) => {
    try {
      const periods = await attendanceService.getPeriods(pCode);
      setAvailablePeriods(periods);

      // Auto-select latest available period if current year/month is not in available periods
      if (periods && periods.length > 0) {
        const latest = periods[0];
        setYearState((currYear) => {
          const yearExists = periods.some((p) => p.year === currYear);
          return yearExists ? currYear : latest.year;
        });

        setMonthState((currMonth) => {
          const monthExists = periods.some((p) => p.month === currMonth);
          return monthExists ? currMonth : latest.month;
        });
      }
    } catch (err) {
      console.warn('Failed to fetch available periods:', err);
      setAvailablePeriods([]);
    }
  }, []);

  useEffect(() => {
    fetchPeriods(plantCode);
  }, [plantCode, fetchPeriods]);

  // Available Years for selected plant
  const availableYears = useMemo(() => {
    const yearsSet = new Set(availablePeriods.map((p) => p.year));
    // Always include current year if no periods imported yet
    if (yearsSet.size === 0) yearsSet.add(2026);
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [availablePeriods]);

  // Available Months for selected year
  const availableMonths = useMemo(() => {
    if (!year) return [];
    const monthsForYear = availablePeriods
      .filter((p) => p.year === year)
      .map((p) => ({
        month: p.month,
        monthName: MONTH_NAMES[p.month - 1] || `Month ${p.month}`,
        recordCount: p.recordCount,
        workerCount: p.workerCount,
      }));

    if (monthsForYear.length > 0) {
      return monthsForYear.sort((a, b) => a.month - b.month);
    }

    // Default return 12 months with availability status
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: MONTH_NAMES[i],
      recordCount: 0,
      workerCount: 0,
    }));
  }, [availablePeriods, year]);

  // Supported units list for selected plant (including 'ALL')
  const supportedUnits = useMemo(() => {
    const plantUnits = selectedPlant.supportedUnits || ['BF-2', 'BF-3'];
    return ['ALL', ...plantUnits];
  }, [selectedPlant]);

  // Check if attendance data is imported for selected (plantCode, year, month)
  const isDataAvailable = useMemo(() => {
    if (!availablePeriods || availablePeriods.length === 0) return false;
    return availablePeriods.some((p) => p.year === year && p.month === month);
  }, [availablePeriods, year, month]);

  // 3. Fetch historical attendance and summary when (plantCode, year, month, unit) change
  const fetchHistoricalData = useCallback(async () => {
    if (!selectedPlant.isImplemented) {
      setWorkers([]);
      setSummaryData(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (!year || !month) return;

    setLoading(true);
    setError(null);

    try {
      if (!isDataAvailable) {
        setWorkers([]);
        setSummaryData(null);
        setLoading(false);
        return;
      }

      const [historyRes, summaryRes] = await Promise.all([
        attendanceService.getHistoricalAttendance({ plantCode, year, month, unit }),
        attendanceService.getMonthlySummary({ plantCode, year, month, unit }),
      ]);

      const workerList = historyRes?.workers || [];
      setWorkers(workerList);
      setSummaryData(summaryRes);
    } catch (err) {
      console.error('Error loading historical attendance:', err);
      setError(err.message || 'Failed to retrieve attendance data for selected period.');
      setWorkers([]);
      setSummaryData(null);
    } finally {
      setLoading(false);
    }
  }, [plantCode, year, month, unit, selectedPlant, isDataAvailable]);

  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  // Sync parameters with URL and localStorage
  useEffect(() => {
    if (plantCode && year && month && unit) {
      syncUrlParams(plantCode, year, month, unit);
      localStorage.setItem('kamla_plant', plantCode);
      localStorage.setItem('kamla_unit', unit);
    }
  }, [plantCode, year, month, unit]);

  // Handlers to update context
  const setPlant = useCallback((code) => {
    setPlantCodeState(code);
  }, []);

  const setYear = useCallback((y) => {
    setYearState(parseInt(y, 10));
  }, []);

  const setMonth = useCallback((m) => {
    setMonthState(parseInt(m, 10));
  }, []);

  const setUnit = useCallback((u) => {
    setUnitState(u);
  }, []);

  // Filter workers by current selected unit (if unit !== 'ALL')
  const allFilteredWorkers = useMemo(() => {
    if (unit === 'ALL') return workers;
    return workers.filter((w) => w.BlastFurnace?.toUpperCase() === unit.toUpperCase());
  }, [workers, unit]);

  // Filter workers by search query (Name or WISA)
  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return allFilteredWorkers;
    const q = searchQuery.toLowerCase().trim();
    return allFilteredWorkers.filter((w) => {
      const nameMatch = w.Name?.toLowerCase().includes(q);
      const wisaMatch = w.WISA?.toString().includes(q);
      return nameMatch || wisaMatch;
    });
  }, [allFilteredWorkers, searchQuery]);

  const value = {
    // Context State
    plantCode,
    selectedPlant,
    year,
    month,
    monthName: MONTH_NAMES[(month || 6) - 1] || 'June',
    unit,
    plants,
    availablePeriods,
    availableYears,
    availableMonths,
    supportedUnits,
    isDataAvailable,

    // Attendance Data
    workers,
    allFilteredWorkers,
    filteredWorkers,
    summaryData,
    loading,
    error,
    searchQuery,
    setSearchQuery,

    // Actions
    setPlantCode: setPlant,
    setYear,
    setMonth,
    setUnit,
    reload: fetchHistoricalData,
    refetchPeriods: () => fetchPeriods(plantCode),
  };

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

export default AttendanceContext;
