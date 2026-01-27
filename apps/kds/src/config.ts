import { Platform } from 'react-native';

// Determine the API URL based on environment
function getApiBaseUrl(): string {
  // Check if running on web
  if (Platform.OS === 'web') {
    // If running locally, use local backend
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3000';
    }
    // Production - use Render backend
    return 'https://get-order-stack-restaurant-backend.onrender.com';
  }

  // For native apps (iOS/Android), always use production or local dev
  // __DEV__ is true when running in development mode
  if (__DEV__) {
    // Use your machine's IP for local development
    // Replace with your actual local IP when testing on device
    return 'http://localhost:3000';
  }

  return 'https://get-order-stack-restaurant-backend.onrender.com';
}

export const API_BASE_URL = getApiBaseUrl();

// Storage keys
export const STORAGE_KEYS = {
  RESTAURANT_ID: 'kds_restaurant_id',
  RESTAURANT_NAME: 'kds_restaurant_name',
  DEVICE_ID: 'kds_device_id',
} as const;

// Generate a unique device ID (UUID v4-like)
export function generateDeviceId(): string {
  const chars = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else if (i === 19) {
      uuid += chars[(Math.random() * 4) | 8];
    } else {
      uuid += chars[(Math.random() * 16) | 0];
    }
  }
  return `kds-${uuid}`;
}
