from typing import Optional, List
from uuid import UUID
from core.user import User
from core.access import authenticated, public
from core.media import MediaFile, save_to_bucket, generate_presigned_url
from core.user_profiles import UserProfile
from core.database import execute_query, execute_update
import uuid
from datetime import datetime

@authenticated
def create_user_profile(user: User, username: str, user_type: str, bio: Optional[str] = None, avatar: Optional[MediaFile] = None) -> UserProfile:
    """Create a new user profile with username and user type."""
    
    # Validate user type
    if user_type not in ['videographer', 'artist', 'both']:
        raise ValueError("User type must be 'videographer', 'artist', or 'both'")
    
    # Check if profile already exists
    existing_profiles = execute_query(
        "SELECT id FROM user_profiles WHERE user_id = %s",
        (str(user.id),)
    )
    
    if existing_profiles:
        raise ValueError("User profile already exists")
    
    # Handle avatar upload if provided
    avatar_url = None
    if avatar:
        avatar_path = save_to_bucket(avatar, f"avatars/{user.id}")
        avatar_url = avatar_path
    
    # Create profile ID
    profile_id = uuid.uuid4()
    
    # Insert profile into database
    execute_update("""
        INSERT INTO user_profiles (
            id, user_id, username, user_type, avatar_url, bio, created_at, last_updated
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        str(profile_id),
        str(user.id),
        username,
        user_type,
        avatar_url,
        bio,
        datetime.now(),
        datetime.now()
    ))
    
    # Return the created profile
    return UserProfile(
        id=profile_id,
        user_id=user.id,
        username=username,
        user_type=user_type,
        avatar_url=avatar_url,
        bio=bio,
        created_at=datetime.now(),
        last_updated=datetime.now()
    )

@authenticated
def get_user_profile(user: User) -> Optional[UserProfile]:
    """Get the current user's profile."""
    profiles = execute_query(
        "SELECT * FROM user_profiles WHERE user_id = %s",
        (str(user.id),)
    )
    
    if not profiles:
        return None
    
    profile_data = profiles[0]
    
    # Create UserProfile instance
    profile = UserProfile(
        id=uuid.UUID(profile_data[0]) if profile_data[0] else None,
        user_id=uuid.UUID(profile_data[1]) if profile_data[1] else None,
        username=profile_data[2],
        user_type=profile_data[3],
        avatar_url=profile_data[4],
        bio=profile_data[5],
        portfolio_data=profile_data[6],
        earnings_total=float(profile_data[7]) if profile_data[7] else 0.0,
        is_verified=bool(profile_data[8]) if profile_data[8] is not None else False,
        created_at=profile_data[9],
        last_updated=profile_data[10]
    )
    
    # Generate presigned URL for avatar
    if profile.avatar_url:
        profile.avatar_url = generate_presigned_url(profile.avatar_url)
    
    return profile

@public
def get_public_profile(user_id: UUID) -> Optional[UserProfile]:
    """Get a public user profile by user ID."""
    profiles = execute_query(
        "SELECT * FROM user_profiles WHERE user_id = %s",
        (str(user_id),)
    )
    
    if not profiles:
        return None
    
    profile_data = profiles[0]
    
    # Create UserProfile instance
    profile = UserProfile(
        id=uuid.UUID(profile_data[0]) if profile_data[0] else None,
        user_id=uuid.UUID(profile_data[1]) if profile_data[1] else None,
        username=profile_data[2],
        user_type=profile_data[3],
        avatar_url=profile_data[4],
        bio=profile_data[5],
        portfolio_data=profile_data[6],
        earnings_total=float(profile_data[7]) if profile_data[7] else 0.0,
        is_verified=bool(profile_data[8]) if profile_data[8] is not None else False,
        created_at=profile_data[9],
        last_updated=profile_data[10]
    )
    
    # Generate presigned URL for avatar
    if profile.avatar_url:
        profile.avatar_url = generate_presigned_url(profile.avatar_url)
    
    return profile

@authenticated
def update_user_profile(user: User, username: Optional[str] = None, bio: Optional[str] = None, avatar: Optional[MediaFile] = None) -> UserProfile:
    """Update the current user's profile."""
    profiles = execute_query(
        "SELECT * FROM user_profiles WHERE user_id = %s",
        (str(user.id),)
    )
    
    if not profiles:
        raise ValueError("User profile not found")
    
    profile_data = profiles[0]
    
    # Update fields if provided
    if username is not None:
        profile_data[2] = username
    
    if bio is not None:
        profile_data[5] = bio
    
    # Handle avatar update
    if avatar:
        avatar_path = save_to_bucket(avatar, f"avatars/{user.id}")
        profile_data[4] = avatar_path
    
    # Update the profile
    execute_update("""
        UPDATE user_profiles 
        SET username = %s, bio = %s, avatar_url = %s, last_updated = %s
        WHERE user_id = %s
    """, (
        profile_data[2],
        profile_data[5],
        profile_data[4],
        datetime.now(),
        str(user.id)
    ))
    
    # Create and return updated profile
    updated_profile = UserProfile(
        id=uuid.UUID(profile_data[0]) if profile_data[0] else None,
        user_id=uuid.UUID(profile_data[1]) if profile_data[1] else None,
        username=profile_data[2],
        user_type=profile_data[3],
        avatar_url=profile_data[4],
        bio=profile_data[5],
        portfolio_data=profile_data[6],
        earnings_total=float(profile_data[7]) if profile_data[7] else 0.0,
        is_verified=bool(profile_data[8]) if profile_data[8] is not None else False,
        created_at=profile_data[9],
        last_updated=datetime.now()
    )
    
    # Return with presigned URL for avatar
    if updated_profile.avatar_url:
        updated_profile.avatar_url = generate_presigned_url(updated_profile.avatar_url)
    
    return updated_profile

@public
def get_artists() -> List[UserProfile]:
    """Get all artist profiles for discovery."""
    artists = execute_query(
        "SELECT * FROM user_profiles WHERE user_type IN ('artist', 'both') ORDER BY created_at DESC"
    )
    
    profiles = []
    for profile_data in artists:
        profile = UserProfile(
            id=uuid.UUID(profile_data[0]) if profile_data[0] else None,
            user_id=uuid.UUID(profile_data[1]) if profile_data[1] else None,
            username=profile_data[2],
            user_type=profile_data[3],
            avatar_url=profile_data[4],
            bio=profile_data[5],
            portfolio_data=profile_data[6],
            earnings_total=float(profile_data[7]) if profile_data[7] else 0.0,
            is_verified=bool(profile_data[8]) if profile_data[8] is not None else False,
            created_at=profile_data[9],
            last_updated=profile_data[10]
        )
        
        # Generate presigned URL for avatar
        if profile.avatar_url:
            profile.avatar_url = generate_presigned_url(profile.avatar_url)
        
        profiles.append(profile)
    
    return profiles

@public
def get_videographers() -> List[UserProfile]:
    """Get all videographer profiles for discovery."""
    videographers = execute_query(
        "SELECT * FROM user_profiles WHERE user_type IN ('videographer', 'both') ORDER BY created_at DESC"
    )
    
    profiles = []
    for profile_data in videographers:
        profile = UserProfile(
            id=uuid.UUID(profile_data[0]) if profile_data[0] else None,
            user_id=uuid.UUID(profile_data[1]) if profile_data[1] else None,
            username=profile_data[2],
            user_type=profile_data[3],
            avatar_url=profile_data[4],
            bio=profile_data[5],
            portfolio_data=profile_data[6],
            earnings_total=float(profile_data[7]) if profile_data[7] else 0.0,
            is_verified=bool(profile_data[8]) if profile_data[8] is not None else False,
            created_at=profile_data[9],
            last_updated=profile_data[10]
        )
        
        # Generate presigned URL for avatar
        if profile.avatar_url:
            profile.avatar_url = generate_presigned_url(profile.avatar_url)
        
        profiles.append(profile)
    
    return profiles

@public
def get_public_profile(user_id: UUID) -> Optional[UserProfile]:
    """Get a public user profile by user ID."""
    profiles = UserProfile.sql(
        "SELECT * FROM user_profiles WHERE user_id = %(user_id)s",
        {"user_id": user_id}
    )
    
    if not profiles:
        return None
    
    profile = UserProfile(**profiles[0])
    
    # Generate presigned URL for avatar
    if profile.avatar_url:
        profile.avatar_url = generate_presigned_url(profile.avatar_url)
    
    return profile

@authenticated
def update_user_profile(user: User, username: Optional[str] = None, bio: Optional[str] = None, avatar: Optional[MediaFile] = None) -> UserProfile:
    """Update the current user's profile."""
    profiles = UserProfile.sql(
        "SELECT * FROM user_profiles WHERE user_id = %(user_id)s",
        {"user_id": user.id}
    )
    
    if not profiles:
        raise ValueError("User profile not found")
    
    profile_data = profiles[0]
    
    # Update fields if provided
    if username is not None:
        profile_data['username'] = username
    
    if bio is not None:
        profile_data['bio'] = bio
    
    # Handle avatar update
    if avatar:
        avatar_path = save_to_bucket(avatar, f"avatars/{user.id}")
        profile_data['avatar_url'] = avatar_path
    
    # Update the profile
    updated_profile = UserProfile(**profile_data)
    updated_profile.sync()
    
    # Return with presigned URL for avatar
    if updated_profile.avatar_url:
        updated_profile.avatar_url = generate_presigned_url(updated_profile.avatar_url)
    
    return updated_profile

@public
def get_artists() -> List[UserProfile]:
    """Get all artist profiles for discovery."""
    artists = UserProfile.sql(
        "SELECT * FROM user_profiles WHERE user_type IN ('artist', 'both') ORDER BY created_at DESC"
    )
    
    profiles = []
    for artist_data in artists:
        profile = UserProfile(**artist_data)
        
        # Generate presigned URL for avatar
        if profile.avatar_url:
            profile.avatar_url = generate_presigned_url(profile.avatar_url)
        
        profiles.append(profile)
    
    return profiles

@public
def get_videographers() -> List[UserProfile]:
    """Get all videographer profiles for discovery."""
    videographers = UserProfile.sql(
        "SELECT * FROM user_profiles WHERE user_type IN ('videographer', 'both') ORDER BY created_at DESC"
    )
    
    profiles = []
    for videographer_data in videographers:
        profile = UserProfile(**videographer_data)
        
        # Generate presigned URL for avatar
        if profile.avatar_url:
            profile.avatar_url = generate_presigned_url(profile.avatar_url)
        
        profiles.append(profile)
    
    return profiles