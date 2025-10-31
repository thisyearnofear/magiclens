"""
Redis-backed render job queue for processing video renders with FFmpeg.
"""

import json
import os
import asyncio
import time
from typing import Dict, Optional, List
from uuid import UUID
from datetime import datetime, timedelta
from loguru import logger

# Redis import with fallback for testing
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    redis = None
    REDIS_AVAILABLE = False

from core.renders import Render
from core.collaborations import Collaboration
from core.videos import Video
from core.overlays import Overlay
from core.artist_assets import ArtistAsset
# Video rendering functionality removed - will be implemented when needed
from core.websocket_service import notify_render_progress

# Sentry integration
try:
    from core.sentry_config import (
        capture_exception_with_context, 
        set_render_context, 
        add_breadcrumb
    )
    from core.metrics import metrics_manager
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False

# Redis connection
redis_client = None

def get_redis_client():
    """Get Redis client with connection pooling."""
    global redis_client
    if redis_client is None:
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        redis_client = redis.from_url(redis_url, decode_responses=True)
    return redis_client

class RenderQueue:
    """Redis-backed render job queue."""
    
    def __init__(self):
        self.redis = get_redis_client()
        self.queue_key = "render_queue"
        self.processing_key = "render_processing"
        self.results_key = "render_results"
        
    def enqueue_render(self, render_id: UUID, collaboration_id: UUID, render_settings: Dict) -> bool:
        """Add a render job to the queue."""
        try:
            job_data = {
                "render_id": str(render_id),
                "collaboration_id": str(collaboration_id),
                "render_settings": render_settings,
                "queued_at": datetime.now().isoformat(),
                "priority": render_settings.get("priority", 5)  # 1-10, lower = higher priority
            }
            
            # Add to priority queue (sorted set by priority)
            self.redis.zadd(self.queue_key, {json.dumps(job_data): job_data["priority"]})
            
            logger.info(f"Enqueued render job {render_id} for collaboration {collaboration_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to enqueue render {render_id}: {e}")
            return False
    
    def dequeue_render(self) -> Optional[Dict]:
        """Get the next render job from the queue."""
        try:
            # Get highest priority job (lowest score)
            result = self.redis.zpopmin(self.queue_key, 1)
            if not result:
                return None
                
            job_json, priority = result[0]
            job_data = json.loads(job_json)
            
            # Move to processing set
            processing_data = {
                **job_data,
                "started_at": datetime.now().isoformat()
            }
            self.redis.hset(self.processing_key, job_data["render_id"], json.dumps(processing_data))
            
            return job_data
            
        except Exception as e:
            logger.error(f"Failed to dequeue render job: {e}")
            return None
    
    def mark_render_completed(self, render_id: str, output_path: str, processing_time: float, file_size: int):
        """Mark a render as completed."""
        try:
            # Remove from processing
            self.redis.hdel(self.processing_key, render_id)
            
            # Add to results
            result_data = {
                "render_id": render_id,
                "status": "completed",
                "output_path": output_path,
                "processing_time": processing_time,
                "file_size": file_size,
                "completed_at": datetime.now().isoformat()
            }
            self.redis.hset(self.results_key, render_id, json.dumps(result_data))
            
            # Set expiry for results (7 days)
            self.redis.expire(f"{self.results_key}:{render_id}", 7 * 24 * 3600)
            
            logger.info(f"Marked render {render_id} as completed")
            
        except Exception as e:
            logger.error(f"Failed to mark render {render_id} as completed: {e}")
    
    def mark_render_failed(self, render_id: str, error_message: str):
        """Mark a render as failed."""
        try:
            # Remove from processing
            self.redis.hdel(self.processing_key, render_id)
            
            # Add to results
            result_data = {
                "render_id": render_id,
                "status": "failed",
                "error_message": error_message,
                "completed_at": datetime.now().isoformat()
            }
            self.redis.hset(self.results_key, render_id, json.dumps(result_data))
            
            logger.error(f"Marked render {render_id} as failed: {error_message}")
            
        except Exception as e:
            logger.error(f"Failed to mark render {render_id} as failed: {e}")
    
    def get_queue_stats(self) -> Dict:
        """Get render queue statistics."""
        try:
            queued_count = self.redis.zcard(self.queue_key)
            processing_count = self.redis.hlen(self.processing_key)
            
            # Get processing jobs that might be stuck (> 30 minutes)
            stuck_jobs = []
            processing_jobs = self.redis.hgetall(self.processing_key)
            cutoff_time = datetime.now() - timedelta(minutes=30)
            
            for render_id, job_json in processing_jobs.items():
                job_data = json.loads(job_json)
                started_at = datetime.fromisoformat(job_data["started_at"])
                if started_at < cutoff_time:
                    stuck_jobs.append(render_id)
            
            return {
                "queued": queued_count,
                "processing": processing_count,
                "stuck": len(stuck_jobs),
                "stuck_jobs": stuck_jobs
            }
            
        except Exception as e:
            logger.error(f"Failed to get queue stats: {e}")
            return {"queued": 0, "processing": 0, "stuck": 0, "stuck_jobs": []}
    
    def cancel_render(self, render_id: str) -> bool:
        """Cancel a queued or processing render."""
        try:
            # Remove from queue if present
            queue_jobs = self.redis.zrange(self.queue_key, 0, -1)
            for job_json in queue_jobs:
                job_data = json.loads(job_json)
                if job_data["render_id"] == render_id:
                    self.redis.zrem(self.queue_key, job_json)
                    logger.info(f"Cancelled queued render {render_id}")
                    return True
            
            # Remove from processing if present
            if self.redis.hdel(self.processing_key, render_id):
                logger.info(f"Cancelled processing render {render_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to cancel render {render_id}: {e}")
            return False

