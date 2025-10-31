import React, { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles, Brain, TrendingUp, Palette, Play, Clock, Layers, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GifOverlay, AssetOverlay, OverlayItem } from '@/types/overlay';

interface OverlaySelectorProps {
    videoId?: string;
    videoDuration?: number;
    onSelectOverlay: (overlay: OverlayItem) => void;
    onCollaborationCreated?: (collaborationId: string) => void;
}

export const OverlaySelector: React.FC<OverlaySelectorProps> = ({
    videoId,
    videoDuration,
    onSelectOverlay,
    onCollaborationCreated
}) => {
    // State management
    const [activeTab, setActiveTab] = useState<'smart' | 'gifs' | 'assets'>('smart');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // GIF search state
    const [query, setQuery] = useState('');
    const [gifs, setGifs] = useState<GifOverlay[]>([]);
    const [smartGifs, setSmartGifs] = useState<GifOverlay[]>([]);

    // Asset recommendations state
    const [recommendations, setRecommendations] = useState<AssetOverlay[]>([]);
    const [analysisComplete, setAnalysisComplete] = useState(false);

    // Load smart recommendations on mount
    useEffect(() => {
        if (videoId && activeTab === 'smart') {
            loadSmartRecommendations();
        }
    }, [videoId, activeTab]);

    // Load smart GIFs when switching to GIF tab
    useEffect(() => {
        if (videoId && activeTab === 'gifs') {
            loadSmartGifs();
        }
    }, [videoId, activeTab]);

    const loadSmartRecommendations = async () => {
        if (!videoId) return;

        setLoading(true);
        try {
            // First analyze video
            const analysisResponse = await fetch('/api/ai_analysis_service/analyze_video_for_overlays', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ video_id: videoId })
            });

            if (analysisResponse.ok) {
                setAnalysisComplete(true);

                // Get recommendations
                const recResponse = await fetch('/api/ai_analysis_service/get_smart_overlay_recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ video_id: videoId, limit: 10 })
                });

                const recData = await recResponse.json();
                if (recData.success) {
                    setRecommendations(recData.recommendations || []);
                }
            }
        } catch (err) {
            setError('Failed to load smart recommendations');
        } finally {
            setLoading(false);
        }
    };

    const loadSmartGifs = async () => {
        if (!videoId) return;

        setLoading(true);
        try {
            const response = await fetch('/api/gif_service/get_smart_overlays', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ video_id: videoId })
            });

            const data = await response.json();
            if (data.success) {
                setSmartGifs(data.recommendations || []);
            }
        } catch (err) {
            setError('Failed to load smart GIFs');
        } finally {
            setLoading(false);
        }
    };

    const searchGifs = async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setGifs([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/gif_service/search_overlays', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ query: searchTerm, limit: 20 })
            });

            const data = await response.json();
            if (data.success) {
                setGifs(data.results || []);
            }
        } catch (err) {
            setError('Failed to search GIFs');
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query && activeTab === 'gifs') {
                searchGifs(query);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [query, activeTab]);

    const renderTabContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="animate-spin mr-2" size={24} />
                    <span className="text-gray-300">Loading...</span>
                </div>
            );
        }

        switch (activeTab) {
            case 'smart':
                return (
                    <div className="space-y-4">
                        {!analysisComplete && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Brain size={16} />
                                    <span className="text-sm">AI analyzing your video for optimal overlay placement...</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendations.map((rec, index) => (
                                <Card key={index} className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors"
                                    onClick={() => onSelectOverlay(rec)}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <img
                                                src={rec.asset.thumbnail_path || rec.asset.file_path}
                                                alt={rec.asset.name}
                                                className="w-12 h-12 rounded object-cover"
                                            />
                                            <div className="flex-1">
                                                <h4 className="text-white font-medium text-sm">{rec.asset.name}</h4>
                                                <Badge variant="secondary" className="text-xs">
                                                    {Math.round(rec.confidence * 100)}% match
                                                </Badge>
                                            </div>
                                        </div>
                                        <p className="text-gray-400 text-xs">{rec.reasoning}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                );

            case 'gifs':
                const gifsToShow = query ? gifs : smartGifs;
                return (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search for GIF overlays..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {gifsToShow.map((gif) => (
                                <div key={gif.id}
                                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => onSelectOverlay(gif)}>
                                    <img src={gif.preview_url} alt={gif.title} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                        <p className="text-white text-xs truncate">{gif.title}</p>
                                        <p className="text-gray-300 text-xs">{gif.source}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Layers size={20} />
                    Select Overlay
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-4">
                    <Button
                        variant={activeTab === 'smart' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab('smart')}
                        className="flex items-center gap-2"
                    >
                        <Sparkles size={16} />
                        AI Recommended
                    </Button>
                    <Button
                        variant={activeTab === 'gifs' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab('gifs')}
                        className="flex items-center gap-2"
                    >
                        <Search size={16} />
                        GIF Search
                    </Button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Tab Content */}
                {renderTabContent()}
            </CardContent>
        </Card>
    );
};