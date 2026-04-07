import { useState, useEffect, useCallback } from 'react';
import { getMyComplaintsApi, getDepartmentComplaintsApi } from '../api/complaints.api';

export const useComplaints = (type = 'my', params = {}) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const apiFn = type === 'department' ? getDepartmentComplaintsApi : getMyComplaintsApi;
      const { data } = await apiFn(params);
      setComplaints(data.data || []);
    } catch {
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [type, JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { complaints, setComplaints, loading, error, refetch: fetch };
};
