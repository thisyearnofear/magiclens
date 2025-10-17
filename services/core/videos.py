from core.table import Table, ColumnDetails
from typing import Optional, Dict
from datetime import datetime
import uuid

class Video(Table):
    __tablename__ = "videos"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    title: str
    description: Optional[str] = None
    category: str  # 'urban', 'nature', 'indoor', etc.
    duration: float  # Duration in seconds
    file_path: str  # Path in media bucket
    thumbnail_path: Optional[str] = None  # Path in media bucket
    uploader_id: uuid.UUID  # References Solar auth user
    status: str = ColumnDetails(default='processing')  # 'processing', 'available', 'archived'
    metadata: Optional[Dict] = None  # Video metadata and analysis data
    view_count: int = ColumnDetails(default=0)
    collaboration_count: int = ColumnDetails(default=0)
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    last_updated: datetime = ColumnDetails(default_factory=datetime.now)