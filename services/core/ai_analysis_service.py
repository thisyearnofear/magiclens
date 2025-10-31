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
import time
from core.computer_vision import (
    normalize_pose_sequence,
    find_pose_sequence_match,
    PoseAnalyzer,
    get_pose_analyzer,
    extract_pose_from_video,
    extract_pose_from_image,
)
from core.pose_cache import (
    get_video_pose_analysis,
    cache_video_pose_analysis,
    get_cached_sequence_match,
    cache_sequence_match,
)
import os


class VideoAnalyzer:
    """AI-powered video content analysis for smart overlay recommendations with pose detection."""

    def __init__(self):
        # self.openai = OpenAI()  # TODO: Initialize when available
        self.analysis_cache = {}  # In production, use Redis
        self.pose_analyzer = get_pose_analyzer()  # Singleton MediaPipe instance

    def analyze_video_content(
        self, video_path: str, video_duration: float, video_id: UUID = None
    ) -> Dict:
        """Analyze video content using AI vision models with database caching."""
        
        # Handle None duration early
        if video_duration is None:
            video_duration = 30.0  # Default 30 seconds

        # Check database cache first if video_id provided
        if video_id:
            try:
                cached_analysis = get_video_pose_analysis(video_id)
                if cached_analysis:
                    print(f"✅ Using cached video analysis for {video_id}")
                    return self._convert_cached_analysis_to_format(cached_analysis, video_duration)
            except Exception as e:
                print(f"Cache lookup failed, proceeding with fresh analysis: {e}")

        # Check memory cache
        cache_key = f"analysis_{hash(video_path)}_{video_duration}"
        if cache_key in self.analysis_cache:
            return self.analysis_cache[cache_key]

        try:
            # Check if video file exists
            if not os.path.exists(video_path):
                print(f"Video file not found: {video_path}")
                return self._fallback_analysis(video_duration)
            
            # Extract key frames for analysis
            frames = self._extract_key_frames(video_path, num_frames=3)

            # Analyze each frame with AI and pose detection
            frame_analyses = []
            pose_sequences = []

            for i, frame in enumerate(frames):
                timestamp = (i / (len(frames) - 1)) * video_duration

                # Extract pose data from frame
                pose_landmarks = self._extract_pose_landmarks_from_frame(frame)
                if pose_landmarks:
                    pose_sequences.append(pose_landmarks)

                # Enhanced frame analysis with pose data
                analysis = self._analyze_single_frame(frame, timestamp, pose_landmarks)
                frame_analyses.append(analysis)

            # Synthesize overall video analysis with pose sequences
            video_analysis = self._synthesize_video_analysis(
                frame_analyses, video_duration, pose_sequences
            )

            # Cache the result
            self.analysis_cache[cache_key] = video_analysis

            return video_analysis

        except Exception as e:
            print(f"Video analysis failed: {e}")
            # Fallback to basic analysis if AI fails
            return self._fallback_analysis(video_duration)

    def _extract_key_frames(self, video_path: str, num_frames: int = 3) -> List[np.ndarray]:
        """Extract evenly spaced frames from video for analysis."""

        frames = []
        try:
            # Use OpenCV to extract actual frames
            cap = cv2.VideoCapture(video_path)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

            if total_frames == 0:
                cap.release()
                return []

            # Calculate frame indices to extract evenly spaced frames
            frame_indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)

            for frame_idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                ret, frame = cap.read()
                if ret:
                    frames.append(frame)

            cap.release()

        except Exception as e:
            print(f"Error extracting frames: {e}")
            # Fallback: create placeholder frames only if real extraction fails
            for i in range(num_frames):
                frame = np.random.rand(480, 640, 3) * 255
                frames.append(frame.astype(np.uint8))

        return frames

    def _analyze_single_frame(
        self, frame: np.ndarray, timestamp: float, pose_landmarks: List[float] = None
    ) -> Dict:
        """Analyze a single video frame using AI vision with pose enhancement."""

        try:
            # Convert frame to base64 for API
            frame_pil = Image.fromarray(frame)
            buffer = io.BytesIO()
            frame_pil.save(buffer, format="JPEG", quality=85)
            frame_b64 = base64.b64encode(buffer.getvalue()).decode()

            # Provider-backed analysis when configured; otherwise fallback heuristics
            import os, json

            api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("AI_API_KEY")
            model = os.getenv("AI_MODEL", "gpt-4o-mini")
            provider_url = os.getenv(
                "AI_PROVIDER_URL", "https://openrouter.ai/api/v1/chat/completions"
            )

            if api_key:
                import httpx, re

                payload = {
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You analyze a single video frame and return JSON with fields: scene_type, activity, mood, objects[], people_count, motion_level, color_palette[], overlay_zones{safe_areas[[x,y,w,h]...], avoid_areas[[x,y,w,h]...]}. Keep responses concise.",
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": f"Analyze this frame at timestamp {round(timestamp, 2)} seconds. Return ONLY JSON.",
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:image/jpeg;base64,{frame_b64}"},
                                },
                            ],
                        },
                    ],
                    "temperature": 0.2,
                }
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                }
                try:
                    with httpx.Client(timeout=20) as client:
                        resp = client.post(provider_url, headers=headers, json=payload)
                        if resp.status_code == 200:
                            data = resp.json()
                            content = (
                                data.get("choices", [{}])[0].get("message", {}).get("content", "")
                            )
                            # Parse JSON from content
                            try:
                                parsed = json.loads(content)
                                parsed["timestamp"] = timestamp
                                return parsed
                            except Exception:
                                m = re.search(r"\{[\s\S]*\}", content)
                                if m:
                                    parsed = json.loads(m.group(0))
                                    parsed["timestamp"] = timestamp
                                    return parsed
                except Exception:
                    # Provider call failed; fall through to heuristics
                    pass

            # Heuristic fallback if provider is not configured or fails
            # Enhanced analysis with pose data
            pose_confidence = (
                self._calculate_pose_confidence(pose_landmarks) if pose_landmarks else 0.0
            )
            movement_type = (
                self._classify_pose_movement(normalize_pose_sequence([pose_landmarks])[0])
                if pose_landmarks
                else "unknown"
            )
            stable_regions = (
                self._identify_stable_body_regions(normalize_pose_sequence([pose_landmarks])[0])
                if pose_landmarks
                else []
            )

            analysis = {
                "timestamp": timestamp,
                "scene_type": "person" if pose_landmarks else "general",
                "activity": movement_type if pose_landmarks else "unknown",
                "mood": "neutral",
                "objects": ["person"] if pose_landmarks else ["background"],
                "people_count": 1 if pose_landmarks else 0,
                "motion_level": self._motion_level_from_movement(movement_type),
                "color_palette": ["blue", "white"],
                "pose_confidence": pose_confidence,
                "stable_regions": stable_regions,
                "overlay_zones": self._calculate_safe_overlay_zones_from_pose(
                    pose_landmarks, frame.shape[1], frame.shape[0]
                )
                if pose_landmarks
                else {
                    "safe_areas": [[50, 50, 200, 100], [400, 300, 150, 80]],
                    "avoid_areas": [[200, 150, 240, 180]],
                },
            }

            return analysis

        except Exception as e:
            # Fallback analysis if AI fails
            return {
                "timestamp": timestamp,
                "scene_type": "unknown",
                "activity": "general",
                "mood": "neutral",
                "objects": [],
                "people_count": 0,
                "motion_level": "medium",
                "color_palette": ["blue", "white"],
                "pose_confidence": 0.0,
                "stable_regions": [],
                "overlay_zones": {
                    "safe_areas": [[50, 50, 200, 100], [400, 300, 150, 80]],
                    "avoid_areas": [[200, 150, 240, 180]],
                },
                "error": str(e),
            }

    def _extract_pose_landmarks_from_frame(self, frame: np.ndarray) -> List[float]:
        """Extract pose landmarks from a frame using MediaPipe."""
        return extract_pose_from_image(frame)

    def _calculate_pose_confidence(self, pose_landmarks: List[float]) -> float:
        """Calculate overall confidence of pose detection."""
        if not pose_landmarks or len(pose_landmarks) < 28:
            return 0.0

        # Extract confidence values (every 4th value starting from index 3)
        confidences = [pose_landmarks[i] for i in range(3, len(pose_landmarks), 4)]
        return sum(confidences) / len(confidences) if confidences else 0.0

    def _classify_pose_movement(self, normalized_pose: List[float]) -> str:
        """Classify the type of movement from normalized pose."""
        if not normalized_pose or len(normalized_pose) < 22:
            return "unknown"

        # Simple movement classification based on pose data
        # In reality, this would be more sophisticated
        try:
            # Calculate spread of limbs (rough measure of activity level)
            limb_spread = sum(abs(val) for val in normalized_pose[6:14])  # Arms data

            if limb_spread > 3.0:
                return "high_activity"
            elif limb_spread > 1.5:
                return "moderate_activity"
            else:
                return "low_activity"
        except:
            return "unknown"

    def _identify_stable_body_regions(self, normalized_pose: List[float]) -> List[str]:
        """Identify stable body regions for overlay placement."""
        if not normalized_pose or len(normalized_pose) < 22:
            return []

        stable_regions = []
        try:
            # Check torso stability (shoulders and hips)
            torso_variation = abs(normalized_pose[2] - normalized_pose[4])  # Shoulder x difference
            if torso_variation < 0.5:
                stable_regions.append("torso")

            # Check head stability
            head_y = normalized_pose[1]  # Nose y position
            if abs(head_y) < 0.3:  # Close to center
                stable_regions.append("head_area")

        except:
            pass

        return stable_regions

    def _estimate_person_bbox_from_pose(
        self, normalized_pose: List[float], width: int, height: int
    ) -> List[int]:
        """Estimate person bounding box from normalized pose data."""
        if not normalized_pose or len(normalized_pose) < 22:
            return [width // 4, height // 4, width // 2, height // 2]  # Default bbox

        try:
            # Convert normalized coordinates back to pixel coordinates
            # Assuming shoulder width normalization, estimate full body bbox
            min_x = min(normalized_pose[i] for i in range(0, 22, 2))  # All x coordinates
            max_x = max(normalized_pose[i] for i in range(0, 22, 2))
            min_y = min(normalized_pose[i] for i in range(1, 22, 2))  # All y coordinates
            max_y = max(normalized_pose[i] for i in range(1, 22, 2))

            # Add padding and convert to pixel coordinates
            padding = 0.1
            bbox_x = int((min_x - padding) * width)
            bbox_y = int((min_y - padding) * height)
            bbox_w = int((max_x - min_x + 2 * padding) * width)
            bbox_h = int((max_y - min_y + 2 * padding) * height)

            # Clamp to frame boundaries
            bbox_x = max(0, min(bbox_x, width - 1))
            bbox_y = max(0, min(bbox_y, height - 1))
            bbox_w = max(1, min(bbox_w, width - bbox_x))
            bbox_h = max(1, min(bbox_h, height - bbox_y))

            return [bbox_x, bbox_y, bbox_w, bbox_h]

        except Exception as e:
            print(f"Bbox estimation error: {e}")
            return [width // 4, height // 4, width // 2, height // 2]

    def _calculate_motion_level(self, pose_analysis: Dict) -> float:
        """Calculate motion level from pose analysis."""
        if not pose_analysis:
            return 0.3

        movement_type = pose_analysis.get("movement_type", "unknown")
        if movement_type == "high_activity":
            return 0.9
        elif movement_type == "moderate_activity":
            return 0.6
        elif movement_type == "low_activity":
            return 0.3
        else:
            return 0.4

    def _calculate_safe_overlay_zones(
        self, pose_analysis: Dict, width: int, height: int
    ) -> List[Dict]:
        """Calculate safe zones for overlay placement based on pose."""
        if not pose_analysis:
            return []

        zones = []
        stable_regions = pose_analysis.get("stable_regions", [])

        # Define safe zones based on stable body regions
        if "torso" in stable_regions:
            zones.append(
                {
                    "region": "torso_side",
                    "bbox": [
                        int(width * 0.7),
                        int(height * 0.3),
                        int(width * 0.25),
                        int(height * 0.4),
                    ],
                    "confidence": 0.8,
                }
            )

        if "head_area" in stable_regions:
            zones.append(
                {
                    "region": "upper_corner",
                    "bbox": [
                        int(width * 0.75),
                        int(height * 0.1),
                        int(width * 0.2),
                        int(height * 0.2),
                    ],
                    "confidence": 0.7,
                }
            )

        return zones

    def _calculate_safe_overlay_zones_from_pose(
        self, pose_landmarks: List[float], width: int, height: int
    ) -> Dict:
        """Calculate safe overlay zones directly from pose landmarks."""
        if not pose_landmarks or len(pose_landmarks) < 28:
            return {
                "safe_areas": [[50, 50, 200, 100], [400, 300, 150, 80]],
                "avoid_areas": [[200, 150, 240, 180]],
            }

        # Extract key landmark positions
        coordinates = []
        for i in range(0, 28, 4):
            x, y = pose_landmarks[i] * width, pose_landmarks[i + 1] * height
            coordinates.append((x, y))

        # Calculate person bounding box
        if coordinates:
            min_x = min(coord[0] for coord in coordinates)
            max_x = max(coord[0] for coord in coordinates)
            min_y = min(coord[1] for coord in coordinates)
            max_y = max(coord[1] for coord in coordinates)

            # Define avoid areas around person
            person_padding = 50
            avoid_areas = [
                [
                    max(0, int(min_x - person_padding)),
                    max(0, int(min_y - person_padding)),
                    min(width, int(max_x - min_x + 2 * person_padding)),
                    min(height, int(max_y - min_y + 2 * person_padding)),
                ]
            ]

            # Define safe areas outside person region
            safe_areas = []
            # Top area
            if min_y > 100:
                safe_areas.append([0, 0, width, int(min_y - 20)])
            # Right area
            if width - max_x > 100:
                safe_areas.append([int(max_x + 20), 0, width - int(max_x + 20), height])
            # Bottom area
            if height - max_y > 100:
                safe_areas.append([0, int(max_y + 20), width, height - int(max_y + 20)])

            return {
                "safe_areas": safe_areas,
                "avoid_areas": avoid_areas,
            }

        return {
            "safe_areas": [[50, 50, 200, 100], [400, 300, 150, 80]],
            "avoid_areas": [[200, 150, 240, 180]],
        }

    def _motion_level_from_movement(self, movement_type: str) -> str:
        """Convert movement type to motion level."""
        if movement_type == "high_activity":
            return "high"
        elif movement_type == "moderate_activity":
            return "medium"
        elif movement_type == "low_activity":
            return "low"
        else:
            return "medium"

    def _synthesize_video_analysis(
        self, frame_analyses: List[Dict], duration: float, pose_sequences: List[List[float]] = None
    ) -> Dict:
        """Combine frame analyses into overall video understanding."""

        # Extract common themes
        scene_types = [f.get("scene_type", "unknown") for f in frame_analyses]
        activities = [f.get("activity", "general") for f in frame_analyses]
        moods = [f.get("mood", "neutral") for f in frame_analyses]
        motion_levels = [f.get("motion_level", "medium") for f in frame_analyses]

        # Find most common values
        dominant_scene = max(set(scene_types), key=scene_types.count)
        dominant_activity = max(set(activities), key=activities.count)
        dominant_mood = max(set(moods), key=moods.count)
        dominant_motion = max(set(motion_levels), key=motion_levels.count)

        # Collect all objects and colors
        all_objects = []
        all_colors = []
        for frame in frame_analyses:
            all_objects.extend(frame.get("objects", []))
            all_colors.extend(frame.get("color_palette", []))

        # Calculate average people count
        people_counts = [f.get("people_count", 0) for f in frame_analyses]
        avg_people = sum(people_counts) / len(people_counts) if people_counts else 0

        # Determine video complexity
        complexity = self._calculate_complexity(frame_analyses, duration)

        # Enhanced analysis with pose data
        normalized_poses = normalize_pose_sequence(pose_sequences) if pose_sequences else []

        return {
            "video_id": None,  # Will be set by caller
            "duration": duration,
            "scene_type": dominant_scene,
            "primary_activity": dominant_activity,
            "mood": dominant_mood,
            "motion_level": dominant_motion,
            "objects": list(set(all_objects)),  # Unique objects
            "color_palette": list(set(all_colors)),  # Unique colors
            "people_count": round(avg_people),
            "complexity_score": complexity,
            "frame_analyses": frame_analyses,
            "pose_sequences": normalized_poses,  # Real pose data
            "pose_analysis_summary": {
                "total_pose_frames": len(normalized_poses),
                "avg_confidence": sum(f.get("pose_confidence", 0) for f in frame_analyses)
                / len(frame_analyses)
                if frame_analyses
                else 0,
                "movement_patterns": list(
                    set(f.get("activity", "unknown") for f in frame_analyses)
                ),
            },
            "analyzed_at": datetime.now().isoformat(),
            "tags": self._generate_content_tags(dominant_scene, dominant_activity, dominant_mood),
            "overlay_recommendations": self._generate_overlay_suggestions(
                dominant_scene, dominant_activity, dominant_mood, duration
            ),
        }

    def _calculate_complexity(self, frame_analyses: List[Dict], duration: float) -> float:
        """Calculate video complexity score (0-1) for overlay recommendation."""

        factors = {"motion": 0, "objects": 0, "people": 0, "duration": 0}

        # Motion complexity
        motion_levels = [f.get("motion_level", "medium") for f in frame_analyses]
        high_motion_count = motion_levels.count("high")
        factors["motion"] = high_motion_count / len(motion_levels)

        # Object complexity
        avg_objects = sum(len(f.get("objects", [])) for f in frame_analyses) / len(frame_analyses)
        factors["objects"] = min(avg_objects / 10, 1.0)  # Normalize to 0-1

        # People complexity
        avg_people = sum(f.get("people_count", 0) for f in frame_analyses) / len(frame_analyses)
        factors["people"] = min(avg_people / 5, 1.0)  # Normalize to 0-1

        # Duration complexity (longer videos are harder to overlay)
        factors["duration"] = min(duration / 30, 1.0)  # Normalize to 0-1 for 30s max

        # Weighted average
        weights = {"motion": 0.3, "objects": 0.3, "people": 0.2, "duration": 0.2}
        complexity = sum(factors[key] * weights[key] for key in factors)

        return round(complexity, 3)

    def _generate_content_tags(self, scene_type: str, activity: str, mood: str) -> List[str]:
        """Generate searchable tags for content matching."""

        tags = [scene_type, activity, mood]

        # Add related tags
        tag_expansions = {
            "outdoor": ["nature", "adventure", "travel"],
            "indoor": ["cozy", "intimate", "personal"],
            "dancing": ["music", "rhythm", "movement", "celebration"],
            "cooking": ["food", "kitchen", "recipe", "lifestyle"],
            "energetic": ["dynamic", "upbeat", "vibrant"],
            "calm": ["peaceful", "serene", "relaxing"],
            "celebration": ["party", "joy", "festive"],
        }

        for tag in tags:
            if tag in tag_expansions:
                tags.extend(tag_expansions[tag])

        return list(set(tags))  # Remove duplicates

    def _generate_overlay_suggestions(
        self, scene_type: str, activity: str, mood: str, duration: float
    ) -> Dict:
        """Generate specific overlay placement and timing suggestions."""

        return {
            "placement_style": self._get_placement_style(activity, mood),
            "timing_pattern": self._get_timing_pattern(activity, duration),
            "scale_range": self._get_scale_range(scene_type),
            "animation_speed": self._get_animation_speed(mood),
            "layer_suggestions": self._get_layer_suggestions(activity),
        }

    def _get_placement_style(self, activity: str, mood: str) -> str:
        """Determine optimal overlay placement style."""

        if activity in ["dancing", "sports", "exercise"]:
            return "dynamic_follow"  # Follow movement
        elif mood in ["calm", "serene"]:
            return "static_corner"  # Subtle corner placement
        elif mood in ["energetic", "celebration"]:
            return "center_burst"  # Bold center placement
        else:
            return "balanced_edge"  # Safe edge placement

    def _get_timing_pattern(self, activity: str, duration: float) -> Dict:
        """Determine optimal overlay timing."""

        if activity in ["dancing", "music"]:
            return {
                "pattern": "rhythmic",
                "intervals": [0.5, 1.0, 1.5],  # Beat-based timing
                "duration_per_overlay": min(2.0, duration / 3),
            }
        elif activity in ["talking", "presentation"]:
            return {
                "pattern": "emphasis",
                "intervals": [duration * 0.2, duration * 0.7],  # Key moments
                "duration_per_overlay": 3.0,
            }
        else:
            return {
                "pattern": "steady",
                "intervals": [duration * 0.1, duration * 0.5, duration * 0.8],
                "duration_per_overlay": min(4.0, duration / 2),
            }

    def _get_scale_range(self, scene_type: str) -> Tuple[float, float]:
        """Determine appropriate overlay scale range."""

        if scene_type == "close_up":
            return (0.3, 0.7)  # Smaller overlays for close shots
        elif scene_type == "wide_shot":
            return (0.8, 1.5)  # Larger overlays for wide shots
        else:
            return (0.5, 1.0)  # Default range

    def _get_animation_speed(self, mood: str) -> str:
        """Determine overlay animation speed based on mood."""

        speed_map = {
            "energetic": "fast",
            "upbeat": "fast",
            "calm": "slow",
            "serene": "slow",
            "dramatic": "medium",
            "playful": "fast",
        }

        return speed_map.get(mood, "medium")

    def _get_layer_suggestions(self, activity: str) -> Dict:
        """Suggest optimal layer count and arrangement."""

        if activity in ["celebration", "party"]:
            return {"max_layers": 3, "arrangement": "scattered", "priority": "background_fill"}
        elif activity in ["talking", "presentation"]:
            return {"max_layers": 1, "arrangement": "single_accent", "priority": "emphasis"}
        else:
            return {"max_layers": 2, "arrangement": "balanced", "priority": "enhancement"}

    def _fallback_analysis(self, duration: float) -> Dict:
        """Provide basic analysis when AI processing fails."""
        
        # Handle None duration
        if duration is None:
            duration = 10.0  # Default 10 seconds

        return {
            "video_id": None,
            "duration": duration,
            "scene_type": "general",
            "primary_activity": "unknown",
            "mood": "neutral",
            "motion_level": "medium",
            "objects": [],
            "color_palette": ["blue", "white"],
            "people_count": 1,
            "complexity_score": 0.5,
            "frame_analyses": [],
            "analyzed_at": datetime.now().isoformat(),
            "tags": ["general", "neutral", "standard"],
            "overlay_recommendations": {
                "placement_style": "balanced_edge",
                "timing_pattern": {
                    "pattern": "steady",
                    "intervals": [duration * 0.3, duration * 0.7],
                    "duration_per_overlay": 3.0,
                },
                "scale_range": (0.5, 1.0),
                "animation_speed": "medium",
                "layer_suggestions": {
                    "max_layers": 2,
                    "arrangement": "balanced",
                    "priority": "enhancement",
                },
            },
            "fallback": True,
        }


def _get_local_file_path(url_path: str) -> str:
    """Convert URL path to local file path for AI analysis."""
    # Remove /media/ prefix if present
    if url_path.startswith('/media/'):
        relative_path = url_path[7:]  # Remove '/media/'
    else:
        relative_path = url_path
    
    # Get local media directory
    local_media_dir = os.environ.get("LOCAL_MEDIA_DIR", "/tmp/magiclens-media")
    local_file_path = os.path.join(local_media_dir, relative_path)
    
    return local_file_path


# Service functions for integration with existing system


@authenticated
def analyze_video_for_overlays(user: User, video_id: UUID) -> Dict:
    """Analyze a video and return AI-powered overlay recommendations."""

    # Get video details
    videos_data = Video.sql(
        "SELECT * FROM videos WHERE id = %(video_id)s AND user_id = %(user_id)s",
        {"video_id": video_id, "user_id": user.id},
    )

    if not videos_data:
        raise ValueError("Video not found or access denied")

    video = Video(**videos_data[0])

    # Convert URL path to local file path for AI analysis
    local_file_path = _get_local_file_path(video.file_path)
    
    # Handle None duration with fallback
    duration = video.duration if video.duration is not None else 30.0
    
    # Perform AI analysis
    analyzer = VideoAnalyzer()
    analysis = analyzer.analyze_video_content(local_file_path, duration, video_id)
    analysis["video_id"] = str(video_id)

    return analysis


@authenticated
def get_smart_overlay_recommendations(user: User, video_id: UUID, limit: int = 5) -> List[Dict]:
    """Get AI-recommended overlays for a specific video."""

    # Get video analysis
    analysis = analyze_video_for_overlays(user, video_id)

    # Find matching assets based on tags and content
    content_tags = analysis.get("tags", [])
    mood = analysis.get("mood", "neutral")
    scene_type = analysis.get("scene_type", "general")
    activity = analysis.get("primary_activity", "unknown")

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
            "limit": limit,
        },
    )

    # Generate recommendations with AI placement
    recommendations = []
    overlay_suggestions = analysis.get("overlay_recommendations", {})

    for i, asset_data in enumerate(assets_data):
        asset = ArtistAsset(**asset_data)

        # Generate smart placement for this asset
        placement = _generate_smart_placement(asset, analysis, i, overlay_suggestions)

        recommendations.append(
            {
                "asset": asset.__dict__,
                "artist_name": asset_data["artist_name"],
                "placement": placement,
                "confidence_score": _calculate_match_confidence(asset, analysis),
                "reasoning": _generate_recommendation_reasoning(asset, analysis),
            }
        )

    return recommendations


