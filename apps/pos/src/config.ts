import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

// Get API URL - check multiple sources
const getApiUrl = (): string => {
  // 1. Check Expo's extra config (from app.json or app.config.js)
  if (extra.apiUrl && extra.apiUrl !== 'http://localhost:3000') {
    return extra.apiUrl;
  }
  
  // 2. For Vercel/web production builds, check if we're on a deployed domain
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    
    // If we're on Vercel (not localhost), use production backend
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://get-order-stack-restaurant-backend.onrender.com';
    }
  }
  
  // 3. Fallback for local development
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

// Log config (always, for debugging)
console.log('📱 OrderStack POS Config:', {
  apiUrl: config.apiUrl,
  hostname: typeof window !== 'undefined' ? window.location?.hostname : 'server',
});
