# Implementation Plan: Demo Features (Saturday)

## Overview

This document provides a comprehensive implementation plan for Claude Code to build two priority features for the Saturday demo:

1. **Upsell Bar Fix** - Connect to real menu data (Priority 1)
2. **Pending Orders Screen** - Full order lifecycle tracking with KDS integration (Priority 2)

---

## Demo Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  ORDER ENTRY    │────▶│       KDS       │────▶│  ORDER ENTRY    │
│  (Server Tablet)│     │    (Kitchen)    │     │ (Pending Orders)│
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ • Browse Menu   │     │ • See Order     │     │ • See Status    │
│ • AI Upsells    │     │ • Confirm       │     │ • Real-time     │
│ • Build Order   │     │ • Start Cooking │     │   Updates       │
│ • Send to KDS   │     │ • Mark Done     │     │ • Mark Delivered│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Key Points:**
- Order Entry (POS) sends orders to KDS
- KDS updates order status (confirmed → preparing → ready)
- Order Entry receives real-time updates via WebSocket
- Order Entry marks order as "delivered/completed" to close the loop

---

## Priority 1: Upsell Bar Fix

### Problem Statement

The `UpsellBar` component currently uses **hardcoded demo data** instead of real menu items:

```typescript
// Current: HARDCODED (MenuScreen.tsx lines 145-165)
suggestions.push({
  id: 'popular-1',
  name: language === 'es' ? 'Ceviche Clásico' : 'Classic Ceviche',  // ← FAKE
  price: 18.00,  // ← FAKE PRICE
  type: 'popular',
});
```

### Solution

Replace hardcoded suggestions with data from `groupedMenu` (already loaded):

1. Filter items with `popular: true` flag
2. Filter items with high `aiProfitMargin` 
3. Include Chef Picks (already working)
4. Use real `menuItemId` and `price`

### Files to Modify

| File | Changes |
|------|---------|
| `apps/pos/src/screens/MenuScreen.tsx` | Replace `generateSuggestions()` function |

### Implementation Details

#### Step 1: Create Helper to Flatten Menu Items

```typescript
// Add this helper function in MenuScreen.tsx

function getAllMenuItems(): MenuItem[] {
  return groupedMenu
    .flatMap(primary => primary.subcategories)
    .flatMap(sub => sub.items);
}
```

#### Step 2: Replace generateSuggestions Function

Find the `useEffect` that calls `generateSuggestions()` (around line 127) and replace the entire function:

```typescript
// Replace the generateSuggestions useEffect (lines ~127-185)

useEffect(() => {
  const generateSuggestions = (): UpsellSuggestion[] => {
    const allItems = groupedMenu
      .flatMap(primary => primary.subcategories)
      .flatMap(sub => sub.items);
    
    // Get active chef picks
    const activeChefPicks = chefPicks.filter(p => p.active);
    
    const suggestions: UpsellSuggestion[] = [];
    
    // 1. Add Chef Picks first (already connected to real menu)
    activeChefPicks.forEach(pick => {
      const menuItem = allItems.find(item => item.id === pick.menuItemId);
      suggestions.push({
        id: `chef-${pick.menuItemId}`,
        menuItemId: pick.menuItemId,
        name: pick.menuItemName,
        reason: pick.note || (language === 'es' ? 'Recomendado por el chef' : 'Chef recommended'),
        price: menuItem ? Number(menuItem.price) : 0,
        type: 'chef-pick',
      });
    });
    
    // 2. Add Popular Items (from real menu)
    const popularItems = allItems
      .filter(item => item.popular)
      .filter(item => !activeChefPicks.some(pick => pick.menuItemId === item.id)) // Avoid duplicates
      .slice(0, 3);
    
    popularItems.forEach(item => {
      suggestions.push({
        id: `popular-${item.id}`,
        menuItemId: item.id,
        name: language === 'en' && item.nameEn ? item.nameEn : item.name,
        reason: language === 'es' ? '🔥 Más vendido' : '🔥 Best seller',
        price: Number(item.price),
        type: 'popular',
      });
    });
    
    // 3. Add High-Margin Items (if AI cost data exists)
    // Note: aiProfitMargin field exists on MenuItem in backend but may not be in current interface
    // For now, use items with price > $15 as proxy for high-margin
    const highMarginItems = allItems
      .filter(item => Number(item.price) >= 15)
      .filter(item => !item.popular) // Don't duplicate popular items
      .filter(item => !activeChefPicks.some(pick => pick.menuItemId === item.id))
      .sort((a, b) => Number(b.price) - Number(a.price))
      .slice(0, 2);
    
    highMarginItems.forEach(item => {
      suggestions.push({
        id: `margin-${item.id}`,
        menuItemId: item.id,
        name: language === 'en' && item.nameEn ? item.nameEn : item.name,
        reason: language === 'es' ? '💰 Alta ganancia' : '💰 High margin',
        price: Number(item.price),
        type: 'high-margin',
      });
    });
    
    // Return different suggestions based on cart state
    if (itemCount === 0) {
      // Empty cart: Show all suggestions
      return suggestions.slice(0, 6);
    } else {
      // Has items: Prioritize chef picks and complementary items
      return suggestions.slice(0, 4);
    }
  };
  
  setUpsellSuggestions(generateSuggestions());
}, [itemCount, language, chefPicks, groupedMenu]);
```

