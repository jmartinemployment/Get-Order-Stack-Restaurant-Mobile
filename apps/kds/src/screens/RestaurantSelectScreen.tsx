import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthRestaurant, authService } from '../services/auth.service';
import { API_BASE_URL, STORAGE_KEYS } from '../config';

interface RestaurantSelectScreenProps {
  restaurants: AuthRestaurant[];
  userName: string | null;
  onRestaurantSelected: (restaurantId: string, restaurantName: string) => void;
  onLogout: () => void;
}

export function RestaurantSelectScreen({
  restaurants,
  userName,
  onRestaurantSelected,
  onLogout,
}: RestaurantSelectScreenProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectRestaurant(authRestaurant: AuthRestaurant) {
    setLoading(authRestaurant.id);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/${authRestaurant.id}`, {
        headers: {
          ...authService.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load restaurant details');
      }

      const restaurant = await response.json();

      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEYS.RESTAURANT_ID, restaurant.id);
      await AsyncStorage.setItem(STORAGE_KEYS.RESTAURANT_NAME, restaurant.name);

      onRestaurantSelected(restaurant.id, restaurant.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant');
      setLoading(null);
    }
  }

  async function handleLogout() {
    await authService.logout();
    onLogout();
  }

  const displayName = userName || 'User';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.icon}>🍳</Text>
        <Text style={styles.title}>Select Kitchen</Text>
        <Text style={styles.subtitle}>
          Choose a restaurant to display orders
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {restaurants.map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              style={[
                styles.restaurantCard,
                loading === restaurant.id && styles.restaurantCardLoading,
              ]}
              onPress={() => handleSelectRestaurant(restaurant)}
              disabled={loading !== null}
            >
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <Text style={styles.restaurantRole}>
                  Role: {formatRole(restaurant.role)}
                </Text>
              </View>
              {loading === restaurant.id ? (
                <ActivityIndicator color="#e94560" />
              ) : (
                <Text style={styles.arrow}>→</Text>
              )}
            </TouchableOpacity>
          ))}

          {restaurants.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No restaurants available</Text>
              <Text style={styles.emptySubtext}>
                Contact your administrator to get access to a restaurant.
              </Text>
            </View>
          )}
        </ScrollView>

        <Text style={styles.footer}>OrderStack KDS v1.0</Text>
      </View>
    </View>
  );
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    super_admin: 'Super Admin',
    owner: 'Owner',
    manager: 'Manager',
    staff: 'Staff',
  };
  return roleMap[role] || role;
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: Math.min(500, width * 0.9),
    maxHeight: height * 0.85,
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#999',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  logoutText: {
    color: '#e94560',
    fontWeight: '600',
    fontSize: 14,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    color: '#e94560',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  list: {
    width: '100%',
    maxHeight: height * 0.4,
  },
  restaurantCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  restaurantCardLoading: {
    opacity: 0.7,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  restaurantRole: {
    fontSize: 13,
    color: '#999',
  },
  arrow: {
    fontSize: 20,
    color: '#e94560',
    marginLeft: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