# Global render queue instance
render_queue = RenderQueue()

# Standalone function wrappers for testing compatibility
def enqueue_render(job_data: Dict) -> bool:
    """Wrapper function for enqueue_render."""
    try:
        from uuid import UUID
        render_id = UUID(job_data['render_id']) if isinstance(job_data['render_id'], str) else job_data['render_id']
        collaboration_id = UUID(job_data['collaboration_id']) if isinstance(job_data['collaboration_id'], str) else job_data['collaboration_id']
        render_settings = job_data
        return render_queue.enqueue_render(render_id, collaboration_id, render_settings)
    except Exception as e:
        logger.error(f"Failed to enqueue render: {e}")
        return False

def dequeue_render() -> Optional[Dict]:
    """Wrapper function for dequeue_render."""
    return render_queue.dequeue_render()

def get_queue_stats() -> Dict:
    """Wrapper function for get_queue_stats."""
    return render_queue.get_queue_stats()

def mark_render_completed(render_id: str, output_path: str, processing_time: float = 0, file_size: int = 0):
    """Wrapper function for mark_render_completed."""
    return render_queue.mark_render_completed(render_id, output_path, processing_time, file_size)

def mark_render_failed(render_id: str, error_message: str):
    """Wrapper function for mark_render_failed."""
    return render_queue.mark_render_failed(render_id, error_message)

