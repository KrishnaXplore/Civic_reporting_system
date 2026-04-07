import { useState, useCallback } from 'react';

export const useConfirm = () => {
  const [confirm, setConfirm] = useState({ open: false, message: '', resolve: null });

  const ask = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirm({ open: true, message, resolve });
    });
  }, []);

  const handleConfirm = (result) => {
    confirm.resolve?.(result);
    setConfirm({ open: false, message: '', resolve: null });
  };

  return { confirm, ask, handleConfirm };
};
