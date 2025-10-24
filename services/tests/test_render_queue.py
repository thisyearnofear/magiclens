"""Tests for render queue functionality."""
import json
from unittest.mock import Mock, patch, AsyncMock
import pytest
from uuid import uuid4
from core.render_queue import (
    enqueue_render, dequeue_render, get_queue_stats, 
    mark_render_completed, mark_render_failed, process_render_job
)


class TestRenderQueue:
    """Test render queue operations."""
    
    @pytest.fixture
    def mock_redis(self):
        """Mock Redis client fixture."""
        return Mock()
    
    @pytest.fixture
    def sample_render_job(self):
        """Sample render job fixture."""
        return {
            'render_id': str(uuid4()),
            'collaboration_id': str(uuid4()),
            'user_id': str(uuid4()),
            'video_path': 'videos/test.mp4',
            'overlays': [
                {
                    'asset_path': 'assets/overlay1.png',
                    'position': {'x': 100, 'y': 100},
                    'scale': 1.0,
                    'start_time': 0,
                    'end_time': 5
                }
            ]
        }
    
    @patch('core.render_queue.render_queue')
    def test_enqueue_render_success(self, mock_queue, sample_render_job):
        """Test successful render job enqueuing."""
        mock_queue.enqueue_render.return_value = True
        
        result = enqueue_render(sample_render_job)
        
        mock_queue.enqueue_render.assert_called_once()
        assert result is True
    
    @patch('core.render_queue.render_queue')
    def test_enqueue_render_failure(self, mock_queue, sample_render_job):
        """Test render job enqueuing failure."""
        mock_queue.enqueue_render.side_effect = Exception("Redis error")
        
        result = enqueue_render(sample_render_job)
        
        assert result is False
    
    @patch('core.render_queue.render_queue')
    def test_dequeue_render_success(self, mock_queue, sample_render_job):
        """Test successful render job dequeuing."""
        mock_queue.dequeue_render.return_value = sample_render_job
        
        result = dequeue_render()
        
        mock_queue.dequeue_render.assert_called_once()
        assert result == sample_render_job
    
    @patch('core.render_queue.render_queue')
    def test_dequeue_render_timeout(self, mock_queue):
        """Test render job dequeuing timeout."""
        mock_queue.dequeue_render.return_value = None
        
        result = dequeue_render()
        
        assert result is None
    
    @patch('core.render_queue.render_queue')
    def test_get_queue_stats(self, mock_queue):
        """Test queue statistics retrieval."""
        mock_queue.get_queue_stats.return_value = {
            'queued': 5,
            'processing': 3,
            'stuck': 0,
            'stuck_jobs': []
        }
        
        stats = get_queue_stats()
        
        assert stats['queued'] == 5
        assert stats['processing'] == 3
        assert stats['stuck'] == 0
    
    @patch('core.render_queue.render_queue')
    def test_mark_render_completed(self, mock_queue):
        """Test marking render as completed."""
        render_id = str(uuid4())
        output_path = 'renders/output.mp4'
        
        mark_render_completed(render_id, output_path)
        
        mock_queue.mark_render_completed.assert_called_once_with(render_id, output_path, 0, 0)
    
    @patch('core.render_queue.render_queue')
    def test_mark_render_failed(self, mock_queue):
        """Test marking render as failed."""
        render_id = str(uuid4())
        error_message = "Render failed due to invalid input"
        
        mark_render_failed(render_id, error_message)
        
        mock_queue.mark_render_failed.assert_called_once_with(render_id, error_message)


