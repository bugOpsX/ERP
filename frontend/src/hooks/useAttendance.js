import { useState, useEffect, useMemo, useCallback } from 'react';
import { attendanceService } from '../services/api';

/**
 * Custom hook to manage attendance state, searching, loading, and refreshing.
 */
export const useAttendance = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMock, setIsMock] = useState(false);

  const fetchAttendance = useCallback(async (forceMock = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await attendanceService.getAttendance(forceMock);
      
      // Validate that response contains an array of workers
      if (Array.isArray(result.workers)) {
        setWorkers(result.workers);
      } else {
        throw new Error('Invalid data format received from server.');
      }
      
      setIsMock(result.isMock);
    } catch (err) {
      console.error('Error in useAttendance hook:', err);
      // Retrieve friendly message from backend if available
      const message = err.response?.data?.message || err.message || 'Failed to connect to the server.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Filter workers based on search query (Name or WISA)
  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) {
      return workers;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    return workers.filter((worker) => {
      const nameMatch = worker.Name?.toLowerCase().includes(query);
      const wisaMatch = worker.WISA?.toString().includes(query);
      return nameMatch || wisaMatch;
    });
  }, [workers, searchQuery]);

  return {
    workers,
    filteredWorkers,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    isMock,
    refresh: () => fetchAttendance(false),
    forceMockFetch: () => fetchAttendance(true),
  };
};

export default useAttendance;
