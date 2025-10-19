"""Authentication system for MagicLens using Flow wallet signatures."""
import jwt
import os
from datetime import datetime, timedelta
from typing import Optional
from core.user import User
import uuid

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "magiclens_secret_key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

def create_access_token(wallet_address: str) -> str:
    """Create a JWT access token for a Flow wallet address."""
    payload = {
        "wallet_address": wallet_address,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_access_token(token: str) -> Optional[dict]:
    """Verify a JWT access token and return the payload."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user_from_token(token: str) -> Optional[User]:
    """Get current user from JWT token."""
    payload = verify_access_token(token)
    if not payload:
        return None
    
    wallet_address = payload.get("wallet_address")
    if not wallet_address:
        return None
    
    # Create a user ID based on the wallet address
    # In a real app, this would be looked up from a users table
    user_id = uuid.uuid5(uuid.NAMESPACE_DNS, wallet_address)
    
    return User(id=user_id, wallet_address=wallet_address)

def get_current_user():
    """Placeholder for FastAPI Depends - will be replaced with proper implementation."""
    # This is a mock implementation for now
    # In a real app, this would extract the token from the request headers
    # and verify it
    return User(id=uuid.uuid4(), wallet_address="0x123456789")