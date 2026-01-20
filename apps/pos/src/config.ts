import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const config = {
  restaurantId: extra.restaurantId || '96816829-87e3-4b6a-9f6c-613e4b3ab522',
  apiUrl: extra.apiUrl || 'http://localhost:3000',
  taxRate: 0.065, // 6.5% Florida
};
