from typing import Optional, List
from uuid import UUID
from core.user import User
from core.access import authenticated, public
from core.media import MediaFile, save_to_bucket, generate_presigned_url
from core.user_profiles import UserProfile

@authenticated
def create_user_profile(user: User, username: str, user_type: str, bio: Optional[str] = None, avatar: Optional[MediaFile] = None) -> UserProfile:
    """Create a new user profile with username and user type."""
    
    # Validate user type
    if user_type not in ['videographer', 'artist', 'both']:
        raise ValueError("User type must be 'videographer', 'artist', or 'both'")
    
    # Check if profile already exists
    existing_profiles = UserProfile.sql(
        "SELECT * FROM user_profiles WHERE user_id = %(user_id)s",
        {"user_id": user.id}
    )
    
    if existing_profiles:
        raise ValueError("User profile already exists")
    
    # Handle avatar upload if provided
    avatar_url = None
    if avatar:
        avatar_path = save_to_bucket(avatar, f"avatars/{user.id}")
        avatar_url = avatar_path
    
    # Create profile
    profile = UserProfile(
        user_id=user.id,
        username=username,
        user_type=user_type,
        bio=bio,
        avatar_url=avatar_url
    )
    profile.sync()
    
    # Return with presigned URL for avatar
    if profile.avatar_url:
        profile.avatar_url = generate_presigned_url(profile.avatar_url)
    
    return profile

@authenticated
def get_user_profile(user: User) -> Optional[UserProfile]:
    """Get the current user's profile."""
    profiles = UserProfile.sql(
        "SELECT * FROM user_profiles WHERE user_id = %(user_id)s",
        {"user_id": user.id}
    )
    
    if not profiles:
        return None
    
    profile = UserProfile(**profiles[0])
    
    # Generate presigned URL for avatar
    if profile.avatar_url:
        profile.avatar_url = generate_presigned_url(profile.avatar_url)
    
    return profile

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