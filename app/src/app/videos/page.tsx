'use client';
import dynamic from 'next/dynamic';
const VideoGallery = dynamic(() => import('@/components/VideoGallery'), { ssr: false });
export default function VideosPage() { return <VideoGallery />; }
