'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import styles from './BrightLoader.module.css';

interface BrightLoaderProps {
  message?: string;
}

export default function BrightLoader({ message = 'Signing you in...' }: BrightLoaderProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.logoRing}>
          <div className={styles.logoPulse} />
          <Sparkles className={styles.logoIcon} size={30} />
        </div>
        <h2 className={styles.wordmark}>Bright</h2>
        <p className={styles.tagline}>Bright Choices. Smarter Phones.</p>
        <div className={styles.dotsRow}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