def _generate_smart_placement(
    asset: ArtistAsset, analysis: Dict, index: int, suggestions: Dict
) -> Dict:
    """Generate smart overlay placement based on AI analysis."""

    duration = analysis.get("duration", 10)
    timing_pattern = suggestions.get("timing_pattern", {})
    placement_style = suggestions.get("placement_style", "balanced_edge")
    scale_range = suggestions.get("scale_range", (0.5, 1.0))

    # Calculate position based on placement style
    if placement_style == "center_burst":
        position = {"x": 400, "y": 225}  # Center of 800x450
    elif placement_style == "static_corner":
        corners = [
            {"x": 50, "y": 50},  # Top-left
            {"x": 650, "y": 50},  # Top-right
            {"x": 50, "y": 350},  # Bottom-left
            {"x": 650, "y": 350},  # Bottom-right
        ]
        position = corners[index % len(corners)]
    else:  # balanced_edge or default
        positions = [
            {"x": 100, "y": 100},
            {"x": 600, "y": 150},
            {"x": 150, "y": 300},
            {"x": 550, "y": 80},
            {"x": 200, "y": 200},
        ]
        position = positions[index % len(positions)]

    # Calculate timing
    intervals = timing_pattern.get("intervals", [duration * 0.3, duration * 0.7])
    overlay_duration = timing_pattern.get("duration_per_overlay", 3.0)

    start_time = intervals[index % len(intervals)]
    end_time = min(start_time + overlay_duration, duration)

    # Calculate scale
    scale = scale_range[0] + (index * 0.1) % (scale_range[1] - scale_range[0])

    return {
        "position": {
            "x": position["x"],
            "y": position["y"],
            "scaleX": scale,
            "scaleY": scale,
            "angle": 0,
        },
        "timing": {
            "startTime": round(start_time, 1),
            "endTime": round(end_time, 1),
            "fadeIn": 0.3,
            "fadeOut": 0.3,
        },
        "layerOrder": index + 1,
    }


