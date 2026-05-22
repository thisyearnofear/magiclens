'use client';
import dynamic from 'next/dynamic';
const AssetLibrary = dynamic(() => import('@/components/AssetLibrary'), { ssr: false });
export default function AssetsPage() { return <AssetLibrary />; }
