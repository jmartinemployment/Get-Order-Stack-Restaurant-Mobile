import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus } from '@get-order-stack/models';
import { colors, spacing, typography, borderRadius } from './theme';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'PENDING', color: colors.textMuted, icon: '⏳' },
  confirmed: { label: 'NEW', color: colors.statusNew, icon: '🔴' },
  preparing: { label: 'COOKING', color: colors.statusCooking, icon: '🟠' },
  ready: { label: 'READY', color: colors.statusReady, icon: '🟢' },
  completed: { label: 'DONE', color: colors.statusCompleted, icon: '✅' },
  cancelled: { label: 'CANCELLED', color: colors.statusCancelled, icon: '❌' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  const sizeStyles = {
    sm: { paddingH: spacing.sm, paddingV: spacing.xs, fontSize: typography.fontSizeXs },
    md: { paddingH: spacing.md, paddingV: spacing.sm, fontSize: typography.fontSizeSm },
    lg: { paddingH: spacing.lg, paddingV: spacing.md, fontSize: typography.fontSizeMd },
  };

  const s = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.color,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: s.fontSize }]}>
        {config.icon} {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    color: colors.textLight,
    fontWeight: typography.fontWeightBold,
  },
});
