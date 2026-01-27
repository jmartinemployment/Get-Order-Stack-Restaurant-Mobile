import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { config } from '../config';

type OrderEventCallback = (order: any, eventType: 'new' | 'updated') => void;
type ConnectionCallback = (connected: boolean) => void;

class POSSocketService {
  private socket: Socket | null = null;
  private deviceId: string | null = null;
  private restaurantId: string | null = null;
  private orderCallbacks: Set<OrderEventCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // Generate a unique device ID for this POS instance
  private generateDeviceId(): string {
    const chars = '0123456789abcdef';
    let uuid = '';
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += '-';
      } else if (i === 14) {
        uuid += '4';
      } else if (i === 19) {
        uuid += chars[(Math.random() * 4) | 8];
      } else {
        uuid += chars[(Math.random() * 16) | 0];
      }
    }
    return `pos-${uuid}`;
  }

  // Get hardware-based device ID
  private async getHardwareDeviceId(): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        // Android: use Android ID (persists across app reinstalls)
        const androidId = Application.getAndroidId();
        if (androidId) return `pos-android-${androidId}`;
      } else if (Platform.OS === 'ios') {
        // iOS: use identifierForVendor (persists until app uninstall)
        const iosId = await Application.getIosIdForVendorAsync();
        if (iosId) return `pos-ios-${iosId}`;
      } else if (Platform.OS === 'web') {
        // Web: use localStorage for persistence
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = localStorage.getItem('pos_device_id');
          if (stored) return stored;
          // Generate and store a new ID for this browser
          const webId = `pos-web-${this.generateDeviceId().replace('pos-', '')}`;
          localStorage.setItem('pos_device_id', webId);
          return webId;
        }
      }
      return null;
    } catch (error) {
      console.error('[POS Socket] Error getting hardware device ID:', error);
      return null;
    }
  }

  // Initialize device ID (async - uses hardware ID or falls back to stored/generated)
  async initializeDeviceIdAsync(): Promise<string> {
    if (this.deviceId) return this.deviceId;

    try {
      // First, try to get hardware-based ID
      const hardwareId = await this.getHardwareDeviceId();
      if (hardwareId) {
        this.deviceId = hardwareId;
        // Store it so we can use sync version later
        await AsyncStorage.setItem('pos_device_id', this.deviceId);
        console.log('[POS Socket] Using hardware device ID:', this.deviceId);
        return this.deviceId;
      }

      // Fall back to stored ID
      const stored = await AsyncStorage.getItem('pos_device_id');
      if (stored) {
        this.deviceId = stored;
        console.log('[POS Socket] Using stored device ID:', this.deviceId);
      } else {
        // Last resort: generate a random ID
        this.deviceId = this.generateDeviceId();
        await AsyncStorage.setItem('pos_device_id', this.deviceId);
        console.log('[POS Socket] Generated new device ID:', this.deviceId);
      }
    } catch (error) {
      // Fallback to in-memory ID
      this.deviceId = this.generateDeviceId();
      console.log('[POS Socket] Fallback device ID:', this.deviceId);
    }
    return this.deviceId;
  }

  // Sync version - returns existing ID (should only be called after connect())
  initializeDeviceId(): string {
    if (!this.deviceId) {
      // This should not happen if connect() was called first
      // But if it does, get from localStorage directly for web
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('pos_device_id');
        if (stored) {
          this.deviceId = stored;
          return this.deviceId;
        }
      }
      // Last resort: generate temporary ID
      this.deviceId = this.generateDeviceId();
      console.warn('[POS Socket] initializeDeviceId called before connect() - using temp ID');
    }
    return this.deviceId;
  }

  // Connect to WebSocket server
  async connect(restaurantId: string): Promise<void> {
    console.log('[POS Socket] connect() called with restaurantId:', restaurantId);

    if (this.socket?.connected && this.restaurantId === restaurantId) {
      console.log('[POS Socket] Already connected to this restaurant');
      return;
    }

    // Disconnect existing connection if any
    this.disconnect();

    this.restaurantId = restaurantId;
    const deviceId = await this.initializeDeviceIdAsync();
    console.log('[POS Socket] Using deviceId:', deviceId);

    // Connect to WebSocket
    const socketUrl = config.apiUrl;
    console.log('[POS Socket] Connecting to:', socketUrl);

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('[POS Socket] Connected! Joining restaurant room...');
      this.reconnectAttempts = 0;

      // Join restaurant room
      this.socket?.emit('join-restaurant', {
        restaurantId,
        deviceId,
        deviceType: 'pos'
      });

      this.notifyConnectionCallbacks(true);
      this.startHeartbeat();
    });

    this.socket.on('joined-restaurant', (data) => {
      console.log('[POS Socket] Successfully joined restaurant room:', data);
    });

    this.socket.on('disconnect', () => {
      this.notifyConnectionCallbacks(false);
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[POS Socket] Connection error:', error.message);
      this.reconnectAttempts++;
    });

    // Order events - receive updates from KDS
    this.socket.on('order:new', (data) => {
      console.log('[POS Socket] Received order:new', data.order?.orderNumber);
      this.notifyOrderCallbacks(data.order, 'new');
    });

    this.socket.on('order:updated', (data) => {
      console.log('[POS Socket] Received order:updated', data.order?.orderNumber, data.order?.status);
      this.notifyOrderCallbacks(data.order, 'updated');
    });

    // Device events - silent
    this.socket.on('device-connected', () => {});
    this.socket.on('device-disconnected', () => {});
  }

  // Disconnect from WebSocket
  disconnect(): void {
    this.stopHeartbeat();

    if (this.socket) {
      if (this.restaurantId && this.deviceId) {
        this.socket.emit('leave-restaurant', {
          restaurantId: this.restaurantId,
          deviceId: this.deviceId
        });
      }
      this.socket.disconnect();
      this.socket = null;
    }

    this.restaurantId = null;
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected && this.deviceId) {
        this.socket.emit('heartbeat', { deviceId: this.deviceId });
      }
    }, 15000); // Every 15 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Subscribe to order events
  onOrderEvent(callback: OrderEventCallback): () => void {
    this.orderCallbacks.add(callback);
    return () => this.orderCallbacks.delete(callback);
  }

  // Subscribe to connection status changes
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  private notifyOrderCallbacks(order: any, eventType: 'new' | 'updated'): void {
    this.orderCallbacks.forEach(callback => {
      try {
        callback(order, eventType);
      } catch (error) {
        console.error('Error in order callback:', error);
      }
    });
  }

  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Get device ID (initializes if needed)
  getDeviceId(): string {
    if (!this.deviceId) {
      this.initializeDeviceId();
    }
    return this.deviceId!;
  }

  // Get current restaurant ID
  getRestaurantId(): string | null {
    return this.restaurantId;
  }
}

export const posSocketService = new POSSocketService();
