import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';

const AUTH_TOKEN_KEY = '@orderstack_auth_token';
const AUTH_USER_KEY = '@orderstack_auth_user';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  restaurantGroupId: string | null;
}

export interface AuthRestaurant {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: AuthUser;
  restaurants?: AuthRestaurant[];
  error?: string;
}

export interface StaffPinResult {
  success: boolean;
  staffPin?: {
    id: string;
    name: string;
    role: string;
    restaurantId: string;
  };
  error?: string;
}

class AuthService {
  private token: string | null = null;
  private user: AuthUser | null = null;

  // Initialize from stored credentials
  async init(): Promise<{ token: string | null; user: AuthUser | null }> {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(AUTH_USER_KEY),
      ]);

      if (storedToken) {
        this.token = storedToken;
      }

      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }

      return { token: this.token, user: this.user };
    } catch (error) {
      console.error('[Auth] Failed to load stored credentials:', error);
      return { token: null, user: null };
    }
  }

  // Login with email/password
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const response = await fetch(`${config.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      // Store credentials
      this.token = data.token;
      this.user = data.user;

      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user)),
      ]);

      return {
        success: true,
        token: data.token,
        user: data.user,
        restaurants: data.restaurants,
      };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Verify staff PIN for a restaurant
  async verifyPin(restaurantId: string, pin: string): Promise<StaffPinResult> {
    try {
      const response = await fetch(`${config.apiUrl}/api/auth/${restaurantId}/pin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Invalid PIN' };
      }

      return {
        success: true,
        staffPin: data.staffPin,
      };
    } catch (error) {
      console.error('[Auth] PIN verification error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Get current user info (validates token)
  async getCurrentUser(): Promise<{ user: AuthUser; restaurants: AuthRestaurant[] } | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        // Token invalid or expired
        await this.logout();
        return null;
      }

      const data = await response.json();
      this.user = data.user;

      return {
        user: data.user,
        restaurants: data.restaurants,
      };
    } catch (error) {
      console.error('[Auth] Get current user error:', error);
      return null;
    }
  }

  // Logout
  async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch(`${config.apiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      } catch (error) {
        console.error('[Auth] Logout error:', error);
      }
    }

    this.token = null;
    this.user = null;

    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
    ]);
  }

  // Get auth header for API requests
  getAuthHeader(): { Authorization: string } | {} {
    if (this.token) {
      return { Authorization: `Bearer ${this.token}` };
    }
    return {};
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Get current user
  getUser(): AuthUser | null {
    return this.user;
  }
}

export const authService = new AuthService();
