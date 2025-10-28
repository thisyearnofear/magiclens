"""
Pose Analysis Caching Models and Operations
==========================================

Database models and caching operations for computer vision pose analysis.
Follows DRY, CLEAN, and MODULAR principles.
"""

from core.table import Table, ColumnDetails
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import uuid
import json
import hashlib
from sqlalchemy.dialects.postgresql import JSONB


class VideoPoseAnalysis(Table):
    """Cache pose analysis results for videos."""

    __tablename__ = "video_pose_analysis"

    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    video_id: uuid.UUID  # References videos table
    analysis_version: str = ColumnDetails(default="1.0")  # Version for cache invalidation
    pose_sequences: Dict = ColumnDetails(default_factory=dict)  # Raw pose landmark sequences
    normalized_poses: Dict = ColumnDetails(default_factory=dict)  # Normalized pose sequences
    movement_analysis: Dict = ColumnDetails(default_factory=dict)  # Movement classification
    frame_count: int = ColumnDetails(default=0)
    confidence_avg: float = ColumnDetails(default=0.0)  # Average pose confidence
    processing_time_ms: int = ColumnDetails(default=0)
    file_size_bytes: int = ColumnDetails(default=0)
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    last_accessed: datetime = ColumnDetails(default_factory=datetime.now)


class PoseSequenceMatch(Table):
    """Cache pose sequence matching results."""

    __tablename__ = "pose_sequence_matches"

    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    sequence_a_hash: str  # Hash of first pose sequence
    sequence_b_hash: str  # Hash of second pose sequence
    similarity_score: float  # Similarity score (0.0 to 1.0)
    match_confidence: str = ColumnDetails(default="medium")  # high, medium, low
    algorithm_version: str = ColumnDetails(default="1.0")
    computation_time_ms: int = ColumnDetails(default=0)
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    access_count: int = ColumnDetails(default=1)
    last_accessed: datetime = ColumnDetails(default_factory=datetime.now)


class SmartOverlayCache(Table):
    """Cache smart overlay placement suggestions."""

    __tablename__ = "smart_overlay_cache"

    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    video_id: uuid.UUID  # References videos table
    overlay_type: str  # Type of overlay (e.g., "logo", "text", "effect")
    overlay_dimensions: str  # Dimensions as "WIDTHxHEIGHT"
    placement_suggestions: Dict = ColumnDetails(default_factory=dict)  # Placement data
    analysis_metadata: Dict = ColumnDetails(default_factory=dict)  # Analysis context
    cache_version: str = ColumnDetails(default="1.0")
    confidence_score: float = ColumnDetails(default=0.0)
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    access_count: int = ColumnDetails(default=0)
    last_accessed: datetime = ColumnDetails(default_factory=datetime.now)


