import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { posSocketService } from '../services/socket.service';
import { config } from '../config';

// Order interface matching backend response
interface OrderItem {
  id: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  modifiers: {
    id: string;
    modifierName: string;
    priceAdjustment: number;
  }[];
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  orderType: 'dine-in' | 'pickup' | 'delivery';
  createdAt: string;
  confirmedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  completedAt?: string;
  subtotal: number;
  tax: number;
  total: number;
  specialInstructions?: string;
  orderItems: OrderItem[];
  table?: {
    id: string;
    tableNumber: string;
  };
  customer?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  deliveryAddress?: string;
}

interface OrderNotification {
  id: string;
  orderNumber: string;
  status: string;
  message: string;
  timestamp: Date;
  tableNumber?: string;
  orderType: string;
}

interface OrderNotificationContextType {
  // Notifications (toast-style)
  notifications: OrderNotification[];
  unreadCount: number;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;

  // Active orders (for Pending Orders screen)
  activeOrders: Order[];
  activeOrderCount: number;
  readyOrderCount: number;

  // Actions
  completeOrder: (orderId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;

  // Connection
  socketConnected: boolean;
  connectToRestaurant: (restaurantId: string) => void;
  disconnect: () => void;

  // Restaurant ID (needed for API calls)
  restaurantId: string | null;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | null>(null);

export function useOrderNotifications() {
  const context = useContext(OrderNotificationContext);
  if (!context) {
    throw new Error('useOrderNotifications must be used within OrderNotificationProvider');
  }
  return context;
}

interface OrderNotificationProviderProps {
  children: ReactNode;
}

export function OrderNotificationProvider({ children }: OrderNotificationProviderProps) {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Fetch active orders from API
  const refreshOrders = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const response = await fetch(
        `${config.apiUrl}/api/restaurant/${restaurantId}/orders?status=pending,confirmed,preparing,ready&limit=50`
      );

      if (response.ok) {
        const orders = await response.json();
        // Filter to only active (non-completed, non-cancelled) orders
        const active = orders.filter((o: Order) =>
          ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
        );
        setActiveOrders(active);
      }
    } catch (error) {
      console.error('Error fetching active orders:', error);
    }
  }, [restaurantId]);

  // Handle order events from socket
  const handleOrderEvent = useCallback((order: Order, eventType: 'new' | 'updated') => {
    if (!order) return;

    // Update activeOrders list
    setActiveOrders(prev => {
      const existingIndex = prev.findIndex(o => o.id === order.id);

      if (order.status === 'completed' || order.status === 'cancelled') {
        // Remove completed/cancelled orders
        return prev.filter(o => o.id !== order.id);
      }

      if (existingIndex >= 0) {
        // Update existing order
        const updated = [...prev];
        updated[existingIndex] = order;
        return updated;
      } else if (eventType === 'new') {
        // Add new order at the beginning
        return [order, ...prev];
      }

      return prev;
    });

    // Create notification for status changes
    const notifyStatuses = ['ready'];

    if (eventType === 'updated' && notifyStatuses.includes(order.status)) {
      const notification: OrderNotification = {
        id: `${order.id}-${Date.now()}`,
        orderNumber: order.orderNumber,
        status: order.status,
        message: getNotificationMessage(order),
        timestamp: new Date(),
        tableNumber: order.table?.tableNumber,
        orderType: order.orderType,
      };

      setNotifications(prev => [notification, ...prev].slice(0, 20));
      playNotificationSound();
    }
  }, []);

  // Complete an order (mark as delivered)
  const completeOrder = useCallback(async (orderId: string) => {
    if (!restaurantId) throw new Error('No restaurant connected');

    const response = await fetch(
      `${config.apiUrl}/api/restaurant/${restaurantId}/orders/${orderId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          changedBy: 'POS-Server',
          note: 'Delivered/handed off'
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete order');
    }

    // Optimistically remove from active orders
    // (WebSocket will also broadcast the update)
    setActiveOrders(prev => prev.filter(o => o.id !== orderId));
  }, [restaurantId]);

  const connectToRestaurant = useCallback((id: string) => {
    setRestaurantId(id);
    posSocketService.connect(id);
  }, []);

  const disconnect = useCallback(() => {
    posSocketService.disconnect();
    setRestaurantId(null);
    setActiveOrders([]);
  }, []);

  // Subscribe to socket events
  useEffect(() => {
    const unsubscribeOrders = posSocketService.onOrderEvent(handleOrderEvent);
    const unsubscribeConnection = posSocketService.onConnectionChange((connected) => {
      setSocketConnected(connected);
      // Sync restaurantId from socket service when connected
      // This handles the case where App.tsx connects directly via posSocketService
      if (connected) {
        const socketRestaurantId = posSocketService.getRestaurantId();
        if (socketRestaurantId && socketRestaurantId !== restaurantId) {
          setRestaurantId(socketRestaurantId);
        }
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeConnection();
    };
  }, [handleOrderEvent, restaurantId]);

  // Fetch orders when restaurant connects
  useEffect(() => {
    if (restaurantId && socketConnected) {
      refreshOrders();
    }
  }, [restaurantId, socketConnected, refreshOrders]);

  // Refresh orders periodically as fallback
  useEffect(() => {
    if (!restaurantId) return;

    const interval = setInterval(refreshOrders, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [restaurantId, refreshOrders]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: OrderNotificationContextType = {
    notifications,
    unreadCount: notifications.length,
    activeOrders,
    activeOrderCount: activeOrders.length,
    readyOrderCount: activeOrders.filter(o => o.status === 'ready').length,
    completeOrder,
    refreshOrders,
    socketConnected,
    connectToRestaurant,
    disconnect,
    restaurantId,
    dismissNotification,
    dismissAll,
  };

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}
    </OrderNotificationContext.Provider>
  );
}

function getNotificationMessage(order: Order): string {
  const tableInfo = order.table?.tableNumber ? ` for Table ${order.table.tableNumber}` : '';
  const typeInfo = order.orderType === 'pickup' ? ' (Pickup)' :
                   order.orderType === 'delivery' ? ' (Delivery)' : '';

  switch (order.status) {
    case 'ready':
      return `Order ${order.orderNumber}${tableInfo} is READY${typeInfo}`;
    case 'completed':
      return `Order ${order.orderNumber}${tableInfo} completed${typeInfo}`;
    default:
      return `Order ${order.orderNumber} updated to ${order.status}`;
  }
}

function playNotificationSound() {
  try {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  } catch (error) {
    console.log('Could not play notification sound');
  }
}

export type { Order, OrderItem, OrderNotification };
