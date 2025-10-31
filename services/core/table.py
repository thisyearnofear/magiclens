"""Simple table base class to replace Solar Table."""
from pydantic import BaseModel
from typing import Any, Dict, Optional, List
from core.database import execute_query, execute_update
import uuid
import json
from datetime import datetime

class ColumnDetails:
    """Column metadata placeholder."""
    def __init__(self, default=None, default_factory=None, primary_key=False):
        self.default = default
        self.default_factory = default_factory
        self.primary_key = primary_key

class Table(BaseModel):
    """Base table model for database entities."""
    
    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
    
    @classmethod
    def sql(cls, query: str, params: Dict = None) -> List[Dict]:
        """Execute a SQL query and return results."""
        if params:
            result = execute_query(query, params)
        else:
            result = execute_query(query)

        # Results are already dictionaries from execute_query
        if result:
            return result
        return []
    
    def sync(self):
        """Save this instance to the database."""
        # This is a simplified implementation
        # In a real app, this would generate INSERT/UPDATE statements
        pass