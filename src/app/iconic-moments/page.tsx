'use client';
import dynamic from 'next/dynamic';

const IconicMomentsGallery = dynamic(() => import('@/components/IconicMomentsGallery').then((m) => ({ default: m.IconicMomentsGallery })), { ssr: false });

export default function IconicMomentsPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <IconicMomentsGallery />
      </div>
    </main>
  );
}
