"""
Computer Vision Pose Analysis - Usage Examples
============================================

This module demonstrates how to use the computer vision pose analysis functions
for normalizing pose sequences and finding pose matches.

The functions are designed to work with MediaPipe pose landmark data and provide
robust pose comparison capabilities for augmented reality applications.
"""

import sys
import os

# Add the core module to the path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from core.computer_vision import normalize_pose_sequence, find_pose_sequence_match, PoseAnalyzer


def example_basic_usage():
    """
    Basic example of pose sequence normalization and matching.
    """
    print("=== Basic Usage Example ===")

    # Example 1: Create sample pose data (7 landmarks with x,y,z,visibility each)
    # This represents: nose, left_shoulder, right_shoulder, left_elbow, right_elbow, left_wrist, right_wrist

    pose_frame_1 = [
        # Nose
        0.5,
        0.2,
        0.0,
        0.95,
        # Left shoulder
        0.35,
        0.4,
        0.0,
        0.9,
        # Right shoulder
        0.65,
        0.4,
        0.0,
        0.9,
        # Left elbow
        0.25,
        0.6,
        0.0,
        0.85,
        # Right elbow
        0.75,
        0.6,
        0.0,
        0.85,
        # Left wrist
        0.15,
        0.8,
        0.0,
        0.8,
        # Right wrist
        0.85,
        0.8,
        0.0,
        0.8,
    ]

    pose_frame_2 = [
        # Similar pose but slightly different (person moved arms)
        0.5,
        0.2,
        0.0,
        0.95,  # Nose (same)
        0.35,
        0.4,
        0.0,
        0.9,  # Left shoulder
        0.65,
        0.4,
        0.0,
        0.9,  # Right shoulder
        0.3,
        0.65,
        0.0,
        0.85,  # Left elbow (moved up)
        0.7,
        0.65,
        0.0,
        0.85,  # Right elbow (moved up)
        0.2,
        0.85,
        0.0,
        0.8,  # Left wrist (moved up)
        0.8,
        0.85,
        0.0,
        0.8,  # Right wrist (moved up)
    ]

    sequence = [pose_frame_1, pose_frame_2]

    # Normalize the sequence
    normalized = normalize_pose_sequence(sequence)

    print(f"Original sequence: {len(sequence)} frames")
    print(f"Normalized sequence: {len(normalized)} frames")
    print(
        f"Each normalized frame has {len(normalized[0]) if normalized else 0} values (should be 22)"
    )

    # Show first few values of first frame
    if normalized:
        print(f"First frame normalized values (first 6): {normalized[0][:6]}")


