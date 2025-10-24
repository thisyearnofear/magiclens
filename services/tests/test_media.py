"""Tests for media storage functionality."""
import os
import tempfile
from unittest.mock import Mock, patch, MagicMock
import pytest
from core.media import StorageConfig, save_to_bucket, get_from_bucket, generate_presigned_url, MediaFile


class TestStorageConfig:
    """Test StorageConfig class."""
    
    def test_init_with_credentials(self):
        """Test initialization with valid credentials."""
        with patch.dict(os.environ, {
            'MEDIA_BUCKET': 'test-bucket',
            'MEDIA_REGION': 'us-west-2',
            'MEDIA_ACCESS_KEY': 'test-key',
            'MEDIA_SECRET_KEY': 'test-secret'
        }):
            config = StorageConfig()
            assert config.bucket_name == 'test-bucket'
            assert config.region == 'us-west-2'
            assert config.access_key == 'test-key'
            assert config.secret_key == 'test-secret'
            assert not config.use_local_fallback
    
    def test_init_without_credentials(self):
        """Test initialization without credentials falls back to local."""
        with patch.dict(os.environ, {}, clear=True):
            config = StorageConfig()
            assert config.use_local_fallback
    
    @patch('core.media.boto3.client')
    def test_get_s3_client_success(self, mock_boto3_client):
        """Test successful S3 client creation."""
        with patch.dict(os.environ, {
            'MEDIA_ACCESS_KEY': 'test-key',
            'MEDIA_SECRET_KEY': 'test-secret'
        }):
            config = StorageConfig()
            client = config.get_s3_client()
            mock_boto3_client.assert_called_once()
            assert client is not None
    
    def test_get_s3_client_fallback(self):
        """Test S3 client returns None for local fallback."""
        with patch.dict(os.environ, {}, clear=True):
            config = StorageConfig()
            client = config.get_s3_client()
            assert client is None


class TestMediaOperations:
    """Test media storage operations."""
    
    @pytest.fixture
    def mock_s3_client(self):
        """Mock S3 client fixture."""
        return Mock()
    
    @pytest.fixture
    def sample_media_file(self):
        """Sample media file fixture."""
        return MediaFile(
            size=1024,
            mime_type='image/jpeg',
            bytes=b'fake image data'
        )
    
    @patch('core.media.StorageConfig')
    def test_save_to_bucket_s3_success(self, mock_config_class, mock_s3_client, sample_media_file):
        """Test successful S3 upload."""
        mock_config = Mock()
        mock_config.use_local_fallback = False
        mock_config.bucket_name = 'test-bucket'
        mock_config.get_s3_client.return_value = mock_s3_client
        mock_config_class.return_value = mock_config
        
        result = save_to_bucket(sample_media_file, 'test/path.jpg')
        
        mock_s3_client.put_object.assert_called_once_with(
            Bucket='test-bucket',
            Key='test/path.jpg',
            Body=sample_media_file.bytes,
            ContentType='image/jpeg'
        )
        assert result == 'test/path.jpg'
    
    @patch('core.media.StorageConfig')
    @patch('core.media.os.makedirs')
    @patch('builtins.open', create=True)
    def test_save_to_bucket_local_fallback(self, mock_open, mock_makedirs, mock_config_class, sample_media_file):
        """Test local fallback for save operation."""
        mock_config = Mock()
        mock_config.use_local_fallback = True
        mock_config_class.return_value = mock_config
        
        with patch.dict(os.environ, {'LOCAL_MEDIA_DIR': '/tmp/media'}):
            result = save_to_bucket(sample_media_file, 'test/path.jpg')
        
        mock_makedirs.assert_called_once()
        mock_open.assert_called_once()
        assert result == 'test/path.jpg'
    
    @patch('core.media.StorageConfig')
    def test_get_from_bucket_s3_success(self, mock_config_class, mock_s3_client):
        """Test successful S3 download."""
        mock_config = Mock()
        mock_config.use_local_fallback = False
        mock_config.bucket_name = 'test-bucket'
        mock_config.get_s3_client.return_value = mock_s3_client
        mock_config_class.return_value = mock_config
        
        mock_response = {'Body': Mock()}
        mock_response['Body'].read.return_value = b'file content'
        mock_s3_client.get_object.return_value = mock_response
        
        result = get_from_bucket('test/path.jpg')
        
        mock_s3_client.get_object.assert_called_once_with(
            Bucket='test-bucket',
            Key='test/path.jpg'
        )
        assert result == b'file content'
    
    @patch('core.media.StorageConfig')
    @patch('builtins.open', create=True)
    def test_get_from_bucket_local_fallback(self, mock_open, mock_config_class):
        """Test local fallback for get operation."""
        mock_config = Mock()
        mock_config.use_local_fallback = True
        mock_config_class.return_value = mock_config
        
        mock_file = Mock()
        mock_file.read.return_value = b'local file content'
        mock_open.return_value.__enter__.return_value = mock_file
        
        with patch.dict(os.environ, {'LOCAL_MEDIA_DIR': '/tmp/media'}):
            result = get_from_bucket('test/path.jpg')
        
        assert result == b'local file content'
    
    @patch('core.media.StorageConfig')
    def test_generate_presigned_url_s3(self, mock_config_class, mock_s3_client):
        """Test presigned URL generation for S3."""
        mock_config = Mock()
        mock_config.use_local_fallback = False
        mock_config.bucket_name = 'test-bucket'
        mock_config.get_s3_client.return_value = mock_s3_client
        mock_config_class.return_value = mock_config
        
        mock_s3_client.generate_presigned_url.return_value = 'https://s3.amazonaws.com/signed-url'
        
        result = generate_presigned_url('test/path.jpg')
        
        mock_s3_client.generate_presigned_url.assert_called_once()
        assert result == 'https://s3.amazonaws.com/signed-url'
    
    @patch('core.media.StorageConfig')
    def test_generate_presigned_url_local_fallback(self, mock_config_class):
        """Test presigned URL generation for local fallback."""
        mock_config = Mock()
        mock_config.use_local_fallback = True
        mock_config_class.return_value = mock_config
        
        result = generate_presigned_url('test/path.jpg')
        
        assert result == '/media/test/path.jpg'


class TestMediaFile:
    """Test MediaFile model."""
    
    def test_media_file_creation(self):
        """Test MediaFile creation with valid data."""
        media_file = MediaFile(
            size=2048,
            mime_type='video/mp4',
            bytes=b'video data'
        )
        assert media_file.size == 2048
        assert media_file.mime_type == 'video/mp4'
        assert media_file.bytes == b'video data'