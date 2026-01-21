import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra || {};

// For web builds, we can use process.env (set at build time)
// For native builds, we use Constants.expoConfig.extra
const getEnvVar = (key: string, fallback: string): string => {
  // Web: Check process.env first (Vercel injects these at build time)
  if (Platform.OS === 'web' && typeof process !== 'undefined' && process.env) {
    const envKey = `EXPO_PUBLIC_${key}`;
    if ((process.env as any)[envKey]) {
      return (process.env as any)[envKey];
    }
  }
  
  // Native/fallback: Use expo extra config
  const extraKey = key.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  if (extra[extraKey]) {
    return extra[extraKey];
  }
  
  return fallback;
};

// Determine API URL based on environment
const getApiUrl = (): string => {
  // Check for explicit environment variable first
  const envUrl = getEnvVar('API_URL', '');
  if (envUrl) return envUrl;
  
  // Default based on environment
  if (extra.apiUrl) return extra.apiUrl;
  
  // Fallback for development
  return 'http://localhost:3000';
};

export const config = {
  apiUrl: getApiUrl(),
  taxRate: 0.065, // 6.5% Florida
  
  // Feature flags
  enableVoiceOrdering: false,
  enableOfflineMode: false,
  
  // AI settings
  enableAiUpsell: true,
  enableAiInsights: true,
};

// Helper to get full API endpoint
export const getApiEndpoint = (restaurantId: string, path: string = ''): string => {
  const base = `${config.apiUrl}/api/restaurant/${restaurantId}`;
  return path ? `${base}${path.startsWith('/') ? path : '/' + path}` : base;
};

// Log config in development
if (__DEV__) {
  console.log('📱 OrderStack POS Config:', {
    apiUrl: config.apiUrl,
    enableAiUpsell: config.enableAiUpsell,
  });
}
