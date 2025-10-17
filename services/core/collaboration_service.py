from typing import Optional, List, Dict
from uuid import UUID
from core.user import User
from core.access import authenticated, public
from core.collaborations import Collaboration
from core.videos import Video
from core.overlays import Overlay
from core.artist_assets import ArtistAsset

@authenticated
def start_collaboration(user: User, video_id: UUID, revenue_split: float = 0.7) -> Collaboration:
    """Start a new collaboration on a video."""
    
    # Check if video exists and is available
    videos_data = Video.sql(
        "SELECT * FROM videos WHERE id = %(video_id)s AND status = 'available'",
        {"video_id": video_id}
    )
    
    if not videos_data:
        raise ValueError("Video not found or not available")
    
    # Check if user already has an active collaboration on this video
    existing_collaborations = Collaboration.sql(
        "SELECT * FROM collaborations WHERE video_id = %(video_id)s AND artist_id = %(user_id)s AND status IN ('claimed', 'in_progress', 'submitted')",
        {"video_id": video_id, "user_id": user.id}
    )
    
    if existing_collaborations:
        raise ValueError("You already have an active collaboration on this video")
    
    # Validate revenue split
    if not 0.0 <= revenue_split <= 1.0:
        revenue_split = 0.7  # Default to 70% for artist
    
    # Create collaboration
    collaboration = Collaboration(
        video_id=video_id,
        artist_id=user.id,
        status='claimed',
        revenue_split=revenue_split
    )
    collaboration.sync()
    
    return collaboration

@authenticated
def get_my_collaborations(user: User, status: Optional[str] = None) -> List[Collaboration]:
    """Get collaborations for the current user."""
    
    base_query = "SELECT * FROM collaborations WHERE artist_id = %(user_id)s"
    params = {"user_id": user.id}
    
    if status:
        base_query += " AND status = %(status)s"
        params["status"] = status
    
    base_query += " ORDER BY created_at DESC"
    
    collaborations_data = Collaboration.sql(base_query, params)
    
    collaborations = []
    for collab_data in collaborations_data:
        collaboration = Collaboration(**collab_data)
        collaborations.append(collaboration)
    
    return collaborations

@authenticated
def get_collaborations_for_my_videos(user: User, status: Optional[str] = None) -> List[Collaboration]:
    """Get collaborations on videos uploaded by the current user."""
    
    base_query = """
        SELECT c.* FROM collaborations c
        JOIN videos v ON c.video_id = v.id
        WHERE v.uploader_id = %(user_id)s
    """
    params = {"user_id": user.id}
    
    if status:
        base_query += " AND c.status = %(status)s"
        params["status"] = status
    
    base_query += " ORDER BY c.created_at DESC"
    
    collaborations_data = Collaboration.sql(base_query, params)
    
    collaborations = []
    for collab_data in collaborations_data:
        collaboration = Collaboration(**collab_data)
        collaborations.append(collaboration)
    
    return collaborations

@public
def get_collaboration(collaboration_id: UUID) -> Optional[Collaboration]:
    """Get a specific collaboration by ID."""
    collaborations_data = Collaboration.sql(
        "SELECT * FROM collaborations WHERE id = %(collaboration_id)s",
        {"collaboration_id": collaboration_id}
    )
    
    if not collaborations_data:
        return None
    
    return Collaboration(**collaborations_data[0])

@authenticated
def update_collaboration_status(user: User, collaboration_id: UUID, status: str, submission_notes: Optional[str] = None, feedback: Optional[str] = None) -> Collaboration:
    """Update collaboration status."""
    
    valid_statuses = ['claimed', 'in_progress', 'submitted', 'approved', 'rejected']
    if status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
    
    # Get collaboration and check permissions
    collaborations_data = Collaboration.sql(
        "SELECT c.*, v.uploader_id FROM collaborations c JOIN videos v ON c.video_id = v.id WHERE c.id = %(collaboration_id)s",
        {"collaboration_id": collaboration_id}
    )
    
    if not collaborations_data:
        raise ValueError("Collaboration not found")
    
    collab_data = collaborations_data[0]
    
    # Check if user has permission to update status
    is_artist = collab_data['artist_id'] == user.id
    is_videographer = collab_data['uploader_id'] == user.id
    
    if not (is_artist or is_videographer):
        raise ValueError("You don't have permission to update this collaboration")
    
    # Artists can only move to 'in_progress' or 'submitted'
    # Videographers can only move to 'approved' or 'rejected'
    if is_artist and status not in ['in_progress', 'submitted']:
        raise ValueError("Artists can only set status to 'in_progress' or 'submitted'")
    
    if is_videographer and status not in ['approved', 'rejected']:
        raise ValueError("Videographers can only set status to 'approved' or 'rejected'")
    
    # Update collaboration
    update_data = {"status": status}
    update_query = "UPDATE collaborations SET status = %(status)s"
    
    if submission_notes is not None:
        update_data["submission_notes"] = submission_notes
        update_query += ", submission_notes = %(submission_notes)s"
    
    if feedback is not None:
        update_data["feedback"] = feedback
        update_query += ", feedback = %(feedback)s"
    
    if status == 'submitted':
        update_query += ", submitted_at = NOW()"
    elif status in ['approved', 'rejected']:
        update_query += ", completed_at = NOW()"
    
    update_query += " WHERE id = %(collaboration_id)s"
    update_data["collaboration_id"] = collaboration_id
    
    Collaboration.sql(update_query, update_data)
    
    # Return updated collaboration
    updated_collaborations = Collaboration.sql(
        "SELECT * FROM collaborations WHERE id = %(collaboration_id)s",
        {"collaboration_id": collaboration_id}
    )
    
    return Collaboration(**updated_collaborations[0])

