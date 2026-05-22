'use client';
import dynamic from 'next/dynamic';
const PublicRemix = dynamic(() => import('@/components/PublicRemix'));
export default function PublicRemixPage() { return <PublicRemix />; }
