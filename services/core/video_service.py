from typing import Optional, List, Dict
from uuid import UUID
from core.user import User
from core.access import authenticated, public
from core.media import MediaFile, save_to_bucket, generate_presigned_url
from core.videos import Video
from core.user_profiles import UserProfile

@authenticated
def upload_video(user: User, video_file: MediaFile, title: str, description: Optional[str] = None, category: str = "urban") -> Video:
    """Upload a new video with validation."""
    
    # Validate file type
    if not video_file.mime_type.startswith('video/'):
        raise ValueError("File must be a video")
    
    # TODO: Add duration validation (30s max) - would need video processing
    # For now, we'll trust the frontend validation
    
    # Validate category
    valid_categories = ['urban', 'nature', 'indoor', 'street', 'park', 'office']
    if category not in valid_categories:
        category = 'urban'  # Default fallback
    
    # Save video to bucket
    video_path = save_to_bucket(video_file, f"videos/{user.id}")
    
    # Create video record
    video = Video(
        title=title,
        description=description,
        category=category,
        duration=30.0,  # Placeholder - would extract from actual video
        file_path=video_path,
        uploader_id=user.id,
        status='available',  # Simplified for MVP
        metadata={"file_size": video_file.size, "mime_type": video_file.mime_type}
    )
    video.sync()
    
    return video

@public
def get_videos(category: Optional[str] = None, limit: int = 20, offset: int = 0) -> List[Video]:
    """Get videos with optional category filtering."""
    
    if category:
        videos_data = Video.sql(
            "SELECT * FROM videos WHERE category = %(category)s AND status = 'available' ORDER BY created_at DESC LIMIT %(limit)s OFFSET %(offset)s",
            {"category": category, "limit": limit, "offset": offset}
        )
    else:
        videos_data = Video.sql(
            "SELECT * FROM videos WHERE status = 'available' ORDER BY created_at DESC LIMIT %(limit)s OFFSET %(offset)s",
            {"limit": limit, "offset": offset}
        )
    
    videos = []
    for video_data in videos_data:
        video = Video(**video_data)
        
        # Generate presigned URLs for media files
        video.file_path = generate_presigned_url(video.file_path)
        if video.thumbnail_path:
            video.thumbnail_path = generate_presigned_url(video.thumbnail_path)
        
        videos.append(video)
    
    return videos

@public
def get_video(video_id: UUID) -> Optional[Video]:
    """Get a specific video by ID."""
    videos_data = Video.sql(
        "SELECT * FROM videos WHERE id = %(video_id)s AND status = 'available'",
        {"video_id": video_id}
    )
    
    if not videos_data:
        return None
    
    video = Video(**videos_data[0])
    
    # Generate presigned URLs for media files
    video.file_path = generate_presigned_url(video.file_path)
    if video.thumbnail_path:
        video.thumbnail_path = generate_presigned_url(video.thumbnail_path)
    
    return video

@authenticated
def get_my_videos(user: User) -> List[Video]:
    """Get videos uploaded by the current user."""
    videos_data = Video.sql(
        "SELECT * FROM videos WHERE uploader_id = %(user_id)s ORDER BY created_at DESC",
        {"user_id": user.id}
    )
    
    videos = []
    for video_data in videos_data:
        video = Video(**video_data)
        
        # Generate presigned URLs for media files
        video.file_path = generate_presigned_url(video.file_path)
        if video.thumbnail_path:
            video.thumbnail_path = generate_presigned_url(video.thumbnail_path)
        
        videos.append(video)
    
    return videos

@authenticated
def update_video(user: User, video_id: UUID, title: Optional[str] = None, description: Optional[str] = None, category: Optional[str] = None) -> Video:
    """Update video metadata (only by owner)."""
    videos_data = Video.sql(
        "SELECT * FROM videos WHERE id = %(video_id)s AND uploader_id = %(user_id)s",
        {"video_id": video_id, "user_id": user.id}
    )
    
    if not videos_data:
        raise ValueError("Video not found or not owned by user")
    
    video_data = videos_data[0]
    
    # Update fields if provided
    if title is not None:
        video_data['title'] = title
    
    if description is not None:
        video_data['description'] = description
    
    if category is not None:
        valid_categories = ['urban', 'nature', 'indoor', 'street', 'park', 'office']
        if category in valid_categories:
            video_data['category'] = category
    
    # Update the video
    updated_video = Video(**video_data)
    updated_video.sync()
    
    # Generate presigned URLs for media files
    updated_video.file_path = generate_presigned_url(updated_video.file_path)
    if updated_video.thumbnail_path:
        updated_video.thumbnail_path = generate_presigned_url(updated_video.thumbnail_path)
    
    return updated_video

@authenticated
def delete_video(user: User, video_id: UUID) -> bool:
    """Delete a video (only by owner)."""
    videos_data = Video.sql(
        "SELECT * FROM videos WHERE id = %(video_id)s AND uploader_id = %(user_id)s",
        {"video_id": video_id, "user_id": user.id}
    )
    
    if not videos_data:
        raise ValueError("Video not found or not owned by user")
    
    # Update status to archived instead of deleting
    Video.sql(
        "UPDATE videos SET status = 'archived' WHERE id = %(video_id)s",
        {"video_id": video_id}
    )
    
    return True

@public
def get_video_categories() -> List[str]:
    """Get list of available video categories."""
    return ['urban', 'nature', 'indoor', 'street', 'park', 'office']

@public
def search_videos(query: str, category: Optional[str] = None, limit: int = 20) -> List[Video]:
    """Search videos by title or description."""
    
    if category:
        videos_data = Video.sql(
            "SELECT * FROM videos WHERE (title ILIKE %(query)s OR description ILIKE %(query)s) AND category = %(category)s AND status = 'available' ORDER BY created_at DESC LIMIT %(limit)s",
            {"query": f"%{query}%", "category": category, "limit": limit}
        )
    else:
        videos_data = Video.sql(
            "SELECT * FROM videos WHERE (title ILIKE %(query)s OR description ILIKE %(query)s) AND status = 'available' ORDER BY created_at DESC LIMIT %(limit)s",
            {"query": f"%{query}%", "limit": limit}
        )
    
    videos = []
    for video_data in videos_data:
        video = Video(**video_data)
        
        # Generate presigned URLs for media files
        video.file_path = generate_presigned_url(video.file_path)
        if video.thumbnail_path:
            video.thumbnail_path = generate_presigned_url(video.thumbnail_path)
        
        videos.append(video)
    
    return videos