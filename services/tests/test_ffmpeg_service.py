"""Tests for FFmpeg service functionality."""
import os
import tempfile
from unittest.mock import patch, Mock, call
import pytest
from core.ffmpeg_service import (
    FFmpegService, VideoInfo, OverlayConfig, 
    get_video_info, apply_overlay, extract_frames
)


class TestVideoInfo:
    """Test VideoInfo data class."""
    
    def test_video_info_creation(self):
        """Test VideoInfo object creation."""
        info = VideoInfo(
            duration=120.5,
            width=1920,
            height=1080,
            fps=30.0,
            format="mp4"
        )
        
        assert info.duration == 120.5
        assert info.width == 1920
        assert info.height == 1080
        assert info.fps == 30.0
        assert info.format == "mp4"


class TestOverlayConfig:
    """Test OverlayConfig data class."""
    
    def test_overlay_config_creation(self):
        """Test OverlayConfig object creation."""
        config = OverlayConfig(
            image_path="/path/to/overlay.png",
            x=100,
            y=200,
            width=300,
            height=150,
            start_time=10.0,
            end_time=20.0,
            opacity=0.8
        )
        
        assert config.image_path == "/path/to/overlay.png"
        assert config.x == 100
        assert config.y == 200
        assert config.width == 300
        assert config.height == 150
        assert config.start_time == 10.0
        assert config.end_time == 20.0
        assert config.opacity == 0.8


class TestFFmpegService:
    """Test FFmpegService functionality."""
    
    @pytest.fixture
    def ffmpeg_service(self):
        """Create FFmpegService instance for testing."""
        return FFmpegService()
    
    @patch('subprocess.run')
    def test_get_video_info_success(self, mock_run, ffmpeg_service):
        """Test successful video info extraction."""
        # Mock ffprobe output
        mock_output = '''
        {
            "streams": [
                {
                    "codec_type": "video",
                    "width": 1920,
                    "height": 1080,
                    "r_frame_rate": "30/1",
                    "duration": "120.500000"
                }
            ],
            "format": {
                "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
                "duration": "120.500000"
            }
        }
        '''
        mock_run.return_value = Mock(
            returncode=0,
            stdout=mock_output,
            stderr=""
        )
        
        with tempfile.NamedTemporaryFile(suffix='.mp4') as temp_file:
            info = ffmpeg_service.get_video_info(temp_file.name)
        
        assert info.duration == 120.5
        assert info.width == 1920
        assert info.height == 1080
        assert info.fps == 30.0
        assert "mp4" in info.format
    
    @patch('subprocess.run')
    def test_get_video_info_failure(self, mock_run, ffmpeg_service):
        """Test video info extraction failure."""
        mock_run.return_value = Mock(
            returncode=1,
            stdout="",
            stderr="Error: Invalid file"
        )
        
        with pytest.raises(Exception) as exc_info:
            ffmpeg_service.get_video_info("/nonexistent/file.mp4")
        
        assert "ffprobe failed" in str(exc_info.value)
    
    @patch('subprocess.run')
    def test_apply_overlay_success(self, mock_run, ffmpeg_service):
        """Test successful overlay application."""
        mock_run.return_value = Mock(returncode=0, stdout="", stderr="")
        
        overlay_config = OverlayConfig(
            image_path="/path/to/overlay.png",
            x=100, y=200, width=300, height=150,
            start_time=10.0, end_time=20.0, opacity=0.8
        )
        
        with tempfile.NamedTemporaryFile(suffix='.mp4') as input_file, \
             tempfile.NamedTemporaryFile(suffix='.mp4') as output_file:
            
            ffmpeg_service.apply_overlay(
                input_file.name, 
                output_file.name, 
                overlay_config
            )
        
        # Verify ffmpeg was called with correct parameters
        mock_run.assert_called_once()
        call_args = mock_run.call_args[0][0]
        
        assert 'ffmpeg' in call_args
        assert '-i' in call_args
        assert 'overlay' in ' '.join(call_args)
    
    @patch('subprocess.run')
    def test_apply_overlay_failure(self, mock_run, ffmpeg_service):
        """Test overlay application failure."""
        mock_run.return_value = Mock(
            returncode=1,
            stdout="",
            stderr="Error: Overlay failed"
        )
        
        overlay_config = OverlayConfig(
            image_path="/path/to/overlay.png",
            x=0, y=0, width=100, height=100,
            start_time=0.0, end_time=10.0, opacity=1.0
        )
        
        with pytest.raises(Exception) as exc_info:
            ffmpeg_service.apply_overlay(
                "/input.mp4", 
                "/output.mp4", 
                overlay_config
            )
        
        assert "ffmpeg failed" in str(exc_info.value)
    
    @patch('subprocess.run')
    def test_extract_frames_success(self, mock_run, ffmpeg_service):
        """Test successful frame extraction."""
        mock_run.return_value = Mock(returncode=0, stdout="", stderr="")
        
        with tempfile.NamedTemporaryFile(suffix='.mp4') as input_file, \
             tempfile.TemporaryDirectory() as temp_dir:
            
            frames = ffmpeg_service.extract_frames(
                input_file.name, 
                temp_dir, 
                fps=1.0, 
                max_frames=10
            )
        
        # Verify ffmpeg was called
        mock_run.assert_called_once()
        call_args = mock_run.call_args[0][0]
        
        assert 'ffmpeg' in call_args
        assert '-i' in call_args
        assert '-vf' in call_args
        assert 'fps=1.0' in ' '.join(call_args)
    
    @patch('subprocess.run')
    def test_extract_frames_failure(self, mock_run, ffmpeg_service):
        """Test frame extraction failure."""
        mock_run.return_value = Mock(
            returncode=1,
            stdout="",
            stderr="Error: Frame extraction failed"
        )
        
        with pytest.raises(Exception) as exc_info:
            ffmpeg_service.extract_frames(
                "/input.mp4", 
                "/output/dir", 
                fps=1.0
            )
        
        assert "ffmpeg failed" in str(exc_info.value)


