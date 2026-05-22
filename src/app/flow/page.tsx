'use client';
import dynamic from 'next/dynamic';
const FlowDashboardPage = dynamic(() => import('@/components/FlowDashboard').then(m => ({ default: m.FlowDashboard })), { ssr: false });
export default function FlowPage() { return <FlowDashboardPage />; }
