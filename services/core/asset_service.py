from typing import Optional, List, Dict
from uuid import UUID
from core.user import User
from core.access import authenticated, public
from core.media import MediaFile, save_to_bucket, generate_presigned_url
from core.artist_assets import ArtistAsset

@authenticated
def upload_asset(user: User, asset_file: MediaFile, name: str, category: str = "effects", is_public: bool = True) -> ArtistAsset:
    """Upload a new artist asset."""
    
    # Validate file type
    valid_mime_types = ['image/gif', 'image/png', 'video/mp4']
    if asset_file.mime_type not in valid_mime_types:
        raise ValueError("Asset must be GIF, PNG, or MP4")
    
    # Determine asset type from mime type
    asset_type_map = {
        'image/gif': 'gif',
        'image/png': 'png', 
        'video/mp4': 'mp4'
    }
    asset_type = asset_type_map[asset_file.mime_type]
    
    # Validate category
    valid_categories = ['creatures', 'effects', 'objects', 'text', 'decorations']
    if category not in valid_categories:
        category = 'effects'  # Default fallback
    
    # Save asset to bucket
    asset_path = save_to_bucket(asset_file, f"assets/{user.id}")
    
    # Create asset record
    asset = ArtistAsset(
        name=name,
        file_path=asset_path,
        asset_type=asset_type,
        category=category,
        artist_id=user.id,
        file_size=asset_file.size,
        metadata={"mime_type": asset_file.mime_type},
        is_public=is_public
    )
    asset.sync()
    
    return asset

@public
def get_assets(category: Optional[str] = None, artist_id: Optional[UUID] = None, limit: int = 50, offset: int = 0) -> List[ArtistAsset]:
    """Get assets with optional filtering."""
    
    base_query = "SELECT * FROM artist_assets WHERE is_public = true"
    params = {"limit": limit, "offset": offset}
    
    conditions = []
    
    if category:
        conditions.append("category = %(category)s")
        params["category"] = category
    
    if artist_id:
        conditions.append("artist_id = %(artist_id)s")
        params["artist_id"] = artist_id
    
    if conditions:
        base_query += " AND " + " AND ".join(conditions)
    
    base_query += " ORDER BY created_at DESC LIMIT %(limit)s OFFSET %(offset)s"
    
    assets_data = ArtistAsset.sql(base_query, params)
    
    assets = []
    for asset_data in assets_data:
        asset = ArtistAsset(**asset_data)
        
        # Generate presigned URLs for media files
        asset.file_path = generate_presigned_url(asset.file_path)
        if asset.thumbnail_path:
            asset.thumbnail_path = generate_presigned_url(asset.thumbnail_path)
        
        assets.append(asset)
    
    return assets

@authenticated
def get_my_assets(user: User) -> List[ArtistAsset]:
    """Get assets uploaded by the current user."""
    assets_data = ArtistAsset.sql(
        "SELECT * FROM artist_assets WHERE artist_id = %(user_id)s ORDER BY created_at DESC",
        {"user_id": user.id}
    )
    
    assets = []
    for asset_data in assets_data:
        asset = ArtistAsset(**asset_data)
        
        # Generate presigned URLs for media files
        asset.file_path = generate_presigned_url(asset.file_path)
        if asset.thumbnail_path:
            asset.thumbnail_path = generate_presigned_url(asset.thumbnail_path)
        
        assets.append(asset)
    
    return assets

@public
def get_asset(asset_id: UUID) -> Optional[ArtistAsset]:
    """Get a specific asset by ID."""
    assets_data = ArtistAsset.sql(
        "SELECT * FROM artist_assets WHERE id = %(asset_id)s AND is_public = true",
        {"asset_id": asset_id}
    )
    
    if not assets_data:
        return None
    
    asset = ArtistAsset(**assets_data[0])
    
    # Generate presigned URLs for media files
    asset.file_path = generate_presigned_url(asset.file_path)
    if asset.thumbnail_path:
        asset.thumbnail_path = generate_presigned_url(asset.thumbnail_path)
    
    return asset

@authenticated
def update_asset(user: User, asset_id: UUID, name: Optional[str] = None, category: Optional[str] = None, is_public: Optional[bool] = None) -> ArtistAsset:
    """Update asset metadata (only by owner)."""
    assets_data = ArtistAsset.sql(
        "SELECT * FROM artist_assets WHERE id = %(asset_id)s AND artist_id = %(user_id)s",
        {"asset_id": asset_id, "user_id": user.id}
    )
    
    if not assets_data:
        raise ValueError("Asset not found or not owned by user")
    
    asset_data = assets_data[0]
    
    # Update fields if provided
    if name is not None:
        asset_data['name'] = name
    
    if category is not None:
        valid_categories = ['creatures', 'effects', 'objects', 'text', 'decorations']
        if category in valid_categories:
            asset_data['category'] = category
    
    if is_public is not None:
        asset_data['is_public'] = is_public
    
    # Update the asset
    updated_asset = ArtistAsset(**asset_data)
    updated_asset.sync()
    
    # Generate presigned URLs for media files
    updated_asset.file_path = generate_presigned_url(updated_asset.file_path)
    if updated_asset.thumbnail_path:
        updated_asset.thumbnail_path = generate_presigned_url(updated_asset.thumbnail_path)
    
    return updated_asset

@authenticated
def delete_asset(user: User, asset_id: UUID) -> bool:
    """Delete an asset (only by owner)."""
    assets_data = ArtistAsset.sql(
        "SELECT * FROM artist_assets WHERE id = %(asset_id)s AND artist_id = %(user_id)s",
        {"asset_id": asset_id, "user_id": user.id}
    )
    
    if not assets_data:
        raise ValueError("Asset not found or not owned by user")
    
    # Mark as private instead of deleting to preserve collaboration history
    ArtistAsset.sql(
        "UPDATE artist_assets SET is_public = false WHERE id = %(asset_id)s",
        {"asset_id": asset_id}
    )
    
    return True

@public
def get_asset_categories() -> List[str]:
    """Get list of available asset categories."""
    return ['creatures', 'effects', 'objects', 'text', 'decorations']

@public
def search_assets(query: str, category: Optional[str] = None, limit: int = 50) -> List[ArtistAsset]:
    """Search assets by name."""
    
    base_query = "SELECT * FROM artist_assets WHERE name ILIKE %(query)s AND is_public = true"
    params = {"query": f"%{query}%", "limit": limit}
    
    if category:
        base_query += " AND category = %(category)s"
        params["category"] = category
    
    base_query += " ORDER BY usage_count DESC, created_at DESC LIMIT %(limit)s"
    
    assets_data = ArtistAsset.sql(base_query, params)
    
    assets = []
    for asset_data in assets_data:
        asset = ArtistAsset(**asset_data)
        
        # Generate presigned URLs for media files
        asset.file_path = generate_presigned_url(asset.file_path)
        if asset.thumbnail_path:
            asset.thumbnail_path = generate_presigned_url(asset.thumbnail_path)
        
        assets.append(asset)
    
    return assets

@authenticated
def increment_asset_usage(user: User, asset_id: UUID) -> bool:
    """Increment usage count when asset is used in collaboration."""
    ArtistAsset.sql(
        "UPDATE artist_assets SET usage_count = usage_count + 1 WHERE id = %(asset_id)s",
        {"asset_id": asset_id}
    )
    return True