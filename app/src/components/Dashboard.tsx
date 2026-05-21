import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/auth/AuthProvider';
import { userServiceGetUserProfile, videoServiceGetVideos, assetServiceGetAssets, videoServiceDeleteVideo, videoServiceUpdateVideo, UserProfile, Video, ArtistAsset } from '@/lib/sdk';
import { getAuthenticatedClient } from '@/lib/sdk/auth-client';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { GuestBanner } from '@/components/dashboard/GuestBanner';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { GettingStartedChecklist } from '@/components/dashboard/GettingStartedChecklist';
import { GuestFeatureCards } from '@/components/dashboard/GuestFeatureCards';
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
import { Info } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, disconnectWallet, isGuest } = useAuthContext();
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

  const handleEdit=(id:string,title:string)=>{setEditingVideo({id,title});setEditOpen(true);};
  const handleDelete=(id:string,title:string)=>{setDeletingVideo({id,title});setDeleteOpen(true);};
  const handleUpdate=async(id:string,title:string)=>{
    try{await videoServiceUpdateVideo({client:getAuthenticatedClient(),body:{video_id:id,title}});setRecentVideos(p=>p.map(v=>v.id===id?{...v,title}:v));setEditOpen(false);setEditingVideo(null);}
    catch(e){console.error('Failed to update video:',e);toast.error('Failed to update video',{description:'Please try again in a moment.'});}
  };
  const confirmDelete=async()=>{
    if(!deletingVideo)return;setIsDeleting(true);
    try{await videoServiceDeleteVideo({client:getAuthenticatedClient(),body:{video_id:deletingVideo.id}});setRecentVideos(p=>p.filter(v=>v.id!==deletingVideo.id));setDeleteOpen(false);setDeletingVideo(null);}
    catch(e){console.error('Failed to delete video:',e);toast.error('Failed to delete video',{description:'Please try again in a moment.'});}
    finally{setIsDeleting(false);}
  };

  useEffect(()=>{(async()=>{
    if(isGuest){setProfile({id:'guest',user_id:'guest',username:'Guest User',user_type:'both',bio:'Exploring MagicLens as a guest',created_at:new Date().toISOString()}as UserProfile);setRecentVideos([]);setRecentAssets([]);setLoading(false);return;}
    try{
      const pr=await userServiceGetUserProfile({client:getAuthenticatedClient()});
      if(pr.data)setProfile(pr.data);
      else setProfile({id:user?.addr||'unknown',user_id:user?.addr||'unknown',username:`User ${user?.addr?.slice(-4)||'Unknown'}`,user_type:'both',bio:'Welcome to MagicLens! Update your profile to get started.',created_at:new Date().toISOString()}as UserProfile);
      try{const v=await videoServiceGetVideos({client:getAuthenticatedClient(),body:{limit:6,offset:0}});if(v.data)setRecentVideos(v.data);}catch{setRecentVideos([]);}
      try{const a=await assetServiceGetAssets({client:getAuthenticatedClient(),body:{limit:6,offset:0}});if(a.data)setRecentAssets(a.data);}catch{setRecentAssets([]);}
    }catch(e){console.error('Dashboard loading error:',e);setError('Unable to load dashboard data. Some features may be limited.');}
    finally{setLoading(false);}
  })();},[navigate,isGuest]);

  if(loading)return<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center"><div className="text-white text-xl">Loading your dashboard...</div></div>;
  if(!profile)return null;

  const isNewUser=!isGuest&&profile.bio==='Welcome to MagicLens! Update your profile to get started.';
  const goHome=()=>{window.location.href='/';};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <DashboardHeader isGuest={isGuest} profile={profile} onDisconnect={disconnectWallet} onNavigate={navigate} />
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
        <WelcomeSection isGuest={isGuest} profile={profile} />
        {isNewUser&&<GettingStartedChecklist onNavigate={navigate} />}
        {isGuest&&<GuestFeatureCards />}
        <QuickActions isGuest={isGuest} userType={profile.user_type} onNavigate={navigate} onShowGallery={()=>setShowGallery(true)} />
        {error&&<div className="mb-8 p-4 rounded-lg bg-red-500/20 border border-red-500/30"><div className="flex items-start space-x-3"><div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5"><span className="text-white text-xs">!</span></div><div><h4 className="text-white font-medium">Connection Issue</h4><p className="text-gray-400 text-sm mt-1">{error}</p><Button variant="outline" size="sm" className="mt-2 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={()=>window.location.reload()}>Retry</Button></div></div></div>}
        {isGuest&&<div className="mb-8 p-4 rounded-lg bg-gray-800/50 border border-gray-700"><div className="flex items-start space-x-3"><Info className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" /><div><h4 className="text-white font-medium">Guest Mode Limitations</h4><p className="text-gray-400 text-sm mt-1">In guest mode, you can browse content and explore features, but uploads, collaborations, and earnings are disabled. Connect your Flow wallet to unlock the full MagicLens experience.</p></div></div></div>}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
          <ActivityFeed />
          <VideoGrid videos={recentVideos} onEdit={handleEdit} onDelete={handleDelete} onNavigate={navigate} />
          <AssetGrid assets={recentAssets} onNavigate={navigate} />
        </div>
      </div>
      <EditVideoDialog open={editOpen} video={editingVideo} onClose={()=>setEditOpen(false)} onSave={handleUpdate} />
      <DeleteVideoDialog open={deleteOpen} video={deletingVideo} loading={isDeleting} onClose={()=>setDeleteOpen(false)} onConfirm={confirmDelete} />
      <EnvironmentalGalleryDialog open={showGallery} onClose={()=>setShowGallery(false)} />
    </div>
  );
}