#### Step 3: Fix handleUpsellPress to Open Item Modal

Currently, pressing an upsell adds directly to cart without modifiers. Better UX: open the item modal.

```typescript
// Replace handleUpsellPress function

function handleUpsellPress(suggestion: UpsellSuggestion) {
  if (suggestion.menuItemId) {
    // Find the full menu item with modifiers
    const allItems = groupedMenu
      .flatMap(primary => primary.subcategories)
      .flatMap(sub => sub.items);
    
    const menuItem = allItems.find(item => item.id === suggestion.menuItemId);
    
    if (menuItem) {
      // Open item detail modal (same as tapping item in menu)
      handleItemPress(menuItem);
      return;
    }
  }
  
  // Fallback: add directly to cart (for items without menuItemId)
  const cartItem: CartItem = {
    id: `${suggestion.id}-${Date.now()}`,
    menuItemId: suggestion.menuItemId || suggestion.id,
    name: suggestion.name,
    price: suggestion.price,
    quantity: 1,
    modifiers: [],
  };
  addItem(cartItem);
}
```

### Testing the Upsell Fix

1. Open POS app
2. Verify UpsellBar shows real menu items (not "Ceviche Clásico" hardcoded)
3. Tap a suggestion → Item modal should open
4. Add to cart → Verify correct item and price

---

## Priority 2: Pending Orders Screen

### Overview

Create a new screen accessible from the left drawer that shows **all active orders** for the restaurant, with real-time updates from KDS via WebSocket.

### Order Lifecycle

```
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌─────────┐    ┌───────────┐
│ PENDING  │───▶│ CONFIRMED │───▶│ PREPARING │───▶│  READY  │───▶│ COMPLETED │
│ (new)    │    │ (KDS ack) │    │ (cooking) │    │ (done)  │    │(delivered)│
└──────────┘    └───────────┘    └───────────┘    └─────────┘    └───────────┘
     │               │                │               │               │
   Order           KDS             KDS             KDS            POS
   Entry         Confirm          Start           Done          Delivered
```

### Files to Create

| File | Purpose |
|------|---------|
| `apps/pos/src/screens/PendingOrdersScreen.tsx` | Main screen component |

### Files to Modify

| File | Changes |
|------|---------|
| `apps/pos/src/screens/MenuScreen.tsx` | Add drawer item, state for showing screen |
| `apps/pos/src/contexts/OrderNotificationContext.tsx` | Add `activeOrders` state, `completeOrder()` function |

---

### Step 1: Update OrderNotificationContext

**File:** `apps/pos/src/contexts/OrderNotificationContext.tsx`

Replace the entire file with:

```typescript
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
    const unsubscribeConnection = posSocketService.onConnectionChange(setSocketConnected);

    return () => {
      unsubscribeOrders();
      unsubscribeConnection();
    };
  }, [handleOrderEvent]);

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
```

