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
    localStorage.setItem('bright_cart', JSON.stringify(items));
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const { productId, variantId, quantity } = action.payload;
      const existing = state.items.find(
        (i) => i.productId === productId && i.variantId === variantId
      );

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push(action.payload);
      }
      saveCartToStorage(state.items);
    },
    updateQuantity(state, action: PayloadAction<{ productId: string; variantId?: string; quantity: number }>) {
      const { productId, variantId, quantity } = action.payload;
      const item = state.items.find(
        (i) => i.productId === productId && i.variantId === variantId
      );
      if (item) {
        item.quantity = quantity;
      }
      saveCartToStorage(state.items);
    },
    removeFromCart(state, action: PayloadAction<{ productId: string; variantId?: string }>) {
      const { productId, variantId } = action.payload;
      state.items = state.items.filter(
        (i) => !(i.productId === productId && i.variantId === variantId)
      );
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
