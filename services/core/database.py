"""Database connection and configuration for MagicLens."""
import os
import psycopg
from psycopg_pool import ConnectionPool
from typing import Optional
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

# Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "magiclens")
DB_USER = os.getenv("DB_USER", "magiclens_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "magiclens_pass")

# Connection string
DB_SSLMODE = os.getenv("DB_SSLMODE", "")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
if DB_SSLMODE:
    DATABASE_URL += f"?sslmode={DB_SSLMODE}"

# Create connection pool
pool: Optional[ConnectionPool] = None

def init_db():
    """Initialize database connection pool."""
    global pool
    try:
        pool = ConnectionPool(
            DATABASE_URL,
            min_size=1,
            max_size=10,
            timeout=30,
            kwargs={"autocommit": True}
        )
        logger.info("Database connection pool initialized")
        create_tables()
    except Exception as e:
        logger.error(f"Failed to initialize database connection pool: {e}")
        raise

def create_tables():
    """Create database tables if they don't exist."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Create user_profiles table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS user_profiles (
                    id UUID PRIMARY KEY,
                    user_id UUID NOT NULL UNIQUE,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('videographer', 'artist', 'both')),
                    avatar_url TEXT,
                    bio TEXT,
                    portfolio_data JSONB,
                    earnings_total DECIMAL(10,2) DEFAULT 0.0,
                    is_verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create videos table
            cur.execute("""
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
                    is_public BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create artist_assets table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS artist_assets (
                    id UUID PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    file_path TEXT NOT NULL,
                    thumbnail_path TEXT,
                    asset_type VARCHAR(20) NOT NULL,
                    category VARCHAR(50),
                    artist_id UUID NOT NULL,
                    file_size BIGINT,
                    usage_count INTEGER DEFAULT 0,
                    metadata JSONB,
                    is_public BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create iconic_moments table (cross-VM mint tracking)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS iconic_moments (
                    id UUID PRIMARY KEY,
                    xlayer_token_id BIGINT NOT NULL,
                    xlayer_tx_hash VARCHAR(128) NOT NULL,
                    xlayer_creator_address VARCHAR(64) NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    overlay_ids TEXT NOT NULL,
                    day INTEGER NOT NULL DEFAULT 1,
                    rank INTEGER NOT NULL,
                    flow_nft_id BIGINT,
                    flow_tx_hash VARCHAR(128),
                    flow_minted_at TIMESTAMP,
                    promoted_by VARCHAR(64),
                    status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_iconic_moments_day ON iconic_moments(day);
                CREATE INDEX IF NOT EXISTS idx_iconic_moments_status ON iconic_moments(status);
            """)

            # Create referral_claims table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS referral_claims (
                    id UUID PRIMARY KEY,
                    referrer_address VARCHAR(64) NOT NULL,
                    referee_address VARCHAR(64) NOT NULL,
                    day INTEGER NOT NULL DEFAULT 1,
                    bonus_votes INTEGER NOT NULL DEFAULT 200,
                    xlayer_token_id BIGINT,
                    xlayer_tx_hash VARCHAR(128),
                    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_referral_referrer ON referral_claims(referrer_address);
                CREATE INDEX IF NOT EXISTS idx_referral_referee ON referral_claims(referee_address);
                CREATE INDEX IF NOT EXISTS idx_referral_day ON referral_claims(day);
            """)

            # Create collaboration_requests table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS collaboration_requests (
                    id UUID PRIMARY KEY,
                    from_user_id UUID NOT NULL,
                    from_username VARCHAR(50) NOT NULL,
                    to_profile_id UUID NOT NULL,
                    to_username VARCHAR(50) NOT NULL,
                    message TEXT,
                    status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    responded_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_collab_req_to ON collaboration_requests(to_profile_id);
                CREATE INDEX IF NOT EXISTS idx_collab_req_from ON collaboration_requests(from_user_id);
            """)

        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        raise
    finally:
        return_db_connection(conn)

def get_db_connection():
    """Get a database connection from the pool."""
    if pool is None:
        raise RuntimeError("Database pool not initialized. Call init_db() first.")
    return pool.getconn()

def return_db_connection(conn):
    """Return a database connection to the pool."""
    if pool is not None:
        pool.putconn(conn)

def execute_query(query: str, params: tuple = None):
    """Execute a query and return results as dictionaries."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
            if cur.description:
                # Get column names
                columns = [desc[0] for desc in cur.description]
                # Convert rows to dictionaries
                rows = cur.fetchall()
                return [dict(zip(columns, row)) for row in rows]
            return None
    finally:
        return_db_connection(conn)

def execute_update(query: str, params: tuple = None):
    """Execute an update/insert/delete query."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return cur.rowcount
    finally:
        return_db_connection(conn)