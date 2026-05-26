'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
const RemixFlow = dynamic(() => import('@/components/RemixFlow'), { ssr: false });
export default function RemixPage() {
  return (
    <Suspense fallback={null}>
      <RemixFlow />
    </Suspense>
  );
}
