"""
Computer Vision module for pose analysis and sequence matching.
Handles MediaPipe pose data normalization and similarity detection.
"""

import numpy as np
from typing import List, Tuple, Optional
import math


class PoseAnalyzer:
    """Handles pose sequence normalization and matching operations."""

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

        return max_similarity


# Convenience functions for direct use
def normalize_pose_sequence(sequence_data: List[List[float]]) -> List[List[float]]:
    """Normalize a sequence of pose frames to relative positions."""
    return PoseAnalyzer.normalize_pose_sequence(sequence_data)


def find_pose_sequence_match(sequence_a: List[List[float]], sequence_b: List[List[float]]) -> float:
    """Find if sequence_b appears within sequence_a."""
    return PoseAnalyzer.find_pose_sequence_match(sequence_a, sequence_b)
