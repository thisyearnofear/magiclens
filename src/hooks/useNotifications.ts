import { useState, useCallback, useEffect } from 'react';

interface NotificationState {
  permission: NotificationPermission;
  subscribed: boolean;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>(() => ({
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
    subscribed: localStorage.getItem('magiclens_notifications') === 'true',
  }));

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setState(prev => ({ ...prev, permission }));
    if (permission === 'granted') {
      localStorage.setItem('magiclens_notifications', 'true');
      setState(prev => ({ ...prev, subscribed: true }));
    }
  }, []);

  const unsubscribe = useCallback(() => {
    localStorage.removeItem('magiclens_notifications');
    setState(prev => ({ ...prev, subscribed: false }));
  }, []);

  const sendTestNotification = useCallback(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    new Notification('MagicLens', {
      body: 'The daily leaderboard is about to reset! Check your rank.',
      icon: '/magiclens.png',
    });
  }, []);

  useEffect(() => {
    // If subscribed, schedule a test notification after 30 seconds (for demo)
    if (state.subscribed && state.permission === 'granted') {
      const timer = setTimeout(sendTestNotification, 30000);
      return () => clearTimeout(timer);
    }
  }, [state.subscribed, state.permission, sendTestNotification]);

  return { ...state, requestPermission, unsubscribe, sendTestNotification };
}
