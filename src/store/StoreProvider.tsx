'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './index';
import { ThemeProvider } from '../context/ThemeContext';
import { rehydrate as rehydrateAuth } from './authSlice';
import { rehydrate as rehydrateCart } from './cartSlice';
import { rehydrate as rehydrateProducts } from './productsSlice';
import { rehydrateBanner, setBanner } from './bannerSlice';

import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1000000000000-dummygoogleclientid.apps.googleusercontent.com';

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    store.dispatch(rehydrateAuth());
    store.dispatch(rehydrateCart());
    store.dispatch(rehydrateProducts());
    store.dispatch(rehydrateBanner());

    // Fetch live banner from backend if available
    fetch('http://localhost:5000/api/banner')
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
