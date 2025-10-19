import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/auth/AuthProvider';
import { userServiceGetUserProfile, videoServiceGetVideos, assetServiceGetAssets } from '@/lib/sdk';
import { UserProfile, Video, ArtistAsset } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, Palette, Eye, TrendingUp, Users, Zap, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, isGuest } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [recentAssets, setRecentAssets] = useState<ArtistAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      console.log('Dashboard loading - isGuest:', isGuest);
      
      // If user is a guest, show demo mode
      if (isGuest) {
        console.log('Loading guest mode dashboard');
        setLoading(false);
        // Set a demo profile for guest users
        setProfile({
          id: 'guest',
          user_id: 'guest',
          username: 'Guest User',
          user_type: 'both',
          bio: 'Exploring MagicLens as a guest',
          created_at: new Date().toISOString(),
        } as UserProfile);
        // Set empty arrays for videos and assets in demo mode
        setRecentVideos([]);
        setRecentAssets([]);
        return;
      }

      console.log('Loading authenticated user dashboard');

      try {
        // Load user profile
        console.log('Calling userServiceGetUserProfile');
        const token = localStorage.getItem('magiclens_token');
        console.log('Token before API call:', token);
        const profileResponse = await userServiceGetUserProfile();
        console.log('userServiceGetUserProfile response:', profileResponse);
        if (profileResponse.data) {
          setProfile(profileResponse.data);
        } else {
          // Redirect to profile setup if no profile exists
          navigate('/profile-setup');
          return;
        }

        // Load recent videos
        try {
          console.log('Calling videoServiceGetVideos');
          const videosResponse = await videoServiceGetVideos({
            body: { limit: 6, offset: 0 }
          });
          console.log('videoServiceGetVideos response:', videosResponse);
          if (videosResponse.data) {
            setRecentVideos(videosResponse.data);
          }
        } catch (error) {
          console.warn('Could not load videos:', error);
          // Continue with empty array
          setRecentVideos([]);
        }

        // Load recent assets
        try {
          console.log('Calling assetServiceGetAssets');
          const assetsResponse = await assetServiceGetAssets({
            body: { limit: 6, offset: 0 }
          });
          console.log('assetServiceGetAssets response:', assetsResponse);
          if (assetsResponse.data) {
            setRecentAssets(assetsResponse.data);
          }
        } catch (error) {
          console.warn('Could not load assets:', error);
          // Continue with empty array
          setRecentAssets([]);
        }
      } catch (error) {
        console.error('Dashboard loading error:', error);
        // If backend is not available, show error message
        alert('Could not connect to backend services. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate, isGuest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your dashboard...</div>
      </div>
    );
  }

  if (!profile) {
    return null; // Will redirect to profile setup
  }

  const isVideographer = profile.user_type === 'videographer' || profile.user_type === 'both';
  const isArtist = profile.user_type === 'artist' || profile.user_type === 'both';
  const isGuestUser = isGuest;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">MagicLens</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" onClick={() => navigate('/videos')} className="text-white">
                Browse Videos
              </Button>
              <Button variant="ghost" onClick={() => navigate('/assets')} className="text-white">
                Asset Library
              </Button>
              <Button variant="ghost" onClick={() => navigate('/profile')} className="text-white">
                Profile
              </Button>
              {isGuestUser ? (
                <Button 
                  onClick={() => {
                    // Redirect to landing page to connect wallet
                    window.location.href = '/';
                  }}
                  className="bg-yellow-400 text-black hover:bg-yellow-500 flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Connect Wallet
                </Button>
              ) : (
                <Button variant="outline" onClick={logout} className="border-white/20 text-white">
                  Sign Out
                </Button>
              )}
            </nav>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6 text-white" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-gray-900/80 backdrop-blur-sm text-white">
                  <nav className="flex flex-col space-y-4 mt-8">
                    <Button variant="ghost" onClick={() => navigate('/videos')} className="text-white">
                      Browse Videos
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/assets')} className="text-white">
                      Asset Library
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/profile')} className="text-white">
                      Profile
                    </Button>
                    {isGuestUser ? (
                      <Button 
                        onClick={() => {
                          // Redirect to landing page to connect wallet
                          window.location.href = '/';
                        }}
                        className="bg-yellow-400 text-black hover:bg-yellow-500 flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Connect Wallet
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={logout} className="border-white/20 text-white">
                        Sign Out
                      </Button>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Guest Mode Banner */}
        {isGuestUser && (
          <div className="mb-8 p-4 rounded-lg bg-gradient-to-r from-yellow-400/20 to-purple-400/20 border border-yellow-400/30">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">Guest Mode</h3>
                <p className="text-gray-300 text-sm">
                  Explore MagicLens features. Connect your Flow wallet to unlock full platform capabilities.
                </p>
              </div>
              <Button 
                onClick={() => {
                  // Redirect to landing page to connect wallet
                  window.location.href = '/';
                }}
                className="bg-yellow-400 text-black hover:bg-yellow-500 whitespace-nowrap"
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Welcome{!isGuestUser && `, ${profile.username}`}!
          </h2>
          <div className="flex items-center space-x-2">
            <Badge className={`${
              profile.user_type === 'artist' ? 'bg-purple-500' :
              profile.user_type === 'videographer' ? 'bg-blue-500' :
              'bg-gradient-to-r from-purple-500 to-blue-500'
            }`}>
              {profile.user_type === 'both' ? 'Artist & Videographer' : 
               profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
            </Badge>
            {isGuestUser && (
              <Badge className="bg-yellow-500 text-black">
                Guest Mode
              </Badge>
            )}
          </div>
        </div>

        {/* Guest Mode Feature Comparison */}
        {isGuestUser && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Unlock Full Platform Features</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 p-2 bg-green-500/20 rounded-full">
                      <Upload className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">Upload Content</h4>
                      <p className="text-gray-400 text-xs mt-1">Share your videos and assets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 p-2 bg-blue-500/20 rounded-full">
                      <Users className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">Collaborate</h4>
                      <p className="text-gray-400 text-xs mt-1">Work with other creators</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 p-2 bg-purple-500/20 rounded-full">
                      <Zap className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">Earn Rewards</h4>
                      <p className="text-gray-400 text-xs mt-1">Get paid for your creations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 p-2 bg-yellow-500/20 rounded-full">
                      <Palette className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">NFT Integration</h4>
                      <p className="text-gray-400 text-xs mt-1">Mint your assets as NFTs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isVideographer && !isGuestUser && (
            <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                  onClick={() => navigate('/upload-video')}>
              <CardContent className="p-6 text-center">
                <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold">Upload Video</h3>
                <p className="text-gray-300 text-sm">Share your environmental footage</p>
              </CardContent>
            </Card>
          )}

          {isArtist && !isGuestUser && (
            <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                  onClick={() => navigate('/upload-asset')}>
              <CardContent className="p-6 text-center">
                <Palette className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold">Upload Asset</h3>
                <p className="text-gray-300 text-sm">Add new overlay animations</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => navigate('/videos')}>
            <CardContent className="p-6 text-center">
              <Eye className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold">Browse Videos</h3>
              <p className="text-gray-300 text-sm">Discover collaboration opportunities</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => navigate('/assets')}>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold">Asset Library</h3>
              <p className="text-gray-300 text-sm">Explore overlay options</p>
            </CardContent>
          </Card>
        </div>

        {/* Guest Mode Limitation Notice */}
        {isGuestUser && (
          <div className="mb-8 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white font-medium">Guest Mode Limitations</h4>
                <p className="text-gray-400 text-sm mt-1">
                  In guest mode, you can browse content and explore features, but uploads, collaborations, 
                  and earnings are disabled. Connect your Flow wallet to unlock the full MagicLens experience.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Videos */}
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Recent Videos</h3>
            <div className="space-y-4">
              {recentVideos.slice(0, 3).map((video) => (
                <Card key={video.id} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{video.title}</h4>
                        <p className="text-gray-400 text-sm">{video.category}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {video.view_count} views
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {video.collaboration_count} collaborations
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {recentVideos.length === 0 && (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-400">No videos available yet.</p>
                    <Button variant="outline" className="mt-2" onClick={() => navigate('/videos')}>
                      Browse Videos
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Assets */}
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Recent Assets</h3>
            <div className="space-y-4">
              {recentAssets.slice(0, 3).map((asset) => (
                <Card key={asset.id} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Palette className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{asset.name}</h4>
                        <p className="text-gray-400 text-sm">{asset.category}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {asset.asset_type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {asset.usage_count} uses
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {recentAssets.length === 0 && (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-400">No assets available yet.</p>
                    <Button variant="outline" className="mt-2" onClick={() => navigate('/assets')}>
                      Browse Assets
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}