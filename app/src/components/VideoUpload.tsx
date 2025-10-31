import { Upload, ArrowLeft, CircleCheck, Sparkles, Eye, Home, FileVideo, Clock, CheckCircle, AlertCircle } from "lucide-react";

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoServiceUploadVideo } from '@/lib/sdk';
import { getAuthenticatedClient } from '@/lib/sdk/auth-client';
import { Video } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';


export default function VideoUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState<Video | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'urban',
    videoFile: null as File | null
  });

  const categories = ['urban', 'nature', 'indoor', 'street', 'park', 'office'];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_DURATION = 30; // 30 seconds

  const validateVideoFile = (file: File): string[] => {
    const errors: string[] = [];

    if (!file.type.startsWith('video/')) {
      errors.push('Please select a valid video file');
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    return errors;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    const errors = validateVideoFile(file);
    setValidationErrors(errors);

    if (errors.length === 0) {
      setFormData(prev => ({ ...prev, videoFile: file }));
      // Auto-generate title from filename if empty
      if (!formData.title) {
        const titleFromFile = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setFormData(prev => ({ ...prev, title: titleFromFile }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.videoFile) {
      setValidationErrors(['Please select a video file']);
      return;
    }

    if (!formData.title.trim()) {
      setValidationErrors(['Please provide a title for your video']);
      return;
    }

    setValidationErrors([]);
    setLoading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await videoServiceUploadVideo({
        client: getAuthenticatedClient(),
        body: {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          video_file: formData.videoFile
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data) {
        setUploadedVideo(response.data);
      } else {
        setValidationErrors(['Video uploaded successfully, but we could not get the details.']);
        setLoading(false);
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Video upload error:', error);
      setValidationErrors(['Failed to upload video. Please check your connection and try again.']);
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (uploadedVideo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 border-white/20 max-w-md text-center">
          <CardContent className="p-6">
            <CircleCheck className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-2">Upload Complete!</h2>
            <p className="text-gray-300 text-sm mb-6">
              Your video is ready for enhancement
            </p>

            <div className="space-y-3">
              {/* Primary CTA - AI Enhancement */}
              <Button
                onClick={() => navigate(`/ai-enhance/${uploadedVideo.id}`)}
                className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-medium py-3"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Enhance with AI
              </Button>

              {/* Secondary Options */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => navigate('/videos')}
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white/10 text-sm py-2"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Gallery
                </Button>

                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  className="text-gray-300 hover:bg-white/5 text-sm py-2"
                >
                  <Home className="h-3 w-3 mr-1" />
                  Dashboard
                </Button>
              </div>
            </div>

            {/* Compact Value Prop */}
            <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded text-left">
              <p className="text-yellow-400 text-xs font-medium mb-1">AI Enhancement</p>
              <p className="text-gray-300 text-xs">
                Professional overlays automatically placed in 60 seconds
              </p>
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
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-white/20 hover:border-white/40'
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {formData.videoFile ? (
                    <div className="space-y-4">
                      <FileVideo className="h-12 w-12 mx-auto text-green-400" />
                      <div>
                        <p className="text-green-400 font-medium">{formData.videoFile.name}</p>
                        <p className="text-gray-400 text-sm">
                          Size: {(formData.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 bg-white/10 text-white hover:bg-white/20"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose Different File
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <Label htmlFor="video" className="cursor-pointer">
                        <span className="text-white hover:text-yellow-400 font-medium">
                          Click to upload or drag and drop
                        </span>
                        <p className="text-gray-400 text-sm mt-2">
                          Maximum 100MB • MP4, MOV, or AVI format
                        </p>
                      </Label>
                    </>
                  )}

                  <Input
                    ref={fileInputRef}
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    required={!formData.videoFile}
                  />
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="flex items-start space-x-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      {validationErrors.map((error, index) => (
                        <p key={index} className="text-red-400 text-sm">{error}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {loading && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <span className="text-white text-sm">Uploading video...</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-gray-400 text-xs">{uploadProgress}% complete</p>
                  </div>
                )}
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
                  maxLength={100}
                />
                <p className="text-gray-400 text-xs">{formData.title.length}/100 characters</p>
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
                  maxLength={500}
                />
                <p className="text-gray-400 text-xs">{formData.description.length}/500 characters</p>
              </div>

              <Button
                type="submit"
                disabled={loading || !formData.videoFile || !formData.title.trim()}
                className="w-full bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading Video...</span>
                  </div>
                ) : (
                  'Upload Video'
                )}
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