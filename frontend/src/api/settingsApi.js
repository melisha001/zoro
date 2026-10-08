import { getWebsiteSettings, saveWebsiteSettings } from './websiteSettingsApi';
import { apiResponse } from './client';

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
  const { data: webSettings } = await getWebsiteSettings();
  const adminSettings = webSettings?.adminSettings || DEFAULT_SETTINGS;
  return apiResponse({
    ...DEFAULT_SETTINGS,
    ...adminSettings
  });
};

export const saveSettings = async (newSettingsData) => {
  const { data: current } = await getSettings();
  const updatedAdminSettings = {
    ...current,
    ...newSettingsData
  };
  await saveWebsiteSettings({ adminSettings: updatedAdminSettings });
  return apiResponse(updatedAdminSettings);
};
