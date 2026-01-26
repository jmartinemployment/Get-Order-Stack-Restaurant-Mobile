import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';

export interface ChefPick {
  menuItemId: string;
  menuItemName: string;
  type: 'chef-pick' | 'push-today' | 'special';
  note?: string;
  active: boolean;
  createdAt: Date;
}

interface ChefInputPanelProps {
  visible: boolean;
  onClose: () => void;
  menuItems: { id: string; name: string; price: number }[];
  chefPicks: ChefPick[];
  onSaveChefPicks: (picks: ChefPick[]) => void;
  language?: 'es' | 'en';
}

/**
 * ChefInputPanel - Kitchen/Manager Input for Daily Specials
 * 
 * Allows chef or manager to:
 * - Mark items as "Chef's Pick" (signature, high quality today)
 * - Mark items as "Push Today" (overstock, need to move)
 * - Add custom notes visible to staff
 * 
 * Similar to the whiteboard/86 board concept in restaurant kitchens.
 */
export function ChefInputPanel({
  visible,
  onClose,
  menuItems,
  chefPicks,
  onSaveChefPicks,
  language = 'es',
}: ChefInputPanelProps) {
  const [localPicks, setLocalPicks] = useState<ChefPick[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);
  const [pickType, setPickType] = useState<'chef-pick' | 'push-today' | 'special'>('chef-pick');
  const [pickNote, setPickNote] = useState('');

  useEffect(() => {
    setLocalPicks(chefPicks);
  }, [chefPicks, visible]);

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPick = () => {
    if (!selectedItem) return;

    const newPick: ChefPick = {
      menuItemId: selectedItem.id,
      menuItemName: selectedItem.name,
      type: pickType,
      note: pickNote.trim() || undefined,
      active: true,
      createdAt: new Date(),
    };

    // Remove existing pick for same item if exists
    const filtered = localPicks.filter(p => p.menuItemId !== selectedItem.id);
    setLocalPicks([...filtered, newPick]);

    // Reset form
    setSelectedItem(null);
    setPickNote('');
    setSearchQuery('');
  };

  const handleRemovePick = (menuItemId: string) => {
    setLocalPicks(localPicks.filter(p => p.menuItemId !== menuItemId));
  };

  const handleTogglePick = (menuItemId: string) => {
    setLocalPicks(localPicks.map(p => 
      p.menuItemId === menuItemId ? { ...p, active: !p.active } : p
    ));
  };

  const handleSave = () => {
    onSaveChefPicks(localPicks);
    onClose();
  };

  const getTypeLabel = (type: ChefPick['type']) => {
    if (language === 'es') {
      switch (type) {
        case 'chef-pick': return '👨‍🍳 Recomendación del Chef';
        case 'push-today': return '📢 Promover Hoy';
        case 'special': return '⭐ Especial del Día';
      }
    } else {
      switch (type) {
        case 'chef-pick': return "👨‍🍳 Chef's Pick";
        case 'push-today': return '📢 Push Today';
        case 'special': return '⭐ Daily Special';
      }
    }
  };

  const getTypeIcon = (type: ChefPick['type']) => {
    switch (type) {
      case 'chef-pick': return '👨‍🍳';
      case 'push-today': return '📢';
      case 'special': return '⭐';
    }
  };

  const getTypeColor = (type: ChefPick['type']) => {
    switch (type) {
      case 'chef-pick': return '#FF9800';
      case 'push-today': return '#2196F3';
      case 'special': return '#9C27B0';
    }
  };

  const texts = {
    title: language === 'es' ? '👨‍🍳 Panel del Chef' : "👨‍🍳 Chef's Panel",
    subtitle: language === 'es' 
      ? 'Marca los platos que quieres destacar hoy' 
      : 'Mark dishes you want to highlight today',
    searchPlaceholder: language === 'es' ? 'Buscar plato...' : 'Search dish...',
    selectType: language === 'es' ? 'Tipo de recomendación:' : 'Recommendation type:',
    addNote: language === 'es' ? 'Nota para el staff (opcional):' : 'Note for staff (optional):',
    notePlaceholder: language === 'es' 
      ? 'ej. "Llegó fresco hoy", "Tenemos exceso"' 
      : 'e.g. "Fresh catch today", "Overstock"',
    addButton: language === 'es' ? 'Agregar' : 'Add',
    currentPicks: language === 'es' ? 'Recomendaciones Activas' : 'Active Recommendations',
    noPicks: language === 'es' ? 'Sin recomendaciones activas' : 'No active recommendations',
    save: language === 'es' ? 'Guardar Cambios' : 'Save Changes',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{texts.title}</Text>
              <Text style={styles.subtitle}>{texts.subtitle}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Add New Pick Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'es' ? '➕ Agregar Recomendación' : '➕ Add Recommendation'}
              </Text>
              
              {/* Item Search */}
              <TextInput
                style={styles.searchInput}
                placeholder={texts.searchPlaceholder}
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {/* Search Results */}
              {searchQuery.length > 0 && (
                <View style={styles.searchResults}>
                  {filteredItems.slice(0, 5).map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.searchResultItem,
                        selectedItem?.id === item.id && styles.searchResultItemSelected,
                      ]}
                      onPress={() => setSelectedItem(item)}
                    >
                      <Text style={styles.searchResultText}>{item.name}</Text>
                      <Text style={styles.searchResultPrice}>${item.price.toFixed(2)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Selected Item */}
              {selectedItem && (
                <View style={styles.selectedItemBox}>
                  <Text style={styles.selectedItemLabel}>
                    {language === 'es' ? 'Seleccionado:' : 'Selected:'}
                  </Text>
                  <Text style={styles.selectedItemName}>{selectedItem.name}</Text>
                </View>
              )}

              {/* Pick Type Selection */}
              <Text style={styles.fieldLabel}>{texts.selectType}</Text>
              <View style={styles.typeButtons}>
                {(['chef-pick', 'push-today', 'special'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      pickType === type && { backgroundColor: getTypeColor(type) },
                    ]}
                    onPress={() => setPickType(type)}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      pickType === type && styles.typeButtonTextActive,
                    ]}>
                      {getTypeIcon(type)} {type === 'chef-pick' ? 'Chef' : type === 'push-today' ? 'Push' : 'Special'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Note Input */}
              <Text style={styles.fieldLabel}>{texts.addNote}</Text>
              <TextInput
                style={styles.noteInput}
                placeholder={texts.notePlaceholder}
                placeholderTextColor="#666"
                value={pickNote}
                onChangeText={setPickNote}
                multiline
              />

              {/* Add Button */}
              <TouchableOpacity
                style={[styles.addButton, !selectedItem && styles.addButtonDisabled]}
                onPress={handleAddPick}
                disabled={!selectedItem}
              >
                <Text style={styles.addButtonText}>{texts.addButton}</Text>
              </TouchableOpacity>
            </View>

            {/* Current Picks */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.currentPicks}</Text>
              
              {localPicks.length === 0 ? (
                <Text style={styles.noPicksText}>{texts.noPicks}</Text>
              ) : (
                localPicks.map(pick => (
                  <View key={pick.menuItemId} style={styles.pickItem}>
                    <View style={[styles.pickTypeIndicator, { backgroundColor: getTypeColor(pick.type) }]} />
                    <View style={styles.pickContent}>
                      <View style={styles.pickHeader}>
                        <Text style={styles.pickName}>{pick.menuItemName}</Text>
                        <Text style={[styles.pickType, { color: getTypeColor(pick.type) }]}>
                          {getTypeLabel(pick.type)}
                        </Text>
                      </View>
                      {pick.note && (
                        <Text style={styles.pickNote}>"{pick.note}"</Text>
                      )}
                    </View>
                    <View style={styles.pickActions}>
                      <Switch
                        value={pick.active}
                        onValueChange={() => handleTogglePick(pick.menuItemId)}
                        trackColor={{ false: '#333', true: getTypeColor(pick.type) }}
                      />
                      <TouchableOpacity onPress={() => handleRemovePick(pick.menuItemId)}>
                        <Text style={styles.removeBtn}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{texts.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{texts.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '70%',
    maxHeight: '85%',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
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
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  searchResults: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    marginBottom: 12,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  searchResultItemSelected: {
    backgroundColor: '#0f3460',
  },
  searchResultText: {
    color: '#fff',
    fontSize: 14,
  },
  searchResultPrice: {
    color: '#e94560',
    fontSize: 14,
  },
  selectedItemBox: {
    backgroundColor: '#0f3460',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedItemLabel: {
    color: '#999',
    fontSize: 12,
  },
  selectedItemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fieldLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
    marginTop: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#16213e',
    alignItems: 'center',
  },
  typeButtonText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  noteInput: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonDisabled: {
    backgroundColor: '#333',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noPicksText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  pickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  pickTypeIndicator: {
    width: 4,
    alignSelf: 'stretch',
  },
  pickContent: {
    flex: 1,
    padding: 12,
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pickType: {
    fontSize: 11,
  },
  pickNote: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  pickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 12,
  },
  removeBtn: {
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#e94560',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChefInputPanel;
