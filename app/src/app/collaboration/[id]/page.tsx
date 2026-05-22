'use client';
import dynamic from 'next/dynamic';
const CollaborationWorkspace = dynamic(() => import('@/components/CollaborationWorkspace'), { ssr: false });
export default function CollabPage() { return <CollaborationWorkspace />; }
