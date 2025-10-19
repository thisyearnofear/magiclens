import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/auth/AuthProvider';
import { userServiceCreateUserProfile } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, User, Camera, Palette } from 'lucide-react';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    userType: 'artist',
    bio: '',
    avatar: null as File | null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, just store profile data locally and proceed
      // TODO: Connect to backend when auth is fully integrated
      const profileData = {
        username: formData.username,
        user_type: formData.userType,
        bio: formData.bio || null,
        avatar: formData.avatar?.name || null,
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem('magiclens_profile', JSON.stringify(profileData));
      console.log('Profile created locally:', profileData);
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Profile creation error:', error);
      alert('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white">Welcome to MagicLens!</CardTitle>
            <CardDescription className="text-gray-300">
              Let's set up your profile to get started creating magic.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Choose a unique username"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>

              {/* User Type */}
              <div className="space-y-4">
                <Label className="text-white">I want to...</Label>
                <RadioGroup
                  value={formData.userType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, userType: value }))}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 p-4 rounded-lg border border-white/20 bg-white/5">
                    <RadioGroupItem value="videographer" id="videographer" />
                    <Label htmlFor="videographer" className="flex items-center space-x-2 cursor-pointer text-white">
                      <Camera className="h-4 w-4" />
                      <span>Upload Videos</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 rounded-lg border border-white/20 bg-white/5">
                    <RadioGroupItem value="artist" id="artist" />
                    <Label htmlFor="artist" className="flex items-center space-x-2 cursor-pointer text-white">
                      <Palette className="h-4 w-4" />
                      <span>Create Art</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 rounded-lg border border-white/20 bg-white/5">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="flex items-center space-x-2 cursor-pointer text-white">
                      <User className="h-4 w-4" />
                      <span>Both</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself and your creative style..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  rows={3}
                />
              </div>

              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label htmlFor="avatar" className="text-white">Profile Picture (Optional)</Label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <span className="text-white hover:text-yellow-400">
                      Click to upload an image
                    </span>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </Label>
                  {formData.avatar && (
                    <p className="text-green-400 mt-2">Selected: {formData.avatar.name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  {loading ? 'Creating Profile...' : 'Create Profile'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Skip Setup (Demo Mode)
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}