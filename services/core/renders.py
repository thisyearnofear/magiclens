from core.table import Table, ColumnDetails
from typing import Optional, Dict
from datetime import datetime
import uuid

class Render(Table):
    __tablename__ = "renders"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    collaboration_id: uuid.UUID  # References Collaboration table
    output_path: Optional[str] = None  # Path in media bucket
    render_status: str = ColumnDetails(default='queued')  # 'queued', 'processing', 'completed', 'failed'
    progress: float = ColumnDetails(default=0.0)  # 0.0 to 1.0
    error_message: Optional[str] = None
    render_settings: Dict = ColumnDetails(default_factory=dict)  # JSON: resolution, format, quality
    processing_time: Optional[float] = None  # Time in seconds
    file_size: Optional[int] = None  # Size in bytes
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None