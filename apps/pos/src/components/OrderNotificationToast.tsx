import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useOrderNotifications } from '../contexts/OrderNotificationContext';

export function OrderNotificationToast() {
  const { notifications, dismissNotification, socketConnected } = useOrderNotifications();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get the most recent notification
  const latestNotification = notifications[0];

  useEffect(() => {
    if (latestNotification) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          dismissNotification(latestNotification.id);
        });
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [latestNotification?.id]);

  if (!latestNotification) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      default:
        return '#FF9800';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'ready':
        return '🔔';
      case 'completed':
        return '✅';
      default:
        return '📋';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim },
        { borderLeftColor: getStatusColor(latestNotification.status) },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={() => dismissNotification(latestNotification.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.emoji}>{getStatusEmoji(latestNotification.status)}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {latestNotification.status === 'ready' ? 'ORDER READY!' : 'Order Update'}
          </Text>
          <Text style={styles.message}>{latestNotification.message}</Text>
          <Text style={styles.time}>
            {latestNotification.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => dismissNotification(latestNotification.id)}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {notifications.length > 1 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+{notifications.length - 1}</Text>
        </View>
      )}
    </Animated.View>
  );
}

// Connection indicator component for the header
export function SocketConnectionIndicator() {
  const { socketConnected } = useOrderNotifications();

  return (
    <View style={styles.connectionContainer}>
      <View
        style={[
          styles.connectionDot,
          socketConnected ? styles.connectionDotOnline : styles.connectionDotOffline,
        ]}
      />
      <Text style={styles.connectionText}>
        {socketConnected ? 'Live' : 'Offline'}
      </Text>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: Math.min(400, width - 40),
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  dismissButton: {
    padding: 8,
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 18,
    color: '#888',
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#e94560',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  connectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionDotOnline: {
    backgroundColor: '#4CAF50',
  },
  connectionDotOffline: {
    backgroundColor: '#f44336',
  },
  connectionText: {
    fontSize: 12,
    color: '#888',
  },
});
