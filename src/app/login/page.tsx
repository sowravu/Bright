'use client';

import React, { Suspense } from 'react';
import { AuthPortal } from '@/components/AuthPortal';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '100px 0', textAlign: 'center', color: 'var(--foreground-secondary)' }}>
          Loading authentication portal...
        </div>
      }
    >
      <AuthPortal initialRegister={false} />
    </Suspense>
  );
}
