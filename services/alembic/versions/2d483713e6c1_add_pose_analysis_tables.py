"""add_pose_analysis_tables

Revision ID: 2d483713e6c1
Revises: 001_initial_schema
Create Date: 2024-12-28 13:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "2d483713e6c1"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add pose analysis tables for computer vision caching."""

    # Create video_pose_analysis table for caching pose detection results
    op.create_table(
        "video_pose_analysis",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("video_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("analysis_version", sa.String(length=10), nullable=False),
        sa.Column("pose_sequences", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("normalized_poses", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("movement_analysis", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("frame_count", sa.Integer(), nullable=True),
        sa.Column("confidence_avg", sa.Numeric(precision=5, scale=3), nullable=True),
        sa.Column("processing_time_ms", sa.Integer(), nullable=True),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=True),
        sa.Column(
            "created_at", sa.TIMESTAMP(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True
        ),
        sa.Column(
            "last_accessed",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for video_pose_analysis
    op.create_index("idx_video_pose_analysis_video_id", "video_pose_analysis", ["video_id"])
    op.create_index("idx_video_pose_analysis_created_at", "video_pose_analysis", ["created_at"])
    op.create_index(
        "idx_video_pose_analysis_last_accessed", "video_pose_analysis", ["last_accessed"]
    )
    op.create_index("idx_video_pose_analysis_version", "video_pose_analysis", ["analysis_version"])

    # Create unique constraint for video_id + analysis_version
    op.create_unique_constraint(
        "uq_video_pose_analysis_video_version",
        "video_pose_analysis",
        ["video_id", "analysis_version"],
    )

    # Create pose_sequence_matches table for caching sequence matching results
    op.create_table(
        "pose_sequence_matches",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sequence_a_hash", sa.String(length=64), nullable=False),
        sa.Column("sequence_b_hash", sa.String(length=64), nullable=False),
        sa.Column("similarity_score", sa.Numeric(precision=6, scale=5), nullable=False),
        sa.Column("match_confidence", sa.String(length=10), nullable=True),
        sa.Column("algorithm_version", sa.String(length=10), nullable=False),
        sa.Column("computation_time_ms", sa.Integer(), nullable=True),
        sa.Column(
            "created_at", sa.TIMESTAMP(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True
        ),
        sa.Column("access_count", sa.Integer(), server_default="1", nullable=True),
        sa.Column(
            "last_accessed",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for pose_sequence_matches
    op.create_index(
        "idx_pose_sequence_matches_hash_a", "pose_sequence_matches", ["sequence_a_hash"]
    )
    op.create_index(
        "idx_pose_sequence_matches_hash_b", "pose_sequence_matches", ["sequence_b_hash"]
    )
    op.create_index(
        "idx_pose_sequence_matches_similarity", "pose_sequence_matches", ["similarity_score"]
    )
    op.create_index(
        "idx_pose_sequence_matches_last_accessed", "pose_sequence_matches", ["last_accessed"]
    )

    # Create unique constraint for hash pair + algorithm version
    op.create_unique_constraint(
        "uq_pose_matches_hashes_version",
        "pose_sequence_matches",
        ["sequence_a_hash", "sequence_b_hash", "algorithm_version"],
    )

    # Create smart_overlay_cache table for caching AI placement suggestions
    op.create_table(
        "smart_overlay_cache",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("video_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("overlay_type", sa.String(length=50), nullable=False),
        sa.Column("overlay_dimensions", sa.String(length=20), nullable=False),  # e.g., "200x200"
        sa.Column("placement_suggestions", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("analysis_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("cache_version", sa.String(length=10), nullable=False),
        sa.Column("confidence_score", sa.Numeric(precision=5, scale=3), nullable=True),
        sa.Column(
            "created_at", sa.TIMESTAMP(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True
        ),
        sa.Column("access_count", sa.Integer(), server_default="0", nullable=True),
        sa.Column(
            "last_accessed",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for smart_overlay_cache
    op.create_index("idx_smart_overlay_cache_video_id", "smart_overlay_cache", ["video_id"])
    op.create_index("idx_smart_overlay_cache_type", "smart_overlay_cache", ["overlay_type"])
    op.create_index(
        "idx_smart_overlay_cache_dimensions", "smart_overlay_cache", ["overlay_dimensions"]
    )
    op.create_index(
        "idx_smart_overlay_cache_last_accessed", "smart_overlay_cache", ["last_accessed"]
    )

    # Create unique constraint for video + overlay type + dimensions + version
    op.create_unique_constraint(
        "uq_overlay_cache_video_type_dims_version",
        "smart_overlay_cache",
        ["video_id", "overlay_type", "overlay_dimensions", "cache_version"],
    )

    # Add foreign key constraints
    op.create_foreign_key(
        "fk_video_pose_analysis_video_id",
        "video_pose_analysis",
        "videos",
        ["video_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_smart_overlay_cache_video_id",
        "smart_overlay_cache",
        "videos",
        ["video_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    """Remove pose analysis tables."""

    # Drop foreign keys
    op.drop_constraint("fk_smart_overlay_cache_video_id", "smart_overlay_cache", type_="foreignkey")
    op.drop_constraint("fk_video_pose_analysis_video_id", "video_pose_analysis", type_="foreignkey")

    # Drop smart_overlay_cache table and indexes
    op.drop_constraint(
        "uq_overlay_cache_video_type_dims_version", "smart_overlay_cache", type_="unique"
    )
    op.drop_index("idx_smart_overlay_cache_last_accessed", table_name="smart_overlay_cache")
    op.drop_index("idx_smart_overlay_cache_dimensions", table_name="smart_overlay_cache")
    op.drop_index("idx_smart_overlay_cache_type", table_name="smart_overlay_cache")
    op.drop_index("idx_smart_overlay_cache_video_id", table_name="smart_overlay_cache")
    op.drop_table("smart_overlay_cache")

    # Drop pose_sequence_matches table and indexes
    op.drop_constraint("uq_pose_matches_hashes_version", "pose_sequence_matches", type_="unique")
    op.drop_index("idx_pose_sequence_matches_last_accessed", table_name="pose_sequence_matches")
    op.drop_index("idx_pose_sequence_matches_similarity", table_name="pose_sequence_matches")
    op.drop_index("idx_pose_sequence_matches_hash_b", table_name="pose_sequence_matches")
    op.drop_index("idx_pose_sequence_matches_hash_a", table_name="pose_sequence_matches")
    op.drop_table("pose_sequence_matches")

    # Drop video_pose_analysis table and indexes
    op.drop_constraint(
        "uq_video_pose_analysis_video_version", "video_pose_analysis", type_="unique"
    )
    op.drop_index("idx_video_pose_analysis_version", table_name="video_pose_analysis")
    op.drop_index("idx_video_pose_analysis_last_accessed", table_name="video_pose_analysis")
    op.drop_index("idx_video_pose_analysis_created_at", table_name="video_pose_analysis")
    op.drop_index("idx_video_pose_analysis_video_id", table_name="video_pose_analysis")
    op.drop_table("video_pose_analysis")
