'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ComparePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/products');
  }, [router]);

  return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <p>Redirecting to products catalog...</p>
    </div>
  );
}
