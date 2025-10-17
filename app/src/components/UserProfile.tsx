import { ArrowLeft, Save, X, User, Camera, Palette, Zap, Pencil } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/auth/AuthProvider';
import { userServiceGetUserProfile, userServiceGetPublicProfile, userServiceUpdateUserProfile } from '@/lib/sdk';
import { UserProfile as UserProfileType } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userDetails } = useAuthContext();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    avatar: null as File | null
  });

  const isOwnProfile = !id || id === userDetails?.user_uuid;

  useEffect(() => {
    loadProfile();
  }, [id, userDetails]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (isOwnProfile) {
        // Load current user's profile
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
        // Load public profile
        const response = await userServiceGetPublicProfile({
          body: { user_id: id! }
        });
        if (response.data) {
          setProfile(response.data);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await userServiceUpdateUserProfile({
        body: {
          username: editForm.username || null,
          bio: editForm.bio || null,
          avatar: editForm.avatar
        }
      });
      
      if (response.data) {
        setProfile(response.data);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        username: profile.username,
        bio: profile.bio || '',
        avatar: null
      });
    }
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="bg-white/10 border-white/20 max-w-md text-center">
          <CardContent className="p-8">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Profile Not Found</h2>
            <p className="text-gray-300 mb-4">This user profile doesn't exist or isn't public.</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
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
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-2xl">
                    {profile.username.charAt(0).toUpperCase()}
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
                      {profile.username}
                    </CardTitle>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <Badge className={`${
                        profile.user_type === 'artist' ? 'bg-purple-500' :
                        profile.user_type === 'videographer' ? 'bg-blue-500' :
                        'bg-gradient-to-r from-purple-500 to-blue-500'
                      }`}>
                        {profile.user_type === 'both' ? 'Artist & Videographer' : 
                         profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
                      </Badge>
                      
                      {profile.is_verified && (
                        <Badge className="bg-yellow-500 text-black">
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    {profile.bio && (
                      <CardDescription className="text-gray-300 text-base">
                        {profile.bio}
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
                    className="border-white/20 text-white"
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
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    ${profile.earnings_total?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-gray-400 text-sm">Total Earnings</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {profile.user_type === 'videographer' || profile.user_type === 'both' ? '0' : '0'}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {profile.user_type === 'videographer' || profile.user_type === 'both' ? 'Videos Uploaded' : 'Assets Created'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white mb-1">0</div>
                  <p className="text-gray-400 text-sm">Collaborations</p>
                </CardContent>
              </Card>
            </div>

            {/* User Type Info */}
            <div className="space-y-4">
              {(profile.user_type === 'videographer' || profile.user_type === 'both') && (
                <Card className="bg-blue-500/10 border-blue-500/20">
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

              {(profile.user_type === 'artist' || profile.user_type === 'both') && (
                <Card className="bg-purple-500/10 border-purple-500/20">
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
  );
}