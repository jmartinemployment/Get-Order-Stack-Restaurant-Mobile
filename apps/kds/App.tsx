import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KitchenDisplayScreen } from './src/screens/KitchenDisplayScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RestaurantSelectScreen } from './src/screens/RestaurantSelectScreen';
import { authService, AuthRestaurant } from './src/services/auth.service';
import { STORAGE_KEYS, API_BASE_URL } from './src/config';

type AppState = 'loading' | 'login' | 'selectRestaurant' | 'kds';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [restaurants, setRestaurants] = useState<AuthRestaurant[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      // Check for saved restaurant selection
      const savedId = await AsyncStorage.getItem(STORAGE_KEYS.RESTAURANT_ID);
      const savedName = await AsyncStorage.getItem(STORAGE_KEYS.RESTAURANT_NAME);

      console.log('🍳 KDS App - Loading saved restaurant:', { savedId, savedName });

      if (savedId) {
        // Verify restaurant still exists
        const response = await fetch(`${API_BASE_URL}/api/restaurant/${savedId}`);
        if (response.ok) {
          setRestaurantId(savedId);
          setRestaurantName(savedName || 'Restaurant');
          setAppState('kds');
          return;
        } else {
          // Restaurant no longer valid, clear it
          await AsyncStorage.removeItem(STORAGE_KEYS.RESTAURANT_ID);
          await AsyncStorage.removeItem(STORAGE_KEYS.RESTAURANT_NAME);
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
    } catch (error) {
      console.error('Error initializing app:', error);
      setAppState('login');
    }
  }

  function handleLoginSuccess(authRestaurants: AuthRestaurant[]) {
    setRestaurants(authRestaurants);
    const user = authService.getUser();
    setUserName(user?.firstName || user?.email || null);
    setAppState('selectRestaurant');
  }

  function handleRestaurantSelected(id: string, name: string) {
    setRestaurantId(id);
    setRestaurantName(name);
    setAppState('kds');
  }

  async function handleLogout() {
    await authService.logout();
    await AsyncStorage.removeItem(STORAGE_KEYS.RESTAURANT_ID);
    await AsyncStorage.removeItem(STORAGE_KEYS.RESTAURANT_NAME);
    setRestaurantId(null);
    setRestaurantName('');
    setRestaurants([]);
    setUserName(null);
    setAppState('login');
  }

  async function handleSwitchRestaurant() {
    await AsyncStorage.removeItem(STORAGE_KEYS.RESTAURANT_ID);
    await AsyncStorage.removeItem(STORAGE_KEYS.RESTAURANT_NAME);
    setRestaurantId(null);
    setRestaurantName('');

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
        <Text style={styles.loadingText}>Loading KDS...</Text>
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

  if (restaurantId) {
    return (
      <>
        <StatusBar style="light" />
        <KitchenDisplayScreen
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          onSwitchRestaurant={handleSwitchRestaurant}
          onLogout={handleLogout}
        />
      </>
    );
  }

  return null;
}

const styles = StyleSheet.create({
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
