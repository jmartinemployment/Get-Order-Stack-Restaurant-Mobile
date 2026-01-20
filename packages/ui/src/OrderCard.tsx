import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order, OrderItem } from '@get-order-stack/models';
import { colors, spacing, typography, borderRadius } from './theme';
import { StatusBadge } from './StatusBadge';

interface OrderCardProps {
  order: Order;
  elapsedMinutes: number;
  onBump?: () => void;
  bumpLabel?: string;
  showBumpButton?: boolean;
}

const ORDER_TYPE_COLORS: Record<string, string> = {
  pickup: colors.orderPickup,
  delivery: colors.orderDelivery,
  'dine-in': colors.orderDineIn,
};

export function OrderCard({
  order,
  elapsedMinutes,
  onBump,
  bumpLabel = 'BUMP',
  showBumpButton = true,
}: OrderCardProps) {
  const isUrgent = elapsedMinutes > 10;
  const customerName = order.customer
    ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
    : undefined;

  return (
    <View style={[styles.card, isUrgent && styles.cardUrgent]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          {customerName && (
            <Text style={styles.customerName}>{customerName}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.orderTypeBadge,
              { backgroundColor: ORDER_TYPE_COLORS[order.orderType] || colors.info },
            ]}
          >
            <Text style={styles.orderTypeText}>
              {order.orderType.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.elapsed, isUrgent && styles.elapsedUrgent]}>
            {elapsedMinutes}m
          </Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.items}>
        {order.items.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
      </View>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            ⚠️ {order.specialInstructions}
          </Text>
        </View>
      )}

      {/* Bump Button */}
      {showBumpButton && onBump && (
        <TouchableOpacity
          style={styles.bumpButton}
          onPress={onBump}
          activeOpacity={0.7}
        >
          <Text style={styles.bumpButtonText}>{bumpLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemQuantity}>{item.quantity}x</Text>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.menuItemName}</Text>
        {item.specialInstructions && (
          <Text style={styles.itemInstructions}>
            ⚠️ {item.specialInstructions}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardUrgent: {
    borderWidth: 3,
    borderColor: colors.error,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.cardHeader,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderNumber: {
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  customerName: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  orderTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  orderTypeText: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightBold,
    color: colors.textLight,
  },
  elapsed: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  elapsedUrgent: {
    color: colors.error,
  },
  items: {
    padding: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  itemQuantity: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    width: 40,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSizeMd,
    color: colors.textPrimary,
  },
  itemInstructions: {
    fontSize: typography.fontSizeSm,
    color: colors.error,
    fontWeight: typography.fontWeightSemibold,
    marginTop: 2,
  },
  instructions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  instructionsText: {
    fontSize: typography.fontSizeSm,
    color: colors.error,
    fontWeight: typography.fontWeightSemibold,
  },
  bumpButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  bumpButtonText: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    color: colors.textLight,
  },
});
