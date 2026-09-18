import { getItem, setItem, apiResponse } from './client';

const NOTIFICATIONS_KEY = 'trainer_notifications_db';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    trainerName: 'Priya',
    title: 'Salary Payment Recorded',
    desc: 'Salary payment of ₹25,000 for September 2026 has been recorded.',
    time: 'Today, 10:30 AM',
    type: 'system',
    date: '2026-09-17'
  },
  {
    id: 'notif-2',
    trainerName: 'Rahul',
    title: 'Salary Payment Recorded',
    desc: 'Salary payment of ₹22,000 for September 2026 has been recorded.',
    time: 'Today, 11:00 AM',
    type: 'system',
    date: '2026-09-17'
  }
];

export const getNotifications = async () => {
  let notifications = getItem(NOTIFICATIONS_KEY, null);
  if (!notifications) {
    notifications = INITIAL_NOTIFICATIONS;
    setItem(NOTIFICATIONS_KEY, notifications);
  }
  return apiResponse(notifications);
};

export const createNotification = async (notifData) => {
  const { data: notifications } = await getNotifications();
  const newNotif = {
    id: `notif_${Date.now()}`,
    time: 'Just now',
    type: notifData.type || 'system',
    date: new Date().toISOString().split('T')[0],
    ...notifData
  };
  const updated = [newNotif, ...notifications];
  setItem(NOTIFICATIONS_KEY, updated);
  return apiResponse(newNotif);
};

export const getTrainerNotifications = async (trainerNameOrEmail) => {
  const { data: notifications } = await getNotifications();
  const lowerQuery = (trainerNameOrEmail || '').toLowerCase().trim();
  
  const trainerNotifs = notifications.filter(n => {
    if (!n.trainerName) return true; // general announcements shown to all
    const nLower = n.trainerName.toLowerCase();
    return nLower.includes(lowerQuery) || lowerQuery.includes(nLower);
  });

  return apiResponse(trainerNotifs);
};
