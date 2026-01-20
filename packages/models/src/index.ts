/**
 * Shared models for GetOrderStack Restaurant Mobile apps
 * These mirror the backend Prisma models
 */

// ============ Order Status ============
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type OrderType = 'pickup' | 'delivery' | 'dine-in';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// ============ Order ============
export interface Order {
  id: string;
  restaurantId: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentStatus: PaymentStatus;
  specialInstructions?: string;
  scheduledTime?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  items: OrderItem[];
  customer?: Customer;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}

// ============ Customer ============
export interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// ============ Menu ============
export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder: number;
  active: boolean;
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  cost?: number;
  image?: string;
  available: boolean;
  eightySixed: boolean;
  eightySixReason?: string;
  popular?: boolean;
  dietary: string[];
  displayOrder: number;
}

// ============ Restaurant ============
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  active: boolean;
}

// ============ API Responses ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============ WebSocket Events ============
export type WebSocketEventType = 
  | 'order:new'
  | 'order:updated'
  | 'order:cancelled'
  | 'connection:established'
  | 'connection:error';

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
}
