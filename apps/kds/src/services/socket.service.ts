import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL, STORAGE_KEYS, generateDeviceId } from '../config';

type OrderEventCallback = (order: any) => void;
type ConnectionCallback = (connected: boolean) => void;

class KDSSocketService {
  private socket: Socket | null = null;
  private deviceId: string | null = null;
  private restaurantId: string | null = null;
  private orderCallbacks: Set<OrderEventCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // Initialize device ID (generate if not exists)
  async initializeDeviceId(): Promise<string> {
    if (this.deviceId) return this.deviceId;

    try {
      let storedId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      if (!storedId) {
        storedId = generateDeviceId();
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, storedId);
      }
      this.deviceId = storedId;
      return storedId;
    } catch (error) {
      // Fallback to in-memory ID
      this.deviceId = generateDeviceId();
      return this.deviceId;
    }
  }

  // Register device with backend
  async registerDevice(restaurantId: string): Promise<boolean> {
    const deviceId = await this.initializeDeviceId();

    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/${restaurantId}/devices/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          deviceType: 'kds',
          platform: Platform.OS,
          appVersion: '1.0.0'
        })
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Connect to WebSocket server
  async connect(restaurantId: string): Promise<void> {
    if (this.socket?.connected && this.restaurantId === restaurantId) {
      return;
    }

    // Disconnect existing connection if any
    this.disconnect();

    this.restaurantId = restaurantId;
    const deviceId = await this.initializeDeviceId();

    // Register device first (non-blocking, errors are silently ignored)
    this.registerDevice(restaurantId);

    // Connect to WebSocket
    const socketUrl = API_BASE_URL.replace('/api/restaurant', '');

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
      this.reconnectAttempts = 0;

      // Join restaurant room
      this.socket?.emit('join-restaurant', {
        restaurantId,
        deviceId,
        deviceType: 'kds'
      });

      this.notifyConnectionCallbacks(true);
      this.startHeartbeat();
    });

    this.socket.on('joined-restaurant', () => {});

    this.socket.on('disconnect', () => {
      this.notifyConnectionCallbacks(false);
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', () => {
      this.reconnectAttempts++;
    });

    // Order events
    this.socket.on('order:new', (data) => {
      this.notifyOrderCallbacks(data.order);
    });

    this.socket.on('order:updated', (data) => {
      this.notifyOrderCallbacks(data.order);
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

  private notifyOrderCallbacks(order: any): void {
    this.orderCallbacks.forEach(callback => {
      try {
        callback(order);
      } catch (error) {
        // Silent error handling
      }
    });
  }

  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        // Silent error handling
      }
    });
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Get device ID
  getDeviceId(): string | null {
    return this.deviceId;
  }
}

export const kdsSocketService = new KDSSocketService();
