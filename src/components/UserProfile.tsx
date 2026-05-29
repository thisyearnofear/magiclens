import { ArrowLeft, Save, X, User, Camera, Palette, Zap, Pencil, Copy, Link2, Flame, Award, Gift, TrendingUp, Wallet } from "lucide-react";
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useAuthContext } from '@/auth/AuthProvider';
import { StadiumBackdrop } from '@/components/StadiumBackdrop';
import { userServiceGetUserProfile, userServiceGetPublicProfile, userServiceUpdateUserProfile, userServiceCreateUserProfile } from '@/lib/sdk';
import { UserProfile as UserProfileType } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getReferralStats } from '@/lib/crossvm-client';
import { getUserRemixes } from '@/lib/remix-store';
import { computeStreak, getStreakBadge } from '@/lib/streak';
import { useWeb3Profile } from '@/hooks/useWeb3Profile';
import { Web3Identities } from '@/components/Web3Identities';
import { getShortDisplayName } from '@/hooks/useWeb3Profile';


export default function UserProfile() {
  const { id } = useParams();
  const router = useRouter();
  const { flowAddress: user } = useAuthContext();
  const { address: evmAddress } = useAccount();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    avatar: null as File | null
  });

  const isOwnProfile = !id || id === user;

  const [streak, setStreak] = useState({ current: 0, longest: 0, todayMinted: false, dayIds: [] as string[] });
  const [refStats, setRefStats] = useState<{
    total_claims: number;
    days_with_claims: number;
    total_bonus_votes: number;
    times_referred: number;
    recent_claims: any[];
  } | null>(null);
  const [loadingRef, setLoadingRef] = useState(false);

  // Resolve Web3 identity (ENS / Lens / Farcaster) from wallet address
  const idStr = typeof id === 'string' ? id : undefined;
  const identityAddress = (isOwnProfile ? evmAddress : idStr) || user || undefined;
  const web3 = useWeb3Profile(identityAddress);

  useEffect(() => {
    const remixes = getUserRemixes();
    setStreak(computeStreak(remixes));
  }, []);

  useEffect(() => {
    if (isOwnProfile && evmAddress) {
      setLoadingRef(true);
      getReferralStats(evmAddress).then(res => {
        if (res.success && res.stats) setRefStats(res.stats);
      }).finally(() => setLoadingRef(false));
    }
  }, [isOwnProfile, evmAddress]);

  useEffect(() => {
    loadProfile();
  }, [id, user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (isOwnProfile) {
        const response = await userServiceGetUserProfile();
        if (response.data) {
          setProfile(response.data);
          setEditForm({
            username: response.data.username,
            bio: response.data.bio || '',
            avatar: null
          });
        }
      } else {
        const response = await userServiceGetPublicProfile({
          body: { user_id: id as string }
        });
        if (response.data) {
          setProfile(response.data);
        }
      }
    } catch (error) {
      console.warn('Profile API threw');
    }
    setLoading(false);
  };

  // For own profile without a backend profile, render from Web3 identity data
  const effectiveProfile = useMemo(() => {
    if (profile) return profile;
    if (!isOwnProfile) return null;
    return {
      id: 'web3-fallback' as const,
      user_id: user || '',
      username: web3.displayName || getShortDisplayName(identityAddress) || 'Player',
      user_type: 'videographer' as const,
      avatar_url: web3.avatarUrl || '',
      bio: web3.bio || '',
      earnings_total: 0,
      is_verified: false,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      portfolio_data: {} as Record<string, unknown>,
    };
  }, [profile, isOwnProfile, user, web3.displayName, web3.avatarUrl, web3.bio, identityAddress]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const isNew = !profile;
      const response = isNew
        ? await userServiceCreateUserProfile({
            body: {
              username: editForm.username || 'Player',
              bio: editForm.bio || null,
              user_type: 'videographer',
            }
          })
        : await userServiceUpdateUserProfile({
            body: {
              username: editForm.username || null,
              bio: editForm.bio || null,
              avatar: editForm.avatar
            }
          });

      if (response.data) {
        setProfile(response.data);
        setEditing(false);
        if (isNew) toast.success('Profile created!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile', { description: 'Please try again in a moment.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      username: effectiveProfile.username,
      bio: effectiveProfile.bio || '',
      avatar: null
    });
    setEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditForm(prev => ({ ...prev, avatar: file }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden pb-24 sm:pb-0">
        <StadiumBackdrop />
        <div className="relative z-[3]">
        <header className="border-b border-white/10 bg-black/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <div className="h-9 bg-white/10 rounded w-24 animate-pulse" />
              <div className="h-6 bg-white/10 rounded w-20 animate-pulse" />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="bg-white/5 rounded-xl p-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/10" />
                <div className="space-y-3 flex-1">
                  <div className="h-6 bg-white/10 rounded w-48" />
                  <div className="h-4 bg-white/5 rounded w-32" />
                  <div className="h-4 bg-white/5 rounded w-64" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white/5 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }

  if (!effectiveProfile) {
    return (
      <div className="min-h-screen relative overflow-hidden pb-24 sm:pb-0 flex items-center justify-center">
        <StadiumBackdrop />
        <div className="relative z-[3]">
        <Card className="bg-white/10 border-white/20 max-w-md text-center">
          <CardContent className="p-8">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Profile Not Found</h2>
            <p className="text-gray-300 mb-4">This user profile doesn't exist or isn't public.</p>

            {!web3.loading && web3.displayName && (
              <div className="mb-4">
                <Web3Identities web3={web3} walletAddress={identityAddress} layout="full" />
              </div>
            )}

            {web3.loading && (
              <div className="mb-4 flex justify-center">
                <div className="animate-pulse flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-white/10" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-white/10 rounded" />
                    <div className="h-3 w-20 bg-white/5 rounded" />
                  </div>
                </div>
              </div>
            )}

            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 sm:pb-0">
      <StadiumBackdrop />
      <div className="relative z-[3]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-yellow-400" />
                <h1 className="text-xl font-bold text-white">Profile</h1>
              </div>
            </div>

            {isOwnProfile && !editing && (
              <Button
                onClick={() => setEditing(true)}
                className="bg-yellow-400 text-black hover:bg-yellow-500"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-white/5 border-white/10 shadow-xl">
          <CardHeader className="pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={effectiveProfile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-2xl">
                    {effectiveProfile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {editing && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Label htmlFor="avatar-upload" className="cursor-pointer text-white hover:text-yellow-400">
                      <Camera className="h-6 w-6" />
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </Label>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username" className="text-white">Username</Label>
                      <Input
                        id="username"
                        value={editForm.username}
                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio" className="text-white">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-3xl font-bold text-white mb-2">
                      {effectiveProfile.username}
                    </CardTitle>

                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={`${effectiveProfile.user_type === 'artist' ? 'bg-purple-500' :
                          effectiveProfile.user_type === 'videographer' ? 'bg-blue-500' :
                            'bg-gradient-to-r from-purple-500 to-blue-500'
                        }`}>
                        {effectiveProfile.user_type === 'both' ? 'Artist & Videographer' :
                          effectiveProfile.user_type.charAt(0).toUpperCase() + effectiveProfile.user_type.slice(1)}
                      </Badge>

                      {effectiveProfile.is_verified && (
                        <Badge className="bg-yellow-500 text-black">
                          Verified
                        </Badge>
                      )}
                    </div>

                    {/* Web3 identities (ENS / Lens / Farcaster) */}
                    {!web3.loading && (web3.displayName || web3.avatarUrl) && (
                      <div className="mb-3">
                        <Web3Identities web3={web3} walletAddress={identityAddress} layout="compact" />
                      </div>
                    )}

                    {effectiveProfile.bio && (
                      <CardDescription className="text-gray-300 text-base">
                        {effectiveProfile.bio}
                      </CardDescription>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons for Editing */}
              {editing && (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    ${effectiveProfile.earnings_total?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-gray-400 text-xs">Earnings</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {streak.current}
                  </div>
                  <p className="text-gray-400 text-xs flex items-center justify-center gap-1">
                    <Flame className="h-3 w-3 text-orange-400" />
                    Day Streak
                  </p>
                  {getStreakBadge(streak.current) && (
                    <span className={`text-[10px] ${getStreakBadge(streak.current)!.color}`}>
                      {getStreakBadge(streak.current)!.icon} {getStreakBadge(streak.current)!.label}
                    </span>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-xl font-bold text-white mb-1">
                    {streak.longest}
                  </div>
                  <p className="text-gray-400 text-xs flex items-center justify-center gap-1">
                    <Award className="h-3 w-3 text-yellow-400" />
                    Best Streak
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {getUserRemixes().length}
                  </div>
                  <p className="text-gray-400 text-xs">Total Remixes</p>
                </CardContent>
              </Card>
            </div>

            {/* Achievement Badges */}
            {isOwnProfile && (
              <div className="flex flex-wrap gap-2 mb-6">
                {getUserRemixes().length > 0 && (
                  <Badge variant="outline" className="bg-purple-500/10 border-purple-400/30 text-purple-300 text-[11px]">
                    <Award className="h-3 w-3 mr-1" />
                    First Mint
                  </Badge>
                )}
                {streak.current >= 3 && (
                  <Badge variant="outline" className="bg-orange-500/10 border-orange-400/30 text-orange-300 text-[11px]">
                    <Flame className="h-3 w-3 mr-1" />
                    Streaker Lv.1
                  </Badge>
                )}
                {streak.current >= 7 && (
                  <Badge variant="outline" className="bg-orange-500/10 border-orange-400/30 text-orange-300 text-[11px]">
                    <Flame className="h-3 w-3 mr-1" />
                    Streaker Lv.2
                  </Badge>
                )}
                {streak.current >= 14 && (
                  <Badge variant="outline" className="bg-red-500/10 border-red-400/30 text-red-300 text-[11px]">
                    <Flame className="h-3 w-3 mr-1" />
                    Streaker Lv.3
                  </Badge>
                )}
                {refStats && refStats.total_claims > 0 && (
                  <Badge variant="outline" className="bg-green-500/10 border-green-400/30 text-green-300 text-[11px]">
                    <Gift className="h-3 w-3 mr-1" />
                    {refStats.total_claims} Referral{refStats.total_claims > 1 ? 's' : ''}
                  </Badge>
                )}
                {refStats && refStats.times_referred > 0 && (
                  <Badge variant="outline" className="bg-blue-500/10 border-blue-400/30 text-blue-300 text-[11px]">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Referred
                  </Badge>
                )}
              </div>
            )}

            {/* Referral Link + Stats */}
            {isOwnProfile && evmAddress && (
              <Card className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border-yellow-400/20 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <Link2 className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h4 className="text-white font-semibold text-sm">Your Referral Link</h4>
                        <p className="text-gray-300 text-xs mt-0.5">
                          Share this link — when someone mints a remix using it, they earn a leaderboard boost!
                        </p>
                        <code className="block mt-2 text-[11px] text-yellow-300 bg-yellow-400/10 rounded px-2 py-1 truncate font-mono">
                          {`https://magiclens.vercel.app?ref=${evmAddress}`}
                        </code>
                        {refStats && (
                          <div className="flex gap-4 mt-3 text-[11px]">
                            <span className="text-green-400">
                              <Gift className="h-3 w-3 inline mr-0.5" />
                              {refStats.total_claims} claimed
                            </span>
                            <span className="text-yellow-400">
                              <TrendingUp className="h-3 w-3 inline mr-0.5" />
                              +{refStats.total_bonus_votes} bonus votes
                            </span>
                            {refStats.times_referred > 0 && (
                              <span className="text-blue-400">
                                You used {refStats.times_referred} link{refStats.times_referred > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(`https://magiclens.vercel.app?ref=${evmAddress}`);
                          toast.success('Referral link copied!');
                        } catch {
                          toast.error('Could not copy link');
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 h-8"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Type Info */}
            <div className="space-y-4">
              {(effectiveProfile.user_type === 'videographer' || effectiveProfile.user_type === 'both') && (
                <Card className="bg-blue-500/20 border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Camera className="h-8 w-8 text-blue-400" />
                      <div>
                        <h4 className="text-white font-semibold">Videographer</h4>
                        <p className="text-gray-300 text-sm">Creates environmental videos for artist collaboration</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(effectiveProfile.user_type === 'artist' || effectiveProfile.user_type === 'both') && (
                <Card className="bg-purple-500/20 border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Palette className="h-8 w-8 text-purple-400" />
                      <div>
                        <h4 className="text-white font-semibold">Digital Artist</h4>
                        <p className="text-gray-300 text-sm">Creates magical overlays and animations for videos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}