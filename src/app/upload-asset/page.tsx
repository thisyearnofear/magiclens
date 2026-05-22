'use client';
import dynamic from 'next/dynamic';
const AssetUpload = dynamic(() => import('@/components/AssetUpload'), { ssr: false });
export default function UploadAssetPage() { return <AssetUpload />; }
