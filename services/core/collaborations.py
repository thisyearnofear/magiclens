from core.table import Table, ColumnDetails
from typing import Optional, Dict
from datetime import datetime
import uuid

class Collaboration(Table):
    __tablename__ = "collaborations"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    video_id: uuid.UUID  # References Video table
    artist_id: uuid.UUID  # References Solar auth user
    status: str = ColumnDetails(default='claimed')  # 'claimed', 'in_progress', 'submitted', 'approved', 'rejected'
    revenue_split: float = ColumnDetails(default=0.7)  # Artist percentage (0.7 = 70%)
    submission_notes: Optional[str] = None
    feedback: Optional[str] = None
    version_number: int = ColumnDetails(default=1)
    render_data: Optional[Dict] = None  # Final render information
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    submitted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    last_updated: datetime = ColumnDetails(default_factory=datetime.now)