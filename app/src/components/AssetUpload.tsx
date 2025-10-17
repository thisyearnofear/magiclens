import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetServiceUploadAsset, assetServiceGetAssetCategories } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Upload, ArrowLeft, CircleCheck } from 'lucide-react';

export default function AssetUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'effects',
    isPublic: true,
    assetFile: null as File | null
  });

  const categories = ['creatures', 'effects', 'objects', 'text', 'decorations'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation
      const validTypes = ['image/gif', 'image/png', 'video/mp4'];
      if (validTypes.includes(file.type)) {
        setFormData(prev => ({ ...prev, assetFile: file }));
      } else {
        alert('Please select a GIF, PNG, or MP4 file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetFile) {
      alert('Please select an asset file');
      return;
    }

    setLoading(true);

    try {
      await assetServiceUploadAsset({
        body: {
          name: formData.name,
          category: formData.category,
          is_public: formData.isPublic,
          asset_file: formData.assetFile
        }
      });

      setUploaded(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Asset upload error:', error);
      alert('Failed to upload asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="bg-white/10 border-white/20 max-w-md text-center">
          <CardContent className="p-8">
            <CircleCheck className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Asset Uploaded!</h2>
            <p className="text-gray-300">Your asset is now available for use in collaborations.</p>
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
            <CardTitle className="text-2xl font-bold text-white">Upload Asset</CardTitle>
            <CardDescription className="text-gray-300">
              Add new overlay animations, creatures, or effects to the MagicLens library.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Asset File Upload */}
              <div className="space-y-2">
                <Label htmlFor="asset" className="text-white">Asset File</Label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <Label htmlFor="asset" className="cursor-pointer">
                    <span className="text-white hover:text-yellow-400">
                      Click to upload your asset
                    </span>
                    <p className="text-gray-400 text-sm mt-2">
                      GIF, PNG, or MP4 format • Max 10MB
                    </p>
                    <Input
                      id="asset"
                      type="file"
                      accept="image/gif,image/png,video/mp4"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                  </Label>
                  {formData.assetFile && (
                    <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
                      <p className="text-green-400">Selected: {formData.assetFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        Type: {formData.assetFile.type} • Size: {(formData.assetFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Asset Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Give your asset a descriptive name"
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

              {/* Public/Private Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <Label htmlFor="public" className="text-white font-medium">Make Public</Label>
                  <p className="text-gray-400 text-sm">Allow other artists to use this asset in their collaborations</p>
                </div>
                <Switch
                  id="public"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
              >
                {loading ? 'Uploading...' : 'Upload Asset'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-purple-500/20 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Asset Guidelines</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Use transparent backgrounds for PNG files</li>
                <li>• GIFs should loop smoothly for best effect</li>
                <li>• Keep file sizes under 10MB for faster loading</li>
                <li>• Create assets that complement various environments</li>
                <li>• Consider how your asset will look at different sizes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}