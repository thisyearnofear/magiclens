from core.table import Table, ColumnDetails
from typing import Optional, Dict
from datetime import datetime
import uuid

class ArtistAsset(Table):
    __tablename__ = "artist_assets"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    name: str
    file_path: str  # Path in media bucket
    thumbnail_path: Optional[str] = None  # Path in media bucket for preview
    asset_type: str  # 'gif', 'png', 'mp4'
    category: str  # 'creatures', 'effects', 'objects', 'text'
    artist_id: uuid.UUID  # References Solar auth user
    file_size: int  # Size in bytes
    usage_count: int = ColumnDetails(default=0)
    metadata: Optional[Dict] = None  # Asset properties like dimensions, duration
    is_public: bool = ColumnDetails(default=True)
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    last_updated: datetime = ColumnDetails(default_factory=datetime.now)