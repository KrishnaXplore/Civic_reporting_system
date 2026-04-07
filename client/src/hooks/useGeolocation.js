import { useState, useCallback } from 'react';

export const useGeolocation = () => {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      () => {
        setError('Could not get location. Please click on the map.');
        setLoading(false);
      }
    );
  }, []);

  return { position, setPosition, loading, error, getLocation };
};
