"""
Test suite for computer vision pose analysis and sequence matching.
Tests the normalize_pose_sequence and find_pose_sequence_match functions.
"""

import pytest
import math
from typing import List
from core.computer_vision import normalize_pose_sequence, find_pose_sequence_match, PoseAnalyzer


class TestPoseAnalysis:
    """Test suite for pose analysis functions."""

    def create_test_frame(
        self, scale: float = 1.0, offset_x: float = 0.0, offset_y: float = 0.0
    ) -> List[float]:
        """
        Create a test frame with 7 landmarks (28 values: x, y, z, visibility for each).
        Represents: nose, left_shoulder, right_shoulder, left_elbow, right_elbow, left_wrist, right_wrist
        """
        landmarks = [
            # Nose (center, top)
            [0.5 + offset_x, 0.2 + offset_y, 0.0, 0.9],
            # Left shoulder
            [0.3 + offset_x, 0.4 + offset_y, 0.0, 0.9],
            # Right shoulder
            [0.7 + offset_x, 0.4 + offset_y, 0.0, 0.9],
            # Left elbow
            [0.2 + offset_x, 0.6 + offset_y, 0.0, 0.8],
            # Right elbow
            [0.8 + offset_x, 0.6 + offset_y, 0.0, 0.8],
            # Left wrist
            [0.1 + offset_x, 0.8 + offset_y, 0.0, 0.7],
            # Right wrist
            [0.9 + offset_x, 0.8 + offset_y, 0.0, 0.7],
        ]

        # Flatten to single list and apply scale
        flattened = []
        for landmark in landmarks:
            flattened.extend([landmark[0] * scale, landmark[1] * scale, landmark[2], landmark[3]])

        return flattened

    def test_normalize_pose_sequence_basic(self):
        """Test that normalize_pose_sequence returns correct format and values."""
        # Create test sequence with 2 frames
        frame1 = self.create_test_frame()
        frame2 = self.create_test_frame(scale=1.1, offset_x=0.1, offset_y=0.1)

        sequence = [frame1, frame2]
        result = normalize_pose_sequence(sequence)

        # Should return 2 frames
        assert len(result) == 2

        # Each frame should have 22 values (11 key points × 2 coordinates)
        for frame in result:
            assert len(frame) == 22

        # Values should be reasonable (normalized around 0)
        for frame in result:
            for value in frame:
                assert -5.0 <= value <= 5.0  # Reasonable range for normalized coordinates

    def test_normalize_pose_sequence_empty(self):
        """Test normalize_pose_sequence with empty input."""
        result = normalize_pose_sequence([])
        assert result == []

    def test_normalize_pose_sequence_invalid_frame(self):
        """Test normalize_pose_sequence with invalid frame data."""
        # Frame with too few values
        invalid_frame = [0.5, 0.5, 0.0]  # Only 3 values instead of 28
        result = normalize_pose_sequence([invalid_frame])
        assert result == []

    def test_find_pose_sequence_match_perfect(self):
        """Test finding perfect match when sequence_b is contained in sequence_a."""
        # Create a longer sequence A with 5 frames
        frame1 = self.create_test_frame()
        frame2 = self.create_test_frame(scale=1.1)
        frame3 = self.create_test_frame(offset_x=0.1)
        frame4 = self.create_test_frame(scale=0.9)
        frame5 = self.create_test_frame(offset_y=0.1)

        sequence_a = [frame1, frame2, frame3, frame4, frame5]

        # Create sequence B that matches frames 2-3 of sequence A
        sequence_b = [frame2, frame3]

        similarity = find_pose_sequence_match(sequence_a, sequence_b)

        # Should find high similarity (>0.5) since sequence_b is contained in sequence_a
        assert similarity > 0.5, f"Expected similarity > 0.5, got {similarity}"

    def test_find_pose_sequence_match_identical(self):
        """Test finding match between identical sequences."""
        frame1 = self.create_test_frame()
        frame2 = self.create_test_frame(scale=1.1)

        sequence = [frame1, frame2]

        # Identical sequences should have very high similarity
        similarity = find_pose_sequence_match(sequence, sequence)
        assert similarity > 0.9, (
            f"Expected similarity > 0.9 for identical sequences, got {similarity}"
        )

    def test_find_pose_sequence_match_no_match(self):
        """Test finding match when sequences are very different."""
        # Create very different poses - one normal, one with arms crossed
        frame1 = self.create_test_frame()  # Normal pose

        # Create dramatically different pose with crossed arms
        different_landmarks = [
            # Nose (same position)
            [0.5, 0.2, 0.0, 0.9],
            # Left shoulder
            [0.3, 0.4, 0.0, 0.9],
            # Right shoulder
            [0.7, 0.4, 0.0, 0.9],
            # Left elbow (crossed to right side)
            [0.8, 0.5, 0.0, 0.8],
            # Right elbow (crossed to left side)
            [0.2, 0.5, 0.0, 0.8],
            # Left wrist (far right)
            [0.9, 0.6, 0.0, 0.7],
            # Right wrist (far left)
            [0.1, 0.6, 0.0, 0.7],
        ]

        frame2 = []
        for landmark in different_landmarks:
            frame2.extend(landmark)

        sequence_a = [frame1]
        sequence_b = [frame2]

        similarity = find_pose_sequence_match(sequence_a, sequence_b)

        # Should have lower similarity for very different poses
        assert similarity < 0.8, f"Expected similarity < 0.8 for different poses, got {similarity}"

    def test_find_pose_sequence_match_empty_sequences(self):
        """Test find_pose_sequence_match with empty sequences."""
        frame = self.create_test_frame()
        sequence = [frame]

        # Empty sequence_a
        assert find_pose_sequence_match([], sequence) == 0.0

        # Empty sequence_b
        assert find_pose_sequence_match(sequence, []) == 0.0

        # Both empty
        assert find_pose_sequence_match([], []) == 0.0

    def test_find_pose_sequence_match_wrong_sizes(self):
        """Test find_pose_sequence_match when sequence_b is longer than sequence_a."""
        frame = self.create_test_frame()

        short_sequence = [frame]
        long_sequence = [frame, frame, frame]

        # sequence_b longer than sequence_a should return 0.0
        similarity = find_pose_sequence_match(short_sequence, long_sequence)
        assert similarity == 0.0

    def test_extract_coordinates_from_frame(self):
        """Test coordinate extraction from frame data."""
        frame_data = [0.1, 0.2, 0.0, 0.9, 0.3, 0.4, 0.0, 0.8]  # 2 landmarks
        coordinates = PoseAnalyzer.extract_coordinates_from_frame(frame_data)

        assert len(coordinates) == 2
        assert coordinates[0] == (0.1, 0.2)
        assert coordinates[1] == (0.3, 0.4)

    def test_normalize_pose_frame(self):
        """Test single frame normalization."""
        # Create coordinates for 7 landmarks
        coordinates = [
            (0.5, 0.2),  # nose
            (0.3, 0.4),  # left_shoulder
            (0.7, 0.4),  # right_shoulder
            (0.2, 0.6),  # left_elbow
            (0.8, 0.6),  # right_elbow
            (0.1, 0.8),  # left_wrist
            (0.9, 0.8),  # right_wrist
        ]

        normalized = PoseAnalyzer.normalize_pose_frame(coordinates)

        # Should return 22 values (11 points × 2 coordinates)
        assert len(normalized) == 22

        # Check that shoulder points are properly normalized
        # The shoulder midpoint should be close to origin (0, 0) after normalization
        left_shoulder_x, left_shoulder_y = normalized[2], normalized[3]  # index 1 in our key points
        right_shoulder_x, right_shoulder_y = (
            normalized[4],
            normalized[5],
        )  # index 2 in our key points

        # Shoulders should be symmetric around origin
        assert abs(left_shoulder_x + right_shoulder_x) < 0.1  # Should sum to ~0

    def test_calculate_frame_similarity(self):
        """Test frame-to-frame similarity calculation."""
        frame1 = [0.1, 0.2] * 11  # 22 values
        frame2 = [0.1, 0.2] * 11  # Identical frame
        frame3 = [0.5, 0.6] * 11  # Different frame

        # Identical frames should have similarity close to 1.0
        sim_identical = PoseAnalyzer.calculate_frame_similarity(frame1, frame2)
        assert sim_identical > 0.95

        # Different frames should have lower similarity
        sim_different = PoseAnalyzer.calculate_frame_similarity(frame1, frame3)
        assert sim_different < sim_identical

    def test_calculate_frame_similarity_different_lengths(self):
        """Test frame similarity with different length inputs."""
        frame1 = [0.1, 0.2] * 11  # 22 values
        frame2 = [0.1, 0.2] * 5  # 10 values

        similarity = PoseAnalyzer.calculate_frame_similarity(frame1, frame2)
        assert similarity == 0.0

    def test_pose_sequence_scale_invariance(self):
        """Test that normalized poses are scale-invariant."""
        # Create same pose at different scales
        frame_small = self.create_test_frame(scale=0.5)
        frame_large = self.create_test_frame(scale=2.0)

        normalized_small = normalize_pose_sequence([frame_small])
        normalized_large = normalize_pose_sequence([frame_large])

        # Normalized versions should be very similar
        if normalized_small and normalized_large:
            similarity = PoseAnalyzer.calculate_frame_similarity(
                normalized_small[0], normalized_large[0]
            )
            assert similarity > 0.9, f"Scale invariance failed, similarity: {similarity}"

    def test_pose_sequence_translation_invariance(self):
        """Test that normalized poses are translation-invariant."""
        # Create same pose at different positions
        frame_center = self.create_test_frame()
        frame_offset = self.create_test_frame(offset_x=0.3, offset_y=0.2)

        normalized_center = normalize_pose_sequence([frame_center])
        normalized_offset = normalize_pose_sequence([frame_offset])

        # Normalized versions should be very similar
        if normalized_center and normalized_offset:
            similarity = PoseAnalyzer.calculate_frame_similarity(
                normalized_center[0], normalized_offset[0]
            )
            assert similarity > 0.9, f"Translation invariance failed, similarity: {similarity}"

    def test_sequence_matching_with_noise(self):
        """Test sequence matching with slightly noisy data."""
        # Create base sequence
        frame1 = self.create_test_frame()
        frame2 = self.create_test_frame(scale=1.1)
        sequence_clean = [frame1, frame2]

        # Create slightly noisy version
        frame1_noisy = self.create_test_frame(offset_x=0.01, offset_y=0.01)
        frame2_noisy = self.create_test_frame(scale=1.1, offset_x=0.01, offset_y=0.01)
        sequence_noisy = [frame1_noisy, frame2_noisy]

        similarity = find_pose_sequence_match(sequence_clean, sequence_noisy)

        # Should still find good match despite noise
        assert similarity > 0.7, f"Noise tolerance failed, similarity: {similarity}"


if __name__ == "__main__":
    pytest.main([__file__])
