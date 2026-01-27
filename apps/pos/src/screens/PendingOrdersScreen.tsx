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
      pending: { label: 'NEW', labelEs: 'NUEVO', color: '#2196F3', icon: '' },
      confirmed: { label: 'CONFIRMED', labelEs: 'CONFIRMADO', color: '#9C27B0', icon: '' },
      preparing: { label: 'COOKING', labelEs: 'COCINANDO', color: '#FF9800', icon: '' },
      ready: { label: 'READY', labelEs: 'LISTO', color: '#4CAF50', icon: '' },
    };
    return statusMap[status] || { label: status.toUpperCase(), labelEs: status.toUpperCase(), color: '#666', icon: '' };
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
          <Text style={styles.actionButtonText}>{buttonText}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case 'dine-in': return '';
      case 'pickup': return '';
      case 'delivery': return '';
      default: return '';
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
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {language === 'es' ? 'Ordenes Pendientes' : 'Pending Orders'}
          </Text>
          <View style={styles.headerRight}>
            <View style={[styles.connectionDot, socketConnected ? styles.connected : styles.disconnected]} />
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
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
              {language === 'es' ? 'Todos' : 'All'} ({tabCounts.all})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'tables' && styles.tabActive]}
            onPress={() => setSelectedTab('tables')}
          >
            <Text style={[styles.tabText, selectedTab === 'tables' && styles.tabTextActive]}>
              {language === 'es' ? 'Mesas' : 'Tables'} ({tabCounts.tables})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'pickup-delivery' && styles.tabActive]}
            onPress={() => setSelectedTab('pickup-delivery')}
          >
            <Text style={[styles.tabText, selectedTab === 'pickup-delivery' && styles.tabTextActive]}>
              Pickup/Delivery ({tabCounts.pickupDelivery})
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
              <Text style={styles.emptyStateIcon}>No orders</Text>
              <Text style={styles.emptyStateText}>
                {language === 'es' ? 'No hay ordenes pendientes' : 'No pending orders'}
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
                              Note: {item.specialInstructions}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Special Instructions */}
                  {order.specialInstructions && (
                    <View style={styles.orderNotes}>
                      <Text style={styles.orderNotesText}>Note: {order.specialInstructions}</Text>
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
    fontSize: 14,
    color: '#e94560',
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
    color: '#666',
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
    marginBottom: 12,
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
