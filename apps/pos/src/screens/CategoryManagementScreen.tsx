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
} from 'react-native';
import { config } from '../config';

// ============ Types ============

interface PrimaryCategory {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  icon: string | null;
  displayOrder: number;
  subcategoryCount?: number;
}

interface Subcategory {
  id: string;
  name: string;
  nameEn: string | null;
  primaryCategoryId: string | null;
  displayOrder: number;
}

interface CategoryManagementScreenProps {
  visible: boolean;
  onClose: () => void;
  restaurantId: string;
  onCategoriesUpdated?: () => void;
}

type EditModalState = {
  type: 'primary' | 'subcategory';
  mode: 'create' | 'edit';
  item?: PrimaryCategory | Subcategory;
} | null;

// ============ Icon Picker Options ============

const ICON_OPTIONS = [
  { value: '🥗', label: 'Salad' },
  { value: '🍽️', label: 'Plate' },
  { value: '🥤', label: 'Drink' },
  { value: '🍰', label: 'Cake' },
  { value: '🥕', label: 'Carrot' },
  { value: '🍕', label: 'Pizza' },
  { value: '🍔', label: 'Burger' },
  { value: '🌮', label: 'Taco' },
  { value: '🍣', label: 'Sushi' },
  { value: '🍝', label: 'Pasta' },
  { value: '🥩', label: 'Steak' },
  { value: '🍗', label: 'Chicken' },
  { value: '🦐', label: 'Shrimp' },
  { value: '🐟', label: 'Fish' },
  { value: '🥘', label: 'Pot' },
  { value: '☕', label: 'Coffee' },
  { value: '🍺', label: 'Beer' },
  { value: '🍷', label: 'Wine' },
  { value: '🍹', label: 'Cocktail' },
  { value: '🧃', label: 'Juice' },
  { value: '📋', label: 'Menu' },
];

// ============ Main Component ============

