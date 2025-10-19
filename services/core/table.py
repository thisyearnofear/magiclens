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
        # Convert dict params to tuple for psycopg
        if params:
            # Extract values in the order they appear in the query
            param_values = []
            for key in params:
                param_values.append(params[key])
            result = execute_query(query, tuple(param_values))
        else:
            result = execute_query(query)
        
        # Convert results to list of dicts
        if result:
            # Get column names from cursor description
            # For now, we'll return raw results and let the calling code handle conversion
            return result
        return []
    
    def sync(self):
        """Save this instance to the database."""
        # This is a simplified implementation
        # In a real app, this would generate INSERT/UPDATE statements
        pass