def example_sequence_matching():
    """
    Example of finding pose sequences within longer sequences.
    """
    print("\n=== Sequence Matching Example ===")

    # Create a longer sequence (5 frames)
    frames = []

    # Frame 1: Standing pose
    frames.append(
        [
            0.5,
            0.2,
            0.0,
            0.95,  # Nose
            0.35,
            0.4,
            0.0,
            0.9,  # Left shoulder
            0.65,
            0.4,
            0.0,
            0.9,  # Right shoulder
            0.25,
            0.6,
            0.0,
            0.85,  # Left elbow
            0.75,
            0.6,
            0.0,
            0.85,  # Right elbow
            0.15,
            0.8,
            0.0,
            0.8,  # Left wrist
            0.85,
            0.8,
            0.0,
            0.8,  # Right wrist
        ]
    )

    # Frame 2: Arms raised
    frames.append(
        [
            0.5,
            0.2,
            0.0,
            0.95,
            0.35,
            0.4,
            0.0,
            0.9,
            0.65,
            0.4,
            0.0,
            0.9,
            0.2,
            0.3,
            0.0,
            0.85,  # Elbows raised
            0.8,
            0.3,
            0.0,
            0.85,
            0.1,
            0.1,
            0.0,
            0.8,  # Wrists high
            0.9,
            0.1,
            0.0,
            0.8,
        ]
    )

    # Frame 3: Arms out to sides
    frames.append(
        [
            0.5,
            0.2,
            0.0,
            0.95,
            0.35,
            0.4,
            0.0,
            0.9,
            0.65,
            0.4,
            0.0,
            0.9,
            0.1,
            0.4,
            0.0,
            0.85,  # Elbows out
            0.9,
            0.4,
            0.0,
            0.85,
            0.05,
            0.4,
            0.0,
            0.8,  # Wrists far out
            0.95,
            0.4,
            0.0,
            0.8,
        ]
    )

    # Frame 4: Back to standing
    frames.append(frames[0])  # Same as frame 1

    # Frame 5: Similar to frame 2
    frames.append(frames[1])

    long_sequence = frames

    # Create shorter sequences to search for
    short_sequence_1 = [frames[1], frames[2]]  # Arms raised -> arms out
    short_sequence_2 = [frames[0], frames[1]]  # Standing -> arms raised

    # Find matches
    match_1 = find_pose_sequence_match(long_sequence, short_sequence_1)
    match_2 = find_pose_sequence_match(long_sequence, short_sequence_2)

    print(f"Long sequence length: {len(long_sequence)} frames")
    print(f"Short sequence 1 length: {len(short_sequence_1)} frames")
    print(f"Short sequence 2 length: {len(short_sequence_2)} frames")
    print(f"Match 1 similarity: {match_1:.3f}")
    print(f"Match 2 similarity: {match_2:.3f}")

    # Test with identical sequence
    identical_match = find_pose_sequence_match(short_sequence_1, short_sequence_1)
    print(f"Identical sequence match: {identical_match:.3f}")


def example_scale_and_translation_invariance():
    """
    Demonstrate that the normalization makes poses scale and translation invariant.
    """
    print("\n=== Scale and Translation Invariance Example ===")

    # Base pose
    base_pose = [
        0.5,
        0.3,
        0.0,
        0.95,  # Nose
        0.4,
        0.5,
        0.0,
        0.9,  # Left shoulder
        0.6,
        0.5,
        0.0,
        0.9,  # Right shoulder
        0.3,
        0.7,
        0.0,
        0.85,  # Left elbow
        0.7,
        0.7,
        0.0,
        0.85,  # Right elbow
        0.2,
        0.9,
        0.0,
        0.8,  # Left wrist
        0.8,
        0.9,
        0.0,
        0.8,  # Right wrist
    ]

    # Same pose scaled up by 1.5x
    scaled_pose = []
    for i in range(0, len(base_pose), 4):
        x, y, z, vis = base_pose[i : i + 4]
        # Scale x and y coordinates
        scaled_pose.extend([x * 1.5, y * 1.5, z, vis])

    # Same pose translated by 0.2 units
    translated_pose = []
    for i in range(0, len(base_pose), 4):
        x, y, z, vis = base_pose[i : i + 4]
        # Translate x and y coordinates
        translated_pose.extend([x + 0.2, y + 0.2, z, vis])

    # Normalize all versions
    base_norm = normalize_pose_sequence([base_pose])
    scaled_norm = normalize_pose_sequence([scaled_pose])
    translated_norm = normalize_pose_sequence([translated_pose])

    if base_norm and scaled_norm and translated_norm:
        # Calculate similarities
        scale_similarity = PoseAnalyzer.calculate_frame_similarity(base_norm[0], scaled_norm[0])
        translation_similarity = PoseAnalyzer.calculate_frame_similarity(
            base_norm[0], translated_norm[0]
        )

        print(f"Base vs Scaled similarity: {scale_similarity:.3f}")
        print(f"Base vs Translated similarity: {translation_similarity:.3f}")
        print("(Values close to 1.0 indicate good invariance)")


