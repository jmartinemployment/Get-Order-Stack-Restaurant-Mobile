import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface CartModifier {
  id: string;
  name: string;
  priceAdjustment: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: CartModifier[];
  specialInstructions?: string;
}

export type OrderType = 'pickup' | 'delivery' | 'dine-in';

export interface CustomerInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface CartState {
  items: CartItem[];
  orderType: OrderType;
  customerInfo: CustomerInfo;
  specialInstructions?: string;
  tableId?: string;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_ORDER_TYPE'; payload: OrderType }
  | { type: 'SET_CUSTOMER_INFO'; payload: CustomerInfo }
  | { type: 'SET_SPECIAL_INSTRUCTIONS'; payload: string }
  | { type: 'SET_TABLE_ID'; payload: string }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  orderType: 'pickup',
  customerInfo: {},
  specialInstructions: undefined,
  tableId: undefined,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.menuItemId === action.payload.menuItemId &&
          JSON.stringify(item.modifiers) === JSON.stringify(action.payload.modifiers) &&
          item.specialInstructions === action.payload.specialInstructions
      );

      if (existingIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + action.payload.quantity,
        };
        return { ...state, items: updatedItems };
      }

      return { ...state, items: [...state.items, action.payload] };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.id !== action.payload.id),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }

    case 'SET_ORDER_TYPE':
      return { ...state, orderType: action.payload };

    case 'SET_CUSTOMER_INFO':
      return { ...state, customerInfo: action.payload };

    case 'SET_SPECIAL_INSTRUCTIONS':
      return { ...state, specialInstructions: action.payload };

    case 'SET_TABLE_ID':
      return { ...state, tableId: action.payload };

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

interface CartContextValue {
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setOrderType: (type: OrderType) => void;
  setCustomerInfo: (info: CustomerInfo) => void;
  setSpecialInstructions: (instructions: string) => void;
  setTableId: (tableId: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const subtotal = state.items.reduce((total, item) => {
    const modifiersTotal = item.modifiers.reduce((m, mod) => m + mod.priceAdjustment, 0);
    return total + (item.price + modifiersTotal) * item.quantity;
  }, 0);

  const itemCount = state.items.reduce((count, item) => count + item.quantity, 0);

  const value: CartContextValue = {
    state,
    addItem: (item) => dispatch({ type: 'ADD_ITEM', payload: item }),
    removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
    updateQuantity: (id, quantity) =>
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }),
    setOrderType: (type) => dispatch({ type: 'SET_ORDER_TYPE', payload: type }),
    setCustomerInfo: (info) => dispatch({ type: 'SET_CUSTOMER_INFO', payload: info }),
    setSpecialInstructions: (instructions) =>
      dispatch({ type: 'SET_SPECIAL_INSTRUCTIONS', payload: instructions }),
    setTableId: (tableId) => dispatch({ type: 'SET_TABLE_ID', payload: tableId }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    subtotal,
    itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
