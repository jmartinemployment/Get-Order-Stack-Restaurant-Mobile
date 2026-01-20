/**
 * Shared theme constants for GetOrderStack apps
 */

export const colors = {
  // Primary brand colors
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#e94560',
  
  // Status colors
  statusNew: '#f44336',
  statusCooking: '#FF9800',
  statusReady: '#4CAF50',
  statusCompleted: '#9E9E9E',
  statusCancelled: '#607D8B',
  
  // Order type colors
  orderPickup: '#4CAF50',
  orderDelivery: '#2196F3',
  orderDineIn: '#FF9800',
  
  // UI colors
  background: '#1a1a2e',
  surface: '#16213e',
  card: '#ffffff',
  cardHeader: '#f5f5f5',
  
  // Text colors
  textPrimary: '#1a1a2e',
  textSecondary: '#666666',
  textLight: '#ffffff',
  textMuted: '#9E9E9E',
  
  // Semantic colors
  error: '#f44336',
  warning: '#FF9800',
  success: '#4CAF50',
  info: '#2196F3',
  
  // Borders
  border: '#e0e0e0',
  borderDark: '#0f3460',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const typography = {
  // Font sizes
  fontSizeXs: 12,
  fontSizeSm: 14,
  fontSizeMd: 16,
  fontSizeLg: 18,
  fontSizeXl: 20,
  fontSizeXxl: 24,
  fontSizeDisplay: 32,
  
  // Font weights
  fontWeightNormal: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemibold: '600' as const,
  fontWeightBold: '700' as const,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Combined theme object
export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
