import { Upload, ArrowLeft, CircleCheck, Sparkles, Eye, House } from "lucide-react";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoServiceUploadVideo } from '@/lib/sdk';
import { Video } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function VideoUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'urban',
    videoFile: null as File | null
  });

  const categories = ['urban', 'nature', 'indoor', 'street', 'park', 'office'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation
      if (file.type.startsWith('video/')) {
        setFormData(prev => ({ ...prev, videoFile: file }));
      } else {
        alert('Please select a video file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.videoFile) {
      alert('Please select a video file');
      return;
    }

    setLoading(true);

    try {
      const response = await videoServiceUploadVideo({
        body: {
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          video_file: formData.videoFile
        }
      });

      if (response.data) {
        setUploadedVideo(response.data);
      } else {
        alert('Video uploaded successfully, but we could not get the details. Redirecting to dashboard.');
        setLoading(false);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Video upload error:', error);
      alert('Failed to upload video. Please try again.');
      setLoading(false);
    }
  };

  if (uploadedVideo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 border-white/20 max-w-lg text-center">
          <CardContent className="p-8">
            <CircleCheck className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Video Uploaded Successfully!</h2>
            <p className="text-gray-300 mb-6">
              Your video "{uploadedVideo.title}" is ready for enhancement.
              What would you like to do next?
            </p>
            
            <div className="space-y-4">
              {/* Primary CTA - AI Enhancement */}
              <Button
                onClick={() => navigate(`/quick-collab/${uploadedVideo.id}`)}
                className="w-full bg-yellow-400 text-black hover:bg-yellow-500 text-lg py-6"
              >
                <Sparkles className="h-5 w-5 mr-3" />
                Enhance with AI Overlays
                <span className="block text-sm font-normal mt-1">Professional overlays in 60 seconds</span>
              </Button>
              
              {/* Secondary Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={() => navigate('/videos')}
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white/10 py-4"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View in Gallery
                  <span className="block text-xs font-normal mt-1">Browse and manage videos</span>
                </Button>
                
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  className="text-gray-300 hover:bg-white/5 py-4"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                  <span className="block text-xs font-normal mt-1">Return to main page</span>
                </Button>
              </div>
            </div>
            
            {/* Value Proposition */}
            <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="text-yellow-400 font-medium text-sm">Why use AI Enhancement?</h4>
                  <p className="text-gray-300 text-sm mt-1">
                    Our AI analyzes your video content and automatically places professional overlays 
                    that match your style and mood. No complex editing required!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">Upload Video</CardTitle>
            <CardDescription className="text-gray-300">
              Share your environmental footage and let artists bring it to life with magical overlays.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Video File Upload */}
              <div className="space-y-2">
                <Label htmlFor="video" className="text-white">Video File</Label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <Label htmlFor="video" className="cursor-pointer">
                    <span className="text-white hover:text-yellow-400">
                      Click to upload your video
                    </span>
                    <p className="text-gray-400 text-sm mt-2">
                      Maximum 30 seconds • MP4, MOV, or AVI format
                    </p>
                    <Input
                      id="video"
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                  </Label>
                  {formData.videoFile && (
                    <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
                      <p className="text-green-400">Selected: {formData.videoFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        Size: {(formData.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your video a descriptive title"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the setting, mood, or any special elements in your video..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
              >
                {loading ? 'Uploading...' : 'Upload Video'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-500/20 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Tips for Great Videos</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Keep videos to 30 seconds or less</li>
                <li>• Use stable shots with interesting environments</li>
                <li>• Include areas where overlays can naturally fit</li>
                <li>• Good lighting helps artists see placement opportunities</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}