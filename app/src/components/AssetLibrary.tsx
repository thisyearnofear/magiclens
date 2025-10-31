import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetServiceGetAssets, assetServiceSearchAssets, assetServiceGetAssetCategories } from '@/lib/sdk';
import { ArtistAsset } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft, Palette, Zap } from 'lucide-react';

export default function AssetLibrary() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<ArtistAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'creatures', 'effects', 'objects', 'text', 'decorations'];

  useEffect(() => {
    loadAssets();
  }, [selectedCategory]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const response = await assetServiceGetAssets({
        body: {
          category: selectedCategory === 'all' ? null : selectedCategory,
          artist_id: null,
          limit: 50,
          offset: 0
        }
      });

      if (response.data) {
        setAssets(response.data);
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadAssets();
      return;
    }

    setLoading(true);
    try {
      const response = await assetServiceSearchAssets({
        body: {
          query: searchQuery,
          category: selectedCategory === 'all' ? null : selectedCategory,
          limit: 50
        }
      });

      if (response.data) {
        setAssets(response.data);
      }
    } catch (error) {
      console.error('Error searching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAssetPreview = (asset: ArtistAsset) => {
    if (asset.asset_type === 'gif' || asset.asset_type === 'png') {
      return (
        <img
          src={asset.file_path}
          alt={asset.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      );
    } else if (asset.asset_type === 'mp4') {
      return (
        <video
          src={asset.file_path}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Palette className="h-12 w-12 text-gray-400" />
        </div>
      );
    }
  };

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
                <h1 className="text-xl font-bold text-white">Asset Library</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} className="bg-yellow-400 text-black hover:bg-yellow-500">
              Search
            </Button>
          </div>
        </div>

        {/* Asset Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {[...Array(24)].map((_, i) => (
              <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-600 rounded-t-lg"></div>
                  <div className="p-2 space-y-1">
                    <div className="h-3 bg-gray-600 rounded"></div>
                    <div className="h-2 bg-gray-600 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : assets.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Assets Found</h3>
              <p className="text-gray-400 mb-4">
                {searchQuery ? 'Try adjusting your search terms or filters.' : 'No assets available in this category.'}
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); loadAssets(); }}>
                View All Assets
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {assets.map((asset) => (
              <Card key={asset.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors group cursor-pointer">
                <CardContent className="p-0">
                  {/* Asset Preview */}
                  <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-t-lg overflow-hidden">
                    {renderAssetPreview(asset)}
                  </div>

                  {/* Asset Info */}
                  <div className="p-2">
                    <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{asset.name}</h3>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {asset.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {asset.asset_type.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="mt-1">
                      <span className="text-xs text-gray-400">{asset.usage_count} uses</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {assets.length > 0 && assets.length % 50 === 0 && (
          <div className="text-center mt-8">
            <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              Load More Assets
            </Button>
          </div>
        )}

        {/* Upload Asset CTA */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-white/10">
            <CardContent className="p-8">
              <Palette className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Share Your Creativity</h3>
              <p className="text-gray-300 mb-4">
                Upload your own assets and help other creators bring their visions to life.
              </p>
              <Button
                onClick={() => navigate('/upload-asset')}
                className="bg-yellow-400 text-black hover:bg-yellow-500"
              >
                Upload Asset
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}