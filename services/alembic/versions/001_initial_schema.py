"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2024-10-24 08:35:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create the baseline schema.

    Production originally bootstrapped several tables from core.database before
    Alembic was wired in. Keep this migration idempotent so those databases can
    be brought under Alembic without dropping data.
    """

    op.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL UNIQUE,
            username VARCHAR(50) NOT NULL UNIQUE,
            user_type VARCHAR(20) NOT NULL,
            avatar_url TEXT,
            bio TEXT,
            portfolio_data JSONB,
            earnings_total NUMERIC(10, 2) DEFAULT 0.0,
            is_verified BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS videos (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL,
            title VARCHAR(100) NOT NULL,
            description TEXT,
            file_path TEXT NOT NULL,
            thumbnail_path TEXT,
            category VARCHAR(50),
            view_count INTEGER DEFAULT 0,
            collaboration_count INTEGER DEFAULT 0,
            file_size BIGINT,
            duration INTEGER,
            metadata JSONB,
            is_public BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_videos_category ON videos (category)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos (created_at)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS artist_assets (
            id UUID PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            file_path TEXT NOT NULL,
            thumbnail_path TEXT,
            asset_type VARCHAR(20) NOT NULL,
            category VARCHAR(50),
            artist_id UUID NOT NULL,
            nft_id INTEGER,
            file_size BIGINT,
            usage_count INTEGER DEFAULT 0,
            tags TEXT,
            metadata JSONB,
            is_public BOOLEAN DEFAULT true,
            status VARCHAR(20) DEFAULT 'approved',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    op.execute("ALTER TABLE artist_assets ADD COLUMN IF NOT EXISTS nft_id INTEGER")
    op.execute("ALTER TABLE artist_assets ADD COLUMN IF NOT EXISTS tags TEXT")
    op.execute("ALTER TABLE artist_assets ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved'")
    op.execute("ALTER TABLE artist_assets ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    op.execute("CREATE INDEX IF NOT EXISTS idx_artist_assets_artist_id ON artist_assets (artist_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_artist_assets_category ON artist_assets (category)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_artist_assets_nft_id ON artist_assets (nft_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS collaborations (
            id UUID PRIMARY KEY,
            video_id UUID NOT NULL,
            artist_id UUID NOT NULL,
            status VARCHAR(20) DEFAULT 'claimed',
            revenue_split NUMERIC(5, 2) DEFAULT 0.7,
            submission_notes TEXT,
            feedback TEXT,
            version_number INTEGER DEFAULT 1,
            render_data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            submitted_at TIMESTAMP,
            completed_at TIMESTAMP,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_collaborations_video_id ON collaborations (video_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_collaborations_artist_id ON collaborations (artist_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_collaborations_status ON collaborations (status)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS overlays (
            id UUID PRIMARY KEY,
            collaboration_id UUID NOT NULL,
            asset_id UUID NOT NULL,
            position_data JSONB NOT NULL,
            timing_data JSONB NOT NULL,
            layer_order INTEGER DEFAULT 1,
            animation_data JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_overlays_collaboration_id ON overlays (collaboration_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_overlays_asset_id ON overlays (asset_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS renders (
            id UUID PRIMARY KEY,
            collaboration_id UUID NOT NULL,
            output_path TEXT,
            render_status VARCHAR(20) DEFAULT 'queued',
            progress NUMERIC(5, 4) DEFAULT 0.0,
            error_message TEXT,
            render_settings JSONB DEFAULT '{}'::jsonb,
            processing_time NUMERIC(10, 2),
            file_size BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMP,
            completed_at TIMESTAMP
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_renders_collaboration_id ON renders (collaboration_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_renders_status ON renders (render_status)")


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
