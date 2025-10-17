"""Access control decorators to replace Solar access functionality."""
from functools import wraps
from typing import Callable


def authenticated(func: Callable) -> Callable:
    """
    Decorator for authenticated endpoints.
    TODO: Implement Web3 signature verification
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Placeholder - will be replaced with Web3 auth verification
        return func(*args, **kwargs)
    return wrapper


def public(func: Callable) -> Callable:
    """Decorator for public endpoints."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper