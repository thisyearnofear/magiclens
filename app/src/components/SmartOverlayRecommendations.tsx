import { Sparkles, Brain, TrendingUp, Palette, Play, Clock, Layers, Zap, CircleCheck, Loader } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { 
  aiAnalysisServiceAnalyzeVideoForOverlays,
  aiAnalysisServiceGetSmartOverlayRecommendations,
  recommendationEngineGetVideoOverlayRecommendations,
  collaborationServiceAddOverlayToCollaboration,
  collaborationServiceStartCollaboration
} from '@/lib/sdk';

interface SmartOverlayRecommendationsProps {
  videoId: string;
  videoDuration: number;
  onOverlayApplied?: (overlayData: any) => void;
  onCollaborationCreated?: (collaborationId: string) => void;
}

interface RecommendationItem {
  asset: {
    id: string;
    name: string;
    file_path: string;
    thumbnail_path?: string;
    category: string;
    asset_type: string;
    tags?: string;
  };
  artist_name: string;
  placement: {
    position: {
      x: number;
      y: number;
      scaleX: number;
      scaleY: number;
      angle: number;
    };
    timing: {
      startTime: number;
      endTime: number;
      fadeIn: number;
      fadeOut: number;
    };
    layerOrder: number;
  };
  confidence_score: number;
  personalization_score?: number;
  reasoning: string;
}

interface VideoAnalysis {
  scene_type: string;
  primary_activity: string;
  mood: string;
  motion_level: string;
  complexity_score: number;
  tags: string[];
}

export default function SmartOverlayRecommendations({
  videoId,
  videoDuration,
  onOverlayApplied,
  onCollaborationCreated
}: SmartOverlayRecommendationsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [appliedOverlays, setAppliedOverlays] = useState<Set<string>>(new Set());
  const [recommendationType, setRecommendationType] = useState<'smart' | 'personalized' | 'trending'>('smart');

  // Auto-analyze video on component mount
  useEffect(() => {
    analyzeVideo();
  }, [videoId]);

  // Load recommendations when analysis completes
  useEffect(() => {
    if (analysis) {
      loadRecommendations();
    }
  }, [analysis, recommendationType]);

  const analyzeVideo = async () => {
    setIsAnalyzing(true);
    try {
      const result = await aiAnalysisServiceAnalyzeVideoForOverlays({
        body: { video_id: videoId }
      });
      
      if (result.data) {
        setAnalysis(result.data as VideoAnalysis);
      }
    } catch (error) {
      console.error('Failed to analyze video:', error);
      // Set fallback analysis
      setAnalysis({
        scene_type: 'general',
        primary_activity: 'unknown',
        mood: 'neutral',
        motion_level: 'medium',
        complexity_score: 0.5,
        tags: ['general', 'neutral']
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const result = await recommendationEngineGetVideoOverlayRecommendations({
        body: {
          video_id: videoId,
          recommendation_type: recommendationType,
          limit: 5
        }
      });
      
      if (result.data && result.data.recommendations) {
        setRecommendations(result.data.recommendations as RecommendationItem[]);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      // Load fallback recommendations
      const fallbackResult = await aiAnalysisServiceGetSmartOverlayRecommendations({
        body: { video_id: videoId, limit: 5 }
      });
      
      if (fallbackResult.data) {
        setRecommendations(fallbackResult.data as RecommendationItem[]);
      }
    }
  };

  const applyOverlay = async (recommendation: RecommendationItem) => {
    const assetId = recommendation.asset.id;
    setIsApplying(assetId);
    
    try {
      // First, start a collaboration if one doesn't exist
      const collaboration = await collaborationServiceStartCollaboration({
        body: {
          video_id: videoId,
          revenue_split: 0.7 // 70% to artist, 30% to videographer
        }
      });

      if (collaboration.data?.id) {
        // Add the overlay to the collaboration with AI-generated placement
        const overlay = await collaborationServiceAddOverlayToCollaboration({
          body: {
            collaboration_id: collaboration.data.id,
            asset_id: assetId,
            position_data: recommendation.placement.position,
            timing_data: recommendation.placement.timing,
            layer_order: recommendation.placement.layerOrder
          }
        });

        if (overlay.data) {
          setAppliedOverlays(prev => new Set([...prev, assetId]));
          onOverlayApplied?.({
            overlay: overlay.data,
            recommendation,
            collaboration: collaboration.data
          });
          onCollaborationCreated?.(collaboration.data.id);
        }
      }
    } catch (error) {
      console.error('Failed to apply overlay:', error);
    } finally {
      setIsApplying(null);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.6) return 'Good Match';
    return 'Fair Match';
  };

  return (
    <div className="space-y-6">
      {/* Video Analysis Results */}
      {isAnalyzing ? (
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader className="h-5 w-5 animate-spin text-yellow-400" />
              <span className="text-white">AI analyzing your video content...</span>
            </div>
          </CardContent>
        </Card>
      ) : analysis && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Brain className="h-5 w-5 text-yellow-400" />
              <span>AI Content Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Scene Type</p>
                <p className="text-white font-medium capitalize">{analysis.scene_type}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Activity</p>
                <p className="text-white font-medium capitalize">{analysis.primary_activity}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Mood</p>
                <p className="text-white font-medium capitalize">{analysis.mood}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Motion Level</p>
                <p className="text-white font-medium capitalize">{analysis.motion_level}</p>
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-2">Content Tags</p>
              <div className="flex flex-wrap gap-2">
                {analysis.tags.slice(0, 6).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-yellow-400 border-yellow-400/30">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation Type Selector */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <span>Smart Overlay Suggestions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Button
              variant={recommendationType === 'smart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecommendationType('smart')}
              className={recommendationType === 'smart' ? 'bg-yellow-400 text-black' : ''}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Matched
            </Button>
            <Button
              variant={recommendationType === 'personalized' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecommendationType('personalized')}
              className={recommendationType === 'personalized' ? 'bg-yellow-400 text-black' : ''}
            >
              <Palette className="h-4 w-4 mr-2" />
              Personal
            </Button>
            <Button
              variant={recommendationType === 'trending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecommendationType('trending')}
              className={recommendationType === 'trending' ? 'bg-yellow-400 text-black' : ''}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </Button>
          </div>
          
          {/* Recommendations List */}
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Loading smart recommendations...</p>
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <Card 
                  key={rec.asset.id} 
                  className={`bg-white/5 border-white/10 transition-all hover:bg-white/10 ${
                    selectedRecommendation === rec.asset.id ? 'ring-2 ring-yellow-400/50' : ''
                  }`}
                  onClick={() => setSelectedRecommendation(rec.asset.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* Asset Preview */}
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-lg flex items-center justify-center">
                        {rec.asset.thumbnail_path ? (
                          <img 
                            src={rec.asset.thumbnail_path} 
                            alt={rec.asset.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Layers className="h-8 w-8 text-yellow-400" />
                        )}
                      </div>
                      
                      {/* Asset Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-medium">{rec.asset.name}</h4>
                            <p className="text-gray-400 text-sm">by {rec.artist_name}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {rec.asset.category}
                            </Badge>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-sm font-medium ${getConfidenceColor(rec.confidence_score)}`}>
                              {(rec.confidence_score * 100).toFixed(0)}% match
                            </div>
                            <div className={`text-xs ${getConfidenceColor(rec.confidence_score)}`}>
                              {getConfidenceLabel(rec.confidence_score)}
                            </div>
                          </div>
                        </div>
                        
                        {/* AI Reasoning */}
                        <p className="text-gray-300 text-sm mt-2">{rec.reasoning}</p>
                        
                        {/* Placement Preview */}
                        <div className="flex items-center space-x-4 mt-3 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{rec.placement.timing.startTime.toFixed(1)}s - {rec.placement.timing.endTime.toFixed(1)}s</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Layers className="h-3 w-3" />
                            <span>Layer {rec.placement.layerOrder}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Apply Button */}
                      <div className="flex flex-col space-y-2">
                        {appliedOverlays.has(rec.asset.id) ? (
                          <Button size="sm" disabled className="bg-green-600">
                            <CircleCheck className="h-4 w-4 mr-2" />
                            Applied
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              applyOverlay(rec);
                            }}
                            disabled={!!isApplying}
                            className="bg-yellow-400 text-black hover:bg-yellow-500"
                          >
                            {isApplying === rec.asset.id ? (
                              <Loader className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4 mr-2" />
                            )}
                            {isApplying === rec.asset.id ? 'Applying...' : 'Apply'}
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Preview overlay without applying
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {recommendations.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
              <div className="flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-yellow-400 font-medium text-sm">One-Tap Magic</h4>
                  <p className="text-gray-300 text-sm mt-1">
                    These overlays are automatically positioned and timed based on AI analysis of your video content. 
                    Simply click "Apply" to instantly add professional overlays to your video.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}