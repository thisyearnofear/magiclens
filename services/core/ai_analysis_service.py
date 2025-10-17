from typing import Dict, List, Optional, Tuple
from uuid import UUID
import json
from datetime import datetime
from core.user import User
from core.access import authenticated, public
# TODO: Import AI/LLM functionality when available
from core.videos import Video
from core.artist_assets import ArtistAsset
import base64
import cv2
import numpy as np
from PIL import Image
import io

class VideoAnalyzer:
    """AI-powered video content analysis for smart overlay recommendations."""
    
    def __init__(self):
        # self.openai = OpenAI()  # TODO: Initialize when available
        self.analysis_cache = {}  # In production, use Redis
    
    def analyze_video_content(self, video_path: str, video_duration: float) -> Dict:
        """Analyze video content using AI vision models."""
        
        # Check cache first
        cache_key = f"analysis_{hash(video_path)}_{video_duration}"
        if cache_key in self.analysis_cache:
            return self.analysis_cache[cache_key]
        
        try:
            # Extract key frames for analysis
            frames = self._extract_key_frames(video_path, num_frames=3)
            
            # Analyze each frame with AI
            frame_analyses = []
            for i, frame in enumerate(frames):
                timestamp = (i / (len(frames) - 1)) * video_duration
                analysis = self._analyze_single_frame(frame, timestamp)
                frame_analyses.append(analysis)
            
            # Synthesize overall video analysis
            video_analysis = self._synthesize_video_analysis(frame_analyses, video_duration)
            
            # Cache the result
            self.analysis_cache[cache_key] = video_analysis
            
            return video_analysis
            
        except Exception as e:
            # Fallback to basic analysis if AI fails
            return self._fallback_analysis(video_duration)
    
    def _extract_key_frames(self, video_path: str, num_frames: int = 3) -> List[np.ndarray]:
        """Extract evenly spaced frames from video for analysis."""
        
        # For now, return placeholder frames
        # In production, this would use OpenCV to extract actual frames
        frames = []
        
        # Create placeholder frames (would be replaced with actual video frame extraction)
        for i in range(num_frames):
            # Placeholder: create a simple gradient image
            frame = np.random.rand(480, 640, 3) * 255
            frames.append(frame.astype(np.uint8))
        
        return frames
    
    def _analyze_single_frame(self, frame: np.ndarray, timestamp: float) -> Dict:
        """Analyze a single video frame using AI vision."""
        
        try:
            # Convert frame to base64 for API
            frame_pil = Image.fromarray(frame)
            buffer = io.BytesIO()
            frame_pil.save(buffer, format='JPEG', quality=85)
            frame_b64 = base64.b64encode(buffer.getvalue()).decode()
            
            # TODO: Replace with actual AI analysis when LLM integration is available
            # For now, return mock analysis based on simple heuristics
            
            # Mock analysis based on frame content
            analysis = {
                'timestamp': timestamp,
                'scene_type': 'general',
                'activity': 'unknown',
                'mood': 'neutral',
                'objects': ['background'],
                'people_count': 1,
                'motion_level': 'medium',
                'color_palette': ['blue', 'white'],
                'overlay_zones': {
                    'safe_areas': [[50, 50, 200, 100], [400, 300, 150, 80]],
                    'avoid_areas': [[200, 150, 240, 180]]
                }
            }
            
            return analysis
            
        except Exception as e:
            # Fallback analysis if AI fails
            return {
                'timestamp': timestamp,
                'scene_type': 'unknown',
                'activity': 'general',
                'mood': 'neutral',
                'objects': [],
                'people_count': 1,
                'motion_level': 'medium',
                'color_palette': ['blue', 'white'],
                'overlay_zones': {
                    'safe_areas': [[50, 50, 200, 100], [400, 300, 150, 80]],
                    'avoid_areas': [[200, 150, 240, 180]]
                },
                'error': str(e)
            }
    
    def _synthesize_video_analysis(self, frame_analyses: List[Dict], duration: float) -> Dict:
        """Combine frame analyses into overall video understanding."""
        
        # Extract common themes
        scene_types = [f.get('scene_type', 'unknown') for f in frame_analyses]
        activities = [f.get('activity', 'general') for f in frame_analyses]
        moods = [f.get('mood', 'neutral') for f in frame_analyses]
        motion_levels = [f.get('motion_level', 'medium') for f in frame_analyses]
        
        # Find most common values
        dominant_scene = max(set(scene_types), key=scene_types.count)
        dominant_activity = max(set(activities), key=activities.count)
        dominant_mood = max(set(moods), key=moods.count)
        dominant_motion = max(set(motion_levels), key=motion_levels.count)
        
        # Collect all objects and colors
        all_objects = []
        all_colors = []
        for frame in frame_analyses:
            all_objects.extend(frame.get('objects', []))
            all_colors.extend(frame.get('color_palette', []))
        
        # Calculate average people count
        people_counts = [f.get('people_count', 0) for f in frame_analyses]
        avg_people = sum(people_counts) / len(people_counts) if people_counts else 0
        
        # Determine video complexity
        complexity = self._calculate_complexity(frame_analyses, duration)
        
        return {
            'video_id': None,  # Will be set by caller
            'duration': duration,
            'scene_type': dominant_scene,
            'primary_activity': dominant_activity,
            'mood': dominant_mood,
            'motion_level': dominant_motion,
            'objects': list(set(all_objects)),  # Unique objects
            'color_palette': list(set(all_colors)),  # Unique colors
            'people_count': round(avg_people),
            'complexity_score': complexity,
            'frame_analyses': frame_analyses,
            'analyzed_at': datetime.now().isoformat(),
            'tags': self._generate_content_tags(dominant_scene, dominant_activity, dominant_mood),
            'overlay_recommendations': self._generate_overlay_suggestions(
                dominant_scene, dominant_activity, dominant_mood, duration
            )
        }
    
    def _calculate_complexity(self, frame_analyses: List[Dict], duration: float) -> float:
        """Calculate video complexity score (0-1) for overlay recommendation."""
        
        factors = {
            'motion': 0,
            'objects': 0,
            'people': 0,
            'duration': 0
        }
        
        # Motion complexity
        motion_levels = [f.get('motion_level', 'medium') for f in frame_analyses]
        high_motion_count = motion_levels.count('high')
        factors['motion'] = high_motion_count / len(motion_levels)
        
        # Object complexity
        avg_objects = sum(len(f.get('objects', [])) for f in frame_analyses) / len(frame_analyses)
        factors['objects'] = min(avg_objects / 10, 1.0)  # Normalize to 0-1
        
        # People complexity
        avg_people = sum(f.get('people_count', 0) for f in frame_analyses) / len(frame_analyses)
        factors['people'] = min(avg_people / 5, 1.0)  # Normalize to 0-1
        
        # Duration complexity (longer videos are harder to overlay)
        factors['duration'] = min(duration / 30, 1.0)  # Normalize to 0-1 for 30s max
        
        # Weighted average
        weights = {'motion': 0.3, 'objects': 0.3, 'people': 0.2, 'duration': 0.2}
        complexity = sum(factors[key] * weights[key] for key in factors)
        
        return round(complexity, 3)
    
    def _generate_content_tags(self, scene_type: str, activity: str, mood: str) -> List[str]:
        """Generate searchable tags for content matching."""
        
        tags = [scene_type, activity, mood]
        
        # Add related tags
        tag_expansions = {
            'outdoor': ['nature', 'adventure', 'travel'],
            'indoor': ['cozy', 'intimate', 'personal'],
            'dancing': ['music', 'rhythm', 'movement', 'celebration'],
            'cooking': ['food', 'kitchen', 'recipe', 'lifestyle'],
            'energetic': ['dynamic', 'upbeat', 'vibrant'],
            'calm': ['peaceful', 'serene', 'relaxing'],
            'celebration': ['party', 'joy', 'festive']
        }
        
        for tag in tags:
            if tag in tag_expansions:
                tags.extend(tag_expansions[tag])
        
        return list(set(tags))  # Remove duplicates
    
    def _generate_overlay_suggestions(self, scene_type: str, activity: str, mood: str, duration: float) -> Dict:
        """Generate specific overlay placement and timing suggestions."""
        
        return {
            'placement_style': self._get_placement_style(activity, mood),
            'timing_pattern': self._get_timing_pattern(activity, duration),
            'scale_range': self._get_scale_range(scene_type),
            'animation_speed': self._get_animation_speed(mood),
            'layer_suggestions': self._get_layer_suggestions(activity)
        }
    
    def _get_placement_style(self, activity: str, mood: str) -> str:
        """Determine optimal overlay placement style."""
        
        if activity in ['dancing', 'sports', 'exercise']:
            return 'dynamic_follow'  # Follow movement
        elif mood in ['calm', 'serene']:
            return 'static_corner'   # Subtle corner placement
        elif mood in ['energetic', 'celebration']:
            return 'center_burst'    # Bold center placement
        else:
            return 'balanced_edge'   # Safe edge placement
    
    def _get_timing_pattern(self, activity: str, duration: float) -> Dict:
        """Determine optimal overlay timing."""
        
        if activity in ['dancing', 'music']:
            return {
                'pattern': 'rhythmic',
                'intervals': [0.5, 1.0, 1.5],  # Beat-based timing
                'duration_per_overlay': min(2.0, duration / 3)
            }
        elif activity in ['talking', 'presentation']:
            return {
                'pattern': 'emphasis',
                'intervals': [duration * 0.2, duration * 0.7],  # Key moments
                'duration_per_overlay': 3.0
            }
        else:
            return {
                'pattern': 'steady',
                'intervals': [duration * 0.1, duration * 0.5, duration * 0.8],
                'duration_per_overlay': min(4.0, duration / 2)
            }
    
    def _get_scale_range(self, scene_type: str) -> Tuple[float, float]:
        """Determine appropriate overlay scale range."""
        
        if scene_type == 'close_up':
            return (0.3, 0.7)  # Smaller overlays for close shots
        elif scene_type == 'wide_shot':
            return (0.8, 1.5)  # Larger overlays for wide shots
        else:
            return (0.5, 1.0)  # Default range
    
    def _get_animation_speed(self, mood: str) -> str:
        """Determine overlay animation speed based on mood."""
        
        speed_map = {
            'energetic': 'fast',
            'upbeat': 'fast',
            'calm': 'slow',
            'serene': 'slow',
            'dramatic': 'medium',
            'playful': 'fast'
        }
        
        return speed_map.get(mood, 'medium')
    
    def _get_layer_suggestions(self, activity: str) -> Dict:
        """Suggest optimal layer count and arrangement."""
        
        if activity in ['celebration', 'party']:
            return {
                'max_layers': 3,
                'arrangement': 'scattered',
                'priority': 'background_fill'
            }
        elif activity in ['talking', 'presentation']:
            return {
                'max_layers': 1,
                'arrangement': 'single_accent',
                'priority': 'emphasis'
            }
        else:
            return {
                'max_layers': 2,
                'arrangement': 'balanced',
                'priority': 'enhancement'
            }
    
    def _fallback_analysis(self, duration: float) -> Dict:
        """Provide basic analysis when AI processing fails."""
        
        return {
            'video_id': None,
            'duration': duration,
            'scene_type': 'general',
            'primary_activity': 'unknown',
            'mood': 'neutral',
            'motion_level': 'medium',
            'objects': [],
            'color_palette': ['blue', 'white'],
            'people_count': 1,
            'complexity_score': 0.5,
            'frame_analyses': [],
            'analyzed_at': datetime.now().isoformat(),
            'tags': ['general', 'neutral', 'standard'],
            'overlay_recommendations': {
                'placement_style': 'balanced_edge',
                'timing_pattern': {
                    'pattern': 'steady',
                    'intervals': [duration * 0.3, duration * 0.7],
                    'duration_per_overlay': 3.0
                },
                'scale_range': (0.5, 1.0),
                'animation_speed': 'medium',
                'layer_suggestions': {
                    'max_layers': 2,
                    'arrangement': 'balanced',
                    'priority': 'enhancement'
                }
            },
            'fallback': True
        }

# Service functions for integration with existing system

@authenticated 
def analyze_video_for_overlays(user: User, video_id: UUID) -> Dict:
    """Analyze a video and return AI-powered overlay recommendations."""
    
    # Get video details
    videos_data = Video.sql(
        "SELECT * FROM videos WHERE id = %(video_id)s AND uploader_id = %(user_id)s",
        {"video_id": video_id, "user_id": user.id}
    )
    
    if not videos_data:
        raise ValueError("Video not found or access denied")
    
    video = Video(**videos_data[0])
    
    # Perform AI analysis
    analyzer = VideoAnalyzer()
    analysis = analyzer.analyze_video_content(video.file_path, video.duration)
    analysis['video_id'] = str(video_id)
    
    return analysis

@authenticated
def get_smart_overlay_recommendations(user: User, video_id: UUID, limit: int = 5) -> List[Dict]:
    """Get AI-recommended overlays for a specific video."""
    
    # Get video analysis
    analysis = analyze_video_for_overlays(user, video_id)
    
    # Find matching assets based on tags and content
    content_tags = analysis.get('tags', [])
    mood = analysis.get('mood', 'neutral')
    scene_type = analysis.get('scene_type', 'general')
    activity = analysis.get('primary_activity', 'unknown')
    
    # Build smart query for asset matching
    tag_conditions = []
    for tag in content_tags[:3]:  # Use top 3 tags
        tag_conditions.append(f"tags LIKE '%{tag}%'")
    
    tag_query = " OR ".join(tag_conditions) if tag_conditions else "1=1"
    
    # Get matching assets
    assets_data = ArtistAsset.sql(
        f"""
        SELECT a.*, u.display_name as artist_name
        FROM artist_assets a
        JOIN users u ON a.uploader_id = u.id
        WHERE a.status = 'approved' AND ({tag_query})
        ORDER BY 
            CASE 
                WHEN a.tags LIKE %(mood)s THEN 3
                WHEN a.tags LIKE %(scene_type)s THEN 2  
                WHEN a.tags LIKE %(activity)s THEN 2
                ELSE 1
            END DESC,
            a.created_at DESC
        LIMIT %(limit)s
        """,
        {
            "mood": f"%{mood}%",
            "scene_type": f"%{scene_type}%", 
            "activity": f"%{activity}%",
            "limit": limit
        }
    )
    
    # Generate recommendations with AI placement
    recommendations = []
    overlay_suggestions = analysis.get('overlay_recommendations', {})
    
    for i, asset_data in enumerate(assets_data):
        asset = ArtistAsset(**asset_data)
        
        # Generate smart placement for this asset
        placement = _generate_smart_placement(
            asset, analysis, i, overlay_suggestions
        )
        
        recommendations.append({
            'asset': asset.__dict__,
            'artist_name': asset_data['artist_name'],
            'placement': placement,
            'confidence_score': _calculate_match_confidence(asset, analysis),
            'reasoning': _generate_recommendation_reasoning(asset, analysis)
        })
    
    return recommendations