async def process_render_job(job_data: dict) -> bool:
    """Process a single render job."""
    start_time = time.time()
    render_id = job_data.get('render_id')
    collaboration_id = job_data.get('collaboration_id')
    render_settings = job_data.get('render_settings')
    
    # Set Sentry context for this render job
    if SENTRY_AVAILABLE:
        set_render_context(render_id, job_data.get('user_id'))
        add_breadcrumb(
            message="Starting render job processing",
            category="render",
            data={"render_id": render_id}
        )
    
    try:
        logger.info(f"Starting render job {render_id}")
        
        # Update render status to processing
        Render.sql(
            "UPDATE renders SET render_status = 'processing', started_at = NOW() WHERE id = %(render_id)s",
            {"render_id": render_id}
        )
        
        # Notify via WebSocket
        notify_render_progress(collaboration_id, render_id, 0.1, "processing")
        
        # Load collaboration data
        collaboration_data = Collaboration.sql(
            """
            SELECT c.*, v.file_path as video_path, v.duration 
            FROM collaborations c 
            JOIN videos v ON c.video_id = v.id 
            WHERE c.id = %(collaboration_id)s
            """,
            {"collaboration_id": collaboration_id}
        )
        
        if not collaboration_data:
            raise ValueError("Collaboration not found")
        
        collab = collaboration_data[0]
        
        # Load overlays and assets
        overlays_data = Overlay.sql(
            "SELECT * FROM overlays WHERE collaboration_id = %(collaboration_id)s ORDER BY layer_order",
            {"collaboration_id": collaboration_id}
        )
        
        overlays = [Overlay(**overlay_data) for overlay_data in overlays_data]
        
        # Load artist assets
        asset_ids = [overlay.asset_id for overlay in overlays if overlay.asset_id]
        assets = []
        if asset_ids:
            assets_data = ArtistAsset.sql(
                f"SELECT * FROM artist_assets WHERE id IN ({','.join(['%s'] * len(asset_ids))})",
                asset_ids
            )
            assets = [ArtistAsset(**asset_data) for asset_data in assets_data]
        
        # Progress update
        notify_render_progress(collaboration_id, render_id, 0.3, "processing")
        
        # Video rendering functionality removed - placeholder for future implementation
        start_time = datetime.now()
        # TODO: Implement video rendering when needed
        output_path = f"/tmp/rendered_video_{render_id}.mp4"  # Placeholder
        end_time = datetime.now()
        
        processing_time = (end_time - start_time).total_seconds()
        
        # Progress update
        notify_render_progress(collaboration_id, render_id, 0.9, "processing")
        
        # Get file size (this would need to be implemented in media service)
        file_size = 0  # Placeholder
        
        # Update database
        Render.sql(
            """
            UPDATE renders SET 
                render_status = 'completed',
                progress = 1.0,
                output_path = %(output_path)s,
                processing_time = %(processing_time)s,
                file_size = %(file_size)s,
                completed_at = NOW()
            WHERE id = %(render_id)s
            """,
            {
                "render_id": render_id,
                "output_path": output_path,
                "processing_time": processing_time,
                "file_size": file_size
            }
        )
        
        # Mark as completed in queue
        render_queue.mark_render_completed(render_id, output_path, processing_time, file_size)
        
        # Final progress notification
        notify_render_progress(collaboration_id, render_id, 1.0, "completed")
        
        # Track successful render metrics
        duration = time.time() - start_time
        if SENTRY_AVAILABLE:
            metrics_manager.track_render_job("completed", duration)
        
        logger.info(f"Completed render job {render_id} in {processing_time:.2f}s")
        
    except Exception as e:
        logger.error(f"Render job {render_id} failed: {e}")
        
        # Capture exception with Sentry
        if SENTRY_AVAILABLE:
            capture_exception_with_context(
                e,
                render_job={
                    "render_id": render_id,
                    "collaboration_id": collaboration_id,
                    "render_settings": render_settings
                }
            )
        
        # Update database
        Render.sql(
            """
            UPDATE renders SET 
                render_status = 'failed',
                error_message = %(error_message)s,
                completed_at = NOW()
            WHERE id = %(render_id)s
            """,
            {
                "render_id": render_id,
                "error_message": str(e)
            }
        )
        
        # Mark as failed in queue
        render_queue.mark_render_failed(render_id, str(e))
        
        # Notify failure
        notify_render_progress(collaboration_id, render_id, 0.0, "failed")

async def render_worker():
    """Background worker to process render jobs."""
    logger.info("Starting render worker")
    
    while True:
        try:
            # Get next job
            job_data = render_queue.dequeue_render()
            
            if job_data:
                await process_render_job(job_data)
            else:
                # No jobs available, wait a bit
                await asyncio.sleep(5)
                
        except Exception as e:
            logger.error(f"Render worker error: {e}")
            await asyncio.sleep(10)  # Wait longer on error

def start_render_worker():
    """Start the render worker in the background."""
    asyncio.create_task(render_worker())