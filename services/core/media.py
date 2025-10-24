"""Media file handling with S3-compatible storage backend."""
import os
import io
from typing import Optional
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from loguru import logger


class MediaFile(BaseModel):
    """Media file representation."""
    size: int
    mime_type: str
    bytes: bytes
    
    class Config:
        arbitrary_types_allowed = True


class StorageConfig:
    """Centralized storage configuration."""
    
    def __init__(self):
        self.bucket_name = os.environ.get("MEDIA_BUCKET", "magiclens-media")
        self.region = os.environ.get("MEDIA_REGION", "us-east-1")
        self.access_key = os.environ.get("MEDIA_ACCESS_KEY")
        self.secret_key = os.environ.get("MEDIA_SECRET_KEY")
        self.endpoint_url = os.environ.get("MEDIA_ENDPOINT_URL")  # For S3-compatible services
        
        # Validate required configuration
        if not self.access_key or not self.secret_key:
            logger.warning("Media storage credentials not configured. Using local fallback.")
            self.use_local_fallback = True
        else:
            self.use_local_fallback = False
    
    def get_s3_client(self):
        """Get configured S3 client."""
        if self.use_local_fallback:
            return None
            
        try:
            return boto3.client(
                's3',
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region,
                endpoint_url=self.endpoint_url
            )
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            return None


# Global storage configuration
_storage_config = StorageConfig()


def save_to_bucket(file: MediaFile, path: str) -> str:
    """
    Save media file to S3-compatible storage.
    Falls back to local storage if S3 is not configured.
    """
    s3_client = _storage_config.get_s3_client()
    
    if not s3_client or _storage_config.use_local_fallback:
        return _save_to_local_fallback(file, path)
    
    try:
        # Upload file to S3
        s3_client.put_object(
            Bucket=_storage_config.bucket_name,
            Key=path,
            Body=file.bytes,
            ContentType=file.mime_type,
            ContentLength=file.size
        )
        
        # Return public URL or generate presigned URL
        if _storage_config.endpoint_url:
            return f"{_storage_config.endpoint_url}/{_storage_config.bucket_name}/{path}"
        else:
            return f"https://{_storage_config.bucket_name}.s3.{_storage_config.region}.amazonaws.com/{path}"
            
    except ClientError as e:
        logger.error(f"Failed to upload to S3: {e}")
        return _save_to_local_fallback(file, path)


def get_from_bucket(path: str) -> MediaFile:
    """
    Retrieve media file from S3-compatible storage.
    Falls back to local storage if S3 is not configured.
    """
    s3_client = _storage_config.get_s3_client()
    
    if not s3_client or _storage_config.use_local_fallback:
        return _get_from_local_fallback(path)
    
    try:
        response = s3_client.get_object(
            Bucket=_storage_config.bucket_name,
            Key=path
        )
        
        file_bytes = response['Body'].read()
        return MediaFile(
            size=len(file_bytes),
            mime_type=response.get('ContentType', 'application/octet-stream'),
            bytes=file_bytes
        )
        
    except ClientError as e:
        logger.error(f"Failed to retrieve from S3: {e}")
        return _get_from_local_fallback(path)


def generate_presigned_url(path: str, expiration: int = 3600) -> str:
    """
    Generate presigned URL for secure media access.
    Falls back to direct URL if S3 is not configured.
    """
    s3_client = _storage_config.get_s3_client()
    
    if not s3_client or _storage_config.use_local_fallback:
        return f"http://localhost:8000/media/{path}"
    
    try:
        return s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': _storage_config.bucket_name, 'Key': path},
            ExpiresIn=expiration
        )
    except ClientError as e:
        logger.error(f"Failed to generate presigned URL: {e}")
        return f"http://localhost:8000/media/{path}"


def _save_to_local_fallback(file: MediaFile, path: str) -> str:
    """Local fallback for development/testing."""
    local_media_dir = os.environ.get("LOCAL_MEDIA_DIR", "/tmp/magiclens-media")
    os.makedirs(local_media_dir, exist_ok=True)
    
    file_path = os.path.join(local_media_dir, path)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, 'wb') as f:
        f.write(file.bytes)
    
    logger.info(f"Saved media file locally: {file_path}")
    return f"http://localhost:8000/media/{path}"


def _get_from_local_fallback(path: str) -> MediaFile:
    """Local fallback for development/testing."""
    local_media_dir = os.environ.get("LOCAL_MEDIA_DIR", "/tmp/magiclens-media")
    file_path = os.path.join(local_media_dir, path)
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Media file not found: {path}")
    
    with open(file_path, 'rb') as f:
        file_bytes = f.read()
    
    # Guess MIME type from extension
    mime_type = "application/octet-stream"
    if path.lower().endswith(('.mp4', '.mov', '.avi')):
        mime_type = "video/mp4"
    elif path.lower().endswith(('.jpg', '.jpeg')):
        mime_type = "image/jpeg"
    elif path.lower().endswith('.png'):
        mime_type = "image/png"
    
    return MediaFile(
        size=len(file_bytes),
        mime_type=mime_type,
        bytes=file_bytes
    )