import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id?: string;
  productId: string;
  name: string;
  image: string;
  brand: string;
  ram: string;
  storage: string;
  color: string;
  price: number;
  quantity: number;
  variantId?: string;
}

interface Coupon {
  code: string;
  discount: number;
  isPercent: boolean;
}

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  shipping: number;
}

const initialState: CartState = {
  items: [],
  coupon: null,
  shipping: 150,
};

const saveCartToStorage = (items: CartItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      // Strip large base64 data URLs to prevent exceeding localStorage quota (5MB)
      const sanitizedItems = items.map((item) => {
        if (item.image && (item.image.startsWith('data:') || item.image.length > 2000)) {
          return { ...item, image: '' };
        }
        return item;
      });
      localStorage.setItem('bright_cart', JSON.stringify(sanitizedItems));
    } catch (error) {
      console.warn('Failed to save cart to localStorage (QuotaExceededError):', error);
      try {
        const minimalItems = items.map((item) => ({ ...item, image: '' }));
        localStorage.setItem('bright_cart', JSON.stringify(minimalItems));
      } catch (_) {
        // Storage full or restricted; safely swallow error to prevent app crash
      }
    }
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const { productId, variantId, color, ram, storage, quantity } = action.payload;
      const existing = state.items.find((i) => {
        if (i.productId !== productId) return false;
        if (variantId && i.variantId) return i.variantId === variantId;
        const sameColor = (i.color || '').trim().toLowerCase() === (color || '').trim().toLowerCase();
        const sameRam = (i.ram || '').trim().toLowerCase() === (ram || '').trim().toLowerCase();
        const sameStorage = (i.storage || '').trim().toLowerCase() === (storage || '').trim().toLowerCase();
        return sameColor && sameRam && sameStorage;
      });

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push(action.payload);
      }
      saveCartToStorage(state.items);
    },
    updateQuantity(state, action: PayloadAction<{ productId: string; variantId?: string; color?: string; quantity: number }>) {
      const { productId, variantId, color, quantity } = action.payload;
      const item = state.items.find((i) => {
        if (i.productId !== productId) return false;
        if (variantId && i.variantId) return i.variantId === variantId;
        if (color && i.color) return i.color.trim().toLowerCase() === color.trim().toLowerCase();
        return true;
      });
      if (item) {
        item.quantity = quantity;
      }
      saveCartToStorage(state.items);
    },
    removeFromCart(state, action: PayloadAction<{ productId: string; variantId?: string; color?: string }>) {
      const { productId, variantId, color } = action.payload;
      state.items = state.items.filter((i) => {
        if (i.productId !== productId) return true;
        if (variantId && i.variantId) return i.variantId !== variantId;
        if (color && i.color) return i.color.trim().toLowerCase() !== color.trim().toLowerCase();
        return false;
      });
      saveCartToStorage(state.items);
    },
    applyCoupon(state, action: PayloadAction<Coupon | null>) {
      state.coupon = action.payload;
    },
    clearCart(state) {
      state.items = [];
      state.coupon = null;
      saveCartToStorage([]);
    },
    setCartItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      state.shipping = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0) > 5000 ? 0 : 150;
      saveCartToStorage(state.items);
    },
    rehydrate(state) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('bright_cart');
        if (saved) {
          try {
            state.items = JSON.parse(saved);
            state.shipping = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0) > 5000 ? 0 : 150;
          } catch (_) {}
        }
      }
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, applyCoupon, clearCart, setCartItems, rehydrate } = cartSlice.actions;
export default cartSlice.reducer;
