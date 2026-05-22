'use client';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
const QuickCollaboration = dynamic(() => import('@/components/QuickCollaboration'), { ssr: false });
export default function AIEnhancePage() {
  const { videoId } = useParams<{ videoId: string }>();
  return <QuickCollaboration videoId={videoId || ''} />;
}
