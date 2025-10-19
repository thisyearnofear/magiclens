from core.table import Table, ColumnDetails
from typing import Optional, Dict
from datetime import datetime
import uuid

class UserProfile(Table):
    __tablename__ = "user_profiles"
    
    id: uuid.UUID = uuid.uuid4()
    user_id: uuid.UUID  # References Solar auth user
    username: str
    user_type: str  # 'videographer', 'artist', or 'both'
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    portfolio_data: Optional[Dict] = None  # JSON data for portfolio items
    earnings_total: float = 0.0
    is_verified: bool = False
    created_at: datetime = datetime.now()
    last_updated: datetime = datetime.now()