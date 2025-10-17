from core.table import Table, ColumnDetails
from typing import Optional, Dict
from datetime import datetime
import uuid

class UserProfile(Table):
    __tablename__ = "user_profiles"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID  # References Solar auth user
    username: str
    user_type: str  # 'videographer', 'artist', or 'both'
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    portfolio_data: Optional[Dict] = None  # JSON data for portfolio items
    earnings_total: float = ColumnDetails(default=0.0)
    is_verified: bool = ColumnDetails(default=False)
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    last_updated: datetime = ColumnDetails(default_factory=datetime.now)