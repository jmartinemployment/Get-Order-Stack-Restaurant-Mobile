import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export interface UpsellSuggestion {
  id: string;
  menuItemId?: string;
  name: string;
  reason: string;
  price: number;
  type: 'upsell' | 'popular' | 'chef-pick' | 'high-margin';
}

interface UpsellBarProps {
  suggestions: UpsellSuggestion[];
  onSuggestionPress: (suggestion: UpsellSuggestion) => void;
  isLoading?: boolean;
  language?: 'es' | 'en';
  mode: 'empty-cart' | 'has-items' | 'checkout';
}

/**
 * UpsellBar - AI-Powered Upsell Suggestions Component
 * 
 * Displays contextual recommendations based on cart state:
 * - Empty cart: Popular items, Chef's Picks, High-margin starters
 * - Has items: Complementary add-ons based on cart contents
 * - Checkout: Last-chance additions (desserts, drinks)
 * 
 * Usage:
 * <UpsellBar
 *   suggestions={upsellSuggestions}
 *   onSuggestionPress={(item) => handleAddUpsell(item)}
 *   mode="empty-cart"
 *   language="es"
 * />
 */
export function UpsellBar({
  suggestions,
  onSuggestionPress,
  isLoading = false,
  language = 'es',
  mode,
}: UpsellBarProps) {
  // Get header text based on mode
  const getHeaderText = () => {
    if (language === 'es') {
      switch (mode) {
        case 'empty-cart':
          return '⭐ Recomendaciones para empezar';
        case 'has-items':
          return '💡 Sugerencias para agregar';
        case 'checkout':
          return '🍰 ¿Algo más antes de cerrar?';
        default:
          return '💡 Sugerencias';
      }
    } else {
      switch (mode) {
        case 'empty-cart':
          return '⭐ Recommendations to start';
        case 'has-items':
          return '💡 Suggestions to add';
        case 'checkout':
          return '🍰 Anything else before closing?';
        default:
          return '💡 Suggestions';
      }
    }
  };

  const loadingText = language === 'es'
    ? 'Cargando sugerencias...'
    : 'Loading suggestions...';

  // Get icon for suggestion type
  const getTypeIcon = (type: UpsellSuggestion['type']) => {
    switch (type) {
      case 'chef-pick':
        return '👨‍🍳';
      case 'popular':
        return '🔥';
      case 'high-margin':
        return '💰';
      case 'upsell':
      default:
        return '✨';
    }
  };

  // Get accent color for suggestion type
  const getTypeColor = (type: UpsellSuggestion['type']) => {
    switch (type) {
      case 'chef-pick':
        return '#FF9800'; // Orange for chef picks
      case 'popular':
        return '#f44336'; // Red for hot/popular
      case 'high-margin':
        return '#4CAF50'; // Green for profit
      case 'upsell':
      default:
        return '#2196F3'; // Blue for general upsells
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>{getHeaderText()}</Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      ) : suggestions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {language === 'es' ? 'Sin sugerencias' : 'No suggestions'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              style={[
                styles.suggestionCard,
                { borderLeftColor: getTypeColor(suggestion.type) }
              ]}
              onPress={() => onSuggestionPress(suggestion)}
              activeOpacity={0.7}
            >
              <View style={styles.suggestionContent}>
                <View style={styles.suggestionHeader}>
                  <Text style={styles.typeIcon}>{getTypeIcon(suggestion.type)}</Text>
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {suggestion.name}
                  </Text>
                </View>
                <Text style={styles.suggestionReason} numberOfLines={1}>
                  {suggestion.reason}
                </Text>
                <Text style={[styles.suggestionPrice, { color: getTypeColor(suggestion.type) }]}>
                  ${suggestion.price.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgb(26, 26, 46)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  loadingContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 12,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 10,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderLeftWidth: 3,
    gap: 12,
    minWidth: 220,
    maxWidth: 280,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeIcon: {
    fontSize: 18,
  },
  suggestionName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  suggestionReason: {
    color: '#bbb',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 24,
  },
  suggestionPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
    marginLeft: 24,
  },
});

export default UpsellBar;
