from typing import Optional, List, Dict
from uuid import UUID
from core.user import User
from core.access import authenticated, public
from core.renders import Render
from core.collaborations import Collaboration
from core.videos import Video
from core.overlays import Overlay
from core.artist_assets import ArtistAsset
from core.media import generate_presigned_url
from core.render_queue import render_queue
import json

@authenticated
def queue_render(user: User, collaboration_id: UUID, render_settings: Optional[Dict] = None) -> Render:
    """Queue a new render job for a collaboration."""
    
    # Verify collaboration exists and user has access
    collaborations_data = Collaboration.sql(
        """
        SELECT c.*, v.uploader_id FROM collaborations c 
        JOIN videos v ON c.video_id = v.id 
        WHERE c.id = %(collaboration_id)s AND c.status = 'approved'
        """,
        {"collaboration_id": collaboration_id}
    )
    
    if not collaborations_data:
        raise ValueError("Collaboration not found or not approved")
    
    collab_data = collaborations_data[0]
    is_artist = collab_data['artist_id'] == user.id
    is_videographer = collab_data['uploader_id'] == user.id
    
    if not (is_artist or is_videographer):
        raise ValueError("You don't have permission to render this collaboration")
    
    # Check if there's already a pending/processing render
    existing_renders = Render.sql(
        "SELECT * FROM renders WHERE collaboration_id = %(collaboration_id)s AND render_status IN ('queued', 'processing')",
        {"collaboration_id": collaboration_id}
    )
    
    if existing_renders:
        raise ValueError("A render is already in progress for this collaboration")
    
    # Default render settings
    default_settings = {
        "resolution": "1920x1080",
        "format": "mp4",
        "quality": "high",
        "fps": 30
    }
    
    if render_settings:
        default_settings.update(render_settings)
    
    # Create render job
    render = Render(
        collaboration_id=collaboration_id,
        render_status='queued',
        progress=0.0,
        render_settings=default_settings
    )
    render.sync()
    
    # Queue the render job with Redis
    success = render_queue.enqueue_render(render.id, collaboration_id, default_settings)
    if not success:
        # If queueing fails, mark render as failed
        render.render_status = 'failed'
        render.error_message = 'Failed to queue render job'
        render.sync()
        raise RuntimeError("Failed to queue render job")
    
    return render

@authenticated
def get_render_status(user: User, render_id: UUID) -> Optional[Render]:
    """Get the status of a render job."""
    
    renders_data = Render.sql(
        """
        SELECT r.*, c.artist_id, v.uploader_id 
        FROM renders r 
        JOIN collaborations c ON r.collaboration_id = c.id
        JOIN videos v ON c.video_id = v.id
        WHERE r.id = %(render_id)s
        """,
        {"render_id": render_id}
    )
    
    if not renders_data:
        return None
    
    render_data = renders_data[0]
    is_artist = render_data['artist_id'] == user.id
    is_videographer = render_data['uploader_id'] == user.id
    
    if not (is_artist or is_videographer):
        raise ValueError("You don't have permission to view this render")
    
    render = Render(**render_data)
    
    # Generate presigned URL for completed renders
    if render.output_path and render.render_status == 'completed':
        render.output_path = generate_presigned_url(render.output_path)
    
    return render

@authenticated
def get_collaboration_renders(user: User, collaboration_id: UUID) -> List[Render]:
    """Get all renders for a collaboration."""
    
    # Verify user has access to collaboration
    collaborations_data = Collaboration.sql(
        """
        SELECT c.*, v.uploader_id FROM collaborations c 
        JOIN videos v ON c.video_id = v.id 
        WHERE c.id = %(collaboration_id)s
        """,
        {"collaboration_id": collaboration_id}
    )
    
    if not collaborations_data:
        raise ValueError("Collaboration not found")
    
    collab_data = collaborations_data[0]
    is_artist = collab_data['artist_id'] == user.id
    is_videographer = collab_data['uploader_id'] == user.id
    
    if not (is_artist or is_videographer):
        raise ValueError("You don't have permission to view renders for this collaboration")
    
    # Get all renders for the collaboration
    renders_data = Render.sql(
        "SELECT * FROM renders WHERE collaboration_id = %(collaboration_id)s ORDER BY created_at DESC",
        {"collaboration_id": collaboration_id}
    )
    
    renders = []
    for render_data in renders_data:
        render = Render(**render_data)
        
        # Generate presigned URL for completed renders
        if render.output_path and render.render_status == 'completed':
            render.output_path = generate_presigned_url(render.output_path)
        
        renders.append(render)
    
    return renders