def example_real_world_usage():
    """
    Example showing how this might be used in a real AR application.
    """
    print("\n=== Real-World AR Usage Example ===")

    # Simulate receiving pose data from MediaPipe in a real application
    def simulate_mediapipe_frame():
        """Simulate getting pose landmarks from MediaPipe."""
        return [
            0.5,
            0.25,
            0.0,
            0.95,  # Nose
            0.4,
            0.45,
            0.0,
            0.9,  # Left shoulder
            0.6,
            0.45,
            0.0,
            0.9,  # Right shoulder
            0.35,
            0.65,
            0.0,
            0.85,  # Left elbow
            0.65,
            0.65,
            0.0,
            0.85,  # Right elbow
            0.3,
            0.85,
            0.0,
            0.8,  # Left wrist
            0.7,
            0.85,
            0.0,
            0.8,  # Right wrist
        ]

    # Reference gesture sequence (e.g., a dance move or exercise)
    reference_gesture = [
        simulate_mediapipe_frame(),  # Frame 1
        simulate_mediapipe_frame(),  # Frame 2 (could be different)
    ]

    # Simulate real-time pose detection
    current_pose_buffer = []
    detection_threshold = 0.7  # Minimum similarity to consider a match

    print("Simulating real-time pose detection...")

    # Simulate 10 frames of pose data
    for frame_num in range(10):
        # Get current pose (in reality, this would come from MediaPipe)
        current_frame = simulate_mediapipe_frame()
        current_pose_buffer.append(current_frame)

        # Keep buffer size manageable (e.g., last 5 frames)
        if len(current_pose_buffer) > 5:
            current_pose_buffer = current_pose_buffer[-5:]

        # Check if we have enough frames to match the reference
        if len(current_pose_buffer) >= len(reference_gesture):
            # Get the most recent frames matching reference length
            recent_frames = current_pose_buffer[-len(reference_gesture) :]

            # Calculate similarity
            similarity = find_pose_sequence_match([recent_frames], [reference_gesture])

            print(f"Frame {frame_num + 1}: Similarity = {similarity:.3f}", end="")

            if similarity > detection_threshold:
                print(" -> GESTURE DETECTED! 🎉")
                # In a real app, you might trigger an AR effect here
            else:
                print()


def example_advanced_features():
    """
    Example showing advanced features and customization.
    """
    print("\n=== Advanced Features Example ===")

    # Create test data
    pose_data = [
        0.5,
        0.2,
        0.0,
        0.95,  # High confidence
        0.4,
        0.4,
        0.0,
        0.9,  # Good confidence
        0.6,
        0.4,
        0.0,
        0.3,  # Low confidence (might be occluded)
        0.3,
        0.6,
        0.0,
        0.85,
        0.7,
        0.6,
        0.0,
        0.85,
        0.2,
        0.8,
        0.0,
        0.8,
        0.8,
        0.8,
        0.0,
        0.8,
    ]

    # Extract coordinates and confidence values
    coordinates = PoseAnalyzer.extract_coordinates_from_frame(pose_data)
    confidences = [
        pose_data[i] for i in range(3, len(pose_data), 4)
    ]  # Every 4th value starting from index 3

    print(f"Extracted coordinates: {coordinates[:3]}...")  # Show first 3
    print(f"Confidence values: {confidences}")

    # Normalize the pose
    normalized = PoseAnalyzer.normalize_pose_frame(coordinates)
    print(f"Normalized pose (first 6 values): {normalized[:6] if normalized else 'None'}")

    # Show how to work with the PoseAnalyzer class directly
    analyzer = PoseAnalyzer()

    # You could extend this class to add custom filtering based on confidence
    print("PoseAnalyzer class initialized successfully")
    print(f"Key landmarks used: {list(analyzer.SELECTED_LANDMARKS)}")


if __name__ == "__main__":
    """Run all examples."""
    print("Computer Vision Pose Analysis - Usage Examples")
    print("=" * 50)

    example_basic_usage()
    example_sequence_matching()
    example_scale_and_translation_invariance()
    example_real_world_usage()
    example_advanced_features()

    print("\n" + "=" * 50)
    print("All examples completed successfully!")
    print("\nTo use in your own code:")
    print("from core.computer_vision import normalize_pose_sequence, find_pose_sequence_match")
