/**
 * API client and hooks for GetOrderStack Restaurant Mobile apps
 */

import { Order, OrderStatus, ApiResponse } from '@get-order-stack/models';

// ============ Configuration ============
let apiBaseUrl = 'http://localhost:3000/api/restaurant';

export function setApiBaseUrl(url: string): void {
  apiBaseUrl = url;
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

// ============ HTTP Client ============
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============ Order API ============
export const ordersApi = {
  /**
   * Get all orders for a restaurant
   */
  async getOrders(
    restaurantId: string,
    status?: OrderStatus
  ): Promise<ApiResponse<Order[]>> {
    const params = status ? `?status=${status}` : '';
    return fetchApi<Order[]>(`/${restaurantId}/orders${params}`);
  },

  /**
   * Get active orders (confirmed, preparing, ready)
   */
  async getActiveOrders(restaurantId: string): Promise<ApiResponse<Order[]>> {
    return fetchApi<Order[]>(`/${restaurantId}/orders?active=true`);
  },

  /**
   * Get a single order
   */
  async getOrder(
    restaurantId: string,
    orderId: string
  ): Promise<ApiResponse<Order>> {
    return fetchApi<Order>(`/${restaurantId}/orders/${orderId}`);
  },

  /**
   * Update order status
   */
  async updateOrderStatus(
    restaurantId: string,
    orderId: string,
    status: OrderStatus,
    reason?: string
  ): Promise<ApiResponse<Order>> {
    return fetchApi<Order>(`/${restaurantId}/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  /**
   * Mark order as preparing (KDS: START button)
   */
  async startPreparing(
    restaurantId: string,
    orderId: string
  ): Promise<ApiResponse<Order>> {
    return this.updateOrderStatus(restaurantId, orderId, 'preparing');
  },

  /**
   * Mark order as ready (KDS: DONE button)
   */
  async markReady(
    restaurantId: string,
    orderId: string
  ): Promise<ApiResponse<Order>> {
    return this.updateOrderStatus(restaurantId, orderId, 'ready');
  },

  /**
   * Mark order as completed (KDS: BUMP button)
   */
  async completeOrder(
    restaurantId: string,
    orderId: string
  ): Promise<ApiResponse<Order>> {
    return this.updateOrderStatus(restaurantId, orderId, 'completed');
  },
};

// ============ WebSocket Connection ============
type WebSocketCallback = (event: { type: string; payload: unknown }) => void;

class OrderWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: Set<WebSocketCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  connect(restaurantId: string): void {
    const wsUrl = apiBaseUrl
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')
      .replace('/api/restaurant', `/ws/orders/${restaurantId}`);

    console.log('[WebSocket] Connecting to:', wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.notifyCallbacks({ type: 'connection:established', payload: null });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Message:', data.type);
        this.notifyCallbacks(data);
      } catch (error) {
        console.error('[WebSocket] Parse error:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      this.notifyCallbacks({ type: 'connection:error', payload: error });
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      this.attemptReconnect(restaurantId);
    };
  }

  private attemptReconnect(restaurantId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `[WebSocket] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      setTimeout(() => this.connect(restaurantId), this.reconnectDelay);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(callback: WebSocketCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notifyCallbacks(event: { type: string; payload: unknown }): void {
    this.callbacks.forEach((cb) => cb(event));
  }
}

export const orderWebSocket = new OrderWebSocket();

export { fetchApi };
