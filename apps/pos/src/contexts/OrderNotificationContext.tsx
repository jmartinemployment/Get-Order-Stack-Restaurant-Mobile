import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { posSocketService } from '../services/socket.service';

interface OrderNotification {
  id: string;
  orderNumber: string;
  status: string;
  message: string;
  timestamp: Date;
  tableNumber?: number;
  orderType: string;
}

interface OrderNotificationContextType {
  notifications: OrderNotification[];
  unreadCount: number;
  socketConnected: boolean;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  connectToRestaurant: (restaurantId: string) => void;
  disconnect: () => void;
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
  const [socketConnected, setSocketConnected] = useState(false);

  // Handle order events from socket
  const handleOrderEvent = useCallback((order: any, eventType: 'new' | 'updated') => {
    if (!order) return;

    // Only notify for specific status changes that staff needs to know about
    const notifyStatuses = ['ready', 'completed'];

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

      setNotifications(prev => [notification, ...prev].slice(0, 20)); // Keep max 20 notifications

      // Play notification sound if available
      playNotificationSound();
    }
  }, []);

  const connectToRestaurant = useCallback((restaurantId: string) => {
    posSocketService.connect(restaurantId);
  }, []);

  const disconnect = useCallback(() => {
    posSocketService.disconnect();
  }, []);

  // Subscribe to socket events
  useEffect(() => {
    const unsubscribeOrders = posSocketService.onOrderEvent(handleOrderEvent);
    const unsubscribeConnection = posSocketService.onConnectionChange(setSocketConnected);

    return () => {
      unsubscribeOrders();
      unsubscribeConnection();
    };
  }, [handleOrderEvent]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: OrderNotificationContextType = {
    notifications,
    unreadCount: notifications.length,
    socketConnected,
    dismissNotification,
    dismissAll,
    connectToRestaurant,
    disconnect,
  };

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}
    </OrderNotificationContext.Provider>
  );
}

function getNotificationMessage(order: any): string {
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
  // Try to play a notification sound
  try {
    if (typeof window !== 'undefined' && 'Audio' in window) {
      // Use a simple beep or system sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2); // 200ms beep
    }
  } catch (error) {
    // Ignore audio errors
    console.log('Could not play notification sound');
  }
}