def _generate_smart_placement(asset: ArtistAsset, analysis: Dict, index: int, suggestions: Dict) -> Dict:
    """Generate smart overlay placement based on AI analysis."""
    
    duration = analysis.get('duration', 10)
    timing_pattern = suggestions.get('timing_pattern', {})
    placement_style = suggestions.get('placement_style', 'balanced_edge')
    scale_range = suggestions.get('scale_range', (0.5, 1.0))
    
    # Calculate position based on placement style
    if placement_style == 'center_burst':
        position = {'x': 400, 'y': 225}  # Center of 800x450
    elif placement_style == 'static_corner':
        corners = [
            {'x': 50, 'y': 50},      # Top-left
            {'x': 650, 'y': 50},     # Top-right  
            {'x': 50, 'y': 350},     # Bottom-left
            {'x': 650, 'y': 350}     # Bottom-right
        ]
        position = corners[index % len(corners)]
    else:  # balanced_edge or default
        positions = [
            {'x': 100, 'y': 100},
            {'x': 600, 'y': 150}, 
            {'x': 150, 'y': 300},
            {'x': 550, 'y': 80},
            {'x': 200, 'y': 200}
        ]
        position = positions[index % len(positions)]
    
    # Calculate timing
    intervals = timing_pattern.get('intervals', [duration * 0.3, duration * 0.7])
    overlay_duration = timing_pattern.get('duration_per_overlay', 3.0)
    
    start_time = intervals[index % len(intervals)]
    end_time = min(start_time + overlay_duration, duration)
    
    # Calculate scale
    scale = scale_range[0] + (index * 0.1) % (scale_range[1] - scale_range[0])
    
    return {
        'position': {
            'x': position['x'],
            'y': position['y'],
            'scaleX': scale,
            'scaleY': scale,
            'angle': 0
        },
        'timing': {
            'startTime': round(start_time, 1),
            'endTime': round(end_time, 1),
            'fadeIn': 0.3,
            'fadeOut': 0.3
        },
        'layerOrder': index + 1
    }

