import { useState, useEffect } from 'react';
import { getDepartmentsApi } from '../api/departments.api';

export const useDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDepartmentsApi()
      .then(({ data }) => setDepartments(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { departments, setDepartments, loading };
};
