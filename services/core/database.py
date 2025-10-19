"""Database connection and configuration for MagicLens."""
import os
import psycopg
from psycopg_pool import ConnectionPool
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "magiclens")
DB_USER = os.getenv("DB_USER", "magiclens_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "magiclens_pass")

# Connection string
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

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
    """Execute a query and return results."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
            if cur.description:
                return cur.fetchall()
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