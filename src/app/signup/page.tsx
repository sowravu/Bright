'use client';

import React, { Suspense } from 'react';
import { AuthPortal } from '@/components/AuthPortal';

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '100px 0', textAlign: 'center', color: 'var(--foreground-secondary)' }}>
          Loading registration portal...
        </div>
      }
    >
      <AuthPortal initialRegister />
    </Suspense>
  );
}
