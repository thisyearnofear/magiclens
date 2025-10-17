"""Simple User model for web3 authentication."""
from uuid import UUID
from pydantic import BaseModel


class User(BaseModel):
    """User model for web3 authentication."""
    id: UUID
    wallet_address: str
    
    class Config:
        from_attributes = True