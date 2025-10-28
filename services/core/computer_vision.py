"""
Computer Vision module for pose analysis and sequence matching.
Handles MediaPipe pose data normalization and similarity detection.
"""

import numpy as np
from typing import List, Tuple, Optional
import math
import mediapipe as mp
import cv2
import time
from uuid import UUID


class PoseAnalyzer:
    """Handles pose sequence normalization and matching operations with MediaPipe integration."""

    # MediaPipe pose landmark indices for key body points
    # These are the most stable landmarks for pose comparison
    KEY_LANDMARKS = {
        "nose": 0,
        "left_shoulder": 11,
        "right_shoulder": 12,
        "left_elbow": 13,
        "right_elbow": 14,
        "left_wrist": 15,
        "right_wrist": 16,
        "left_hip": 23,
        "right_hip": 24,
        "left_knee": 25,
        "right_knee": 26,
        "left_ankle": 27,
        "right_ankle": 28,
    }

    # Selected 11 key points for comparison (excluding some for balance)
    SELECTED_LANDMARKS = [
        "nose",
        "left_shoulder",
        "right_shoulder",
        "left_elbow",
        "right_elbow",
        "left_wrist",
        "right_wrist",
        "left_hip",
        "right_hip",
        "left_knee",
        "right_knee",
    ]

    def __init__(self):
        """Initialize MediaPipe pose detection."""
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def extract_pose_from_image(self, image: np.ndarray) -> List[float]:
        """
        Extract pose landmarks from image using MediaPipe.
        Returns format: [x1, y1, z1, visibility1, x2, y2, z2, visibility2, ...]
        """
        try:
            # Convert BGR to RGB for MediaPipe
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Process the image
            results = self.pose.process(rgb_image)

            if results.pose_landmarks:
                landmarks = []
                # Extract first 7 key landmarks for our format
                key_indices = [0, 11, 12, 13, 14, 15, 16]  # nose, shoulders, elbows, wrists

                for idx in key_indices:
                    if idx < len(results.pose_landmarks.landmark):
                        landmark = results.pose_landmarks.landmark[idx]
                        landmarks.extend([landmark.x, landmark.y, landmark.z, landmark.visibility])

                return landmarks
            else:
                return []
        except Exception as e:
            print(f"Error extracting pose: {e}")
            return []

    def extract_pose_from_video(
        self, video_path: str, max_frames: int = 30, video_id: UUID = None
    ) -> List[List[float]]:
        """
        Extract pose sequences from video file with caching support.
        Returns list of frames, each with 28 values (7 landmarks × 4 properties).
        """
        # Check cache first if video_id provided
        if video_id:
            try:
                from core.pose_cache import get_video_pose_analysis

                cached_analysis = get_video_pose_analysis(video_id)
                if cached_analysis and cached_analysis.pose_sequences:
                    sequences = cached_analysis.pose_sequences.get("sequences", [])
                    if sequences:
                        print(f"✅ Using cached pose analysis for video {video_id}")
                        return sequences
            except ImportError:
                pass  # Cache not available

        start_time = time.time()

        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                print(f"Error: Cannot open video {video_path}")
                return []

            pose_sequences = []
            frame_count = 0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

            # Sample frames evenly if video is long
            frame_skip = max(1, total_frames // max_frames) if total_frames > max_frames else 1

            while cap.isOpened() and len(pose_sequences) < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_count % frame_skip == 0:
                    pose_data = self.extract_pose_from_image(frame)
                    if pose_data and len(pose_data) == 28:  # Ensure complete pose data
                        pose_sequences.append(pose_data)

                frame_count += 1

            cap.release()

            # Cache the results if video_id provided
            if video_id and pose_sequences:
                try:
                    from core.pose_cache import cache_video_pose_analysis
                    from core.computer_vision import normalize_pose_sequence

                    processing_time_ms = int((time.time() - start_time) * 1000)
                    normalized_poses = normalize_pose_sequence(pose_sequences)

                    # Basic movement analysis
                    movement_analysis = {
                        "frame_count": len(pose_sequences),
                        "avg_confidence": self._calculate_average_confidence(pose_sequences),
                        "processing_time_ms": processing_time_ms,
                    }

                    cache_video_pose_analysis(
                        video_id,
                        pose_sequences,
                        normalized_poses,
                        movement_analysis,
                        processing_time_ms,
                    )
                    print(f"✅ Cached pose analysis for video {video_id}")
                except ImportError:
                    pass  # Cache not available

            return pose_sequences

        except Exception as e:
            print(f"Error processing video: {e}")
            return []

    def _calculate_average_confidence(self, pose_sequences: List[List[float]]) -> float:
        """Calculate average confidence from pose sequences."""
        if not pose_sequences:
            return 0.0

        total_confidence = 0.0
        confidence_count = 0

        for sequence in pose_sequences:
            # Extract confidence values (every 4th value starting from index 3)
            for i in range(3, len(sequence), 4):
                if i < len(sequence):
                    total_confidence += sequence[i]
                    confidence_count += 1

        return total_confidence / confidence_count if confidence_count > 0 else 0.0

    @staticmethod
    def extract_coordinates_from_frame(frame_data: List[float]) -> List[Tuple[float, float]]:
        """
        Extract (x, y) coordinates from frame data.
        Assumes input format: [x1, y1, z1, visibility1, x2, y2, z2, visibility2, ...]
        """
        coordinates = []
        # Process in groups of 4 (x, y, z, visibility)
        for i in range(0, len(frame_data), 4):
            if i + 1 < len(frame_data):
                x, y = frame_data[i], frame_data[i + 1]
                coordinates.append((x, y))
        return coordinates

    @staticmethod
    def normalize_pose_frame(coordinates: List[Tuple[float, float]]) -> List[float]:
        """
        Normalize a single pose frame to relative positions.
        Uses shoulder midpoint as origin and shoulder width for scaling.
        """
        if len(coordinates) < 7:  # Need at least 7 landmarks
            return []

        # For test data with 7 landmarks, map to our key points
        # Assuming test data order: nose, shoulders, elbows, wrists, hip
        nose = coordinates[0] if len(coordinates) > 0 else (0, 0)
        left_shoulder = coordinates[1] if len(coordinates) > 1 else (0, 0)
        right_shoulder = coordinates[2] if len(coordinates) > 2 else (0, 0)
        left_elbow = coordinates[3] if len(coordinates) > 3 else (0, 0)
        right_elbow = coordinates[4] if len(coordinates) > 4 else (0, 0)
        left_wrist = coordinates[5] if len(coordinates) > 5 else (0, 0)
        right_wrist = coordinates[6] if len(coordinates) > 6 else (0, 0)

        # For missing landmarks, use reasonable defaults relative to available points
        left_hip = (left_shoulder[0], left_shoulder[1] + 0.3) if len(coordinates) > 1 else (0, 0)
        right_hip = (right_shoulder[0], right_shoulder[1] + 0.3) if len(coordinates) > 2 else (0, 0)
        left_knee = (left_hip[0], left_hip[1] + 0.4) if len(coordinates) > 1 else (0, 0)
        right_knee = (right_hip[0], right_hip[1] + 0.4) if len(coordinates) > 2 else (0, 0)

        # Calculate shoulder midpoint as origin
        shoulder_midpoint = (
            (left_shoulder[0] + right_shoulder[0]) / 2,
            (left_shoulder[1] + right_shoulder[1]) / 2,
        )

        # Calculate shoulder width for scaling
        shoulder_width = math.sqrt(
            (right_shoulder[0] - left_shoulder[0]) ** 2
            + (right_shoulder[1] - left_shoulder[1]) ** 2
        )

        # Avoid division by zero
        if shoulder_width == 0:
            shoulder_width = 1.0

        # Normalize all 11 key points relative to shoulder midpoint and scale
        key_points = [
            nose,
            left_shoulder,
            right_shoulder,
            left_elbow,
            right_elbow,
            left_wrist,
            right_wrist,
            left_hip,
            right_hip,
            left_knee,
            right_knee,
        ]

        normalized = []
        for point in key_points:
            # Translate to shoulder midpoint origin
            rel_x = (point[0] - shoulder_midpoint[0]) / shoulder_width
            rel_y = (point[1] - shoulder_midpoint[1]) / shoulder_width
            normalized.extend([rel_x, rel_y])

        return normalized

    @staticmethod
    def normalize_pose_sequence(sequence_data: List[List[float]]) -> List[List[float]]:
        """
        Normalize a sequence of pose frames.

        Args:
            sequence_data: List of frames, each frame is a list of coordinate values

        Returns:
            List of normalized frames, each with 22 values (11 points × 2 coordinates)
        """
        normalized_sequence = []

        for frame_data in sequence_data:
            # Extract (x, y) coordinates from the frame data
            coordinates = PoseAnalyzer.extract_coordinates_from_frame(frame_data)

            # Normalize the frame
            normalized_frame = PoseAnalyzer.normalize_pose_frame(coordinates)

            if normalized_frame:  # Only add if normalization succeeded
                normalized_sequence.append(normalized_frame)

        return normalized_sequence

    @staticmethod
    def calculate_frame_similarity(frame1: List[float], frame2: List[float]) -> float:
        """
        Calculate similarity between two normalized pose frames using cosine similarity.

        Args:
            frame1, frame2: Normalized pose frames (22 values each)

        Returns:
            Similarity score between 0 and 1
        """
        if len(frame1) != len(frame2) or len(frame1) == 0:
            return 0.0

        # Convert to numpy arrays for easier computation
        v1 = np.array(frame1)
        v2 = np.array(frame2)

        # Calculate cosine similarity
        dot_product = np.dot(v1, v2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        cosine_sim = dot_product / (norm1 * norm2)

        # Convert to 0-1 range (cosine similarity is -1 to 1)
        return (cosine_sim + 1) / 2

    @staticmethod
    def find_pose_sequence_match(
        sequence_a: List[List[float]], sequence_b: List[List[float]]
    ) -> float:
        """
        Find if sequence_b appears within sequence_a using sliding window comparison.
        Enhanced with caching for performance.

        Args:
            sequence_a: Longer sequence to search within
            sequence_b: Shorter sequence to find

        Returns:
            Maximum similarity score found (0.0 to 1.0)
        """
        if not sequence_a or not sequence_b:
            return 0.0

        if len(sequence_b) > len(sequence_a):
            return 0.0

        # Check cache first
        try:
            from core.pose_cache import get_cached_sequence_match, cache_sequence_match

            cached_result = get_cached_sequence_match(sequence_a, sequence_b)
            if cached_result is not None:
                return cached_result
        except ImportError:
            pass  # Cache not available, proceed without caching

        start_time = time.time()

        # Normalize both sequences first
        norm_a = PoseAnalyzer.normalize_pose_sequence(sequence_a)
        norm_b = PoseAnalyzer.normalize_pose_sequence(sequence_b)

        if not norm_a or not norm_b:
            return 0.0

        max_similarity = 0.0
        window_size = len(norm_b)

        # Sliding window comparison
        for i in range(len(norm_a) - window_size + 1):
            window = norm_a[i : i + window_size]

            # Calculate average similarity across all frames in window
            frame_similarities = []
            for j in range(window_size):
                if j < len(window) and j < len(norm_b):
                    sim = PoseAnalyzer.calculate_frame_similarity(window[j], norm_b[j])
                    frame_similarities.append(sim)

            if frame_similarities:
                avg_similarity = sum(frame_similarities) / len(frame_similarities)
                max_similarity = max(max_similarity, avg_similarity)

        # Cache the result
        try:
            from core.pose_cache import cache_sequence_match

            computation_time_ms = int((time.time() - start_time) * 1000)
            cache_sequence_match(sequence_a, sequence_b, max_similarity, computation_time_ms)
        except ImportError:
            pass  # Cache not available

        return max_similarity


# Singleton instance for performance (avoid reinitializing MediaPipe)
_pose_analyzer_instance = None


def get_pose_analyzer() -> PoseAnalyzer:
    """Get singleton PoseAnalyzer instance for performance."""
    global _pose_analyzer_instance
    if _pose_analyzer_instance is None:
        _pose_analyzer_instance = PoseAnalyzer()
    return _pose_analyzer_instance


# Convenience functions for direct use
def normalize_pose_sequence(sequence_data: List[List[float]]) -> List[List[float]]:
    """Normalize a sequence of pose frames to relative positions."""
    return PoseAnalyzer.normalize_pose_sequence(sequence_data)


def find_pose_sequence_match(sequence_a: List[List[float]], sequence_b: List[List[float]]) -> float:
    """Find if sequence_b appears within sequence_a."""
    return PoseAnalyzer.find_pose_sequence_match(sequence_a, sequence_b)


def extract_pose_from_video(
    video_path: str, max_frames: int = 30, video_id: UUID = None
) -> List[List[float]]:
    """Extract pose sequences from video file using MediaPipe with caching."""
    analyzer = get_pose_analyzer()
    return analyzer.extract_pose_from_video(video_path, max_frames, video_id)


def extract_pose_from_image(image: np.ndarray) -> List[float]:
    """Extract pose landmarks from single image using MediaPipe."""
    analyzer = get_pose_analyzer()
    return analyzer.extract_pose_from_image(image)
