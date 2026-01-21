import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config, getApiEndpoint } from '../config';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  taxRate: number;
}

interface RestaurantContextValue {
  restaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
  setRestaurant: (restaurant: Restaurant) => Promise<void>;
  clearRestaurant: () => Promise<void>;
  apiUrl: (path?: string) => string;
}

const RestaurantContext = createContext<RestaurantContextValue | undefined>(undefined);

const STORAGE_KEY = '@orderstack_restaurant';

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [restaurant, setRestaurantState] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved restaurant on mount
  useEffect(() => {
    loadSavedRestaurant();
  }, []);

  async function loadSavedRestaurant() {
    try {
      setLoading(true);
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verify restaurant still exists by fetching it
        const response = await fetch(getApiEndpoint(parsed.id));
        if (response.ok) {
          const data = await response.json();
          setRestaurantState(data);
        } else {
          // Restaurant no longer exists, clear storage
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('Error loading restaurant:', err);
      setError('Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  }

  async function setRestaurant(newRestaurant: Restaurant) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRestaurant));
      setRestaurantState(newRestaurant);
      setError(null);
    } catch (err) {
      console.error('Error saving restaurant:', err);
      setError('Failed to save restaurant');
    }
  }

  async function clearRestaurant() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setRestaurantState(null);
      setError(null);
    } catch (err) {
      console.error('Error clearing restaurant:', err);
    }
  }

  // Helper to build API URLs
  function apiUrl(path: string = ''): string {
    if (!restaurant) {
      throw new Error('No restaurant selected');
    }
    return getApiEndpoint(restaurant.id, path);
  }

  const value: RestaurantContextValue = {
    restaurant,
    loading,
    error,
    setRestaurant,
    clearRestaurant,
    apiUrl,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
