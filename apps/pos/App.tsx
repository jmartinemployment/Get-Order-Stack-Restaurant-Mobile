import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartProvider } from './src/context/CartContext';
import { MenuScreen } from './src/screens/MenuScreen';
import { RestaurantSetupScreen } from './src/screens/RestaurantSetupScreen';
import { config } from './src/config';

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

const STORAGE_KEY = '@orderstack_restaurant';

export default function App() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedRestaurant();
  }, []);

  async function loadSavedRestaurant() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verify restaurant still exists
        const response = await fetch(`${config.apiUrl}/api/restaurant/${parsed.id}`);
        if (response.ok) {
          const data = await response.json();
          setRestaurant(data);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('Error loading restaurant:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestaurantSelected(newRestaurant: Restaurant) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRestaurant));
    setRestaurant(newRestaurant);
  }

  async function handleLogout() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setRestaurant(null);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Loading OrderStack...</Text>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <>
        <StatusBar style="light" />
        <RestaurantSetupScreen onRestaurantSelected={handleRestaurantSelected} />
      </>
    );
  }

  return (
    <CartProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <MenuScreen 
          restaurantId={restaurant.id} 
          restaurantName={restaurant.name}
          onLogout={handleLogout}
        />
      </SafeAreaView>
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
});
