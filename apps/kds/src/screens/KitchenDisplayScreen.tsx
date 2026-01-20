import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

// Types - will move to @get-order-stack/models
interface OrderItem {
  id: string;
  menuItemName: string;
  quantity: number;
  specialInstructions?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: 'pickup' | 'delivery' | 'dine-in';
  status: 'confirmed' | 'preparing' | 'ready';
  items: OrderItem[];
  createdAt: string;
  customerName?: string;
}

// Mock data for now - will connect to WebSocket
const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    orderType: 'pickup',
    status: 'confirmed',
    customerName: 'John M.',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    items: [
      { id: '1a', menuItemName: 'Cuban Sandwich', quantity: 2, specialInstructions: 'Extra pickles' },
      { id: '1b', menuItemName: 'Yuca Fries', quantity: 1 },
    ],
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    orderType: 'dine-in',
    status: 'preparing',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    items: [
      { id: '2a', menuItemName: 'Ropa Vieja', quantity: 1 },
      { id: '2b', menuItemName: 'Black Beans & Rice', quantity: 1 },
      { id: '2c', menuItemName: 'Tostones', quantity: 2 },
    ],
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    orderType: 'delivery',
    status: 'confirmed',
    customerName: 'Sarah L.',
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    items: [
      { id: '3a', menuItemName: 'Lechon Asado', quantity: 1 },
    ],
  },
];

const ORDER_TYPE_COLORS = {
  pickup: '#4CAF50',
  delivery: '#2196F3',
  'dine-in': '#FF9800',
};

const STATUS_LABELS = {
  confirmed: 'NEW',
  preparing: 'COOKING',
  ready: 'READY',
};

export function KitchenDisplayScreen() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedMinutes = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const handleBumpOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        if (order.status === 'confirmed') return { ...order, status: 'preparing' };
        if (order.status === 'preparing') return { ...order, status: 'ready' };
        return order;
      }).filter((order) => order.status !== 'ready' || order.id !== orderId)
    );
  };

  const newOrders = orders.filter((o) => o.status === 'confirmed');
  const cookingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍳 Kitchen Display</Text>
        <Text style={styles.headerTime}>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <View style={styles.headerStats}>
          <Text style={styles.statText}>New: {newOrders.length}</Text>
          <Text style={styles.statText}>Cooking: {cookingOrders.length}</Text>
          <Text style={styles.statText}>Ready: {readyOrders.length}</Text>
        </View>
      </View>

      {/* Order Columns */}
      <View style={styles.columnsContainer}>
        {/* New Orders */}
        <View style={styles.column}>
          <View style={[styles.columnHeader, { backgroundColor: '#f44336' }]}>
            <Text style={styles.columnHeaderText}>🔴 NEW ORDERS</Text>
          </View>
          <ScrollView style={styles.columnContent}>
            {newOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                elapsed={getElapsedMinutes(order.createdAt)}
                onBump={() => handleBumpOrder(order.id)}
                bumpLabel="START"
              />
            ))}
          </ScrollView>
        </View>

        {/* Cooking */}
        <View style={styles.column}>
          <View style={[styles.columnHeader, { backgroundColor: '#FF9800' }]}>
            <Text style={styles.columnHeaderText}>🟠 COOKING</Text>
          </View>
          <ScrollView style={styles.columnContent}>
            {cookingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                elapsed={getElapsedMinutes(order.createdAt)}
                onBump={() => handleBumpOrder(order.id)}
                bumpLabel="DONE"
              />
            ))}
          </ScrollView>
        </View>

        {/* Ready */}
        <View style={styles.column}>
          <View style={[styles.columnHeader, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.columnHeaderText}>🟢 READY</Text>
          </View>
          <ScrollView style={styles.columnContent}>
            {readyOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                elapsed={getElapsedMinutes(order.createdAt)}
                onBump={() => handleBumpOrder(order.id)}
                bumpLabel="BUMP"
              />
            ))}
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

  return (
    <View style={[styles.orderCard, isUrgent && styles.orderCardUrgent]}>
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          {order.customerName && (
            <Text style={styles.customerName}>{order.customerName}</Text>
          )}
        </View>
        <View style={styles.orderMeta}>
          <View
            style={[
              styles.orderTypeBadge,
              { backgroundColor: ORDER_TYPE_COLORS[order.orderType] },
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
        {order.items.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <Text style={styles.itemQuantity}>{item.quantity}x</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.menuItemName}</Text>
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
        style={styles.bumpButton}
        onPress={onBump}
        activeOpacity={0.7}
      >
        <Text style={styles.bumpButtonText}>{bumpLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
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
  headerTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e94560',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  columnContent: {
    flex: 1,
    padding: 8,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
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
    fontSize: 12,
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
  },
  itemInstructions: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '600',
    marginTop: 2,
  },
  bumpButton: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 16,
    alignItems: 'center',
  },
  bumpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