---

### Step 2: Create PendingOrdersScreen

**File:** `apps/pos/src/screens/PendingOrdersScreen.tsx`

```typescript
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useOrderNotifications, Order } from '../contexts/OrderNotificationContext';

interface PendingOrdersScreenProps {
  visible: boolean;
  onClose: () => void;
  language?: 'es' | 'en';
}

type TabType = 'all' | 'tables' | 'pickup-delivery';
type StatusFilter = 'all' | 'new' | 'cooking' | 'ready';

export function PendingOrdersScreen({ visible, onClose, language = 'es' }: PendingOrdersScreenProps) {
  const { 
    activeOrders, 
    activeOrderCount,
    readyOrderCount,
    completeOrder, 
    refreshOrders,
    socketConnected 
  } = useOrderNotifications();
  
  const [selectedTab, setSelectedTab] = useState<TabType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);

  // Filter orders based on selected tab and status
  const filteredOrders = useMemo(() => {
    let orders = [...activeOrders];
    
    // Filter by tab (order type)
    if (selectedTab === 'tables') {
      orders = orders.filter(o => o.orderType === 'dine-in');
    } else if (selectedTab === 'pickup-delivery') {
      orders = orders.filter(o => o.orderType === 'pickup' || o.orderType === 'delivery');
    }
    
    // Filter by status
    if (statusFilter === 'new') {
      orders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
    } else if (statusFilter === 'cooking') {
      orders = orders.filter(o => o.status === 'preparing');
    } else if (statusFilter === 'ready') {
      orders = orders.filter(o => o.status === 'ready');
    }
    
    // Sort: ready first, then by creation time (newest first)
    orders.sort((a, b) => {
      if (a.status === 'ready' && b.status !== 'ready') return -1;
      if (b.status === 'ready' && a.status !== 'ready') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return orders;
  }, [activeOrders, selectedTab, statusFilter]);

  // Count orders by type for tab badges
  const tabCounts = useMemo(() => ({
    all: activeOrders.length,
    tables: activeOrders.filter(o => o.orderType === 'dine-in').length,
    pickupDelivery: activeOrders.filter(o => o.orderType === 'pickup' || o.orderType === 'delivery').length,
  }), [activeOrders]);

  // Count orders by status for filter badges
  const statusCounts = useMemo(() => ({
    all: filteredOrders.length,
    new: activeOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
    cooking: activeOrders.filter(o => o.status === 'preparing').length,
    ready: activeOrders.filter(o => o.status === 'ready').length,
  }), [activeOrders, filteredOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const handleCompleteOrder = async (order: Order) => {
    try {
      setCompletingOrderId(order.id);
      await completeOrder(order.id);
    } catch (error) {
      console.error('Error completing order:', error);
      // Could show an error toast here
    } finally {
      setCompletingOrderId(null);
    }
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; labelEs: string; color: string; icon: string }> = {
      pending: { label: 'NEW', labelEs: 'NUEVO', color: '#2196F3', icon: '🆕' },
      confirmed: { label: 'CONFIRMED', labelEs: 'CONFIRMADO', color: '#9C27B0', icon: '✓' },
      preparing: { label: 'COOKING', labelEs: 'COCINANDO', color: '#FF9800', icon: '🍳' },
      ready: { label: 'READY', labelEs: 'LISTO', color: '#4CAF50', icon: '✅' },
    };
    return statusMap[status] || { label: status.toUpperCase(), labelEs: status.toUpperCase(), color: '#666', icon: '📋' };
  };

  const getElapsedTime = (dateString: string) => {
    const elapsed = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return language === 'es' ? 'ahora' : 'just now';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getActionButton = (order: Order) => {
    if (order.status !== 'ready') return null;
    
    const isCompleting = completingOrderId === order.id;
    
    let buttonText = '';
    if (order.orderType === 'dine-in') {
      buttonText = language === 'es' ? 'ENTREGADO' : 'DELIVERED';
    } else if (order.orderType === 'pickup') {
      buttonText = language === 'es' ? 'RECOGIDO' : 'PICKED UP';
    } else {
      buttonText = language === 'es' ? 'ENTREGADO' : 'HANDED OFF';
    }
    
    return (
      <TouchableOpacity
        style={[styles.actionButton, isCompleting && styles.actionButtonDisabled]}
        onPress={() => handleCompleteOrder(order)}
        disabled={isCompleting}
      >
        {isCompleting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.actionButtonText}>✅ {buttonText}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case 'dine-in': return '🍽️';
      case 'pickup': return '🥡';
      case 'delivery': return '🚗';
      default: return '📋';
    }
  };

  const getOrderDestination = (order: Order) => {
    if (order.orderType === 'dine-in' && order.table) {
      return `Table ${order.table.tableNumber}`;
    }
    if (order.orderType === 'pickup' && order.customer) {
      return `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Pickup';
    }
    if (order.orderType === 'delivery') {
      return order.deliveryAddress || 'Delivery';
    }
    return order.orderType;
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>← </Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {language === 'es' ? 'Órdenes Pendientes' : 'Pending Orders'}
          </Text>
          <View style={styles.headerRight}>
            <View style={[styles.connectionDot, socketConnected ? styles.connected : styles.disconnected]} />
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Text style={styles.refreshButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Type Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
            onPress={() => setSelectedTab('all')}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              📋 {language === 'es' ? 'Todos' : 'All'} ({tabCounts.all})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'tables' && styles.tabActive]}
            onPress={() => setSelectedTab('tables')}
          >
            <Text style={[styles.tabText, selectedTab === 'tables' && styles.tabTextActive]}>
              🍽️ {language === 'es' ? 'Mesas' : 'Tables'} ({tabCounts.tables})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'pickup-delivery' && styles.tabActive]}
            onPress={() => setSelectedTab('pickup-delivery')}
          >
            <Text style={[styles.tabText, selectedTab === 'pickup-delivery' && styles.tabTextActive]}>
              📦 Pickup/Delivery ({tabCounts.pickupDelivery})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter Pills */}
        <View style={styles.filterBar}>
          {(['all', 'new', 'cooking', 'ready'] as StatusFilter[]).map((status) => {
            const count = statusCounts[status];
            const isActive = statusFilter === status;
            const labels: Record<StatusFilter, { en: string; es: string }> = {
              all: { en: 'All', es: 'Todos' },
              new: { en: 'New', es: 'Nuevos' },
              cooking: { en: 'Cooking', es: 'Cocinando' },
              ready: { en: 'Ready', es: 'Listos' },
            };
            
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {language === 'es' ? labels[status].es : labels[status].en} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Orders List */}
        <ScrollView
          style={styles.ordersList}
          contentContainerStyle={styles.ordersListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#e94560"
            />
          }
        >
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateText}>
                {language === 'es' ? 'No hay órdenes pendientes' : 'No pending orders'}
              </Text>
            </View>
          ) : (
            filteredOrders.map((order) => {
              const statusDisplay = getStatusDisplay(order.status);
              
              return (
                <View 
                  key={order.id} 
                  style={[
                    styles.orderCard,
                    order.status === 'ready' && styles.orderCardReady
                  ]}
                >
                  {/* Order Header */}
                  <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderLeft}>
                      <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                      <Text style={styles.orderDestination}>
                        {getOrderTypeIcon(order.orderType)} {getOrderDestination(order)}
                      </Text>
                    </View>
                    <View style={styles.orderHeaderRight}>
                      <View style={[styles.statusBadge, { backgroundColor: statusDisplay.color }]}>
                        <Text style={styles.statusBadgeText}>
                          {statusDisplay.icon} {language === 'es' ? statusDisplay.labelEs : statusDisplay.label}
                        </Text>
                      </View>
                      <Text style={styles.orderTime}>{getElapsedTime(order.createdAt)}</Text>
                    </View>
                  </View>

                  {/* Order Items */}
                  <View style={styles.orderItems}>
                    {order.orderItems.map((item, index) => (
                      <View key={item.id || index} style={styles.orderItem}>
                        <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                        <View style={styles.orderItemDetails}>
                          <Text style={styles.orderItemName}>{item.menuItemName}</Text>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <Text style={styles.orderItemMods}>
                              {item.modifiers.map(m => m.modifierName).join(', ')}
                            </Text>
                          )}
                          {item.specialInstructions && (
                            <Text style={styles.orderItemInstructions}>
                              ⚠️ {item.specialInstructions}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Special Instructions */}
                  {order.specialInstructions && (
                    <View style={styles.orderNotes}>
                      <Text style={styles.orderNotesText}>📝 {order.specialInstructions}</Text>
                    </View>
                  )}

                  {/* Action Button (only for ready orders) */}
                  {getActionButton(order)}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a2e',
    zIndex: 100,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#f44336',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 20,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#16213e',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#e94560',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  filterPillActive: {
    backgroundColor: '#0f3460',
    borderColor: '#e94560',
  },
  filterPillText: {
    color: '#888',
    fontSize: 13,
  },
  filterPillTextActive: {
    color: '#fff',
  },
  ordersList: {
    flex: 1,
  },
  ordersListContent: {
    padding: 12,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  orderCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0f3460',
  },
  orderCardReady: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#1a3a2e',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderDestination: {
    color: '#e94560',
    fontSize: 14,
    marginTop: 4,
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderTime: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    paddingTop: 12,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  orderItemQty: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: 'bold',
    width: 30,
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemName: {
    color: '#fff',
    fontSize: 14,
  },
  orderItemMods: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  orderItemInstructions: {
    color: '#FF9800',
    fontSize: 12,
    marginTop: 4,
  },
  orderNotes: {
    backgroundColor: '#1a1a2e',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  orderNotesText: {
    color: '#888',
    fontSize: 13,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtonDisabled: {
    backgroundColor: '#2e5a2e',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PendingOrdersScreen;
```

---

### Step 3: Add Pending Orders to Menu Drawer

**File:** `apps/pos/src/screens/MenuScreen.tsx`

#### 3a. Add Import

At the top of the file, add:

```typescript
import { PendingOrdersScreen } from './PendingOrdersScreen';
import { useOrderNotifications } from '../contexts/OrderNotificationContext';
```

#### 3b. Add State

In the component, add state for showing the screen:

```typescript
const [showPendingOrders, setShowPendingOrders] = useState(false);
```

#### 3c. Get Notification Context

Add this near the top of the component:

```typescript
const { activeOrderCount, readyOrderCount } = useOrderNotifications();
```

#### 3d. Add Drawer Item

Find the drawer footer section (around line 620 where admin buttons are) and add before the "Items" button:

```typescript
{/* Pending Orders - Add this BEFORE the admin buttons */}
<TouchableOpacity
  style={[styles.menuDrawerAdminBtn, styles.pendingOrdersBtn]}
  onPress={() => {
    setShowMenu(false);
    setShowPendingOrders(true);
  }}
>
  <Text style={styles.menuDrawerAdminText}>
    🔔 {language === 'es' ? 'Órdenes Pendientes' : 'Pending Orders'}
    {activeOrderCount > 0 && (
      <Text style={styles.pendingBadge}> ({activeOrderCount})</Text>
    )}
    {readyOrderCount > 0 && (
      <Text style={styles.readyBadge}> • {readyOrderCount} {language === 'es' ? 'listos' : 'ready'}</Text>
    )}
  </Text>
</TouchableOpacity>

{/* Divider */}
<View style={styles.drawerDivider} />
```

#### 3e. Add Styles

Add these styles:

```typescript
pendingOrdersBtn: {
  backgroundColor: '#0f3460',
  borderWidth: 1,
  borderColor: '#e94560',
},
pendingBadge: {
  color: '#e94560',
  fontWeight: 'bold',
},
readyBadge: {
  color: '#4CAF50',
  fontWeight: 'bold',
},
drawerDivider: {
  height: 1,
  backgroundColor: '#0f3460',
  marginVertical: 8,
},
```

#### 3f. Render the Screen

At the end of the component (after other screens/modals), add:

```typescript
{/* Pending Orders Screen */}
<PendingOrdersScreen
  visible={showPendingOrders}
  onClose={() => setShowPendingOrders(false)}
  language={language}
/>
```

---

### Step 4: Update Backend to Support Status Filtering

**File:** `Get-Order-Stack-Restaurant-Backend/src/app/app.routes.ts`

The current orders endpoint may need adjustment to support comma-separated status filtering:

```typescript
// Find the GET orders endpoint and update it:

router.get('/:restaurantId/orders', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { status, orderType, limit = '50' } = req.query;

    // Support comma-separated status values
    let statusFilter: any = undefined;
    if (status) {
      const statuses = (status as string).split(',').map(s => s.trim());
      statusFilter = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        ...(statusFilter && { status: statusFilter }),
        ...(orderType && { orderType: orderType as string })
      },
      include: {
        orderItems: {
          include: { modifiers: true }
        },
        customer: true,
        table: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});
```

---

## Testing Checklist

### Upsell Fix
- [ ] Open POS app
- [ ] Verify UpsellBar shows real menu items (not hardcoded names)
- [ ] Tap a suggestion → Item modal opens with correct item
- [ ] Add to cart → Correct item and price
- [ ] Check that Chef Picks still work
- [ ] Toggle language → Suggestions update to correct language

### Pending Orders Screen
- [ ] Open left drawer → See "🔔 Pending Orders" with count
- [ ] Tap → Full screen opens
- [ ] See all active orders
- [ ] Tab filtering works (All / Tables / Pickup-Delivery)
- [ ] Status filter pills work
- [ ] Create new order from POS → Appears in Pending Orders
- [ ] KDS confirms order → Status updates in real-time
- [ ] KDS marks cooking → Status updates
- [ ] KDS marks done → Status changes to READY, green styling
- [ ] Tap [DELIVERED] → Order disappears, timestamp recorded
- [ ] Pickup order shows [PICKED UP] button
- [ ] Delivery order shows [HANDED OFF] button

### End-to-End Demo Flow
1. [ ] Server opens POS, browses menu
2. [ ] AI Upsell suggests real items
3. [ ] Server builds order, sends to KDS
4. [ ] KDS receives order, bumps through workflow
5. [ ] POS Pending Orders shows real-time updates
6. [ ] When READY, server delivers and taps [DELIVERED]
7. [ ] Order completes with timestamp

---

## Post-Demo: TODO / Handoff Items

### AI Upsell Backend (Option B)
Create intelligent upsell endpoint:
- `GET /api/restaurant/:id/upsell-suggestions?cartItems=...`
- Use Claude to analyze cart + menu + margins
- Consider time of day, historical pairings
- Return contextual recommendations

### Tip Accounting
- Add tip entry screen after payment
- Tip recording with order
- End-of-shift tip report
- Tip pool configuration

### Daily Sales Report
- Sales by payment type
- Sales by order type
- Basic cash drawer tracking

### Device Role Configuration
- Device registration system
- Auto-filter orders based on device type
- Server tablets vs Counter POS

---

## Quick Reference

### Key Files
| File | Purpose |
|------|---------|
| `apps/pos/src/screens/MenuScreen.tsx` | Main POS screen, upsell logic |
| `apps/pos/src/screens/PendingOrdersScreen.tsx` | NEW: Order tracking screen |
| `apps/pos/src/contexts/OrderNotificationContext.tsx` | Order state management |
| `apps/pos/src/components/UpsellBar.tsx` | Upsell display component |
| `apps/pos/src/services/socket.service.ts` | WebSocket connection |

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/orders` | GET | Fetch orders with filters |
| `/orders/:id/status` | PATCH | Update order status |

### Order Statuses
| Status | Set By | Meaning |
|--------|--------|---------|
| `pending` | POS | Order created |
| `confirmed` | KDS | Kitchen acknowledged |
| `preparing` | KDS | Cooking started |
| `ready` | KDS | Food is ready |
| `completed` | POS | Delivered to customer |
| `cancelled` | POS/KDS | Order cancelled |

---

*Last Updated: January 27, 2026*