def _calculate_match_confidence(asset: ArtistAsset, analysis: Dict) -> float:
    """Calculate how well an asset matches the video content."""
    
    confidence = 0.0
    video_tags = set(analysis.get('tags', []))
    asset_tags = set(asset.tags if asset.tags else [])
    
    # Tag overlap
    if video_tags and asset_tags:
        overlap = len(video_tags.intersection(asset_tags))
        confidence += (overlap / len(video_tags)) * 0.6
    
    # Mood matching
    video_mood = analysis.get('mood', '').lower()
    if video_mood and asset.tags and video_mood in asset.tags.lower():
        confidence += 0.3
    
    # Activity matching  
    video_activity = analysis.get('primary_activity', '').lower()
    if video_activity and asset.tags and video_activity in asset.tags.lower():
        confidence += 0.2
    
    # Base confidence for approved assets
    confidence += 0.1
    
    return min(round(confidence, 3), 1.0)

def _generate_recommendation_reasoning(asset: ArtistAsset, analysis: Dict) -> str:
    """Generate human-readable reasoning for the recommendation."""
    
    video_mood = analysis.get('mood', 'neutral')
    video_activity = analysis.get('primary_activity', 'general')
    scene_type = analysis.get('scene_type', 'standard')
    
    reasons = []
    
    if asset.tags:
        asset_tags = asset.tags.lower()
        if video_mood in asset_tags:
            reasons.append(f"matches {video_mood} mood")
        if video_activity in asset_tags:
            reasons.append(f"fits {video_activity} activity")
        if scene_type in asset_tags:
            reasons.append(f"works with {scene_type} setting")
    
    if not reasons:
        reasons.append("popular choice for similar videos")
    
    return f"Great fit because it {' and '.join(reasons)}."