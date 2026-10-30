'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './index';
import { ThemeProvider } from '../context/ThemeContext';
import { rehydrate as rehydrateAuth, logout, updateUser } from './authSlice';
import { rehydrate as rehydrateCart } from './cartSlice';
import { rehydrate as rehydrateProducts } from './productsSlice';
import { rehydrateBanner, setBanner } from './bannerSlice';

import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  ['416540660041', 'agkv8jcph46njtuvssamsedd1a08iabi.apps.googleusercontent.com'].join('-');

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    store.dispatch(rehydrateAuth());
    store.dispatch(rehydrateCart());
    store.dispatch(rehydrateProducts());
    store.dispatch(rehydrateBanner());

    // Verify session with backend httpOnly cookie
    fetch('/api/auth/profile')
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 401 || res.status === 403) {
          const state = store.getState();
          if (state.auth.isAuthenticated) {
            store.dispatch(logout());
          }
        }
        return null;
      })
      .then((user) => {
        if (user) {
          store.dispatch(updateUser(user));
        }
      })
      .catch(() => {});

    // Fetch live banner from backend if available
    fetch('/api/banner')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data) {
          store.dispatch(setBanner(data));
        }
      })
      .catch(() => {
        // Fallback to local rehydrated state
      });
  }, []);

  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </GoogleOAuthProvider>
    </Provider>
  );
};
