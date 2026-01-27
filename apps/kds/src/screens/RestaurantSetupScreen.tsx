import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../config';

interface Props {
  onRestaurantSelected: (restaurantId: string, restaurantName: string) => void;
}

export function RestaurantSetupScreen({ onRestaurantSelected }: Props) {
  const [restaurantId, setRestaurantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🍳 KDS Setup Screen - Waiting for restaurant ID input');

  const handleConnect = async () => {
    if (!restaurantId.trim()) {
      setError('Please enter a restaurant ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/${restaurantId.trim()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Restaurant not found. Please check the ID.');
        } else {
          setError('Failed to connect to restaurant.');
        }
        return;
      }

      const restaurant = await response.json();
      
      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEYS.RESTAURANT_ID, restaurant.id);
      await AsyncStorage.setItem(STORAGE_KEYS.RESTAURANT_NAME, restaurant.name);
      
      onRestaurantSelected(restaurant.id, restaurant.name);
    } catch (err) {
      console.error('Error connecting to restaurant:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🍳</Text>
        <Text style={styles.title}>Kitchen Display System</Text>
        <Text style={styles.subtitle}>Connect to your restaurant</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Restaurant ID</Text>
          <TextInput
            style={styles.input}
            value={restaurantId}
            onChangeText={setRestaurantId}
            placeholder="Enter restaurant ID"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Connect</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => showAlert(
            'Finding Your Restaurant ID',
            'Contact your administrator or check the POS system settings to get your restaurant ID.'
          )}
        >
          <Text style={styles.helpText}>Where do I find my Restaurant ID?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  errorText: {
    color: '#e94560',
    fontSize: 14,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpButton: {
    marginTop: 24,
    padding: 8,
  },
  helpText: {
    color: '#4da6ff',
    fontSize: 14,
  },
});