def _calculate_match_confidence(asset: ArtistAsset, analysis: Dict) -> float:
    """Calculate how well an asset matches the video content."""

    confidence = 0.0
    video_tags = set(analysis.get("tags", []))
    asset_tags = set(asset.tags if asset.tags else [])

    # Tag overlap
    if video_tags and asset_tags:
        overlap = len(video_tags.intersection(asset_tags))
        confidence += (overlap / len(video_tags)) * 0.6

    # Mood matching
    video_mood = analysis.get("mood", "").lower()
    if video_mood and asset.tags and video_mood in asset.tags.lower():
        confidence += 0.3

    # Activity matching
    video_activity = analysis.get("primary_activity", "").lower()
    if video_activity and asset.tags and video_activity in asset.tags.lower():
        confidence += 0.2

    # Base confidence for approved assets
    confidence += 0.1

    return min(round(confidence, 3), 1.0)


def _generate_recommendation_reasoning(asset: ArtistAsset, analysis: Dict) -> str:
    """Generate human-readable reasoning for the recommendation."""

    video_mood = analysis.get("mood", "neutral")
    video_activity = analysis.get("primary_activity", "general")
    scene_type = analysis.get("scene_type", "standard")

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

    def _convert_cached_analysis_to_format(self, cached_analysis, video_duration: float) -> Dict:
        """Convert cached pose analysis to expected analysis format."""
        try:
            pose_sequences = cached_analysis.pose_sequences.get("sequences", [])
            normalized_poses = cached_analysis.normalized_poses.get("normalized", [])
            movement_analysis = cached_analysis.movement_analysis or {}

            return {
                "video_id": str(cached_analysis.video_id),
                "duration": video_duration,
                "scene_type": "person" if pose_sequences else "general",
                "primary_activity": movement_analysis.get("movement_type", "unknown"),
                "mood": "neutral",
                "motion_level": self._determine_motion_level_from_confidence(
                    cached_analysis.confidence_avg
                ),
                "objects": ["person"] if pose_sequences else ["background"],
                "color_palette": ["blue", "white"],
                "people_count": 1 if pose_sequences else 0,
                "complexity_score": min(cached_analysis.frame_count / 30.0, 1.0),
                "frame_analyses": self._generate_frame_analyses_from_cache(pose_sequences),
                "pose_sequences": normalized_poses,
                "pose_analysis_summary": {
                    "total_pose_frames": cached_analysis.frame_count,
                    "avg_confidence": float(cached_analysis.confidence_avg),
                    "processing_time_ms": cached_analysis.processing_time_ms,
                    "cached_result": True,
                },
                "analyzed_at": cached_analysis.created_at.isoformat(),
                "tags": self._generate_content_tags("person", "movement", "neutral"),
                "overlay_recommendations": self._generate_overlay_suggestions(
                    "person", "movement", "neutral", video_duration
                ),
                "cached": True,
            }
        except Exception as e:
            print(f"Error converting cached analysis: {e}")
            # Return minimal analysis if conversion fails
            return self._fallback_analysis(video_duration)

    def _determine_motion_level_from_confidence(self, confidence: float) -> str:
        """Determine motion level from pose confidence."""
        if confidence > 0.8:
            return "high"
        elif confidence > 0.5:
            return "medium"
        else:
            return "low"

    def _generate_frame_analyses_from_cache(self, pose_sequences: List[List[float]]) -> List[Dict]:
        """Generate frame analyses from cached pose sequences."""
        frame_analyses = []
        for i, pose_data in enumerate(pose_sequences[:3]):  # Limit to 3 frames for consistency
            confidence = self._calculate_pose_confidence(pose_data) if pose_data else 0.0
            frame_analyses.append(
                {
                    "timestamp": i * 2.0,  # Assume 2-second intervals
                    "scene_type": "person" if confidence > 0.5 else "general",
                    "activity": "movement" if confidence > 0.6 else "static",
                    "mood": "neutral",
                    "objects": ["person"] if confidence > 0.5 else [],
                    "people_count": 1 if confidence > 0.5 else 0,
                    "motion_level": "high"
                    if confidence > 0.8
                    else "medium"
                    if confidence > 0.5
                    else "low",
                    "pose_confidence": confidence,
                    "cached_frame": True,
                }
            )
        return frame_analyses
