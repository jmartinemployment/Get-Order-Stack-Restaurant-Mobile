import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  Switch,
} from 'react-native';
import { config } from '../config';

// ============ Types ============

interface PrimaryCategory {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  icon: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  nameEn: string | null;
  primaryCategoryId: string | null;
}

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  price: number;
  cost: number | null;
  image: string | null;
  available: boolean;
  eightySixed: boolean;
  eightySixReason: string | null;
  popular: boolean;
  dietary: string[];
  prepTimeMinutes: number | null;
}

interface MenuItemManagementScreenProps {
  visible: boolean;
  onClose: () => void;
  restaurantId: string;
  language: 'es' | 'en';
  onItemsUpdated?: () => void;
}

type EditModalState = {
  mode: 'create' | 'edit';
  item?: MenuItem;
} | null;

// ============ Dietary Options ============

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: '🥬 Vegetarian', labelEs: '🥬 Vegetariano' },
  { value: 'vegan', label: '🌱 Vegan', labelEs: '🌱 Vegano' },
  { value: 'gluten-free', label: '🌾 Gluten-Free', labelEs: '🌾 Sin Gluten' },
  { value: 'dairy-free', label: '🥛 Dairy-Free', labelEs: '🥛 Sin Lácteos' },
  { value: 'nut-free', label: '🥜 Nut-Free', labelEs: '🥜 Sin Nueces' },
  { value: 'spicy', label: '🌶️ Spicy', labelEs: '🌶️ Picante' },
  { value: 'contains-alcohol', label: '🍷 Contains Alcohol', labelEs: '🍷 Contiene Alcohol' },
];

// ============ Main Component ============