class PoseCacheManager:
    """
    Manages pose analysis caching operations.
    Implements PERFORMANT caching with automatic cleanup.
    """

    # Cache TTL settings
    POSE_ANALYSIS_TTL_DAYS = 30  # Keep pose analysis for 30 days
    SEQUENCE_MATCH_TTL_DAYS = 7  # Keep sequence matches for 7 days
    OVERLAY_CACHE_TTL_DAYS = 14  # Keep overlay cache for 14 days

    # Version for cache invalidation
    CURRENT_ANALYSIS_VERSION = "1.0"
    CURRENT_ALGORITHM_VERSION = "1.0"
    CURRENT_CACHE_VERSION = "1.0"

    @staticmethod
    def generate_sequence_hash(pose_sequence: List[List[float]]) -> str:
        """Generate consistent hash for pose sequence (DRY principle)."""
        # Convert to string representation for hashing
        sequence_str = json.dumps(pose_sequence, sort_keys=True)
        return hashlib.sha256(sequence_str.encode()).hexdigest()

    @staticmethod
    def format_dimensions(width: int, height: int) -> str:
        """Format overlay dimensions consistently (DRY principle)."""
        return f"{width}x{height}"

    @classmethod
    def get_video_pose_analysis(cls, video_id: uuid.UUID) -> Optional[VideoPoseAnalysis]:
        """Get cached pose analysis for video."""
        try:
            results = VideoPoseAnalysis.sql(
                """
                SELECT * FROM video_pose_analysis
                WHERE video_id = %(video_id)s
                AND analysis_version = %(version)s
                ORDER BY created_at DESC
                LIMIT 1
                """,
                {"video_id": video_id, "version": cls.CURRENT_ANALYSIS_VERSION},
            )

            if results:
                # Update access time
                cls._update_access_time("video_pose_analysis", results[0]["id"])
                return VideoPoseAnalysis(**results[0])
            return None

        except Exception as e:
            print(f"Error getting video pose analysis: {e}")
            return None

    @classmethod
    def cache_video_pose_analysis(
        cls,
        video_id: uuid.UUID,
        pose_sequences: List[List[float]],
        normalized_poses: List[List[float]],
        movement_analysis: Dict,
        processing_time_ms: int = 0,
        file_size_bytes: int = 0,
    ) -> bool:
        """Cache video pose analysis results."""
        try:
            # Calculate metadata
            frame_count = len(pose_sequences)
            confidence_avg = cls._calculate_average_confidence(pose_sequences)

            analysis = VideoPoseAnalysis(
                video_id=video_id,
                analysis_version=cls.CURRENT_ANALYSIS_VERSION,
                pose_sequences={"sequences": pose_sequences},
                normalized_poses={"normalized": normalized_poses},
                movement_analysis=movement_analysis,
                frame_count=frame_count,
                confidence_avg=confidence_avg,
                processing_time_ms=processing_time_ms,
                file_size_bytes=file_size_bytes,
            )

            # Use upsert to handle duplicates
            analysis.sql(
                """
                INSERT INTO video_pose_analysis
                (id, video_id, analysis_version, pose_sequences, normalized_poses,
                 movement_analysis, frame_count, confidence_avg, processing_time_ms,
                 file_size_bytes, created_at, last_accessed)
                VALUES (%(id)s, %(video_id)s, %(analysis_version)s, %(pose_sequences)s,
                        %(normalized_poses)s, %(movement_analysis)s, %(frame_count)s,
                        %(confidence_avg)s, %(processing_time_ms)s, %(file_size_bytes)s,
                        NOW(), NOW())
                ON CONFLICT (video_id, analysis_version)
                DO UPDATE SET
                    pose_sequences = EXCLUDED.pose_sequences,
                    normalized_poses = EXCLUDED.normalized_poses,
                    movement_analysis = EXCLUDED.movement_analysis,
                    frame_count = EXCLUDED.frame_count,
                    confidence_avg = EXCLUDED.confidence_avg,
                    processing_time_ms = EXCLUDED.processing_time_ms,
                    file_size_bytes = EXCLUDED.file_size_bytes,
                    last_accessed = NOW()
                """,
                {
                    "id": analysis.id,
                    "video_id": video_id,
                    "analysis_version": cls.CURRENT_ANALYSIS_VERSION,
                    "pose_sequences": json.dumps({"sequences": pose_sequences}),
                    "normalized_poses": json.dumps({"normalized": normalized_poses}),
                    "movement_analysis": json.dumps(movement_analysis),
                    "frame_count": frame_count,
                    "confidence_avg": confidence_avg,
                    "processing_time_ms": processing_time_ms,
                    "file_size_bytes": file_size_bytes,
                },
            )

            return True

        except Exception as e:
            print(f"Error caching video pose analysis: {e}")
            return False

    @classmethod
    def get_sequence_match(
        cls, sequence_a: List[List[float]], sequence_b: List[List[float]]
    ) -> Optional[float]:
        """Get cached sequence match result."""
        try:
            hash_a = cls.generate_sequence_hash(sequence_a)
            hash_b = cls.generate_sequence_hash(sequence_b)

            # Try both hash orders (A,B and B,A)
            results = PoseSequenceMatch.sql(
                """
                SELECT similarity_score FROM pose_sequence_matches
                WHERE ((sequence_a_hash = %(hash_a)s AND sequence_b_hash = %(hash_b)s) OR
                       (sequence_a_hash = %(hash_b)s AND sequence_b_hash = %(hash_a)s))
                AND algorithm_version = %(version)s
                ORDER BY created_at DESC
                LIMIT 1
                """,
                {"hash_a": hash_a, "hash_b": hash_b, "version": cls.CURRENT_ALGORITHM_VERSION},
            )

            if results:
                # Update access statistics
                cls._update_sequence_match_access(hash_a, hash_b)
                return float(results[0]["similarity_score"])
            return None

        except Exception as e:
            print(f"Error getting sequence match: {e}")
            return None

    @classmethod
    def cache_sequence_match(
        cls,
        sequence_a: List[List[float]],
        sequence_b: List[List[float]],
        similarity_score: float,
        computation_time_ms: int = 0,
    ) -> bool:
        """Cache sequence match result."""
        try:
            hash_a = cls.generate_sequence_hash(sequence_a)
            hash_b = cls.generate_sequence_hash(sequence_b)

            # Determine confidence level
            confidence = (
                "high" if similarity_score > 0.8 else "medium" if similarity_score > 0.5 else "low"
            )

            match_record = PoseSequenceMatch(
                sequence_a_hash=hash_a,
                sequence_b_hash=hash_b,
                similarity_score=similarity_score,
                match_confidence=confidence,
                algorithm_version=cls.CURRENT_ALGORITHM_VERSION,
                computation_time_ms=computation_time_ms,
            )

            # Use upsert for duplicates
            match_record.sql(
                """
                INSERT INTO pose_sequence_matches
                (id, sequence_a_hash, sequence_b_hash, similarity_score, match_confidence,
                 algorithm_version, computation_time_ms, created_at, access_count, last_accessed)
                VALUES (%(id)s, %(sequence_a_hash)s, %(sequence_b_hash)s, %(similarity_score)s,
                        %(match_confidence)s, %(algorithm_version)s, %(computation_time_ms)s,
                        NOW(), 1, NOW())
                ON CONFLICT (sequence_a_hash, sequence_b_hash, algorithm_version)
                DO UPDATE SET
                    similarity_score = EXCLUDED.similarity_score,
                    match_confidence = EXCLUDED.match_confidence,
                    computation_time_ms = EXCLUDED.computation_time_ms,
                    access_count = pose_sequence_matches.access_count + 1,
                    last_accessed = NOW()
                """,
                {
                    "id": match_record.id,
                    "sequence_a_hash": hash_a,
                    "sequence_b_hash": hash_b,
                    "similarity_score": similarity_score,
                    "match_confidence": confidence,
                    "algorithm_version": cls.CURRENT_ALGORITHM_VERSION,
                    "computation_time_ms": computation_time_ms,
                },
            )

            return True

        except Exception as e:
            print(f"Error caching sequence match: {e}")
            return False

    @classmethod
    def get_smart_overlay_cache(
        cls, video_id: uuid.UUID, overlay_type: str, width: int, height: int
    ) -> Optional[Dict]:
        """Get cached smart overlay placement."""
        try:
            dimensions = cls.format_dimensions(width, height)

            results = SmartOverlayCache.sql(
                """
                SELECT placement_suggestions, analysis_metadata, confidence_score
                FROM smart_overlay_cache
                WHERE video_id = %(video_id)s
                AND overlay_type = %(overlay_type)s
                AND overlay_dimensions = %(dimensions)s
                AND cache_version = %(version)s
                ORDER BY created_at DESC
                LIMIT 1
                """,
                {
                    "video_id": video_id,
                    "overlay_type": overlay_type,
                    "dimensions": dimensions,
                    "version": cls.CURRENT_CACHE_VERSION,
                },
            )

            if results:
                # Update access statistics
                cls._update_overlay_cache_access(video_id, overlay_type, dimensions)
                return {
                    "placement_suggestions": results[0]["placement_suggestions"],
                    "analysis_metadata": results[0]["analysis_metadata"],
                    "confidence_score": float(results[0]["confidence_score"]),
                }
            return None

        except Exception as e:
            print(f"Error getting smart overlay cache: {e}")
            return None

    @classmethod
    def cache_smart_overlay_placement(
        cls,
        video_id: uuid.UUID,
        overlay_type: str,
        width: int,
        height: int,
        placement_suggestions: Dict,
        analysis_metadata: Dict,
        confidence_score: float = 0.0,
    ) -> bool:
        """Cache smart overlay placement suggestions."""
        try:
            dimensions = cls.format_dimensions(width, height)

            overlay_cache = SmartOverlayCache(
                video_id=video_id,
                overlay_type=overlay_type,
                overlay_dimensions=dimensions,
                placement_suggestions=placement_suggestions,
                analysis_metadata=analysis_metadata,
                cache_version=cls.CURRENT_CACHE_VERSION,
                confidence_score=confidence_score,
            )

            # Use upsert for duplicates
            overlay_cache.sql(
                """
                INSERT INTO smart_overlay_cache
                (id, video_id, overlay_type, overlay_dimensions, placement_suggestions,
                 analysis_metadata, cache_version, confidence_score, created_at,
                 access_count, last_accessed)
                VALUES (%(id)s, %(video_id)s, %(overlay_type)s, %(overlay_dimensions)s,
                        %(placement_suggestions)s, %(analysis_metadata)s, %(cache_version)s,
                        %(confidence_score)s, NOW(), 0, NOW())
                ON CONFLICT (video_id, overlay_type, overlay_dimensions, cache_version)
                DO UPDATE SET
                    placement_suggestions = EXCLUDED.placement_suggestions,
                    analysis_metadata = EXCLUDED.analysis_metadata,
                    confidence_score = EXCLUDED.confidence_score,
                    last_accessed = NOW()
                """,
                {
                    "id": overlay_cache.id,
                    "video_id": video_id,
                    "overlay_type": overlay_type,
                    "overlay_dimensions": dimensions,
                    "placement_suggestions": json.dumps(placement_suggestions),
                    "analysis_metadata": json.dumps(analysis_metadata),
                    "cache_version": cls.CURRENT_CACHE_VERSION,
                    "confidence_score": confidence_score,
                },
            )

            return True

        except Exception as e:
            print(f"Error caching smart overlay placement: {e}")
            return False

    @classmethod
    def cleanup_expired_cache(cls) -> Dict[str, int]:
        """Clean up expired cache entries (PERFORMANT principle)."""
        try:
            cleanup_stats = {"pose_analysis": 0, "sequence_matches": 0, "overlay_cache": 0}

            # Clean up expired pose analysis
            pose_cutoff = datetime.now() - timedelta(days=cls.POSE_ANALYSIS_TTL_DAYS)
            result = VideoPoseAnalysis.sql(
                "DELETE FROM video_pose_analysis WHERE last_accessed < %(cutoff)s",
                {"cutoff": pose_cutoff},
            )
            cleanup_stats["pose_analysis"] = result.get("rowcount", 0)

            # Clean up expired sequence matches
            match_cutoff = datetime.now() - timedelta(days=cls.SEQUENCE_MATCH_TTL_DAYS)
            result = PoseSequenceMatch.sql(
                "DELETE FROM pose_sequence_matches WHERE last_accessed < %(cutoff)s",
                {"cutoff": match_cutoff},
            )
            cleanup_stats["sequence_matches"] = result.get("rowcount", 0)

            # Clean up expired overlay cache
            overlay_cutoff = datetime.now() - timedelta(days=cls.OVERLAY_CACHE_TTL_DAYS)
            result = SmartOverlayCache.sql(
                "DELETE FROM smart_overlay_cache WHERE last_accessed < %(cutoff)s",
                {"cutoff": overlay_cutoff},
            )
            cleanup_stats["overlay_cache"] = result.get("rowcount", 0)

            return cleanup_stats

        except Exception as e:
            print(f"Error cleaning up cache: {e}")
            return {"pose_analysis": 0, "sequence_matches": 0, "overlay_cache": 0}

    @staticmethod
    def _calculate_average_confidence(pose_sequences: List[List[float]]) -> float:
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
    def _update_access_time(table_name: str, record_id: uuid.UUID):
        """Update last_accessed timestamp (DRY principle)."""
        try:
            from core.database import execute_query

            execute_query(
                f"UPDATE {table_name} SET last_accessed = NOW() WHERE id = %s", (record_id,)
            )
        except Exception as e:
            print(f"Error updating access time: {e}")

    @staticmethod
    def _update_sequence_match_access(hash_a: str, hash_b: str):
        """Update sequence match access statistics."""
        try:
            PoseSequenceMatch.sql(
                """
                UPDATE pose_sequence_matches
                SET access_count = access_count + 1, last_accessed = NOW()
                WHERE (sequence_a_hash = %(hash_a)s AND sequence_b_hash = %(hash_b)s) OR
                      (sequence_a_hash = %(hash_b)s AND sequence_b_hash = %(hash_a)s)
                """,
                {"hash_a": hash_a, "hash_b": hash_b},
            )
        except Exception as e:
            print(f"Error updating sequence match access: {e}")

    @staticmethod
    def _update_overlay_cache_access(video_id: uuid.UUID, overlay_type: str, dimensions: str):
        """Update overlay cache access statistics."""
        try:
            SmartOverlayCache.sql(
                """
                UPDATE smart_overlay_cache
                SET access_count = access_count + 1, last_accessed = NOW()
                WHERE video_id = %(video_id)s
                AND overlay_type = %(overlay_type)s
                AND overlay_dimensions = %(dimensions)s
                """,
                {"video_id": video_id, "overlay_type": overlay_type, "dimensions": dimensions},
            )
        except Exception as e:
            print(f"Error updating overlay cache access: {e}")


