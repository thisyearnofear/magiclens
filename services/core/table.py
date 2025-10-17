"""Simple table base class to replace Solar Table."""
from pydantic import BaseModel
from typing import Any, Dict, Optional


class ColumnDetails:
    """Column metadata placeholder."""
    pass


class Table(BaseModel):
    """Base table model for database entities."""
    
    class Config:
        from_attributes = True
        arbitrary_types_allowed = True