@authenticated
def cancel_render(user: User, render_id: UUID) -> bool:
    """Cancel a queued or processing render."""
    
    renders_data = Render.sql(
        """
        SELECT r.*, c.artist_id, v.uploader_id 
        FROM renders r 
        JOIN collaborations c ON r.collaboration_id = c.id
        JOIN videos v ON c.video_id = v.id
        WHERE r.id = %(render_id)s
        """,
        {"render_id": render_id}
    )
    
    if not renders_data:
        raise ValueError("Render not found")
    
    render_data = renders_data[0]
    is_artist = render_data['artist_id'] == user.id
    is_videographer = render_data['uploader_id'] == user.id
    
    if not (is_artist or is_videographer):
        raise ValueError("You don't have permission to cancel this render")
    
    if render_data['render_status'] not in ['queued', 'processing']:
        raise ValueError("Can only cancel queued or processing renders")
    
    # Cancel the job in the queue
    queue_cancelled = render_queue.cancel_render(str(render_id))
    
    # Update render status
    Render.sql(
        "UPDATE renders SET render_status = 'cancelled' WHERE id = %(render_id)s",
        {"render_id": render_id}
    )
    
    return True

@authenticated
def retry_render(user: User, render_id: UUID) -> Render:
    """Retry a failed render."""
    
    renders_data = Render.sql(
        """
        SELECT r.*, c.artist_id, v.uploader_id 
        FROM renders r 
        JOIN collaborations c ON r.collaboration_id = c.id
        JOIN videos v ON c.video_id = v.id
        WHERE r.id = %(render_id)s
        """,
        {"render_id": render_id}
    )
    
    if not renders_data:
        raise ValueError("Render not found")
    
    render_data = renders_data[0]
    is_artist = render_data['artist_id'] == user.id
    is_videographer = render_data['uploader_id'] == user.id
    
    if not (is_artist or is_videographer):
        raise ValueError("You don't have permission to retry this render")
    
    if render_data['render_status'] != 'failed':
        raise ValueError("Can only retry failed renders")
    
    # Reset render status
    Render.sql(
        """
        UPDATE renders SET 
            render_status = 'queued', 
            progress = 0.0, 
            error_message = NULL,
            started_at = NULL,
            completed_at = NULL
        WHERE id = %(render_id)s
        """,
        {"render_id": render_id}
    )
    
    # Get updated render
    updated_renders = Render.sql(
        "SELECT * FROM renders WHERE id = %(render_id)s",
        {"render_id": render_id}
    )
    
    render = Render(**updated_renders[0])
    
    # Re-queue the render job
    collaboration_id = render_data['collaboration_id']
    render_settings = render_data.get('render_settings', {})
    success = render_queue.enqueue_render(render.id, UUID(collaboration_id), render_settings)
    if not success:
        # If queueing fails, mark render as failed again
        Render.sql(
            "UPDATE renders SET render_status = 'failed', error_message = 'Failed to re-queue render job' WHERE id = %(render_id)s",
            {"render_id": render_id}
        )
        raise RuntimeError("Failed to re-queue render job")
    
    return render

@public
def get_render_queue_status() -> Dict[str, int]:
    """Get general render queue statistics."""
    
    # Get real-time queue stats from Redis
    queue_stats = render_queue.get_queue_stats()
    
    # Get database stats for completed/failed renders in last 24h
    db_stats = Render.sql(
        """
        SELECT 
            render_status,
            COUNT(*) as count
        FROM renders 
        WHERE created_at > NOW() - INTERVAL '24 hours'
        AND render_status IN ('completed', 'failed', 'cancelled')
        GROUP BY render_status
        """
    )
    
    result = {
        'queued': queue_stats.get('queued', 0),
        'processing': queue_stats.get('processing', 0),
        'stuck': queue_stats.get('stuck', 0),
        'completed': 0,
        'failed': 0,
        'cancelled': 0
    }
    
    for stat in db_stats:
        result[stat['render_status']] = stat['count']
    
    return result