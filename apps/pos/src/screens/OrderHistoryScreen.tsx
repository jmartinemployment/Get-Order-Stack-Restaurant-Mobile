import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';

const API_URL = 'http://localhost:3000/api/restaurant/96816829-87e3-4b6a-9f6c-613e4b3ab522';

interface OrderItem {
  id: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  modifiers: { modifierName: string; priceAdjustment: number }[];
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: 'pickup' | 'delivery' | 'dine-in';
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  customer?: { firstName?: string; lastName?: string };
  table?: { tableNumber: number };
  orderItems: OrderItem[];
}

interface OrderHistoryScreenProps {
  visible: boolean;
  onClose: () => void;
  onReprint: (order: Order) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#FF9800',
  confirmed: '#2196F3',
  preparing: '#9C27B0',
  ready: '#4CAF50',
  completed: '#4CAF50',
  cancelled: '#f44336',
};

const ORDER_TYPE_COLORS: Record<string, string> = {
  pickup: '#4CAF50',
  delivery: '#2196F3',
  'dine-in': '#FF9800',
};

export function OrderHistoryScreen({ visible, onClose, onReprint }: OrderHistoryScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (visible) {
      fetchOrders();
    }
  }, [visible]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/orders?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchOrders();
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function getCustomerName(order: Order) {
    if (order.customer?.firstName) {
      return `${order.customer.firstName} ${order.customer.lastName || ''}`.trim();
    }
    return 'Guest';
  }

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📋 Order History</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Orders List */}
          <View style={styles.ordersList}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#e94560" />
                <Text style={styles.loadingText}>Loading orders...</Text>
              </View>
            ) : (
              <ScrollView
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor="#e94560"
                  />
                }
              >
                {orders.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>No orders yet</Text>
                  </View>
                ) : (
                  orders.map((order) => (
                    <TouchableOpacity
                      key={order.id}
                      style={[
                        styles.orderCard,
                        selectedOrder?.id === order.id && styles.orderCardSelected,
                      ]}
                      onPress={() => setSelectedOrder(order)}
                    >
                      <View style={styles.orderCardHeader}>
                        <View>
                          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                          <Text style={styles.orderCustomer}>{getCustomerName(order)}</Text>
                        </View>
                        <View style={styles.orderCardMeta}>
                          <View
                            style={[
                              styles.typeBadge,
                              { backgroundColor: ORDER_TYPE_COLORS[order.orderType] },
                            ]}
                          >
                            <Text style={styles.typeBadgeText}>
                              {order.orderType.toUpperCase()}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: STATUS_COLORS[order.status] || '#666' },
                            ]}
                          >
                            <Text style={styles.statusBadgeText}>
                              {order.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.orderCardFooter}>
                        <Text style={styles.orderTime}>
                          {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
                        </Text>
                        <Text style={styles.orderTotal}>${Number(order.total).toFixed(2)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>

          {/* Order Detail */}
          <View style={styles.orderDetail}>
            {selectedOrder ? (
              <>
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={styles.detailOrderNumber}>
                      {selectedOrder.orderNumber}
                    </Text>
                    <Text style={styles.detailMeta}>
                      {formatDate(selectedOrder.createdAt)} at{' '}
                      {formatTime(selectedOrder.createdAt)}
                    </Text>
                    <Text style={styles.detailMeta}>
                      {selectedOrder.orderType.toUpperCase()}
                      {selectedOrder.table && ` • Table ${selectedOrder.table.tableNumber}`}
                    </Text>
                    <Text style={styles.detailMeta}>
                      Customer: {getCustomerName(selectedOrder)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadgeLarge,
                      { backgroundColor: STATUS_COLORS[selectedOrder.status] || '#666' },
                    ]}
                  >
                    <Text style={styles.statusBadgeLargeText}>
                      {selectedOrder.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailSectionTitle}>Items</Text>
                <ScrollView style={styles.detailItems}>
                  {selectedOrder.orderItems.map((item) => (
                    <View key={item.id} style={styles.detailItem}>
                      <Text style={styles.detailItemQty}>{item.quantity}x</Text>
                      <View style={styles.detailItemInfo}>
                        <Text style={styles.detailItemName}>{item.menuItemName}</Text>
                        {item.modifiers.map((mod, i) => (
                          <Text key={i} style={styles.detailItemMod}>
                            + {mod.modifierName}
                            {mod.priceAdjustment > 0 &&
                              ` (+$${Number(mod.priceAdjustment).toFixed(2)})`}
                          </Text>
                        ))}
                        {item.specialInstructions && (
                          <Text style={styles.detailItemInstructions}>
                            ⚠️ {item.specialInstructions}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.detailItemPrice}>
                        ${Number(item.totalPrice).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.detailTotals}>
                  <View style={styles.detailTotalRow}>
                    <Text style={styles.detailTotalLabel}>Subtotal</Text>
                    <Text style={styles.detailTotalValue}>
                      ${Number(selectedOrder.subtotal).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.detailTotalRow}>
                    <Text style={styles.detailTotalLabel}>Tax</Text>
                    <Text style={styles.detailTotalValue}>
                      ${Number(selectedOrder.tax).toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.detailTotalRow, styles.detailGrandTotal]}>
                    <Text style={styles.detailGrandTotalLabel}>Total</Text>
                    <Text style={styles.detailGrandTotalValue}>
                      ${Number(selectedOrder.total).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.reprintBtn}
                  onPress={() => onReprint(selectedOrder)}
                >
                  <Text style={styles.reprintBtnText}>🖨️ Reprint Receipt</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noSelection}>
                <Text style={styles.noSelectionIcon}>👆</Text>
                <Text style={styles.noSelectionText}>Select an order to view details</Text>
              </View>
            )}
          </View>
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    height: height * 0.85,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: '#999',
    fontSize: 24,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  ordersList: {
    width: '40%',
    borderRightWidth: 1,
    borderRightColor: '#0f3460',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  orderCard: {
    backgroundColor: '#16213e',
    margin: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  orderCardSelected: {
    borderColor: '#e94560',
    backgroundColor: '#1f2a4a',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderCustomer: {
    color: '#999',
    fontSize: 13,
    marginTop: 2,
  },
  orderCardMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  orderTime: {
    color: '#999',
    fontSize: 12,
  },
  orderTotal: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDetail: {
    flex: 1,
    padding: 16,
  },
  noSelection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSelectionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noSelectionText: {
    color: '#999',
    fontSize: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  detailOrderNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailMeta: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  statusBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusBadgeLargeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailSectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailItems: {
    flex: 1,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  detailItemQty: {
    color: '#e94560',
    fontWeight: 'bold',
    width: 40,
  },
  detailItemInfo: {
    flex: 1,
  },
  detailItemName: {
    color: '#fff',
    fontSize: 15,
  },
  detailItemMod: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  detailItemInstructions: {
    color: '#FF9800',
    fontSize: 12,
    marginTop: 4,
  },
  detailItemPrice: {
    color: '#fff',
    fontWeight: '600',
  },
  detailTotals: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  detailTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailTotalLabel: {
    color: '#999',
    fontSize: 15,
  },
  detailTotalValue: {
    color: '#fff',
    fontSize: 15,
  },
  detailGrandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  detailGrandTotalLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailGrandTotalValue: {
    color: '#e94560',
    fontSize: 20,
    fontWeight: 'bold',
  },
  reprintBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  reprintBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
