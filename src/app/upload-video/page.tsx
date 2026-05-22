'use client';
import dynamic from 'next/dynamic';
const VideoUpload = dynamic(() => import('@/components/VideoUpload'), { ssr: false });
export default function UploadVideoPage() { return <VideoUpload />; }
