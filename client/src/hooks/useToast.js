import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState({ text: '', type: '' });

  const showToast = useCallback((text, type = 'success', duration = 3000) => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), duration);
  }, []);

  const clearToast = useCallback(() => setToast({ text: '', type: '' }), []);

  return { toast, showToast, clearToast };
};
