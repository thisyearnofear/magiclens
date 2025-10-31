from core.table import Table, ColumnDetails
from typing import Optional, Dict
from datetime import datetime
import uuid

class Video(Table):
    __tablename__ = "videos"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID  # References auth user (matches database schema)
    title: str
    description: Optional[str] = None
    file_path: str  # Path in media bucket
    thumbnail_path: Optional[str] = None  # Path in media bucket
    category: Optional[str] = None  # 'urban', 'nature', 'indoor', etc.
    view_count: int = ColumnDetails(default=0)
    collaboration_count: int = ColumnDetails(default=0)
    file_size: Optional[int] = None  # File size in bytes
    duration: Optional[int] = None  # Duration in seconds (integer in DB)
    metadata: Optional[Dict] = None  # Video metadata and analysis data
    is_public: bool = ColumnDetails(default=True)
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    last_updated: datetime = ColumnDetails(default_factory=datetime.now)