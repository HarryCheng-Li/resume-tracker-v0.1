import { useState, useEffect, useCallback } from 'react';
import {
  getNotificationsByUserId,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../lib/mockData';
import { Notification } from '../types';

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const items = getNotificationsByUserId(userId);
    setNotifications(items);
    setUnreadCount(items.filter((item) => !item.isRead).length);
    setIsLoading(false);
  }, [userId]);

  const markAsRead = async (id: string) => {
    markNotificationAsRead(id);
    await fetchNotifications();
  };

  const markAllAsRead = async () => {
    markAllNotificationsAsRead(userId);
    await fetchNotifications();
  };

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!userId) return;
    const intervalId = setInterval(() => {
      void fetchNotifications();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchNotifications, userId]);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};