@authenticated
def add_overlay_to_collaboration(user: User, collaboration_id: UUID, asset_id: UUID, position_data: Dict, timing_data: Dict, layer_order: int = 1) -> Overlay:
    """Add an overlay to a collaboration."""
    
    # Check if collaboration exists and user is the artist
    collaborations_data = Collaboration.sql(
        "SELECT * FROM collaborations WHERE id = %(collaboration_id)s AND artist_id = %(user_id)s",
        {"collaboration_id": collaboration_id, "user_id": user.id}
    )
    
    if not collaborations_data:
        raise ValueError("Collaboration not found or you're not the artist")
    
    # Check if asset exists
    assets_data = ArtistAsset.sql(
        "SELECT * FROM artist_assets WHERE id = %(asset_id)s",
        {"asset_id": asset_id}
    )
    
    if not assets_data:
        raise ValueError("Asset not found")
    
    # Create overlay
    overlay = Overlay(
        collaboration_id=collaboration_id,
        asset_id=asset_id,
        position_data=position_data,
        timing_data=timing_data,
        layer_order=layer_order
    )
    overlay.sync()
    
    return overlay

@authenticated
def get_collaboration_overlays(user: User, collaboration_id: UUID) -> List[Overlay]:
    """Get all overlays for a collaboration."""
    
    # Check if user has access to this collaboration
    collaborations_data = Collaboration.sql(
        "SELECT c.*, v.uploader_id FROM collaborations c JOIN videos v ON c.video_id = v.id WHERE c.id = %(collaboration_id)s",
        {"collaboration_id": collaboration_id}
    )
    
    if not collaborations_data:
        raise ValueError("Collaboration not found")
    
    collab_data = collaborations_data[0]
    is_artist = collab_data['artist_id'] == user.id
    is_videographer = collab_data['uploader_id'] == user.id
    
    if not (is_artist or is_videographer):
        raise ValueError("You don't have access to this collaboration")
    
    # Get overlays
    overlays_data = Overlay.sql(
        "SELECT * FROM overlays WHERE collaboration_id = %(collaboration_id)s ORDER BY layer_order",
        {"collaboration_id": collaboration_id}
    )
    
    overlays = []
    for overlay_data in overlays_data:
        overlay = Overlay(**overlay_data)
        overlays.append(overlay)
    
    return overlays

@authenticated
def update_overlay(user: User, overlay_id: UUID, position_data: Optional[Dict] = None, timing_data: Optional[Dict] = None, layer_order: Optional[int] = None) -> Overlay:
    """Update an overlay (only by the artist who created it)."""
    
    # Get overlay and check permissions
    overlays_data = Overlay.sql(
        "SELECT o.*, c.artist_id FROM overlays o JOIN collaborations c ON o.collaboration_id = c.id WHERE o.id = %(overlay_id)s",
        {"overlay_id": overlay_id}
    )
    
    if not overlays_data:
        raise ValueError("Overlay not found")
    
    overlay_data = overlays_data[0]
    
    if overlay_data['artist_id'] != user.id:
        raise ValueError("You can only update your own overlays")
    
    # Update overlay
    update_fields = []
    update_data = {"overlay_id": overlay_id}
    
    if position_data is not None:
        update_fields.append("position_data = %(position_data)s")
        update_data["position_data"] = position_data
    
    if timing_data is not None:
        update_fields.append("timing_data = %(timing_data)s")
        update_data["timing_data"] = timing_data
    
    if layer_order is not None:
        update_fields.append("layer_order = %(layer_order)s")
        update_data["layer_order"] = layer_order
    
    if update_fields:
        update_query = f"UPDATE overlays SET {', '.join(update_fields)} WHERE id = %(overlay_id)s"
        Overlay.sql(update_query, update_data)
    
    # Return updated overlay
    updated_overlays = Overlay.sql(
        "SELECT * FROM overlays WHERE id = %(overlay_id)s",
        {"overlay_id": overlay_id}
    )
    
    return Overlay(**updated_overlays[0])

@authenticated
def delete_overlay(user: User, overlay_id: UUID) -> bool:
    """Delete an overlay (only by the artist who created it)."""
    
    # Get overlay and check permissions
    overlays_data = Overlay.sql(
        "SELECT o.*, c.artist_id FROM overlays o JOIN collaborations c ON o.collaboration_id = c.id WHERE o.id = %(overlay_id)s",
        {"overlay_id": overlay_id}
    )
    
    if not overlays_data:
        raise ValueError("Overlay not found")
    
    overlay_data = overlays_data[0]
    
    if overlay_data['artist_id'] != user.id:
        raise ValueError("You can only delete your own overlays")
    
    # Delete overlay
    Overlay.sql(
        "DELETE FROM overlays WHERE id = %(overlay_id)s",
        {"overlay_id": overlay_id}
    )
    
    return True