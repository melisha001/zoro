import { getItem, setItem, apiResponse } from './client';

const SETTINGS_KEY = 'admin_settings_db';

const DEFAULT_SETTINGS = {
  generalInfo: {
    academyName: 'Zoro English Academy',
    tagline: 'Small Steps Big Communication',
    contactEmail: 'contact@zoroacademy.com',
    contactPhone: '+91 98765 43210',
    address: 'No. 12, Main Road, Skill Nagar, Chennai - 600001',
    currency: 'INR (₹)'
  },
  securitySettings: {
    autoGeneratePasswords: true,
    requirePasswordChange: false,
    sessionTimeoutMins: 60,
    notifyOnNewEnrollment: true
  },
  notificationTriggers: {
    emailOnEnrollment: true,
    smsOnReminder: true,
    notifyOnDoubt: true
  }
};

export const getSettings = async () => {
  let settings = getItem(SETTINGS_KEY, null);
  if (!settings) {
    settings = DEFAULT_SETTINGS;
    setItem(SETTINGS_KEY, settings);
  }
  return apiResponse(settings);
};

export const saveSettings = async (newSettingsData) => {
  const { data: current } = await getSettings();
  const updated = {
    ...current,
    ...newSettingsData
  };
  setItem(SETTINGS_KEY, updated);
  return apiResponse(updated);
};
