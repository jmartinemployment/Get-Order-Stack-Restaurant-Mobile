import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

// Get API URL - check multiple sources
const getApiUrl = (): string => {
  // Use local backend for development
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  // Production backend
  return 'https://get-order-stack-restaurant-backend.onrender.com';
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
