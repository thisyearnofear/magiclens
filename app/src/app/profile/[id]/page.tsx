'use client';
import dynamic from 'next/dynamic';
const UserProfile = dynamic(() => import('@/components/UserProfile'), { ssr: false });
export default function UserProfilePage() { return <UserProfile />; }
