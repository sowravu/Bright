import { createSlice } from '@reduxjs/toolkit';

// Empty catalog - populated strictly from MongoDB database
const initialFallbackProducts: any[] = [];

const saveProductsToStorage = (items: any[]) => {
  if (typeof window !== 'undefined') {
    try {
      const sanitized = items.map((item) => {
        const cleanImages = (item.images || []).map((img: string) =>
          img && (typeof img === 'string') && (img.startsWith('data:') || img.length > 2000) ? '' : img
        );
        return {
          ...item,
          images: cleanImages,
        };
      });
      localStorage.setItem('bright_products', JSON.stringify(sanitized));
    } catch (error) {
      console.warn('Failed to save products to localStorage:', error);
      try {
        localStorage.removeItem('bright_products');
      } catch (_) {}
    }
  }
};

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: initialFallbackProducts,
  },
  reducers: {
    setProducts: (state, action) => {
      state.items = action.payload;
      saveProductsToStorage(state.items);
    },
    addProduct: (state, action) => {
      state.items = [action.payload, ...state.items];
      saveProductsToStorage(state.items);
    },
    updateProductStock: (state, action) => {
      const { id, stock } = action.payload;
      const prod = state.items.find((item: any) => item.id === id || item._id === id);
      if (prod) {
        prod.stock = stock;
      }
      saveProductsToStorage(state.items);
    },
    removeProduct: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((item: any) => item.id !== id && item._id !== id);
      saveProductsToStorage(state.items);
    },
    rehydrate: (state) => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('bright_products');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            // Filter out any legacy dummy items (items with simple numeric string IDs like '1', '2', '3')
            const cleanRealItems = parsed.filter((item: any) => {
              if (!item.id && !item._id) return false;
              const idStr = String(item.id || item._id);
              // Legacy dummy IDs were '1' through '23'
              if (/^\d{1,2}$/.test(idStr)) return false;
              return true;
            });
            state.items = cleanRealItems;
            saveProductsToStorage(cleanRealItems);
          } catch (_) {
            state.items = [];
            try { localStorage.removeItem('bright_products'); } catch (_) {}
          }
        }
      }
    },
  },
});

export const { setProducts, addProduct, updateProductStock, removeProduct, rehydrate } = productsSlice.actions;
export default productsSlice.reducer;
