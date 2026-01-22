import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

export interface PrimaryCategory {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  icon?: string | null;
}

interface PrimaryCategoryNavProps {
  categories: PrimaryCategory[];
  selectedId: string | null;
  onSelect: (category: PrimaryCategory) => void;
  language?: 'es' | 'en';
}

/**
 * PrimaryCategoryNav - Navigation Pills Component
 * 
 * A sticky navigation bar that displays primary category pills.
 * - Wraps to multiple rows on smaller devices (flexWrap)
 * - Single row with horizontal scroll on larger tablets
 * - No external library required
 * 
 * Usage:
 * <PrimaryCategoryNav
 *   categories={primaryCategories}
 *   selectedId={selectedPrimaryId}
 *   onSelect={(cat) => handlePrimarySelect(cat)}
 *   language="en"
 * />
 */
export function PrimaryCategoryNav({
  categories,
  selectedId,
  onSelect,
  language = 'es',
}: PrimaryCategoryNavProps) {
  const { width } = useWindowDimensions();
  
  // Determine if we should wrap (smaller devices) or scroll (larger tablets)
  // Threshold: 600px - typical small tablet portrait width
  const shouldWrap = width < 600;

  const getDisplayName = (cat: PrimaryCategory) => {
    if (language === 'en' && cat.nameEn) {
      return cat.nameEn;
    }
    return cat.name;
  };

  // Optional: Map slug to emoji icon
  const getIcon = (cat: PrimaryCategory) => {
    if (cat.icon) return cat.icon;
    
    // Default icons by slug
    const iconMap: Record<string, string> = {
      appetizers: '🥗',
      entrees: '🍽️',
      beverages: '🥤',
      desserts: '🍰',
      sides: '🥕',
    };
    return iconMap[cat.slug] || '📋';
  };

  return (
    <View style={[
      styles.container,
      shouldWrap ? styles.containerWrap : styles.containerScroll
    ]}>
      {categories.map((cat) => {
        const isSelected = cat.id === selectedId;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.pill,
              isSelected && styles.pillSelected,
              shouldWrap && styles.pillWrap,
            ]}
            onPress={() => onSelect(cat)}
            activeOpacity={0.7}
          >
            <Text style={styles.pillIcon}>{getIcon(cat)}</Text>
            <Text
              style={[
                styles.pillText,
                isSelected && styles.pillTextSelected,
              ]}
              numberOfLines={1}
            >
              {getDisplayName(cat)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f3460',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  
  // Wrap mode for smaller devices
  containerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  
  // Scroll mode for larger tablets (single row)
  containerScroll: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: 8,
  },
  
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#16213e',
    gap: 6,
  },
  
  pillWrap: {
    // Ensure pills have minimum width when wrapping
    minWidth: 100,
    justifyContent: 'center',
  },
  
  pillSelected: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  
  pillIcon: {
    fontSize: 16,
  },
  
  pillText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  
  pillTextSelected: {
    color: '#fff',
  },
});

export default PrimaryCategoryNav;
