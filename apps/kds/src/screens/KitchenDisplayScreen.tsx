import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  AppState,
} from 'react-native';

const API_URL = 'http://localhost:3000/api/restaurant/96816829-87e3-4b6a-9f6c-613e4b3ab522';
const POLL_INTERVAL = 5000; // 5 seconds

interface OrderItemModifier {
  id: string;
  modifierName: string;
  priceAdjustment: number;
}

interface OrderItem {
  id: string;
  menuItemName: string;
  quantity: number;
  specialInstructions?: string;
  status: string;
  modifiers: OrderItemModifier[];
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: 'pickup' | 'delivery' | 'dine-in';
  status: string;
  items: OrderItem[];
  createdAt: string;
  customerName?: string;
  customer?: { firstName?: string; lastName?: string };
  table?: { tableNumber: number };
  orderItems: OrderItem[];
}

const ORDER_TYPE_COLORS: Record<string, string> = {
  pickup: '#4CAF50',
  delivery: '#2196F3',
  'dine-in': '#FF9800',
};

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

export function KitchenDisplayScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // Fetch orders from API
  const fetchOrders = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      
      const response = await fetch(`${API_URL}/orders?limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      
      // Filter to only show active orders (not completed or cancelled)
      const activeOrders = data.filter((order: Order) => 
        !['completed', 'cancelled'].includes(order.status)
      );
      
      // Transform to match our expected format
      const transformedOrders = activeOrders.map((order: Order) => ({
        ...order,
        items: order.orderItems,
        customerName: order.customer 
          ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
          : undefined,
      }));
      
      setOrders(transformedOrders);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update order status via API
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          changedBy: 'KDS'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Refresh orders after update
      fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // Initial load and polling setup
  useEffect(() => {
    fetchOrders(true);

    // Set up polling
    pollInterval.current = setInterval(() => {
      fetchOrders(false);
    }, POLL_INTERVAL);

    // Handle app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        fetchOrders(false);
      }
      appState.current = nextAppState;
    });

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      subscription.remove();
    };
  }, [fetchOrders]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedMinutes = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const handleBumpOrder = (orderId: string, currentStatus: string) => {
    // Optimistically update UI
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        
        const currentIndex = STATUS_FLOW.indexOf(currentStatus);
        const nextStatus = STATUS_FLOW[currentIndex + 1];
        
        if (!nextStatus || nextStatus === 'completed') {
          return order;
        }
        
        return { ...order, status: nextStatus };
      }).filter((order) => order.status !== 'completed')
    );

    // Determine next status
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const nextStatus = STATUS_FLOW[currentIndex + 1];
    
    if (nextStatus) {
      updateOrderStatus(orderId, nextStatus);
    }
  };

  // Group orders by status
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  // Combine pending and confirmed as "NEW"
  const newOrders = [...pendingOrders, ...confirmedOrders];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍳 Kitchen Display</Text>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTime}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {lastUpdate && (
            <Text style={styles.lastUpdate}>
              Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          )}
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.statText}>New: {newOrders.length}</Text>
          <Text style={styles.statText}>Cooking: {preparingOrders.length}</Text>
          <Text style={styles.statText}>Ready: {readyOrders.length}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchOrders(false)}>
          <Text style={styles.refreshBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={() => fetchOrders(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Order Columns */}
      <View style={styles.columnsContainer}>
        {/* New Orders */}
        <View style={styles.column}>
          <View style={[styles.columnHeader, { backgroundColor: '#f44336' }]}>
            <Text style={styles.columnHeaderText}>🔴 NEW ORDERS ({newOrders.length})</Text>
          </View>
          <ScrollView style={styles.columnContent}>
            {newOrders.length === 0 ? (
              <View style={styles.emptyColumn}>
                <Text style={styles.emptyText}>No new orders</Text>
              </View>
            ) : (
              newOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  elapsed={getElapsedMinutes(order.createdAt)}
                  onBump={() => handleBumpOrder(order.id, order.status)}
                  bumpLabel={order.status === 'pending' ? 'CONFIRM' : 'START'}
                />
              ))
            )}
          </ScrollView>
        </View>

        {/* Cooking */}
        <View style={styles.column}>
          <View style={[styles.columnHeader, { backgroundColor: '#FF9800' }]}>
            <Text style={styles.columnHeaderText}>🟠 COOKING ({preparingOrders.length})</Text>
          </View>
          <ScrollView style={styles.columnContent}>
            {preparingOrders.length === 0 ? (
              <View style={styles.emptyColumn}>
                <Text style={styles.emptyText}>Nothing cooking</Text>
              </View>
            ) : (
              preparingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  elapsed={getElapsedMinutes(order.createdAt)}
                  onBump={() => handleBumpOrder(order.id, order.status)}
                  bumpLabel="DONE"
                />
              ))
            )}
          </ScrollView>
        </View>

        {/* Ready */}
        <View style={styles.column}>
          <View style={[styles.columnHeader, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.columnHeaderText}>🟢 READY ({readyOrders.length})</Text>
          </View>
          <ScrollView style={styles.columnContent}>
            {readyOrders.length === 0 ? (
              <View style={styles.emptyColumn}>
                <Text style={styles.emptyText}>No orders ready</Text>
              </View>
            ) : (
              readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  elapsed={getElapsedMinutes(order.createdAt)}
                  onBump={() => handleBumpOrder(order.id, order.status)}
                  bumpLabel="COMPLETE"
                />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

interface OrderCardProps {
  order: Order;
  elapsed: number;
  onBump: () => void;
  bumpLabel: string;
}

function OrderCard({ order, elapsed, onBump, bumpLabel }: OrderCardProps) {
  const isUrgent = elapsed > 10;
  const items = order.items || order.orderItems || [];

  return (
    <View style={[styles.orderCard, isUrgent && styles.orderCardUrgent]}>
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          {order.customerName && (
            <Text style={styles.customerName}>{order.customerName}</Text>
          )}
          {order.table && (
            <Text style={styles.tableNumber}>Table {order.table.tableNumber}</Text>
          )}
        </View>
        <View style={styles.orderMeta}>
          <View
            style={[
              styles.orderTypeBadge,
              { backgroundColor: ORDER_TYPE_COLORS[order.orderType] || '#666' },
            ]}
          >
            <Text style={styles.orderTypeText}>
              {order.orderType.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.elapsedTime, isUrgent && styles.elapsedTimeUrgent]}>
            {elapsed}m
          </Text>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.orderItems}>
        {items.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <Text style={styles.itemQuantity}>{item.quantity}x</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.menuItemName}</Text>
              {item.modifiers && item.modifiers.length > 0 && (
                <Text style={styles.itemModifiers}>
                  {item.modifiers.map(m => m.modifierName).join(', ')}
                </Text>
              )}
              {item.specialInstructions && (
                <Text style={styles.itemInstructions}>
                  ⚠️ {item.specialInstructions}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Bump Button */}
      <TouchableOpacity
        style={[
          styles.bumpButton,
          bumpLabel === 'COMPLETE' && styles.bumpButtonComplete,
        ]}
        onPress={onBump}
        activeOpacity={0.7}
      >
        <Text style={styles.bumpButtonText}>{bumpLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#16213e',
    borderBottomWidth: 2,
    borderBottomColor: '#0f3460',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e94560',
  },
  lastUpdate: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: '#0f3460',
    borderRadius: 8,
  },
  refreshBtnText: {
    fontSize: 20,
  },
  errorBanner: {
    backgroundColor: '#f44336',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  column: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  columnHeader: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  columnHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  columnContent: {
    flex: 1,
    padding: 8,
  },
  emptyColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  orderCardUrgent: {
    borderWidth: 3,
    borderColor: '#f44336',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tableNumber: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    marginTop: 2,
  },
  orderMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orderTypeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  elapsedTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  elapsedTimeUrgent: {
    color: '#f44336',
  },
  orderItems: {
    padding: 12,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  itemQuantity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    width: 40,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  itemModifiers: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  itemInstructions: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '600',
    marginTop: 4,
  },
  bumpButton: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 16,
    alignItems: 'center',
  },
  bumpButtonComplete: {
    backgroundColor: '#4CAF50',
  },
  bumpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
