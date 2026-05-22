'use client';
import dynamic from 'next/dynamic';
const RemixFlow = dynamic(() => import('@/components/RemixFlow'), { ssr: false });
export default function RemixPage() { return <RemixFlow />; }
