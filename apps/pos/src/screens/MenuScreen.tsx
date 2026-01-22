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
  useWindowDimensions,
} from 'react-native';
import { useCart, CartItem, CartModifier } from '../context/CartContext';
import { CheckoutModal } from '../components/CheckoutModal';
import { ReceiptModal } from '../components/ReceiptPrinter';
import { OrderHistoryScreen } from './OrderHistoryScreen';
import { PrimaryCategoryNav, PrimaryCategory } from '../components/PrimaryCategoryNav';
import { CategoryManagementScreen } from './CategoryManagementScreen';
import { MenuItemManagementScreen } from './MenuItemManagementScreen';
import { config } from '../config';

interface MenuScreenProps {
  restaurantId: string;
  restaurantName: string;
  restaurantLogo?: string;
  onLogout: () => void;
}

interface Restaurant {
  id: string;
  name: string;
  logo?: string;
  location?: string;
}

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
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  price: number;
  image?: string;
  popular?: boolean;
  dietary: string[];
  modifierGroups: ModifierGroup[];
}

interface Subcategory {
  id: string;
  name: string;
  nameEs?: string;
  nameEn?: string;
  description?: string;
  image?: string;
  items: MenuItem[];
}

interface GroupedPrimaryCategory extends PrimaryCategory {
  subcategories: Subcategory[];
}

