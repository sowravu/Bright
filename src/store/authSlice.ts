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
  user: null,
  isAuthenticated: false,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; token?: string }>) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        try {
          // Token is securely handled by httpOnly cookies — clean up any legacy bright_token
          localStorage.removeItem('bright_token');
          localStorage.setItem('bright_user', JSON.stringify(action.payload.user));
        } catch (error) {
          console.warn('Failed to save user to localStorage:', error);
        }
      }
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('bright_token');
          localStorage.removeItem('bright_user');
        } catch (_) {}
      }
    },
    rehydrate(state) {
      if (typeof window !== 'undefined') {
        try {
          // Clean up any exposed token from localStorage
          localStorage.removeItem('bright_token');
          const userJson = localStorage.getItem('bright_user');
          if (userJson) {
            state.user = JSON.parse(userJson);
            state.isAuthenticated = true;
          }
        } catch (_) {}
      }
      state.hydrated = true;
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('bright_user', JSON.stringify(state.user));
          } catch (error) {
            console.warn('Failed to update user in localStorage:', error);
          }
        }
      }
    },
  },
});

export const { setCredentials, logout, rehydrate, updateUser } = authSlice.actions;
export default authSlice.reducer;
