import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useCart, OrderType } from '../context/CartContext';
import { config } from '../config';

const TAX_RATE = 0.065; // 6.5% Florida

interface Table {
  id: string;
  tableNumber: number;
  tableName?: string;
  capacity: number;
  status: string;
}

interface PlaceOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (orderNumber: string, orderData: any) => void;
  restaurantId: string;
}

export function PlaceOrderModal({ visible, onClose, onSuccess, restaurantId }: PlaceOrderModalProps) {
  const API_URL = `${config.apiUrl}/api/restaurant/${restaurantId}`;
  const { state, subtotal, clearCart } = useCart();
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setError(null);
      setFieldErrors({});
    }
  }, [visible]);

  useEffect(() => {
    if (visible && orderType === 'dine-in') {
      fetchTables();
    }
  }, [visible, orderType]);

  async function fetchTables() {
    try {
      setLoadingTables(true);
      const response = await fetch(`${API_URL}/tables`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoadingTables(false);
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, boolean> = {};
    let errorMessages: string[] = [];

    // Pickup & Delivery require name and phone
    if (orderType === 'pickup' || orderType === 'delivery') {
      if (!customerName.trim()) {
        errors.customerName = true;
        errorMessages.push('Customer name');
      }
      if (!customerPhone.trim()) {
        errors.customerPhone = true;
        errorMessages.push('Phone number');
      }
    }

    // Dine-in requires table number
    if (orderType === 'dine-in') {
      const hasTable = selectedTableId || tableNumberInput.trim();
      if (!hasTable) {
        errors.tableNumber = true;
        errorMessages.push('Table number');
      }
    }

    setFieldErrors(errors);

    if (errorMessages.length > 0) {
      setError(`Required: ${errorMessages.join(', ')}`);
      return false;
    }

    return true;
  }

  async function handleSubmitOrder() {
    console.log('[PlaceOrder] Button clicked, validating...');

    if (!validateForm()) {
      console.log('[PlaceOrder] Validation failed');
      return;
    }

    setSubmitting(true);
    setError(null);

    console.log('[PlaceOrder] Starting order submission...');
    console.log('[PlaceOrder] API URL:', `${API_URL}/orders`);

    try {
      const orderData = {
        customerInfo: {
          firstName: customerName.split(' ')[0] || 'Guest',
          lastName: customerName.split(' ').slice(1).join(' ') || undefined,
          phone: customerPhone || undefined,
        },
        orderType,
        orderSource: 'pos',
        // Handle table: if it's a real ID use tableId, if manual use tableNumber
        tableId: orderType === 'dine-in' && selectedTableId && !selectedTableId.startsWith('manual:')
          ? selectedTableId
          : undefined,
        tableNumber: orderType === 'dine-in'
          ? (selectedTableId?.startsWith('manual:')
              ? selectedTableId.replace('manual:', '')
              : tableNumberInput || undefined)
          : undefined,
        items: state.items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          modifiers: item.modifiers.map(m => ({ modifierId: m.id })),
        })),
      };

      console.log('[PlaceOrder] Order data:', JSON.stringify(orderData, null, 2));

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      console.log('[PlaceOrder] Response status:', response.status);

      if (!response.ok) {
        const err = await response.json();
        console.log('[PlaceOrder] Error response:', err);
        throw new Error(err.error || 'Failed to create order');
      }

      const order = await response.json();
      console.log('[PlaceOrder] Order created:', order.orderNumber);

      // Build receipt data (include orderId for profit insight)
      const receiptData = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderType,
        customerName: customerName.trim() || 'Guest',
        tableNumber: selectedTableId
          ? tables.find(t => t.id === selectedTableId)?.tableNumber?.toString()
          : tableNumberInput || undefined,
        items: state.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: (item.price + item.modifiers.reduce((t, m) => t + m.priceAdjustment, 0)) * item.quantity,
          modifiers: item.modifiers,
        })),
        subtotal,
        tax,
        total,
        createdAt: new Date(),
      };

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setSelectedTableId(null);
      setTableNumberInput('');
      setOrderType('dine-in');

      clearCart();
      onSuccess(order.orderNumber, receiptData);
    } catch (err) {
      console.error('[PlaceOrder] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  }

  function handleOrderTypeChange(type: OrderType) {
    setOrderType(type);
    setError(null);
    setFieldErrors({});
    if (type !== 'dine-in') {
      setSelectedTableId(null);
      setTableNumberInput('');
    }
  }

  if (!visible) return null;

  const needsCustomerInfo = orderType === 'pickup' || orderType === 'delivery';

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Place Order</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body}>
          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Order Type */}
          <Text style={styles.sectionTitle}>Order Type</Text>
          <View style={styles.orderTypeRow}>
            {(['dine-in', 'pickup', 'delivery'] as OrderType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.orderTypeBtn, orderType === type && styles.orderTypeBtnActive]}
                onPress={() => handleOrderTypeChange(type)}
              >
                <Text style={[styles.orderTypeBtnText, orderType === type && styles.orderTypeBtnTextActive]}>
                  {type === 'pickup' && '🥡 '}
                  {type === 'dine-in' && '🍽️ '}
                  {type === 'delivery' && '🚗 '}
                  {type === 'dine-in' ? 'Dine-In' : type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Table Selection for Dine-in */}
          {orderType === 'dine-in' && (
            <>
              <Text style={styles.sectionTitle}>
                Table Number <Text style={styles.required}>*</Text>
              </Text>
              {loadingTables ? (
                <ActivityIndicator color="#e94560" style={{ marginVertical: 12 }} />
              ) : tables.length === 0 ? (
                <TextInput
                  style={[styles.input, fieldErrors.tableNumber && styles.inputError]}
                  placeholder="Table Number (e.g., 1, 2, 3)"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  value={tableNumberInput}
                  onChangeText={(text) => {
                    setTableNumberInput(text);
                    if (fieldErrors.tableNumber) {
                      setFieldErrors(prev => ({ ...prev, tableNumber: false }));
                      setError(null);
                    }
                  }}
                />
              ) : (
                <View style={styles.tableGrid}>
                  {tables.map((table) => (
                    <TouchableOpacity
                      key={table.id}
                      style={[
                        styles.tableBtn,
                        selectedTableId === table.id && styles.tableBtnSelected,
                        table.status === 'occupied' && styles.tableBtnOccupied,
                        fieldErrors.tableNumber && styles.tableBtnError,
                      ]}
                      onPress={() => {
                        setSelectedTableId(table.id);
                        if (fieldErrors.tableNumber) {
                          setFieldErrors(prev => ({ ...prev, tableNumber: false }));
                          setError(null);
                        }
                      }}
                      disabled={table.status === 'occupied'}
                    >
                      <Text style={[
                        styles.tableBtnText,
                        selectedTableId === table.id && styles.tableBtnTextSelected,
                      ]}>
                        {table.tableName || `Table ${table.tableNumber}`}
                      </Text>
                      <Text style={styles.tableCapacity}>
                        {table.capacity} seats
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Customer Info - Required for pickup/delivery */}
          <Text style={styles.sectionTitle}>
            Customer Info {needsCustomerInfo && <Text style={styles.required}>*</Text>}
          </Text>
          <TextInput
            style={[styles.input, fieldErrors.customerName && styles.inputError]}
            placeholder={needsCustomerInfo ? "Customer Name *" : "Customer Name (optional)"}
            placeholderTextColor="#666"
            value={customerName}
            onChangeText={(text) => {
              setCustomerName(text);
              if (fieldErrors.customerName) {
                setFieldErrors(prev => ({ ...prev, customerName: false }));
                setError(null);
              }
            }}
          />
          <TextInput
            style={[styles.input, fieldErrors.customerPhone && styles.inputError]}
            placeholder={needsCustomerInfo ? "Phone Number *" : "Phone (optional)"}
            placeholderTextColor="#666"
            value={customerPhone}
            onChangeText={(text) => {
              setCustomerPhone(text);
              if (fieldErrors.customerPhone) {
                setFieldErrors(prev => ({ ...prev, customerPhone: false }));
                setError(null);
              }
            }}
            keyboardType="phone-pad"
          />

          {/* Order Summary */}
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {state.items.map((item) => (
            <View key={item.id} style={styles.summaryItem}>
              <Text style={styles.summaryQty}>{item.quantity}x</Text>
              <View style={styles.summaryItemDetails}>
                <Text style={styles.summaryName}>{item.name}</Text>
                {item.modifiers.length > 0 && (
                  <Text style={styles.summaryMods}>
                    {item.modifiers.map(m => m.name).join(', ')}
                  </Text>
                )}
                {item.specialInstructions && (
                  <Text style={styles.summaryInstructions}>
                    ⚠️ {item.specialInstructions}
                  </Text>
                )}
              </View>
              <Text style={styles.summaryPrice}>
                ${((item.price + item.modifiers.reduce((t, m) => t + m.priceAdjustment, 0)) * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax (6.5%)</Text>
              <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmitOrder}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Place Order - ${total.toFixed(2)}</Text>
            )}
          </TouchableOpacity>
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
  modal: {
    width: width * 0.5,
    maxHeight: height * 0.85,
    backgroundColor: '#16213e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  body: {
    padding: 16,
    maxHeight: height * 0.55,
  },
  errorBanner: {
    backgroundColor: '#e94560',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  required: {
    color: '#e94560',
  },
  orderTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  orderTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  orderTypeBtnActive: {
    backgroundColor: '#e94560',
  },
  orderTypeBtnText: {
    color: '#999',
    fontWeight: '600',
  },
  orderTypeBtnTextActive: {
    color: '#fff',
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tableBtn: {
    width: '23%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tableBtnSelected: {
    borderColor: '#e94560',
    backgroundColor: '#2a2a4e',
  },
  tableBtnOccupied: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  tableBtnError: {
    borderColor: '#e94560',
  },
  tableBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tableBtnTextSelected: {
    color: '#e94560',
  },
  tableCapacity: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#e94560',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  summaryQty: {
    color: '#e94560',
    fontWeight: 'bold',
    width: 40,
  },
  summaryItemDetails: {
    flex: 1,
  },
  summaryName: {
    color: '#fff',
  },
  summaryMods: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  summaryInstructions: {
    color: '#FF9800',
    fontSize: 12,
    marginTop: 4,
  },
  summaryPrice: {
    color: '#fff',
    fontWeight: '600',
  },
  totalsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    color: '#999',
    fontSize: 15,
  },
  totalValue: {
    color: '#fff',
    fontSize: 15,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  grandTotalLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    color: '#e94560',
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#2e7d32',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
