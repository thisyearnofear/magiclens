import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/auth/AuthProvider';
import { userServiceGetUserProfile, videoServiceGetVideos, assetServiceGetAssets, videoServiceDeleteVideo, videoServiceUpdateVideo, UserProfile, Video, ArtistAsset } from '@/lib/sdk';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { GuestBanner } from '@/components/dashboard/GuestBanner';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { GettingStartedChecklist } from '@/components/dashboard/GettingStartedChecklist';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { VideoGrid } from '@/components/dashboard/VideoGrid';
import { AssetGrid } from '@/components/dashboard/AssetGrid';
import { EditVideoDialog } from '@/components/dashboard/EditVideoDialog';
import { DeleteVideoDialog } from '@/components/dashboard/DeleteVideoDialog';
import { EnvironmentalGalleryDialog } from '@/components/dashboard/EnvironmentalGalleryDialog';
import { EventCard } from '@/components/dashboard/EventCard';
import { StatsBar } from '@/components/StatsBar';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useWeb3Profile } from '@/hooks/useWeb3Profile';
import { Web3Identities } from '@/components/Web3Identities';

export default function Dashboard() {
  const router = useRouter();
  const { flowAddress: user, evmAddress, disconnect: disconnectWallet, isGuest } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile|null>(null);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [recentAssets, setRecentAssets] = useState<ArtistAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<{id:string;title:string}|null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState<{id:string;title:string}|null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const { permission, subscribed, requestPermission } = useNotifications();

  // Resolve Web3 identity (ENS / Lens / Farcaster) from wallet address
  // Use EVM address first (RainbowKit), fall back to Flow address
  const walletAddress = evmAddress || user || null;
  const web3 = useWeb3Profile(walletAddress);

  const handleEdit=(id:string,title:string)=>{setEditingVideo({id,title});setEditOpen(true);};
  const handleDelete=(id:string,title:string)=>{setDeletingVideo({id,title});setDeleteOpen(true);};
  const handleUpdate=async(id:string,title:string)=>{
    try{await videoServiceUpdateVideo({body:{video_id:id,title}});setRecentVideos(p=>p.map(v=>v.id===id?{...v,title}:v));setEditOpen(false);setEditingVideo(null);}
    catch(e){console.error('Failed to update video:',e);toast.error('Failed to update video',{description:'Please try again in a moment.'});}
  };
  const confirmDelete=async()=>{
    if(!deletingVideo)return;setIsDeleting(true);
    try{await videoServiceDeleteVideo({body:{video_id:deletingVideo.id}});setRecentVideos(p=>p.filter(v=>v.id!==deletingVideo.id));setDeleteOpen(false);setDeletingVideo(null);}
    catch(e){console.error('Failed to delete video:',e);toast.error('Failed to delete video',{description:'Please try again in a moment.'});}
    finally{setIsDeleting(false);}
  };

  useEffect(()=>{(async()=>{
    if(isGuest){setProfile({id:'guest',user_id:'guest',username:'Guest User',user_type:'both',bio:'Exploring MagicLens as a guest',created_at:new Date().toISOString()}as UserProfile);setRecentVideos([]);setRecentAssets([]);setLoading(false);return;}
    try{
      const pr=await userServiceGetUserProfile({});
      if(pr.data)setProfile(pr.data);
      else {
        // Use the best available wallet address for the fallback display
        const fallbackAddr = walletAddress || user || null;
        const fallbackName = fallbackAddr ? `${fallbackAddr.slice(0, 6)}...${fallbackAddr.slice(-4)}` : 'Guest';
        setProfile({id:fallbackAddr||'unknown',user_id:fallbackAddr||'unknown',username:fallbackName,user_type:'both',bio:'Welcome to MagicLens! Update your profile to get started.',created_at:new Date().toISOString()}as UserProfile);
      }
      try{const v=await videoServiceGetVideos({body:{limit:6,offset:0}});if(v.data)setRecentVideos(v.data);}catch{setRecentVideos([]);}
      try{const a=await assetServiceGetAssets({body:{limit:6,offset:0}});if(a.data)setRecentAssets(a.data);}catch{setRecentAssets([]);}
    }catch(e){console.error('Dashboard loading error:',e);setError('Unable to load dashboard data. Some features may be limited.');}
    finally{setLoading(false);}
  })();},[router,isGuest]);

  if(loading)return<div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-indigo-950 flex items-center justify-center"><div className="text-white text-xl">Loading your dashboard...</div></div>;
  if(!profile)return null;

  const isNewUser=!isGuest&&profile.bio==='Welcome to MagicLens! Update your profile to get started.';
  const goHome=()=>{router.push('/');};

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Stadium background image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=80&auto=format)',
        }}
      />
      {/* Dark overlay + gradient */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-br from-purple-950/90 via-blue-950/85 to-indigo-950/90" />

      {/* Gooey animated blobs */}
      <svg className="fixed inset-0 z-[2] w-full h-full pointer-events-none opacity-30" aria-hidden="true">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -20" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
        <g filter="url(#gooey)">
          <circle
            cx="15%" cy="20%" r="120"
            fill="rgba(168,85,247,0.5)"
            style={{ animation: 'gooey-blob-1 12s ease-in-out infinite' }}
          />
          <circle
            cx="80%" cy="25%" r="100"
            fill="rgba(59,130,246,0.4)"
            style={{ animation: 'gooey-blob-2 15s ease-in-out infinite 2s' }}
          />
          <circle
            cx="50%" cy="70%" r="90"
            fill="rgba(250,204,21,0.25)"
            style={{ animation: 'gooey-blob-3 18s ease-in-out infinite 4s' }}
          />
        </g>
      </svg>

      {/* Content layer */}
      <div className="relative z-[3]">
      <DashboardHeader isGuest={isGuest} profile={profile} onDisconnect={disconnectWallet} onNavigate={(path:string)=>router.push(path)} />
      <div className="container mx-auto px-4 py-8">
        <EventCard />
        {typeof Notification !== 'undefined' && (
          <div className="mb-6">
            <button
              onClick={requestPermission}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                subscribed
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30'
                  : 'bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              🔔 {subscribed ? 'Notifications on ✓' : 'Get notified when leaderboard resets'}
            </button>
          </div>
        )}
        <StatsBar />
        {isGuest&&<GuestBanner onConnect={goHome} />}
        {/* Web3 identity bar — shows ENS/Lens/Farcaster when user has a web3 identity */}
        {!isGuest && !web3.loading && (web3.displayName || web3.avatarUrl) && (
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <Web3Identities web3={web3} walletAddress={walletAddress} layout="compact" />
            {profile.bio === 'Welcome to MagicLens! Update your profile to get started.' && (
              <span className="text-gray-400 text-xs">
                We found your Web3 identity!{' '}
                <a href="/profile" className="text-yellow-400 hover:text-yellow-300 underline">
                  Create a MagicLens profile
                </a>{' '}
                to add videos and assets.
              </span>
            )}
          </div>
        )}

        <WelcomeSection isGuest={isGuest} profile={profile} />
      {isNewUser&&<GettingStartedChecklist onNavigate={(p:string)=>router.push(p)} />}
      <QuickActions isGuest={isGuest} userType={profile.user_type} onNavigate={(p:string)=>router.push(p)} onShowGallery={()=>setShowGallery(true)} />
        {error&&<div className="mb-8 p-4 rounded-lg bg-red-500/20 border border-red-500/30"><div className="flex items-start space-x-3"><div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5"><span className="text-white text-xs">!</span></div><div><h4 className="text-white font-medium">Connection Issue</h4><p className="text-gray-300 text-sm mt-1">{error}</p><Button variant="outline" size="sm" className="mt-2 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={()=>window.location.reload()}>Retry</Button></div></div></div>}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
          <ActivityFeed />
          <VideoGrid videos={recentVideos} onEdit={handleEdit} onDelete={handleDelete} onNavigate={(p:string)=>router.push(p)} />
          <AssetGrid assets={recentAssets} onNavigate={(p:string)=>router.push(p)} />
        </div>
      </div>
      <EditVideoDialog open={editOpen} video={editingVideo} onClose={()=>setEditOpen(false)} onSave={handleUpdate} />
      <DeleteVideoDialog open={deleteOpen} video={deletingVideo} loading={isDeleting} onClose={()=>setDeleteOpen(false)} onConfirm={confirmDelete} />
      <EnvironmentalGalleryDialog open={showGallery} onClose={()=>setShowGallery(false)} />
      </div>
    </div>
  );
}
