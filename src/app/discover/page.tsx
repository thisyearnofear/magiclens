'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, User, Zap, Search, ArrowLeft, Sparkles,
  Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useAuthContext } from '@/auth/AuthProvider';
import { CollabCard } from '@/components/collaboration/CollabCard';
import { CollabRequest } from '@/components/collaboration/CollabRequest';
import { MobileNav } from '@/components/MobileNav';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface Creator {
  id: string;
  username: string;
  user_type: string;
  avatar_url?: string;
  bio?: string;
  earnings_total?: number;
  is_verified?: boolean;
}

interface OpenCollaboration {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  category?: string;
  view_count?: number;
  duration?: number;
  created_at?: string;
  creator_name?: string;
  creator_avatar?: string;
  creator_type?: string;
  active_collabs?: number;
}

export default function DiscoverPage() {
  const router = useRouter();
  const { isConnected, isGuest } = useAuthContext();
  const isAuthenticated = isConnected && !isGuest;

  const [creators, setCreators] = useState<Creator[]>([]);
  const [collabs, setCollabs] = useState<OpenCollaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [activeTab, setActiveTab] = useState<'creators' | 'collabs'>('collabs');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [creatorsRes, collabsRes] = await Promise.all([
        fetch(`${API_BASE}/api/discover/creators?limit=12&offset=0`),
        fetch(`${API_BASE}/api/discover/open_collaborations?limit=12&offset=0`),
      ]);
      const creatorsData = await creatorsRes.json();
      const collabsData = await collabsRes.json();
      if (creatorsData.success) setCreators(creatorsData.creators);
      if (collabsData.success) setCollabs(collabsData.open_collaborations);
    } catch (err) {
      setError('Could not load discovery data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStartCollab = useCallback(async (videoId: string) => {
    if (!isAuthenticated) {
      toast.info('Connect a wallet to join collaborations');
      return;
    }
    const token = localStorage.getItem('magiclens_token');
    try {
      const res = await fetch(`${API_BASE}/api/discover/start_collaboration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ video_id: videoId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Joined collaboration!', {
          description: 'Open the workspace to start adding overlays.',
        });
        router.push(`/collaboration/${data.collaboration}`);
      } else {
        toast.error(data.error || 'Failed to join');
      }
    } catch (err) {
      toast.error('Network error — please try again');
    }
  }, [isAuthenticated, router]);

  const handleSendRequest = useCallback(async (creatorId: string) => {
    // For now, this is a placeholder — real implementation would send a notification
    await new Promise(r => setTimeout(r, 1000));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20">
        <div className="container mx-auto px-4 py-4">
          <MobileNav title="Discover" icon={<Users className="h-8 w-8 text-indigo-400 shrink-0" />} />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">Find Your Creative Match</h2>
          <p className="text-gray-400">
            Connect with videographers and AR artists to create amazing remixes together.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 w-fit border border-white/5 mb-8">
          <button
            onClick={() => setActiveTab('collabs')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'collabs'
                ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Open Collaborations
            {collabs.length > 0 && (
              <Badge className="ml-1 bg-indigo-500/30 text-indigo-300 text-[9px] px-1 py-0">{collabs.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'creators'
                ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Creators
            {creators.length > 0 && (
              <Badge className="ml-1 bg-indigo-500/30 text-indigo-300 text-[9px] px-1 py-0">{creators.length}</Badge>
            )}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            <span className="ml-3 text-gray-400">Discovering collaborations...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="bg-red-500/10 border-red-500/30 mb-8">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div>
                  <h3 className="text-white font-medium">Connection Issue</h3>
                  <p className="text-gray-400 text-sm">{error}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData} className="border-red-500/30 text-red-400">
                <RefreshCw className="h-4 w-4 mr-1" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Open Collaborations */}
        {!loading && activeTab === 'collabs' && (
          <>
            {collabs.length === 0 ? (
              <div className="text-center py-16">
                <Zap className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">No open collaborations yet</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Upload a video or create a remix to get started.
                </p>
                <Button onClick={() => router.push('/upload-video')} className="bg-indigo-500 hover:bg-indigo-400 text-white">
                  Upload Your First Video
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {collabs.map(collab => (
                  <CollabCard
                    key={collab.id}
                    collab={collab}
                    onStartCollab={handleStartCollab}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Creators */}
        {!loading && activeTab === 'creators' && (
          <>
            {creators.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">No creators yet</h3>
                <p className="text-gray-400 text-sm">Be the first to create a profile!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {creators.map(creator => (
                  <motion.div
                    key={creator.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-white/5 border-white/10 hover:border-indigo-400/30 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() => setSelectedCreator(creator)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto mb-3 flex items-center justify-center">
                          {creator.avatar_url ? (
                            <img src={creator.avatar_url} alt={creator.username} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="h-8 w-8 text-white" />
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                          <h3 className="text-white font-semibold">{creator.username}</h3>
                          {creator.is_verified && (
                            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                          )}
                        </div>
                        <Badge className="mt-1 capitalize text-[10px] bg-white/5 text-gray-400">
                          {creator.user_type}
                        </Badge>
                        {creator.bio && (
                          <p className="text-gray-500 text-xs mt-2 line-clamp-2">{creator.bio}</p>
                        )}
                        {creator.earnings_total !== undefined && creator.earnings_total > 0 && (
                          <p className="text-yellow-400 text-xs mt-2 font-medium">
                            ${creator.earnings_total.toFixed(2)} earned
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Collab request modal */}
      {selectedCreator && (
        <CollabRequest
          creator={selectedCreator}
          onSendRequest={handleSendRequest}
          onClose={() => setSelectedCreator(null)}
        />
      )}
    </div>
  );
}
