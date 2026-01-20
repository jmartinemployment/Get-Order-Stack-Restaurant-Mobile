import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  TextInput,
} from 'react-native';
import { useCart, CartItem, CartModifier } from '../context/CartContext';
import { CheckoutModal } from '../components/CheckoutModal';
import { ReceiptModal } from '../components/ReceiptPrinter';
import { OrderHistoryScreen } from './OrderHistoryScreen';

const API_URL = 'http://localhost:3000/api/restaurant/96816829-87e3-4b6a-9f6c-613e4b3ab522';

interface Modifier {
  id: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  minSelections: number;
  maxSelections: number | null;
  modifiers: Modifier[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  popular?: boolean;
  dietary: string[];
  modifierGroups: ModifierGroup[];
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  items: MenuItem[];
}

export function MenuScreen() {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [editingCartItem, setEditingCartItem] = useState<string | null>(null);

  const { addItem, removeItem, updateQuantity, clearCart, state, subtotal, itemCount } = useCart();

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/menu`);
      if (!response.ok) throw new Error('Failed to fetch menu');
      const data = await response.json();
      setMenu(data);
      if (data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }

  function handleItemPress(item: MenuItem) {
    setSelectedItem(item);
    setQuantity(1);
    setSpecialInstructions('');
    const defaultModifiers: Record<string, string[]> = {};
    item.modifierGroups.forEach((group) => {
      const defaults = group.modifiers
        .filter((m) => m.isDefault)
        .map((m) => m.id);
      if (defaults.length > 0) {
        defaultModifiers[group.id] = defaults;
      }
    });
    setSelectedModifiers(defaultModifiers);
  }

  function handleModifierToggle(groupId: string, modifierId: string, multiSelect: boolean) {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      if (multiSelect) {
        if (current.includes(modifierId)) {
          return { ...prev, [groupId]: current.filter((id) => id !== modifierId) };
        }
        return { ...prev, [groupId]: [...current, modifierId] };
      }
      return { ...prev, [groupId]: [modifierId] };
    });
  }

  function calculateItemTotal(): number {
    if (!selectedItem) return 0;
    let total = Number(selectedItem.price);
    selectedItem.modifierGroups.forEach((group) => {
      const selected = selectedModifiers[group.id] || [];
      group.modifiers.forEach((mod) => {
        if (selected.includes(mod.id)) {
          total += Number(mod.priceAdjustment);
        }
      });
    });
    return total * quantity;
  }

  function handleAddToCart() {
    if (!selectedItem) return;

    const modifiers: CartModifier[] = [];
    selectedItem.modifierGroups.forEach((group) => {
      const selected = selectedModifiers[group.id] || [];
      group.modifiers.forEach((mod) => {
        if (selected.includes(mod.id)) {
          modifiers.push({
            id: mod.id,
            name: mod.name,
            priceAdjustment: Number(mod.priceAdjustment),
          });
        }
      });
    });

    const cartItem: CartItem = {
      id: `${selectedItem.id}-${Date.now()}`,
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      price: Number(selectedItem.price),
      quantity,
      modifiers,
      specialInstructions: specialInstructions.trim() || undefined,
    };

    addItem(cartItem);
    setSelectedItem(null);
    setSelectedModifiers({});
    setSpecialInstructions('');
    setQuantity(1);
  }

  function handleRemoveFromCart(itemId: string) {
    removeItem(itemId);
    setEditingCartItem(null);
  }

  function handleUpdateCartQuantity(itemId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
    setEditingCartItem(null);
  }

  function handleCheckoutSuccess(orderNumber: string, data: any) {
    setShowCheckout(false);
    setOrderSuccess(orderNumber);
    setReceiptData(data);
  }

  function handlePrintReceipt() {
    if (receiptData) {
      setShowReceipt(true);
    }
  }

  function handleReprintFromHistory(order: any) {
    const data = {
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      customerName: order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : undefined,
      tableNumber: order.table?.tableNumber?.toString(),
      items: order.orderItems.map((item: any) => ({
        name: item.menuItemName,
        quantity: item.quantity,
        price: Number(item.totalPrice),
        modifiers: item.modifiers.map((m: any) => ({
          name: m.modifierName,
          priceAdjustment: Number(m.priceAdjustment),
        })),
      })),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      total: Number(order.total),
      createdAt: new Date(order.createdAt),
    };
    setReceiptData(data);
    setShowReceipt(true);
  }

  const currentCategory = menu.find((c) => c.id === selectedCategory);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMenu}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {menu.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === category.id && styles.categoryTabTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowOrderHistory(true)}
        >
          <Text style={styles.historyButtonText}>📋 History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        {/* Menu Items Grid */}
        <ScrollView style={styles.menuGrid} contentContainerStyle={styles.menuGridContent}>
          <View style={styles.itemsRow}>
            {currentCategory?.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItemCard}
                onPress={() => handleItemPress(item)}
              >
                {item.image && (
                  <Image source={{ uri: item.image }} style={styles.menuItemImage} />
                )}
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.menuItemPrice}>${Number(item.price).toFixed(2)}</Text>
                  {item.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>⭐ Popular</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Cart Summary */}
        <View style={styles.cartSummary}>
          <Text style={styles.cartTitle}>🛒 Cart ({itemCount})</Text>
          <ScrollView style={styles.cartItems}>
            {state.items.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemMain}>
                  <Text style={styles.cartItemQty}>{item.quantity}x</Text>
                  <View style={styles.cartItemDetails}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    {item.modifiers.length > 0 && (
                      <Text style={styles.cartItemMods}>
                        {item.modifiers.map((m) => m.name).join(', ')}
                      </Text>
                    )}
                    {item.specialInstructions && (
                      <Text style={styles.cartItemInstructions}>
                        ⚠️ {item.specialInstructions}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.cartItemPrice}>
                    ${((Number(item.price) + item.modifiers.reduce((t, m) => t + Number(m.priceAdjustment), 0)) * item.quantity).toFixed(2)}
                  </Text>
                </View>
                
                {/* Cart Item Actions */}
                <View style={styles.cartItemActions}>
                  <TouchableOpacity
                    style={styles.cartQtyBtn}
                    onPress={() => handleUpdateCartQuantity(item.id, item.quantity - 1)}
                  >
                    <Text style={styles.cartQtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.cartQtyDisplay}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.cartQtyBtn}
                    onPress={() => handleUpdateCartQuantity(item.id, item.quantity + 1)}
                  >
                    <Text style={styles.cartQtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cartRemoveBtn}
                    onPress={() => handleRemoveFromCart(item.id)}
                  >
                    <Text style={styles.cartRemoveBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.cartFooter}>
            {itemCount > 0 && (
              <TouchableOpacity style={styles.clearCartBtn} onPress={clearCart}>
                <Text style={styles.clearCartBtnText}>Clear Cart</Text>
              </TouchableOpacity>
            )}
            <View style={styles.cartSubtotal}>
              <Text style={styles.cartSubtotalLabel}>Subtotal</Text>
              <Text style={styles.cartSubtotalValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutButton, itemCount === 0 && styles.checkoutButtonDisabled]}
              disabled={itemCount === 0}
              onPress={() => setShowCheckout(true)}
            >
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Item Detail Modal */}
      {selectedItem && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedItem.name}</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setSelectedItem(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>{selectedItem.description}</Text>
              <Text style={styles.modalBasePrice}>
              Base price: ${Number(selectedItem.price).toFixed(2)}
              </Text>

              {selectedItem.modifierGroups.map((group) => (
                <View key={group.id} style={styles.modifierGroup}>
                  <Text style={styles.modifierGroupName}>
                    {group.name}
                    {group.required && <Text style={styles.requiredBadge}> (Required)</Text>}
                  </Text>
                  {group.modifiers.map((mod) => {
                    const isSelected = (selectedModifiers[group.id] || []).includes(mod.id);
                    return (
                      <TouchableOpacity
                        key={mod.id}
                        style={[styles.modifierOption, isSelected && styles.modifierOptionSelected]}
                        onPress={() => handleModifierToggle(group.id, mod.id, group.multiSelect)}
                      >
                        <Text style={styles.modifierOptionText}>
                          {group.multiSelect ? (isSelected ? '☑' : '☐') : (isSelected ? '●' : '○')}{' '}
                          {mod.name}
                        </Text>
                        {mod.priceAdjustment > 0 && (
                          <Text style={styles.modifierPrice}>+${Number(mod.priceAdjustment).toFixed(2)}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              {/* Special Instructions */}
              <View style={styles.instructionsSection}>
                <Text style={styles.instructionsLabel}>Special Instructions</Text>
                <TextInput
                  style={styles.instructionsInput}
                  placeholder="e.g., No onions, extra sauce..."
                  placeholderTextColor="#666"
                  value={specialInstructions}
                  onChangeText={setSpecialInstructions}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity((q) => q + 1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
                <Text style={styles.addToCartButtonText}>
                  Add to Cart - ${calculateItemTotal().toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        visible={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Order Success Modal */}
      {orderSuccess && (
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Order Placed!</Text>
            <Text style={styles.successOrderNumber}>Order #{orderSuccess}</Text>
            <Text style={styles.successMessage}>The order has been sent to the kitchen.</Text>
            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.printReceiptBtn}
                onPress={handlePrintReceipt}
              >
                <Text style={styles.printReceiptBtnText}>🖨️ Print Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.newOrderBtn}
                onPress={() => {
                  setOrderSuccess(null);
                  setReceiptData(null);
                }}
              >
                <Text style={styles.newOrderBtnText}>New Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        visible={showReceipt}
        onClose={() => setShowReceipt(false)}
        data={receiptData}
      />

      {/* Order History Screen */}
      <OrderHistoryScreen
        visible={showOrderHistory}
        onClose={() => setShowOrderHistory(false)}
        onReprint={handleReprintFromHistory}
      />
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#e94560',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  categoryBar: {
    backgroundColor: '#16213e',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryScroll: {
    flex: 1,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  categoryTabActive: {
    backgroundColor: '#e94560',
  },
  categoryTabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  historyButton: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  historyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  menuGrid: {
    flex: 1,
  },
  menuGridContent: {
    padding: 12,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  menuItemCard: {
    width: (width * 0.7 - 48) / 3,
    backgroundColor: '#16213e',
    borderRadius: 12,
    margin: 6,
    overflow: 'hidden',
  },
  menuItemImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#0f3460',
  },
  menuItemInfo: {
    padding: 12,
  },
  menuItemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemPrice: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: 'bold',
  },
  popularBadge: {
    marginTop: 6,
  },
  popularBadgeText: {
    color: '#ffd700',
    fontSize: 12,
  },
  cartSummary: {
    width: width * 0.3,
    backgroundColor: '#16213e',
    borderLeftWidth: 1,
    borderLeftColor: '#0f3460',
  },
  cartTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  cartItems: {
    flex: 1,
    padding: 12,
  },
  cartItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  cartItemMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cartItemQty: {
    color: '#e94560',
    fontWeight: 'bold',
    fontSize: 14,
    width: 30,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    color: '#fff',
    fontSize: 14,
  },
  cartItemMods: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  cartItemInstructions: {
    color: '#FF9800',
    fontSize: 11,
    marginTop: 4,
  },
  cartItemPrice: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  cartQtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartQtyBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartQtyDisplay: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  cartRemoveBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  cartRemoveBtnText: {
    fontSize: 16,
  },
  cartFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  clearCartBtn: {
    backgroundColor: '#333',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  clearCartBtnText: {
    color: '#999',
    fontSize: 13,
  },
  cartSubtotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cartSubtotalLabel: {
    color: '#999',
    fontSize: 16,
  },
  cartSubtotalValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#444',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.5,
    maxHeight: height * 0.8,
    backgroundColor: '#16213e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    padding: 8,
  },
  modalCloseText: {
    color: '#999',
    fontSize: 24,
  },
  modalBody: {
    padding: 16,
    maxHeight: height * 0.5,
  },
  modalDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
  },
  modalBasePrice: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  modifierGroup: {
    marginBottom: 16,
  },
  modifierGroupName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  requiredBadge: {
    color: '#e94560',
    fontWeight: 'normal',
  },
  modifierOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    marginBottom: 4,
  },
  modifierOptionSelected: {
    backgroundColor: '#0f3460',
  },
  modifierOptionText: {
    color: '#fff',
    fontSize: 14,
  },
  modifierPrice: {
    color: '#e94560',
    fontSize: 14,
  },
  instructionsSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  instructionsLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionsInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    gap: 12,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
  },
  quantityButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  quantityValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#e94560',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successModal: {
    width: width * 0.4,
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    color: '#4CAF50',
    marginBottom: 16,
  },
  successTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successOrderNumber: {
    color: '#e94560',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  successMessage: {
    color: '#999',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  successActions: {
    flexDirection: 'row',
    gap: 12,
  },
  printReceiptBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  printReceiptBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newOrderBtn: {
    backgroundColor: '#e94560',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  newOrderBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
