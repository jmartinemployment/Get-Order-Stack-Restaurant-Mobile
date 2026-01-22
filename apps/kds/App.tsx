import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KitchenDisplayScreen } from './src/screens/KitchenDisplayScreen';
import { RestaurantSetupScreen } from './src/screens/RestaurantSetupScreen';
import { STORAGE_KEYS } from './src/config';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');

  // Check for saved restaurant on app load
  useEffect(() => {
    const loadSavedRestaurant = async () => {
      try {
        const savedId = await AsyncStorage.getItem(STORAGE_KEYS.RESTAURANT_ID);
        const savedName = await AsyncStorage.getItem(STORAGE_KEYS.RESTAURANT_NAME);
        
        if (savedId) {
          setRestaurantId(savedId);
          setRestaurantName(savedName || 'Restaurant');
        }
      } catch (error) {
        console.error('Error loading saved restaurant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedRestaurant();
  }, []);

  const handleRestaurantSelected = (id: string, name: string) => {
    setRestaurantId(id);
    setRestaurantName(name);
  };

  const handleSwitchRestaurant = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RESTAURANT_ID);
      await AsyncStorage.removeItem(STORAGE_KEYS.RESTAURANT_NAME);
      setRestaurantId(null);
      setRestaurantName('');
    } catch (error) {
      console.error('Error clearing restaurant:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {restaurantId ? (
        <KitchenDisplayScreen
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          onSwitchRestaurant={handleSwitchRestaurant}
        />
      ) : (
        <RestaurantSetupScreen onRestaurantSelected={handleRestaurantSelected} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