class TestRenderJobProcessing:
    """Test render job processing."""
    
    @pytest.fixture
    def sample_job_data(self):
        """Sample job data fixture."""
        return {
            'render_id': str(uuid4()),
            'collaboration_id': str(uuid4()),
            'user_id': str(uuid4()),
            'video_path': 'videos/test.mp4',
            'overlays': []
        }
    
    @patch('core.render_queue.Render')
    @patch('core.render_queue.Collaboration')
    @patch('core.render_queue.Overlay')
    @patch('core.render_queue.ArtistAsset')
    @patch('core.render_queue.notify_render_progress')
    @patch('core.render_queue.render_video_with_overlays')
    @patch('core.render_queue.render_queue')
    async def test_process_render_job_success(
        self, mock_queue, mock_render_video, mock_notify_progress,
        mock_asset, mock_overlay, mock_collaboration, mock_render, sample_job_data
    ):
        """Test successful render job processing."""
        # Mock database responses
        mock_render.sql.return_value = None
        mock_collaboration.sql.return_value = [{
            'id': sample_job_data['collaboration_id'],
            'video_path': 'videos/test.mp4',
            'duration': 10.0
        }]
        mock_overlay.sql.return_value = []
        mock_render_video.return_value = 'renders/output.mp4'
        
        await process_render_job(sample_job_data)
        
        # Verify render video was called
        mock_notify_progress.assert_called()
        mock_render_video.assert_called_once()
        mock_queue.mark_render_completed.assert_called_once()
    
    @patch('core.render_queue.Render')
    @patch('core.render_queue.Collaboration')
    @patch('core.render_queue.Overlay')
    @patch('core.render_queue.notify_render_progress')
    @patch('core.render_queue.render_video_with_overlays')
    @patch('core.render_queue.render_queue')
    async def test_process_render_job_failure(
        self, mock_queue, mock_render_video, mock_notify_progress,
        mock_overlay, mock_collaboration, mock_render, sample_job_data
    ):
        """Test render job processing failure."""
        # Mock database responses
        mock_render.sql.return_value = None
        mock_collaboration.sql.return_value = [{
            'id': sample_job_data['collaboration_id'],
            'video_path': 'videos/test.mp4',
            'duration': 10.0
        }]
        mock_overlay.sql.return_value = []
        mock_render_video.side_effect = Exception("Render error")
        
        await process_render_job(sample_job_data)
        
        mock_queue.mark_render_failed.assert_called_once_with(
            sample_job_data['render_id'], 
            "Render error"
        )
    
    @patch('core.render_queue.Render')
    @patch('core.render_queue.render_queue')
    async def test_process_render_job_invalid_data(
        self, mock_queue, mock_render
    ):
        """Test render job processing with invalid data."""
        mock_render.sql.return_value = None
        
        invalid_job_data = {'invalid': 'data'}
        
        await process_render_job(invalid_job_data)
        
        # Should handle gracefully and mark as failed
        mock_queue.mark_render_failed.assert_called()


class TestRenderWorker:
    """Test render worker functionality."""
    
    @patch('core.render_queue.render_queue')
    @patch('core.render_queue.process_render_job')
    @patch('core.render_queue.asyncio.sleep')
    async def test_render_worker_processes_jobs(self, mock_sleep, mock_process_job, mock_queue):
        """Test that render worker processes available jobs."""
        from core.render_queue import render_worker
        
        # Mock a job being available on first call, then raise exception to break loop
        job_data = {'render_id': str(uuid4()), 'video_path': 'test.mp4'}
        mock_queue.dequeue_render.side_effect = [job_data, KeyboardInterrupt()]
        
        # Run worker and catch the exception
        try:
            await render_worker()
        except KeyboardInterrupt:
            pass  # Expected to break the loop
        
        mock_process_job.assert_called_once_with(job_data)
    
    @patch('core.render_queue.render_queue')
    @patch('core.render_queue.asyncio.sleep')
    async def test_render_worker_handles_no_jobs(self, mock_sleep, mock_queue):
        """Test that render worker handles no available jobs gracefully."""
        from core.render_queue import render_worker
        
        # Return None (no jobs), then raise exception to break loop
        mock_queue.dequeue_render.side_effect = [None, KeyboardInterrupt()]
        
        # Run worker and catch the exception
        try:
            await render_worker()
        except KeyboardInterrupt:
            pass  # Expected to break the loop
        
        mock_queue.dequeue_render.assert_called()
        mock_sleep.assert_called_once_with(5)
