import React, { useState, useEffect } from 'react';
import { Play, Camera, MapPin, Clock, User, ExternalLink } from 'lucide-react';
import { EnvironmentalVideo, EnvironmentalCategory } from '@/types/overlay';

interface EnvironmentalFootageGalleryProps {
    onVideoSelect?: (video: EnvironmentalVideo) => void;
    showAsInspiration?: boolean;
}

export const EnvironmentalFootageGallery: React.FC<EnvironmentalFootageGalleryProps> = ({
    onVideoSelect,
    showAsInspiration = true
}) => {
    const [videos, setVideos] = useState<EnvironmentalVideo[]>([]);
    const [categories, setCategories] = useState<EnvironmentalCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCategories();
        loadVideos();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await fetch('/api/pexels_service/get_environmental_categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setCategories(data.categories || []);
            }
        } catch (err) {
            console.error('Error loading categories:', err);
        }
    };

    const loadVideos = async (category?: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/pexels_service/get_environmental_inspiration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    category: category,
                    limit: 20
                })
            });

            const data = await response.json();
            if (data.success) {
                setVideos(data.results || []);
            } else {
                setError(data.error || 'Failed to load videos');
            }
        } catch (err) {
            setError('Failed to load environmental footage');
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
        loadVideos(category);
    };

    const handleVideoSelect = (video: EnvironmentalVideo) => {
        if (onVideoSelect) {
            onVideoSelect(video);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                    {showAsInspiration ? 'Environmental Footage Inspiration' : 'Browse Environmental Videos'}
                </h2>
                <p className="text-gray-300 mb-4">
                    {showAsInspiration
                        ? 'Get inspired by professional environmental footage. See what makes great content for AR overlays.'
                        : 'Browse environmental videos to understand what works best for magical overlays.'
                    }
                </p>

                {/* Attribution */}
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <Camera size={16} />
                    <span>Videos provided by</span>
                    <a
                        href="https://www.pexels.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                        Pexels <ExternalLink size={12} />
                    </a>
                </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => {
                            setSelectedCategory(null);
                            loadVideos();
                        }}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${!selectedCategory
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        All Categories
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.name}
                            onClick={() => handleCategorySelect(category.name)}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${selectedCategory === category.name
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            title={category.description}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-300">Loading environmental footage...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                    <p className="text-red-400">Error: {error}</p>
                </div>
            )}

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                    <div
                        key={video.id}
                        className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer group"
                        onClick={() => handleVideoSelect(video)}
                    >
                        <div className="relative aspect-video">
                            <img
                                src={video.preview_url}
                                alt={video.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="text-white" size={32} />
                            </div>

                            {/* Duration Badge */}
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <Clock size={12} />
                                {formatDuration(video.duration)}
                            </div>
                        </div>

                        <div className="p-4">
                            <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">
                                {video.title}
                            </h3>

                            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                                <User size={12} />
                                <span>{video.photographer}</span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                                <MapPin size={12} />
                                <span>{video.width}×{video.height}</span>
                            </div>

                            {showAsInspiration && (
                                <div className="mt-3 text-xs text-blue-400">
                                    Click to see why this works well for AR overlays
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* No Results */}
            {!loading && videos.length === 0 && (
                <div className="text-center p-12 text-gray-400">
                    <Camera size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No environmental footage found</p>
                    <p className="text-sm">Try selecting a different category</p>
                </div>
            )}
        </div>
    );
};