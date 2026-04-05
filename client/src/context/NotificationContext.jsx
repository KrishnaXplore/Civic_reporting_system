import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/api/v1/notifications');
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n) => !n.isRead).length);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchNotifications();

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const es = new EventSource(`${baseURL}/api/v1/notifications/connect`, {
      withCredentials: true,
    });

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'connected') return;
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    es.onerror = () => {
      es.close();
    };

    eventSourceRef.current = es;

    return () => {
      es.close();
    };
  }, [user]);

  const markAllRead = async () => {
    await api.put('/api/v1/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markRead = async (id) => {
    await api.put(`/api/v1/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead, markRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
