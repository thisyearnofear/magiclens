from core.table import Table, ColumnDetails
from typing import Dict
from datetime import datetime
import uuid

class Overlay(Table):
    __tablename__ = "overlays"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    collaboration_id: uuid.UUID  # References Collaboration table
    asset_id: uuid.UUID  # References ArtistAsset table
    position_data: Dict  # JSON: {x, y, width, height, scale, rotation, opacity}
    timing_data: Dict  # JSON: {start_time, end_time, fade_in, fade_out}
    layer_order: int = ColumnDetails(default=1)  # Z-index for multiple overlays
    animation_data: Dict = ColumnDetails(default_factory=dict)  # JSON: motion paths, effects
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    last_updated: datetime = ColumnDetails(default_factory=datetime.now)