class TestStandaloneFunctions:
    """Test standalone FFmpeg functions."""
    
    @patch('core.ffmpeg_service.FFmpegService')
    def test_get_video_info_function(self, mock_service_class):
        """Test get_video_info standalone function."""
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.get_video_info.return_value = VideoInfo(
            duration=60.0, width=1280, height=720, fps=24.0, format="mp4"
        )
        
        info = get_video_info("/test/video.mp4")
        
        mock_service.get_video_info.assert_called_once_with("/test/video.mp4")
        assert info.duration == 60.0
        assert info.width == 1280
    
    @patch('core.ffmpeg_service.FFmpegService')
    def test_apply_overlay_function(self, mock_service_class):
        """Test apply_overlay standalone function."""
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        
        overlay_config = OverlayConfig(
            image_path="/overlay.png",
            x=0, y=0, width=100, height=100,
            start_time=0.0, end_time=5.0, opacity=1.0
        )
        
        apply_overlay("/input.mp4", "/output.mp4", overlay_config)
        
        mock_service.apply_overlay.assert_called_once_with(
            "/input.mp4", "/output.mp4", overlay_config
        )
    
    @patch('core.ffmpeg_service.FFmpegService')
    def test_extract_frames_function(self, mock_service_class):
        """Test extract_frames standalone function."""
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.extract_frames.return_value = [
            "/frames/frame_001.jpg",
            "/frames/frame_002.jpg"
        ]
        
        frames = extract_frames("/input.mp4", "/frames", fps=2.0, max_frames=5)
        
        mock_service.extract_frames.assert_called_once_with(
            "/input.mp4", "/frames", fps=2.0, max_frames=5
        )
        assert len(frames) == 2


class TestFFmpegServiceIntegration:
    """Integration tests for FFmpeg service."""
    
    @pytest.fixture
    def ffmpeg_service(self):
        """Create FFmpegService instance for testing."""
        return FFmpegService()
    
    def test_overlay_config_validation(self, ffmpeg_service):
        """Test overlay configuration validation."""
        # Test with negative coordinates
        config = OverlayConfig(
            image_path="/overlay.png",
            x=-10, y=-10, width=100, height=100,
            start_time=0.0, end_time=5.0, opacity=1.0
        )
        
        # Should handle negative coordinates gracefully
        assert config.x == -10
        assert config.y == -10
    
    def test_overlay_timing_validation(self, ffmpeg_service):
        """Test overlay timing validation."""
        # Test with end time before start time
        config = OverlayConfig(
            image_path="/overlay.png",
            x=0, y=0, width=100, height=100,
            start_time=10.0, end_time=5.0, opacity=1.0
        )
        
        # Configuration should be created but logic should handle invalid timing
        assert config.start_time > config.end_time
    
    def test_opacity_bounds(self, ffmpeg_service):
        """Test opacity value bounds."""
        # Test with opacity outside normal range
        config = OverlayConfig(
            image_path="/overlay.png",
            x=0, y=0, width=100, height=100,
            start_time=0.0, end_time=5.0, opacity=1.5
        )
        
        # Should accept the value (validation can be done in service)
        assert config.opacity == 1.5