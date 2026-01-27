import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authService, AuthRestaurant } from '../services/auth.service';

interface LoginScreenProps {
  onLoginSuccess: (restaurants: AuthRestaurant[]) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    try {
      await authService.init();

      if (authService.isAuthenticated()) {
        const result = await authService.getCurrentUser();
        if (result) {
          onLoginSuccess(result.restaurants);
          return;
        }
      }
    } catch (err) {
      console.error('Error checking session:', err);
    } finally {
      setCheckingSession(false);
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await authService.login(email.trim().toLowerCase(), password);

    setLoading(false);

    if (result.success && result.restaurants) {
      onLoginSuccess(result.restaurants);
    } else {
      setError(result.error || 'Login failed');
    }
  }

  if (checkingSession) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Checking session...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>🍳</Text>
        <Text style={styles.title}>Kitchen Display</Text>
        <Text style={styles.subtitle}>Sign in to connect</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            editable={!loading}
            onSubmitEditing={handleLogin}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>OrderStack KDS v1.0</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 12,
    fontSize: 14,
  },
  content: {
    width: Math.min(400, width * 0.9),
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 32,
  },
  form: {
    width: '100%',
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
  error: {
    color: '#e94560',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
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
