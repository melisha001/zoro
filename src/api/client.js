// Centralized API Client with LocalStorage Persistence & REST structure
const STORAGE_PREFIX = 'zoro_english_academy_';

export const getItem = (key, defaultVal = null) => {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : defaultVal;
  } catch (e) {
    console.error('Error reading localStorage', e);
    return defaultVal;
  }
};

export const setItem = (key, value) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing localStorage', e);
  }
};

// Generic API response wrapper
export const apiResponse = (data, success = true, message = 'Success') => {
  return Promise.resolve({ success, data, message });
};
