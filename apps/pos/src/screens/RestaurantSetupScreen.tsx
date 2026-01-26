import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { config } from '../config';

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

interface RestaurantSetupScreenProps {
  onRestaurantSelected: (restaurant: Restaurant) => void;
}

export function RestaurantSetupScreen({ onRestaurantSelected }: RestaurantSetupScreenProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Select existing restaurant - hardcoded for testing
  const [restaurantId, setRestaurantId] = useState('f2cfe8dd-48f3-4596-ab1e-22a28b23ad38');
  
  // Create new restaurant
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('FL');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');

  async function handleSelectRestaurant() {
    if (!restaurantId.trim()) {
      setError('Please enter a restaurant ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiUrl}/api/restaurant/${restaurantId.trim()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Restaurant not found. Check the ID and try again.');
        }
        throw new Error('Failed to connect to restaurant');
      }

      const restaurant = await response.json();
      onRestaurantSelected(restaurant);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRestaurant() {
    if (!name.trim()) {
      setError('Restaurant name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiUrl}/api/restaurant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || 'FL',
          zip: zip.trim() || undefined,
          phone: phone.trim() || undefined,
          taxRate: 0.065, // Florida default
          pickupEnabled: true,
          dineInEnabled: true,
          deliveryEnabled: false,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create restaurant');
      }

      const restaurant = await response.json();
      onRestaurantSelected(restaurant);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create restaurant');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🍽️ OrderStack</Text>
        <Text style={styles.title}>Restaurant Setup</Text>
        <Text style={styles.subtitle}>Connect to your restaurant to get started</Text>

        {/* Mode Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'select' && styles.tabActive]}
            onPress={() => setMode('select')}
          >
            <Text style={[styles.tabText, mode === 'select' && styles.tabTextActive]}>
              Connect Existing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'create' && styles.tabActive]}
            onPress={() => setMode('create')}
          >
            <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>
              Create New
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {mode === 'select' ? (
            <>
              <Text style={styles.label}>Restaurant ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter restaurant ID or paste URL"
                placeholderTextColor="#666"
                value={restaurantId}
                onChangeText={setRestaurantId}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.hint}>
                Your restaurant ID was provided when your account was created.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>Restaurant Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., La Cocina Cubana"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>URL Slug</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., la-cocina-cubana (auto-generated if blank)"
                placeholderTextColor="#666"
                value={slug}
                onChangeText={setSlug}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Street address"
                placeholderTextColor="#666"
                value={address}
                onChangeText={setAddress}
              />

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor="#666"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={styles.rowItemSmall}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="FL"
                    placeholderTextColor="#666"
                    value={state}
                    onChangeText={setState}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>ZIP</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="33101"
                    placeholderTextColor="#666"
                    value={zip}
                    onChangeText={setZip}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="(305) 555-0123"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={mode === 'select' ? handleSelectRestaurant : handleCreateRestaurant}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'select' ? 'Connect' : 'Create Restaurant'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <Text style={styles.footer}>
          OrderStack POS v1.0 • AI-Powered Restaurant Management
        </Text>
      </View>
    </View>
  );
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
    maxHeight: height * 0.9,
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#e94560',
  },
  tabText: {
    color: '#999',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  form: {
    width: '100%',
    maxHeight: height * 0.5,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  hint: {
    color: '#666',
    fontSize: 12,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  rowItemSmall: {
    width: 70,
  },
  error: {
    color: '#e94560',
    textAlign: 'center',
    marginTop: 16,
  },
  button: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    color: '#666',
    fontSize: 12,
    marginTop: 24,
  },
});
