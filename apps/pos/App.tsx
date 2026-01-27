import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartProvider } from './src/context/CartContext';
import { OrderNotificationProvider } from './src/contexts/OrderNotificationContext';
import { MenuScreen } from './src/screens/MenuScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RestaurantSelectScreen } from './src/screens/RestaurantSelectScreen';
import { OrderNotificationToast } from './src/components/OrderNotificationToast';
import { authService, AuthRestaurant } from './src/services/auth.service';
import { posSocketService } from './src/services/socket.service';
import { config } from './src/config';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  taxRate: number;
}

type AppState = 'loading' | 'login' | 'selectRestaurant' | 'pos';

const STORAGE_KEY = '@orderstack_restaurant';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<AuthRestaurant[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      // Check if we have a saved restaurant selection
      const savedRestaurant = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedRestaurant) {
        const parsed = JSON.parse(savedRestaurant);

        // Verify restaurant still exists
        const response = await fetch(`${config.apiUrl}/api/restaurant/${parsed.id}`);
        if (response.ok) {
          const data = await response.json();
          setRestaurant(data);
          // Connect to socket for real-time order updates (await to ensure deviceId is ready)
          await posSocketService.connect(data.id);
          setAppState('pos');
          return;
        } else {
          // Restaurant no longer valid, clear it
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }

      // No saved restaurant, check auth state
      await authService.init();

      if (authService.isAuthenticated()) {
        const result = await authService.getCurrentUser();
        if (result) {
          setRestaurants(result.restaurants);
          const user = authService.getUser();
          setUserName(user?.firstName || user?.email || null);
          setAppState('selectRestaurant');
          return;
        }
      }

      // Not authenticated
      setAppState('login');
    } catch (err) {
      console.error('Error initializing app:', err);
      setAppState('login');
    }
  }

  function handleLoginSuccess(authRestaurants: AuthRestaurant[]) {
    setRestaurants(authRestaurants);
    const user = authService.getUser();
    setUserName(user?.firstName || user?.email || null);
    setAppState('selectRestaurant');
  }

  async function handleRestaurantSelected(selectedRestaurant: Restaurant) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selectedRestaurant));
    setRestaurant(selectedRestaurant);
    // Connect to socket for real-time order updates (await to ensure deviceId is ready)
    await posSocketService.connect(selectedRestaurant.id);
    setAppState('pos');
  }

  async function handleLogout() {
    posSocketService.disconnect();
    await authService.logout();
    await AsyncStorage.removeItem(STORAGE_KEY);
    setRestaurant(null);
    setRestaurants([]);
    setUserName(null);
    setAppState('login');
  }

  async function handleSwitchRestaurant() {
    posSocketService.disconnect();
    await AsyncStorage.removeItem(STORAGE_KEY);
    setRestaurant(null);

    // Refresh restaurant list
    const result = await authService.getCurrentUser();
    if (result) {
      setRestaurants(result.restaurants);
      setAppState('selectRestaurant');
    } else {
      // Session expired
      handleLogout();
    }
  }

  if (appState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Loading OrderStack...</Text>
      </View>
    );
  }

  if (appState === 'login') {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  if (appState === 'selectRestaurant') {
    return (
      <>
        <StatusBar style="light" />
        <RestaurantSelectScreen
          restaurants={restaurants}
          userName={userName}
          onRestaurantSelected={handleRestaurantSelected}
          onLogout={handleLogout}
        />
      </>
    );
  }

  if (restaurant) {
    return (
      <OrderNotificationProvider>
        <CartProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <MenuScreen
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
              restaurantLogo={restaurant.logo}
              onLogout={handleLogout}
              onSwitchRestaurant={handleSwitchRestaurant}
            />
            <OrderNotificationToast />
          </SafeAreaView>
        </CartProvider>
      </OrderNotificationProvider>
    );
  }

  return null;
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