# Convenience functions for direct use (DRY principle)
def get_video_pose_analysis(video_id: uuid.UUID) -> Optional[VideoPoseAnalysis]:
    """Get cached pose analysis for video."""
    return PoseCacheManager.get_video_pose_analysis(video_id)


def cache_video_pose_analysis(
    video_id: uuid.UUID,
    pose_sequences: List[List[float]],
    normalized_poses: List[List[float]],
    movement_analysis: Dict,
    processing_time_ms: int = 0,
) -> bool:
    """Cache video pose analysis results."""
    return PoseCacheManager.cache_video_pose_analysis(
        video_id, pose_sequences, normalized_poses, movement_analysis, processing_time_ms
    )


def get_cached_sequence_match(
    sequence_a: List[List[float]], sequence_b: List[List[float]]
) -> Optional[float]:
    """Get cached sequence match result."""
    return PoseCacheManager.get_sequence_match(sequence_a, sequence_b)


def cache_sequence_match(
    sequence_a: List[List[float]],
    sequence_b: List[List[float]],
    similarity_score: float,
    computation_time_ms: int = 0,
) -> bool:
    """Cache sequence match result."""
    return PoseCacheManager.cache_sequence_match(
        sequence_a, sequence_b, similarity_score, computation_time_ms
    )
