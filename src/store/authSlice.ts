import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'EMPLOYEE' | 'ADMIN';
  phone?: string;
  avatar?: string;
  googleId?: string;
  hasPassword?: boolean;
  addresses?: any[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  /**
   * False until the persisted session has been read back from localStorage.
   * Route guards must wait for this before deciding to redirect, otherwise
   * they run on the first render (when state is still empty) and wrongly
   * reject an authenticated user.
   */
  hydrated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('bright_token', action.payload.token);
        localStorage.setItem('bright_user', JSON.stringify(action.payload.user));
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bright_token');
        localStorage.removeItem('bright_user');
      }
    },
    rehydrate(state) {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('bright_token');
        const userJson = localStorage.getItem('bright_user');
        if (token && userJson) {
          try {
            state.token = token;
            state.user = JSON.parse(userJson);
            state.isAuthenticated = true;
          } catch (_) {
            // parsing error
          }
        }
      }
      state.hydrated = true;
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== 'undefined') {
          localStorage.setItem('bright_user', JSON.stringify(state.user));
        }
      }
    },
  },
});

export const { setCredentials, logout, rehydrate, updateUser } = authSlice.actions;
export default authSlice.reducer;
