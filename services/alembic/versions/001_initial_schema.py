"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2024-10-24 08:35:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all initial tables for MagicLens."""
    
    # Create user_profiles table
    op.create_table(
        'user_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('user_type', sa.String(length=20), nullable=False),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('portfolio_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('earnings_total', sa.Numeric(precision=10, scale=2), server_default='0.0', nullable=True),
        sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('last_updated', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        sa.UniqueConstraint('username'),
        sa.CheckConstraint("user_type IN ('videographer', 'artist', 'both')", name='user_type_check')
    )
    
    # Create videos table
    op.create_table(
        'videos',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_path', sa.Text(), nullable=False),
        sa.Column('thumbnail_path', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('view_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('collaboration_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_public', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('last_updated', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on user_id for videos
    op.create_index('idx_videos_user_id', 'videos', ['user_id'])
    op.create_index('idx_videos_category', 'videos', ['category'])
    op.create_index('idx_videos_created_at', 'videos', ['created_at'])
    
    # Create artist_assets table
    op.create_table(
        'artist_assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('file_path', sa.Text(), nullable=False),
        sa.Column('thumbnail_path', sa.Text(), nullable=True),
        sa.Column('asset_type', sa.String(length=20), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('nft_id', sa.Integer(), nullable=True),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('usage_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('tags', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_public', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('status', sa.String(length=20), server_default='approved', nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('last_updated', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for artist_assets
    op.create_index('idx_artist_assets_artist_id', 'artist_assets', ['artist_id'])
    op.create_index('idx_artist_assets_category', 'artist_assets', ['category'])
    op.create_index('idx_artist_assets_nft_id', 'artist_assets', ['nft_id'], unique=True)
    
    # Create collaborations table
    op.create_table(
        'collaborations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('videographer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='pending', nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('revenue_split', sa.Numeric(precision=5, scale=2), server_default='50.0', nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('last_updated', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("status IN ('pending', 'active', 'completed', 'cancelled')", name='collaboration_status_check')
    )
    
    # Create indexes for collaborations
    op.create_index('idx_collaborations_video_id', 'collaborations', ['video_id'])
    op.create_index('idx_collaborations_videographer_id', 'collaborations', ['videographer_id'])
    op.create_index('idx_collaborations_artist_id', 'collaborations', ['artist_id'])
    
    # Create overlays table
    op.create_table(
        'overlays',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('collaboration_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('position_x', sa.Integer(), nullable=False),
        sa.Column('position_y', sa.Integer(), nullable=False),
        sa.Column('scale', sa.Numeric(precision=5, scale=2), server_default='1.0', nullable=True),
        sa.Column('rotation', sa.Numeric(precision=5, scale=2), server_default='0.0', nullable=True),
        sa.Column('opacity', sa.Numeric(precision=3, scale=2), server_default='1.0', nullable=True),
        sa.Column('start_time', sa.Numeric(precision=10, scale=3), nullable=False),
        sa.Column('end_time', sa.Numeric(precision=10, scale=3), nullable=False),
        sa.Column('layer_order', sa.Integer(), server_default='0', nullable=True),
        sa.Column('animation_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('last_updated', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for overlays
    op.create_index('idx_overlays_collaboration_id', 'overlays', ['collaboration_id'])
    op.create_index('idx_overlays_asset_id', 'overlays', ['asset_id'])
    
    # Create renders table
    op.create_table(
        'renders',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('collaboration_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('render_status', sa.String(length=20), server_default='queued', nullable=True),
        sa.Column('progress', sa.Numeric(precision=5, scale=4), server_default='0.0', nullable=True),
        sa.Column('output_path', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('processing_time', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('started_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('completed_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("render_status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')", name='render_status_check')
    )
    
    # Create indexes for renders
    op.create_index('idx_renders_collaboration_id', 'renders', ['collaboration_id'])
    op.create_index('idx_renders_status', 'renders', ['render_status'])


def downgrade() -> None:
    """Drop all tables."""
    op.drop_index('idx_renders_status', table_name='renders')
    op.drop_index('idx_renders_collaboration_id', table_name='renders')
    op.drop_table('renders')
    
    op.drop_index('idx_overlays_asset_id', table_name='overlays')
    op.drop_index('idx_overlays_collaboration_id', table_name='overlays')
    op.drop_table('overlays')
    
    op.drop_index('idx_collaborations_artist_id', table_name='collaborations')
    op.drop_index('idx_collaborations_videographer_id', table_name='collaborations')
    op.drop_index('idx_collaborations_video_id', table_name='collaborations')
    op.drop_table('collaborations')
    
    op.drop_index('idx_artist_assets_nft_id', table_name='artist_assets')
    op.drop_index('idx_artist_assets_category', table_name='artist_assets')
    op.drop_index('idx_artist_assets_artist_id', table_name='artist_assets')
    op.drop_table('artist_assets')
    
    op.drop_index('idx_videos_created_at', table_name='videos')
    op.drop_index('idx_videos_category', table_name='videos')
    op.drop_index('idx_videos_user_id', table_name='videos')
    op.drop_table('videos')
    
    op.drop_table('user_profiles')
