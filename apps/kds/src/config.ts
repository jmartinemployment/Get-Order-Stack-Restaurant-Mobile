import { Platform } from 'react-native';

// Determine the API URL based on environment
function getApiBaseUrl(): string {
  // Check if running on web
  if (Platform.OS === 'web') {
    // If running locally, use production backend (Render may need wake-up time)
    // Change this to 'http://localhost:3000' if running backend locally
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'https://get-order-stack-restaurant-backend.onrender.com';
    }
    // Production - use Render backend
    return 'https://get-order-stack-restaurant-backend.onrender.com';
  }
  
  // For native apps (iOS/Android), always use production or local dev
  // __DEV__ is true when running in development mode
  if (__DEV__) {
    // Use your machine's IP for local development
    // Replace with your actual local IP when testing on device
    return 'https://get-order-stack-restaurant-backend.onrender.com';
  }
  
  return 'https://get-order-stack-restaurant-backend.onrender.com';
}

export const API_BASE_URL = getApiBaseUrl();

// Storage keys
export const STORAGE_KEYS = {
  RESTAURANT_ID: 'kds_restaurant_id',
  RESTAURANT_NAME: 'kds_restaurant_name',
} as const;
