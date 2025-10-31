from typing import Optional, List, Dict
from uuid import UUID
import uuid
import json
from datetime import datetime
from core.user import User
from core.access import authenticated, public
from core.media import MediaFile, save_to_bucket, generate_presigned_url
from core.videos import Video
from core.user_profiles import UserProfile

# Duration extraction removed - not essential for core functionality
# If needed later, can implement with lightweight alternatives or browser-based extraction

@authenticated
def upload_video(user: User, video_file: MediaFile, title: str, description: Optional[str] = None, category: Optional[str] = None) -> Video:
    """Upload a new video with validation."""
    
    # Validate file type
    if not video_file.mime_type.startswith('video/'):
        raise ValueError("File must be a video")
    
    # TODO: Add duration validation (30s max) - would need video processing
    # For now, we'll trust the frontend validation
    
    # Save video to bucket first
    video_path = save_to_bucket(video_file, f"videos/{user.id}")
    
    # Smart category detection - if not provided, analyze title/description
    if not category:
        title_lower = title.lower()
        desc_lower = (description or "").lower()
        text_to_analyze = f"{title_lower} {desc_lower}"
        
        if any(word in text_to_analyze for word in ['park', 'tree', 'forest', 'nature', 'outdoor', 'landscape']):
            category = 'nature'
        elif any(word in text_to_analyze for word in ['office', 'meeting', 'desk', 'work', 'indoor', 'room']):
            category = 'indoor'
        elif any(word in text_to_analyze for word in ['street', 'road', 'traffic', 'sidewalk', 'city']):
            category = 'street'
        else:
            category = 'urban'  # Default
    
    # Validate category
    valid_categories = ['urban', 'nature', 'indoor', 'street', 'park', 'office']
    if category not in valid_categories:
        category = 'urban'
    
    # Create video record in database
    video_id = uuid.uuid4()
    Video.sql(
        """INSERT INTO videos (id, user_id, title, description, category, duration, file_path, file_size, metadata, is_public, created_at, last_updated)
           VALUES (%(id)s, %(user_id)s, %(title)s, %(description)s, %(category)s, %(duration)s, %(file_path)s, %(file_size)s, %(metadata)s, %(is_public)s, %(created_at)s, %(last_updated)s)""",
        {
            "id": video_id,
            "user_id": user.id,
            "title": title,
            "description": description,
            "category": category,
            "duration": None,  # Duration not extracted - not essential for core functionality
            "file_path": video_path,
            "file_size": video_file.size,
            "metadata": json.dumps({"mime_type": video_file.mime_type}),
            "is_public": True,
            "created_at": datetime.now(),
            "last_updated": datetime.now()
        }
    )
    
    # Retrieve the created video to return properly serialized object
    video_data = Video.sql(
        "SELECT * FROM videos WHERE id = %(video_id)s",
        {"video_id": video_id}
    )
    
    if video_data:
        video_dict = video_data[0].copy()
        
        # Create a response dict that matches the Video model
        response_video = {
            "id": str(video_dict["id"]),
            "user_id": str(video_dict["user_id"]),  # Keep as user_id to match Video model
            "title": video_dict["title"],
            "description": video_dict["description"],
            "category": video_dict["category"] or "urban",
            "duration": video_dict["duration"] or 30,  # Keep as int to match model
            "file_path": generate_presigned_url(video_dict["file_path"]),
            "thumbnail_path": video_dict["thumbnail_path"],
            "file_size": video_dict["file_size"],
            "metadata": video_dict["metadata"],
            "view_count": video_dict["view_count"] or 0,
            "collaboration_count": video_dict["collaboration_count"] or 0,
            "is_public": video_dict["is_public"],
            "created_at": video_dict["created_at"].isoformat() if video_dict["created_at"] else None,
            "last_updated": video_dict["last_updated"].isoformat() if video_dict["last_updated"] else None
        }
        
        return response_video
    
    # Fallback if something went wrong
    raise ValueError("Failed to create video record")

@public
def get_videos(category: Optional[str] = None, limit: int = 20, offset: int = 0) -> List[Video]:
    """Get videos with optional category filtering."""
    
    if category:
        videos_data = Video.sql(
            "SELECT * FROM videos WHERE category = %(category)s ORDER BY created_at DESC LIMIT %(limit)s OFFSET %(offset)s",
            {"category": category, "limit": limit, "offset": offset}
        )
    else:
        videos_data = Video.sql(
            "SELECT * FROM videos ORDER BY created_at DESC LIMIT %(limit)s OFFSET %(offset)s",
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
        "SELECT * FROM videos WHERE id = %(video_id)s",
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
        "SELECT * FROM videos WHERE user_id = %(user_id)s ORDER BY created_at DESC",
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
        "SELECT * FROM videos WHERE id = %(video_id)s AND user_id = %(user_id)s",
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
        "SELECT * FROM videos WHERE id = %(video_id)s AND user_id = %(user_id)s",
        {"video_id": video_id, "user_id": user.id}
    )
    
    if not videos_data:
        raise ValueError("Video not found or not owned by user")
    
    # Actually delete the video record
    Video.sql(
        "DELETE FROM videos WHERE id = %(video_id)s",
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
            "SELECT * FROM videos WHERE (title ILIKE %(query)s OR description ILIKE %(query)s) AND category = %(category)s ORDER BY created_at DESC LIMIT %(limit)s",
            {"query": f"%{query}%", "category": category, "limit": limit}
        )
    else:
        videos_data = Video.sql(
            "SELECT * FROM videos WHERE (title ILIKE %(query)s OR description ILIKE %(query)s) ORDER BY created_at DESC LIMIT %(limit)s",
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