import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  brand: string;
  price: number;
  specs: {
    processor?: string;
    camera?: string;
    battery?: string;
    display?: string;
    charging?: string;
    os?: string;
    refreshRate?: string;
  };
}

interface CompareState {
  items: CompareProduct[];
}

const initialState: CompareState = {
  items: [],
};

const compareSlice = createSlice({
  name: 'compare',
  initialState,
  reducers: {
    addToCompare(state, action: PayloadAction<CompareProduct>) {
      const exists = state.items.some((i) => i.id === action.payload.id);
      if (!exists && state.items.length < 4) {
        state.items.push(action.payload);
      }
    },
    removeFromCompare(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    clearCompare(state) {
      state.items = [];
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;