export function CategoryManagementScreen({
  visible,
  onClose,
  restaurantId,
  onCategoriesUpdated,
}: CategoryManagementScreenProps) {
  const API_URL = `${config.apiUrl}/api/restaurant/${restaurantId}`;

  // Data state
  const [primaryCategories, setPrimaryCategories] = useState<PrimaryCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'primary' | 'subcategory'>('primary');
  const [editModal, setEditModal] = useState<EditModalState>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'primary' | 'subcategory'; item: any } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    slug: '',
    icon: '📋',
    primaryCategoryId: null as string | null,
  });

  // ============ Data Fetching ============

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [primaryRes, subRes] = await Promise.all([
        fetch(`${API_URL}/primary-categories`),
        fetch(`${API_URL}/menu/categories`),
      ]);

      if (!primaryRes.ok || !subRes.ok) {
        throw new Error('Failed to fetch categories');
      }

      const primaryData = await primaryRes.json();
      const subData = await subRes.json();

      setPrimaryCategories(primaryData);
      setSubcategories(subData);
    } catch (err) {
      Alert.alert('Error', 'Failed to load categories. Please try again.');
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

  // ============ CRUD Operations ============

  async function handleSave() {
    if (!editModal) return;

    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Name (Spanish) is required');
      return;
    }

    if (editModal.type === 'primary' && !formData.slug.trim()) {
      Alert.alert('Validation Error', 'Slug is required for primary categories');
      return;
    }

    setSaving(true);
    try {
      let endpoint: string;
      let method: string;
      let body: any;

      if (editModal.type === 'primary') {
        endpoint = editModal.mode === 'create'
          ? `${API_URL}/primary-categories`
          : `${API_URL}/primary-categories/${editModal.item?.id}`;
        method = editModal.mode === 'create' ? 'POST' : 'PATCH';
        body = {
          name: formData.name.trim(),
          nameEn: formData.nameEn.trim() || null,
          slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
          icon: formData.icon,
        };
      } else {
        endpoint = editModal.mode === 'create'
          ? `${API_URL}/menu/categories`
          : `${API_URL}/menu/categories/${editModal.item?.id}`;
        method = editModal.mode === 'create' ? 'POST' : 'PATCH';
        body = {
          name: formData.name.trim(),
          nameEn: formData.nameEn.trim() || null,
        };
      }

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
      onCategoriesUpdated?.();

      Alert.alert('Success', `Category ${editModal.mode === 'create' ? 'created' : 'updated'} successfully`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;

    setSaving(true);
    try {
      const endpoint = deleteConfirm.type === 'primary'
        ? `${API_URL}/primary-categories/${deleteConfirm.item.id}`
        : `${API_URL}/menu/categories/${deleteConfirm.item.id}`;

      const response = await fetch(endpoint, { method: 'DELETE' });

      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to delete');
      }

      setDeleteConfirm(null);
      await fetchData();
      onCategoriesUpdated?.();

      Alert.alert('Success', 'Category deleted successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete category');
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign(subcategoryId: string, primaryCategoryId: string | null) {
    try {
      const response = await fetch(`${API_URL}/menu/categories/${subcategoryId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryCategoryId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign');
      }

      await fetchData();
      onCategoriesUpdated?.();
    } catch (err) {
      Alert.alert('Error', 'Failed to assign category');
    }
  }

  // ============ Form Helpers ============

  function resetForm() {
    setFormData({
      name: '',
      nameEn: '',
      slug: '',
      icon: '📋',
      primaryCategoryId: null,
    });
  }

  function openCreateModal(type: 'primary' | 'subcategory') {
    resetForm();
    setEditModal({ type, mode: 'create' });
  }

  function openEditModal(type: 'primary' | 'subcategory', item: any) {
    setFormData({
      name: item.name || '',
      nameEn: item.nameEn || '',
      slug: item.slug || '',
      icon: item.icon || '📋',
      primaryCategoryId: item.primaryCategoryId || null,
    });
    setEditModal({ type, mode: 'edit', item });
  }

  // ============ Render Helpers ============

  function getPrimaryName(primaryId: string | null): string {
    if (!primaryId) return 'Unassigned';
    const primary = primaryCategories.find((p) => p.id === primaryId);
    return primary ? primary.name : 'Unknown';
  }

  // ============ Main Render ============

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚙️ Category Management</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'primary' && styles.tabActive]}
            onPress={() => setActiveTab('primary')}
          >
            <Text style={[styles.tabText, activeTab === 'primary' && styles.tabTextActive]}>
              Primary Categories
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'subcategory' && styles.tabActive]}
            onPress={() => setActiveTab('subcategory')}
          >
            <Text style={[styles.tabText, activeTab === 'subcategory' && styles.tabTextActive]}>
              Subcategories
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e94560" />
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {activeTab === 'primary' ? (
              // Primary Categories Tab
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Primary Categories ({primaryCategories.length})
                  </Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => openCreateModal('primary')}
                  >
                    <Text style={styles.addBtnText}>+ Add Primary</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionDescription}>
                  Primary categories are the top-level navigation (e.g., Appetizers, Entrees, Beverages).
                </Text>

                {primaryCategories.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No primary categories yet</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Create your first primary category to organize your menu
                    </Text>
                  </View>
                ) : (
                  primaryCategories.map((category) => (
                    <View key={category.id} style={styles.categoryCard}>
                      <View style={styles.categoryIcon}>
                        <Text style={styles.categoryIconText}>{category.icon || '📋'}</Text>
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.categoryNameEn}>
                          {category.nameEn || '(No English name)'}
                        </Text>
                        <Text style={styles.categorySlug}>/{category.slug}</Text>
                      </View>
                      <View style={styles.categoryActions}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => openEditModal('primary', category)}
                        >
                          <Text style={styles.actionBtnText}>✏️ Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => setDeleteConfirm({ type: 'primary', item: category })}
                        >
                          <Text style={styles.deleteBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            ) : (
              // Subcategories Tab
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Subcategories ({subcategories.length})
                  </Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => openCreateModal('subcategory')}
                  >
                    <Text style={styles.addBtnText}>+ Add Subcategory</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionDescription}>
                  Subcategories group menu items within a primary category (e.g., Beer, Wine under Beverages).
                </Text>

                {subcategories.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No subcategories yet</Text>
                  </View>
                ) : (
                  subcategories.map((subcategory) => (
                    <View key={subcategory.id} style={styles.subcategoryCard}>
                      <View style={styles.subcategoryInfo}>
                        <Text style={styles.categoryName}>{subcategory.name}</Text>
                        <Text style={styles.categoryNameEn}>
                          {subcategory.nameEn || '(No English name)'}
                        </Text>
                        
                        {/* Assignment Selector */}
                        <View style={styles.assignmentRow}>
                          <Text style={styles.assignmentLabel}>Assigned to:</Text>
                          <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.assignmentScroll}
                          >
                            <TouchableOpacity
                              style={[
                                styles.assignmentChip,
                                !subcategory.primaryCategoryId && styles.assignmentChipActive,
                              ]}
                              onPress={() => handleAssign(subcategory.id, null)}
                            >
                              <Text style={[
                                styles.assignmentChipText,
                                !subcategory.primaryCategoryId && styles.assignmentChipTextActive,
                              ]}>
                                None
                              </Text>
                            </TouchableOpacity>
                            {primaryCategories.map((pc) => (
                              <TouchableOpacity
                                key={pc.id}
                                style={[
                                  styles.assignmentChip,
                                  subcategory.primaryCategoryId === pc.id && styles.assignmentChipActive,
                                ]}
                                onPress={() => handleAssign(subcategory.id, pc.id)}
                              >
                                <Text style={[
                                  styles.assignmentChipText,
                                  subcategory.primaryCategoryId === pc.id && styles.assignmentChipTextActive,
                                ]}>
                                  {pc.icon} {pc.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                      <View style={styles.categoryActions}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => openEditModal('subcategory', subcategory)}
                        >
                          <Text style={styles.actionBtnText}>✏️ Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => setDeleteConfirm({ type: 'subcategory', item: subcategory })}
                        >
                          <Text style={styles.deleteBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        )}

        {/* Edit/Create Modal */}
        {editModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.editModal}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>
                  {editModal.mode === 'create' ? 'Create' : 'Edit'}{' '}
                  {editModal.type === 'primary' ? 'Primary Category' : 'Subcategory'}
                </Text>
                <TouchableOpacity onPress={() => setEditModal(null)}>
                  <Text style={styles.editModalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.editModalBody}>
                {/* Name (Spanish) */}
                <Text style={styles.inputLabel}>Name (Spanish) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Bebidas"
                  placeholderTextColor="#666"
                />

                {/* Name (English) */}
                <Text style={styles.inputLabel}>Name (English)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nameEn}
                  onChangeText={(text) => setFormData({ ...formData, nameEn: text })}
                  placeholder="e.g., Beverages"
                  placeholderTextColor="#666"
                />

                {/* Slug (Primary only) */}
                {editModal.type === 'primary' && (
                  <>
                    <Text style={styles.inputLabel}>Slug (URL-friendly) *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.slug}
                      onChangeText={(text) =>
                        setFormData({
                          ...formData,
                          slug: text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                        })
                      }
                      placeholder="e.g., beverages"
                      placeholderTextColor="#666"
                      autoCapitalize="none"
                    />

                    {/* Icon Picker */}
                    <Text style={styles.inputLabel}>Icon</Text>
                    <View style={styles.iconPicker}>
                      {ICON_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.iconOption,
                            formData.icon === option.value && styles.iconOptionSelected,
                          ]}
                          onPress={() => setFormData({ ...formData, icon: option.value })}
                        >
                          <Text style={styles.iconOptionText}>{option.value}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>

              <View style={styles.editModalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditModal(null)}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
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
                      {editModal.mode === 'create' ? 'Create' : 'Save Changes'}
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
              <Text style={styles.confirmTitle}>Delete Category?</Text>
              <Text style={styles.confirmMessage}>
                Are you sure you want to delete "{deleteConfirm.item.name}"?
                {deleteConfirm.type === 'primary' && (
                  '\n\nSubcategories will be unassigned but not deleted.'
                )}
                {deleteConfirm.type === 'subcategory' && (
                  '\n\nMenu items in this category will also be deleted.'
                )}
              </Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => setDeleteConfirm(null)}
                  disabled={saving}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmDeleteBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleDelete}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmDeleteText}>Delete</Text>
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
  closeBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeBtnText: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    padding: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#0f3460',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDescription: {
    color: '#666',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
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
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  emptyStateSubtext: {
    color: '#444',
    fontSize: 13,
    marginTop: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryNameEn: {
    color: '#999',
    fontSize: 13,
    marginTop: 2,
  },
  categorySlug: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
  },
  deleteBtn: {
    backgroundColor: '#333',
  },
  deleteBtnText: {
    fontSize: 16,
  },
  subcategoryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  subcategoryInfo: {
    flex: 1,
  },
  assignmentRow: {
    marginTop: 12,
  },
  assignmentLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 6,
  },
  assignmentScroll: {
    flexGrow: 0,
  },
  assignmentChip: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  assignmentChipActive: {
    backgroundColor: '#e94560',
  },
  assignmentChipText: {
    color: '#999',
    fontSize: 12,
  },
  assignmentChipTextActive: {
    color: '#fff',
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
    width: Math.min(width * 0.9, 500),
    maxHeight: height * 0.8,
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
    maxHeight: height * 0.5,
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
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: '#e94560',
    backgroundColor: '#0f3460',
  },
  iconOptionText: {
    fontSize: 20,
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
    minWidth: 120,
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

export default CategoryManagementScreen;