export function MenuScreen({ restaurantId, restaurantName, restaurantLogo, onLogout }: MenuScreenProps) {
  const API_URL = `${config.apiUrl}/api/restaurant/${restaurantId}`;
  const { width: screenWidth } = useWindowDimensions();
  
  // Restaurant data (for logo, etc.)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  
  // Menu data - now hierarchical
  const [groupedMenu, setGroupedMenu] = useState<GroupedPrimaryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  
  // Item detail modal
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  // Other modals
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showMenuItemManagement, setShowMenuItemManagement] = useState(false);
  
  // Profit insight for checkout success
  const [profitInsight, setProfitInsight] = useState<{
    profitMargin: number;
    estimatedProfit: number;
    starItem?: { name: string; margin: number };
    insightText: string;
    quickTip: string;
  } | null>(null);

  // Language setting - always default to Spanish for POS systems
  // Restaurant staff typically prefer Spanish; toggle available for English
  const [language, setLanguage] = useState<'es' | 'en'>('es');

  const { addItem, removeItem, updateQuantity, clearCart, state, subtotal, itemCount } = useCart();

  useEffect(() => {
    fetchRestaurant();
    // Default to Spanish on initial load
    fetchGroupedMenu('es');
  }, []);

  async function fetchRestaurant() {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data);
      }
    } catch (err) {
      console.error('Error fetching restaurant:', err);
    }
  }

  async function fetchGroupedMenu(lang?: 'es' | 'en', showLoading = true) {
    const fetchLang = lang ?? language;
    try {
      if (showLoading) setLoading(true);
      const response = await fetch(`${API_URL}/menu/grouped?lang=${fetchLang}`);
      if (!response.ok) throw new Error('Failed to fetch menu');
      const data: GroupedPrimaryCategory[] = await response.json();
      setGroupedMenu(data);
      
      // Set initial selections only if not already set
      if (!selectedPrimaryId && data.length > 0) {
        setSelectedPrimaryId(data[0].id);
        if (data[0].subcategories.length > 0) {
          setSelectedSubcategoryId(data[0].subcategories[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  // Get current primary category and its subcategories
  const currentPrimary = groupedMenu.find((p) => p.id === selectedPrimaryId);
  const currentSubcategories = currentPrimary?.subcategories || [];
  const currentSubcategory = currentSubcategories.find((s) => s.id === selectedSubcategoryId);

  function handlePrimarySelect(category: PrimaryCategory) {
    setSelectedPrimaryId(category.id);
    // Auto-select first subcategory of the new primary
    const primary = groupedMenu.find((p) => p.id === category.id);
    if (primary && primary.subcategories.length > 0) {
      setSelectedSubcategoryId(primary.subcategories[0].id);
    } else {
      setSelectedSubcategoryId(null);
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
  }

  function handleUpdateCartQuantity(itemId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  }

  async function handleCheckoutSuccess(orderNumber: string, data: any) {
    setShowCheckout(false);
    setOrderSuccess(orderNumber);
    setReceiptData(data);
    setProfitInsight(null); // Reset while loading
    
    // Fetch profit insight for this order
    try {
      const orderId = data.orderId; // Need to pass orderId from CheckoutModal
      if (orderId) {
        const response = await fetch(`${API_URL}/orders/${orderId}/profit-insight`);
        if (response.ok) {
          const insight = await response.json();
          setProfitInsight(insight);
        }
      }
    } catch (err) {
      console.log('Could not fetch profit insight:', err);
      // Non-critical - don't show error to user
    }
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

  async function toggleLanguage() {
    const newLang = language === 'en' ? 'es' : 'en';
    console.log('Toggling language to:', newLang);
    setLanguage(newLang);
    
    // Fetch menu with new language directly (avoid closure issues)
    try {
      const response = await fetch(`${API_URL}/menu/grouped?lang=${newLang}`);
      if (!response.ok) throw new Error('Failed to fetch menu');
      const data: GroupedPrimaryCategory[] = await response.json();
      console.log('Fetched menu data:', data.length, 'categories');
      setGroupedMenu(data);
    } catch (err) {
      console.error('Error fetching menu:', err);
    }
  }

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
        <TouchableOpacity style={styles.retryButton} onPress={fetchGroupedMenu}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {(restaurant?.logo || restaurantLogo) ? (
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: restaurant?.logo || restaurantLogo }} 
                style={styles.headerLogoImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <Text style={styles.headerLogo}>🍽️</Text>
          )}
          <Text style={styles.headerTitle}>{restaurant?.name || restaurantName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
            <Text style={styles.langToggleText}>
              {language === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'} → {language === 'es' ? '🇺🇸' : '🇪🇸'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminBtn}
            onPress={() => setShowMenuItemManagement(true)}
          >
            <Text style={styles.adminBtnText}>🍽️ Items</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminBtn}
            onPress={() => setShowCategoryManagement(true)}
          >
            <Text style={styles.adminBtnText}>⚙️ Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutBtnText}>Switch Restaurant</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Primary Category Navigation Pills */}
      <PrimaryCategoryNav
        categories={groupedMenu}
        selectedId={selectedPrimaryId}
        onSelect={handlePrimarySelect}
        language={language}
      />

      {/* Subcategory Tabs */}
      <View style={styles.subcategoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subcategoryScroll}>
          {currentSubcategories.map((subcategory) => (
            <TouchableOpacity
              key={subcategory.id}
              style={[
                styles.subcategoryTab,
                selectedSubcategoryId === subcategory.id && styles.subcategoryTabActive,
              ]}
              onPress={() => setSelectedSubcategoryId(subcategory.id)}
            >
              <Text
                style={[
                  styles.subcategoryTabText,
                  selectedSubcategoryId === subcategory.id && styles.subcategoryTabTextActive,
                ]}
              >
                {language === 'en' && subcategory.nameEn ? subcategory.nameEn : subcategory.name}
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
          {/* Show subcategory name as header */}
          {currentSubcategory && (
            <Text style={styles.subcategoryHeader}>
              {language === 'en' && currentSubcategory.nameEn ? currentSubcategory.nameEn : currentSubcategory.name}
            </Text>
          )}
          
          <View style={styles.itemsRow}>
            {currentSubcategory?.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItemCard, { width: (screenWidth * 0.7 - 48) / 3 }]}
                onPress={() => handleItemPress(item)}
              >
                {item.image && (
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.menuItemImage} 
                    resizeMode="cover"
                  />
                )}
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemName} numberOfLines={2}>
                    {language === 'en' && item.nameEn ? item.nameEn : item.name}
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

          {/* If no items in subcategory */}
          {currentSubcategory && currentSubcategory.items.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No items in this category</Text>
            </View>
          )}

          {/* If no subcategory selected */}
          {!currentSubcategory && currentSubcategories.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No subcategories available</Text>
            </View>
          )}
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
              <Text style={styles.modalTitle}>
                {language === 'en' && selectedItem.nameEn ? selectedItem.nameEn : selectedItem.name}
              </Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setSelectedItem(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                {language === 'en' && selectedItem.descriptionEn ? selectedItem.descriptionEn : selectedItem.description}
              </Text>
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
        restaurantId={restaurantId}
      />

      {/* Order Success Modal */}
      {orderSuccess && (
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Order Placed!</Text>
            <Text style={styles.successOrderNumber}>Order #{orderSuccess}</Text>
            <Text style={styles.successMessage}>The order has been sent to the kitchen.</Text>
            
            {/* Profit Insight Section */}
            {profitInsight && (
              <View style={styles.profitInsightBox}>
                <View style={styles.profitInsightHeader}>
                  <Text style={styles.profitInsightEmoji}>💰</Text>
                  <Text style={styles.profitInsightMargin}>{profitInsight.profitMargin}% margin</Text>
                  <Text style={styles.profitInsightProfit}>${profitInsight.estimatedProfit.toFixed(2)} profit</Text>
                </View>
                {profitInsight.starItem && (
                  <Text style={styles.profitInsightStar}>
                    ⭐ Star item: {profitInsight.starItem.name}
                  </Text>
                )}
                <Text style={styles.profitInsightTip}>{profitInsight.quickTip}</Text>
              </View>
            )}
            
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
                  setProfitInsight(null);
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
        restaurantId={restaurantId}
      />

      {/* Category Management Screen */}
      <CategoryManagementScreen
        visible={showCategoryManagement}
        onClose={() => setShowCategoryManagement(false)}
        restaurantId={restaurantId}
        onCategoriesUpdated={() => fetchGroupedMenu(language)}
      />

      {/* Menu Item Management Screen */}
      <MenuItemManagementScreen
        visible={showMenuItemManagement}
        onClose={() => setShowMenuItemManagement(false)}
        restaurantId={restaurantId}
        onItemsUpdated={() => fetchGroupedMenu(language)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f3460',
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    padding: 4,
  },
  headerLogoImage: {
    width: 100,
    height: 36,
  },
  headerLogo: {
    fontSize: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langToggle: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  langToggleText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  adminBtn: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  adminBtnText: {
    color: '#e94560',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutBtnText: {
    color: '#999',
    fontSize: 13,
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
  // Subcategory bar (below primary pills)
  subcategoryBar: {
    backgroundColor: '#16213e',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
    flexDirection: 'row',
    alignItems: 'center',
  },
  subcategoryScroll: {
    flex: 1,
  },
  subcategoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#1a1a2e',
  },
  subcategoryTabActive: {
    backgroundColor: '#0f3460',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  subcategoryTabText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  subcategoryTabTextActive: {
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
  subcategoryHeader: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 6,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  menuItemCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    margin: 6,
    overflow: 'hidden',
  },
  menuItemImage: {
    width: 64,
    height: 64,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 12,
    backgroundColor: '#fff',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
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
  // Profit Insight Styles
  profitInsightBox: {
    backgroundColor: '#1a3a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    width: '100%',
  },
  profitInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  profitInsightEmoji: {
    fontSize: 24,
  },
  profitInsightMargin: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profitInsightProfit: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  profitInsightStar: {
    color: '#ffd700',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  profitInsightTip: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