export function MenuItemManagementScreen({
  visible,
  onClose,
  restaurantId,
  language,
  onItemsUpdated,
}: MenuItemManagementScreenProps) {
  const API_URL = `${config.apiUrl}/api/restaurant/${restaurantId}`;

  // Data state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [primaryCategories, setPrimaryCategories] = useState<PrimaryCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter state - now filters by PRIMARY category
  const [selectedPrimaryCategoryId, setSelectedPrimaryCategoryId] = useState<string | 'all'>('all');

  // UI state
  const [editModal, setEditModal] = useState<EditModalState>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MenuItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    primaryCategoryId: '',
    categoryId: '',
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    price: '',
    cost: '',
    image: '',
    available: true,
    popular: false,
    dietary: [] as string[],
    prepTimeMinutes: '',
  });

  // ============ Data Fetching ============

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, primaryRes, subRes] = await Promise.all([
        fetch(`${API_URL}/menu/items`),
        fetch(`${API_URL}/primary-categories`),
        fetch(`${API_URL}/menu/categories`),
      ]);

      if (!itemsRes.ok || !primaryRes.ok || !subRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const itemsData = await itemsRes.json();
      const primaryData = await primaryRes.json();
      const subData = await subRes.json();

      setMenuItems(itemsData);
      setPrimaryCategories(primaryData);
      setSubcategories(subData);
    } catch (err) {
      Alert.alert('Error', 'Failed to load menu items. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible, fetchData]);

  // ============ Filtered Items ============

  // Build a map of subcategoryId -> primaryCategoryId for filtering
  const subcategoryToPrimaryMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    subcategories.forEach((sub) => {
      if (sub.primaryCategoryId) {
        map[sub.id] = sub.primaryCategoryId;
      }
    });
    return map;
  }, [subcategories]);

  const filteredItems = menuItems.filter((item) => {
    if (selectedPrimaryCategoryId === 'all') return true;
    const itemPrimaryCategoryId = subcategoryToPrimaryMap[item.categoryId];
    return itemPrimaryCategoryId === selectedPrimaryCategoryId;
  });

  // ============ CRUD Operations ============

  async function handleSave() {
    if (!editModal) return;

    // Validation
    if (!formData.name.trim()) {
      Alert.alert(
        language === 'es' ? 'Error de Validación' : 'Validation Error',
        language === 'es' ? 'El nombre (Español) es requerido' : 'Name (Spanish) is required'
      );
      return;
    }
    if (!formData.categoryId) {
      Alert.alert(
        language === 'es' ? 'Error de Validación' : 'Validation Error',
        language === 'es' ? 'La categoría es requerida' : 'Category is required'
      );
      return;
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      Alert.alert(
        language === 'es' ? 'Error de Validación' : 'Validation Error',
        language === 'es' ? 'Se requiere un precio válido' : 'Valid price is required'
      );
      return;
    }

    setSaving(true);
    try {
      const endpoint =
        editModal.mode === 'create'
          ? `${API_URL}/menu/items`
          : `${API_URL}/menu/items/${editModal.item?.id}`;
      const method = editModal.mode === 'create' ? 'POST' : 'PATCH';

      const body = {
        categoryId: formData.categoryId,
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim() || null,
        description: formData.description.trim() || null,
        descriptionEn: formData.descriptionEn.trim() || null,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        image: formData.image.trim() || null,
        available: formData.available,
        popular: formData.popular,
        dietary: formData.dietary,
        prepTimeMinutes: formData.prepTimeMinutes ? parseInt(formData.prepTimeMinutes, 10) : null,
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      setEditModal(null);
      resetForm();
      await fetchData();
      onItemsUpdated?.();

      Alert.alert(
        language === 'es' ? 'Éxito' : 'Success',
        language === 'es'
          ? `Artículo ${editModal.mode === 'create' ? 'creado' : 'actualizado'} exitosamente`
          : `Item ${editModal.mode === 'create' ? 'created' : 'updated'} successfully`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/menu/items/${deleteConfirm.id}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to delete');
      }

      setDeleteConfirm(null);
      await fetchData();
      onItemsUpdated?.();

      Alert.alert(
        language === 'es' ? 'Éxito' : 'Success',
        language === 'es' ? 'Artículo eliminado exitosamente' : 'Item deleted successfully'
      );
    } catch (err) {
      Alert.alert('Error', language === 'es' ? 'Error al eliminar artículo' : 'Failed to delete item');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle86(item: MenuItem) {
    try {
      const response = await fetch(`${API_URL}/menu/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eightySixed: !item.eightySixed,
          eightySixReason: !item.eightySixed ? 'Out of stock' : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      await fetchData();
      onItemsUpdated?.();
    } catch (err) {
      Alert.alert('Error', language === 'es' ? 'Error al actualizar estado' : 'Failed to update item status');
    }
  }

  // ============ Form Helpers ============

  function resetForm() {
    const firstPrimary = primaryCategories[0]?.id || '';
    const firstSubInPrimary = subcategories.find(s => s.primaryCategoryId === firstPrimary)?.id || '';
    setFormData({
      primaryCategoryId: firstPrimary,
      categoryId: firstSubInPrimary,
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      price: '',
      cost: '',
      image: '',
      available: true,
      popular: false,
      dietary: [],
      prepTimeMinutes: '',
    });
  }

  function openCreateModal() {
    resetForm();
    setEditModal({ mode: 'create' });
  }

  function openEditModal(item: MenuItem) {
    // Get the primary category from the subcategory
    const itemPrimaryCategoryId = subcategoryToPrimaryMap[item.categoryId] || primaryCategories[0]?.id || '';
    setFormData({
      primaryCategoryId: itemPrimaryCategoryId,
      categoryId: item.categoryId,
      name: item.name,
      nameEn: item.nameEn || '',
      description: item.description || '',
      descriptionEn: item.descriptionEn || '',
      price: item.price.toString(),
      cost: item.cost?.toString() || '',
      image: item.image || '',
      available: item.available,
      popular: item.popular,
      dietary: item.dietary || [],
      prepTimeMinutes: item.prepTimeMinutes?.toString() || '',
    });
    setEditModal({ mode: 'edit', item });
  }

  function toggleDietary(value: string) {
    setFormData((prev) => ({
      ...prev,
      dietary: prev.dietary.includes(value)
        ? prev.dietary.filter((d) => d !== value)
        : [...prev.dietary, value],
    }));
  }

  // Handle primary category change - reset subcategory to first available
  function handlePrimaryCategoryChange(primaryId: string) {
    const firstSubInPrimary = subcategories.find(s => s.primaryCategoryId === primaryId)?.id || '';
    setFormData(prev => ({
      ...prev,
      primaryCategoryId: primaryId,
      categoryId: firstSubInPrimary,
    }));
  }

  // Get subcategories filtered by selected primary category
  const filteredSubcategoriesForForm = subcategories.filter(
    s => s.primaryCategoryId === formData.primaryCategoryId
  );

  // ============ Helpers ============

  function getCategoryName(categoryId: string): string {
    const cat = subcategories.find((c) => c.id === categoryId);
    if (!cat) return 'Unknown';
    return language === 'en' && cat.nameEn ? cat.nameEn : cat.name;
  }

  function getPrimaryCategoryName(cat: PrimaryCategory): string {
    return language === 'en' && cat.nameEn ? cat.nameEn : cat.name;
  }

  // Count items per primary category
  function getItemCountForPrimaryCategory(primaryCategoryId: string): number {
    return menuItems.filter((item) => {
      const itemPrimaryCategoryId = subcategoryToPrimaryMap[item.categoryId];
      return itemPrimaryCategoryId === primaryCategoryId;
    }).length;
  }

  // ============ Main Render ============

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header with Close (X) on top, Add Item below */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            🍽️ {language === 'es' ? 'Gestión de Artículos' : 'Menu Item Management'}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
              <Text style={styles.addBtnText}>+ {language === 'es' ? 'Agregar' : 'Add Item'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary Category Filter Pills */}
        <View style={styles.filtersBar}>
          <TouchableOpacity
            style={[styles.filterChip, selectedPrimaryCategoryId === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedPrimaryCategoryId('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedPrimaryCategoryId === 'all' && styles.filterChipTextActive,
              ]}
            >
              {language === 'es' ? 'Todos' : 'All'} ({menuItems.length})
            </Text>
          </TouchableOpacity>
          {primaryCategories.map((cat) => {
            const count = getItemCountForPrimaryCategory(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  selectedPrimaryCategoryId === cat.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedPrimaryCategoryId(cat.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedPrimaryCategoryId === cat.id && styles.filterChipTextActive,
                  ]}
                >
                  {cat.icon} {getPrimaryCategoryName(cat)} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e94560" />
            <Text style={styles.loadingText}>
              {language === 'es' ? 'Cargando artículos...' : 'Loading menu items...'}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {language === 'es' ? 'No se encontraron artículos' : 'No items found'}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {language === 'es'
                    ? 'Agrega tu primer artículo para comenzar'
                    : 'Add your first menu item to get started'}
                </Text>
              </View>
            ) : (
              filteredItems.map((item) => (
                <View
                  key={item.id}
                  style={[styles.itemCard, item.eightySixed && styles.itemCard86]}
                >
                  {/* Item Info */}
                  <View style={styles.itemInfo}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.itemName}>
                        {language === 'en' && item.nameEn ? item.nameEn : item.name}
                      </Text>
                      {item.eightySixed && (
                        <View style={styles.badge86Inline}>
                          <Text style={styles.badge86Text}>86'd</Text>
                        </View>
                      )}
                      {item.popular && !item.eightySixed && (
                        <Text style={styles.badgePopularInline}>⭐</Text>
                      )}
                    </View>
                    <Text style={styles.itemCategory}>{getCategoryName(item.categoryId)}</Text>
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemPrice}>${Number(item.price).toFixed(2)}</Text>
                      {item.cost && (
                        <Text style={styles.itemCost}>
                          {language === 'es' ? 'Costo' : 'Cost'}: ${Number(item.cost).toFixed(2)} (
                          {Math.round(((item.price - item.cost) / item.price) * 100)}% {language === 'es' ? 'margen' : 'margin'})
                        </Text>
                      )}
                    </View>
                    {item.dietary && item.dietary.length > 0 && (
                      <View style={styles.dietaryTags}>
                        {item.dietary.map((d) => {
                          const option = DIETARY_OPTIONS.find(opt => opt.value === d);
                          const label = option 
                            ? (language === 'es' ? option.labelEs : option.label)
                            : d;
                          return (
                            <View key={d} style={styles.dietaryTag}>
                              <Text style={styles.dietaryTagText}>{label}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* Item Actions */}
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, item.eightySixed && styles.actionBtn86Active]}
                      onPress={() => handleToggle86(item)}
                    >
                      <Text style={styles.actionBtnText}>
                        {item.eightySixed
                          ? (language === 'es' ? '✅ Restaurar' : '✅ Restore')
                          : '🚫 86'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
                      <Text style={styles.actionBtnText}>✏️ {language === 'es' ? 'Editar' : 'Edit'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => setDeleteConfirm(item)}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Edit/Create Modal */}
        {editModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.editModal}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>
                  {editModal.mode === 'create'
                    ? (language === 'es' ? 'Agregar Artículo' : 'Add Menu Item')
                    : (language === 'es' ? 'Editar Artículo' : 'Edit Menu Item')}
                </Text>
                <TouchableOpacity onPress={() => setEditModal(null)}>
                  <Text style={styles.editModalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.editModalBody}>
                {/* Primary Category */}
                <Text style={styles.inputLabel}>
                  {language === 'es' ? 'Categoría Principal *' : 'Primary Category *'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryPicker}>
                    {primaryCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryOption,
                          formData.primaryCategoryId === cat.id && styles.categoryOptionSelected,
                        ]}
                        onPress={() => handlePrimaryCategoryChange(cat.id)}
                      >
                        <Text
                          style={[
                            styles.categoryOptionText,
                            formData.primaryCategoryId === cat.id && styles.categoryOptionTextSelected,
                          ]}
                        >
                          {cat.icon} {language === 'en' && cat.nameEn ? cat.nameEn : cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Subcategory (filtered by primary) */}
                <Text style={styles.inputLabel}>
                  {language === 'es' ? 'Subcategoría *' : 'Subcategory *'}
                </Text>
                <View style={styles.categoryPickerWrap}>
                  {filteredSubcategoriesForForm.length === 0 ? (
                    <Text style={styles.noSubcategoriesText}>
                      {language === 'es' ? 'No hay subcategorías' : 'No subcategories available'}
                    </Text>
                  ) : (
                    filteredSubcategoriesForForm.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryOption,
                          formData.categoryId === cat.id && styles.categoryOptionSelected,
                        ]}
                        onPress={() => setFormData({ ...formData, categoryId: cat.id })}
                      >
                        <Text
                          style={[
                            styles.categoryOptionText,
                            formData.categoryId === cat.id && styles.categoryOptionTextSelected,
                          ]}
                        >
                          {language === 'en' && cat.nameEn ? cat.nameEn : cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                {/* Name (Spanish) */}
                <Text style={styles.inputLabel}>
                  {language === 'es' ? 'Nombre (Español) *' : 'Name (Spanish) *'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Lomo Saltado"
                  placeholderTextColor="#666"
                />

                {/* Name (English) */}
                <Text style={styles.inputLabel}>
                  {language === 'es' ? 'Nombre (Inglés)' : 'Name (English)'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.nameEn}
                  onChangeText={(text) => setFormData({ ...formData, nameEn: text })}
                  placeholder="e.g., Stir-Fried Beef"
                  placeholderTextColor="#666"
                />

                {/* Description (Spanish) */}
                <Text style={styles.inputLabel}>
                  {language === 'es' ? 'Descripción (Español)' : 'Description (Spanish)'}
                </Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder={language === 'es' ? 'Descripción del plato...' : 'Dish description...'}
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={2}
                />

                {/* Description (English) */}
                <Text style={styles.inputLabel}>
                  {language === 'es' ? 'Descripción (Inglés)' : 'Description (English)'}
                </Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={formData.descriptionEn}
                  onChangeText={(text) => setFormData({ ...formData, descriptionEn: text })}
                  placeholder="Dish description..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={2}
                />

                {/* Price & Cost Row */}
                <View style={styles.rowInputs}>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>
                      {language === 'es' ? 'Precio ($) *' : 'Price ($) *'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={formData.price}
                      onChangeText={(text) => setFormData({ ...formData, price: text })}
                      placeholder="0.00"
                      placeholderTextColor="#666"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>
                      {language === 'es' ? 'Costo ($)' : 'Cost ($)'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={formData.cost}
                      onChangeText={(text) => setFormData({ ...formData, cost: text })}
                      placeholder="0.00"
                      placeholderTextColor="#666"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Image URL */}
                <Text style={styles.inputLabel}>
                  {language === 'es' ? 'URL de Imagen' : 'Image URL'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.image}
                  onChangeText={(text) => setFormData({ ...formData, image: text })}
                  placeholder="https://..."
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                />

                {/* Prep Time */}
                <Text style={styles.inputLabel}>
                  {language === 'es' ? 'Tiempo de Preparación (minutos)' : 'Prep Time (minutes)'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.prepTimeMinutes}
                  onChangeText={(text) => setFormData({ ...formData, prepTimeMinutes: text })}
                  placeholder="e.g., 15"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                />

                {/* Toggles */}
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    {language === 'es' ? 'Artículo Popular' : 'Popular Item'}
                  </Text>
                  <Switch
                    value={formData.popular}
                    onValueChange={(value) => setFormData({ ...formData, popular: value })}
                    trackColor={{ false: '#333', true: '#e94560' }}
                    thumbColor={formData.popular ? '#fff' : '#666'}
                  />
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    {language === 'es' ? 'Disponible' : 'Available'}
                  </Text>
                  <Switch
                    value={formData.available}
                    onValueChange={(value) => setFormData({ ...formData, available: value })}
                    trackColor={{ false: '#333', true: '#4CAF50' }}
                    thumbColor={formData.available ? '#fff' : '#666'}
                  />
                </View>

                {/* Dietary Tags */}
                <Text style={styles.inputLabel}>
                  {language === 'es' ? 'Etiquetas Dietéticas' : 'Dietary Tags'}
                </Text>
                <View style={styles.dietaryPicker}>
                  {DIETARY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dietaryOption,
                        formData.dietary.includes(option.value) && styles.dietaryOptionSelected,
                      ]}
                      onPress={() => toggleDietary(option.value)}
                    >
                      <Text
                        style={[
                          styles.dietaryOptionText,
                          formData.dietary.includes(option.value) && styles.dietaryOptionTextSelected,
                        ]}
                      >
                        {language === 'es' ? option.labelEs : option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.editModalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditModal(null)}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editModal.mode === 'create'
                        ? (language === 'es' ? 'Crear Artículo' : 'Create Item')
                        : (language === 'es' ? 'Guardar Cambios' : 'Save Changes')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModal}>
              <Text style={styles.confirmTitle}>
                {language === 'es' ? '¿Eliminar Artículo?' : 'Delete Menu Item?'}
              </Text>
              <Text style={styles.confirmMessage}>
                {language === 'es'
                  ? `¿Estás seguro de que quieres eliminar "${deleteConfirm.name}"?\n\nEsta acción no se puede deshacer.`
                  : `Are you sure you want to delete "${deleteConfirm.name}"?\n\nThis action cannot be undone.`}
              </Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => setDeleteConfirm(null)}
                  disabled={saving}
                >
                  <Text style={styles.confirmCancelText}>
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmDeleteBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleDelete}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmDeleteText}>
                      {language === 'es' ? 'Eliminar' : 'Delete'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ============ Styles ============

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0f3460',
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  closeBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeBtnText: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filtersBar: {
    backgroundColor: '#16213e',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#e94560',
  },
  filterChipText: {
    color: '#999',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 12,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 18,
  },
  emptyStateSubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 8,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  itemCard86: {
    opacity: 0.6,
    borderWidth: 2,
    borderColor: '#f44336',
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImagePlaceholderText: {
    fontSize: 32,
  },
  badge86: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#f44336',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badge86Text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgePopular: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFD700',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePopularText: {
    fontSize: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  badge86Inline: {
    backgroundColor: '#f44336',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePopularInline: {
    fontSize: 14,
  },
  itemNameEn: {
    color: '#999',
    fontSize: 13,
    marginTop: 2,
  },
  itemCategory: {
    color: '#e94560',
    fontSize: 12,
    marginTop: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  itemPrice: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemCost: {
    color: '#666',
    fontSize: 12,
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  dietaryTag: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dietaryTagText: {
    color: '#999',
    fontSize: 10,
  },
  itemActions: {
    justifyContent: 'center',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionBtn86Active: {
    backgroundColor: '#4CAF50',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  deleteBtn: {
    backgroundColor: '#333',
  },
  deleteBtnText: {
    fontSize: 16,
    textAlign: 'center',
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
  editModal: {
    width: Math.min(width * 0.9, 600),
    maxHeight: height * 0.9,
    backgroundColor: '#16213e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  editModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editModalClose: {
    color: '#999',
    fontSize: 24,
    padding: 4,
  },
  editModalBody: {
    padding: 16,
    maxHeight: height * 0.6,
  },
  inputLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  categoryPicker: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryPickerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  categoryOption: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  categoryOptionSelected: {
    backgroundColor: '#0f3460',
    borderColor: '#e94560',
  },
  categoryOptionText: {
    color: '#999',
    fontSize: 13,
  },
  categoryOptionTextSelected: {
    color: '#fff',
  },
  noSubcategoriesText: {
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 14,
  },
  dietaryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  dietaryOption: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
    flexShrink: 1,
    minWidth: 0,
  },
  dietaryOptionSelected: {
    backgroundColor: '#0f3460',
    borderColor: '#e94560',
  },
  dietaryOptionText: {
    color: '#999',
    fontSize: 12,
  },
  dietaryOptionTextSelected: {
    color: '#fff',
  },
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: '#999',
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#e94560',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModal: {
    width: Math.min(width * 0.85, 400),
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
  },
  confirmTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  confirmMessage: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  confirmCancelText: {
    color: '#999',
    fontSize: 16,
  },
  confirmDeleteBtn: {
    backgroundColor: '#f44336',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MenuItemManagementScreen;
