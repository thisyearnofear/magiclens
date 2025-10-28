"""
Pose Processing Queue - Background Processing Service
===================================================

Background processing service for pose analysis operations.
Follows CLEAN, MODULAR, and PERFORMANT principles.
"""

import asyncio
import time
import uuid
from typing import Dict, List, Optional, Callable
from datetime import datetime
from enum import Enum
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import json
import threading
from queue import Queue, PriorityQueue, Empty
from uuid import UUID

from core.computer_vision import get_pose_analyzer, extract_pose_from_video
from core.pose_cache import cache_video_pose_analysis, PoseCacheManager
from core.videos import Video


class JobStatus(Enum):
    """Job status enumeration."""

    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobPriority(Enum):
    """Job priority levels."""

    LOW = 3
    NORMAL = 2
    HIGH = 1
    URGENT = 0


@dataclass
class PoseProcessingJob:
    """Pose processing job data structure."""

    job_id: str
    video_id: UUID
    video_path: str
    priority: JobPriority = JobPriority.NORMAL
    max_frames: int = 30
    callback: Optional[Callable] = None
    created_at: datetime = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: JobStatus = JobStatus.QUEUED
    result: Optional[Dict] = None
    error: Optional[str] = None
    progress: float = 0.0
    processing_time_ms: int = 0

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    def __lt__(self, other):
        """Priority queue comparison."""
        return self.priority.value < other.priority.value


class PoseProcessingQueue:
    """
    Background processing queue for pose analysis operations.
    Implements PERFORMANT processing with configurable concurrency.
    """

    def __init__(self, max_workers: int = 2, max_queue_size: int = 100):
        """
        Initialize processing queue.

        Args:
            max_workers: Maximum concurrent processing threads
            max_queue_size: Maximum queue size before blocking
        """
        self.max_workers = max_workers
        self.max_queue_size = max_queue_size

        # Thread-safe queue for jobs
        self._job_queue = PriorityQueue(maxsize=max_queue_size)
        self._active_jobs: Dict[str, PoseProcessingJob] = {}
        self._completed_jobs: Dict[str, PoseProcessingJob] = {}
        self._job_lock = threading.Lock()

        # Processing infrastructure
        self._executor = ThreadPoolExecutor(
            max_workers=max_workers, thread_name_prefix="PoseProcessor"
        )
        self._is_running = False
        self._processor_thread = None

        # Performance metrics
        self._stats = {
            "jobs_processed": 0,
            "jobs_failed": 0,
            "total_processing_time_ms": 0,
            "average_processing_time_ms": 0,
            "queue_high_water_mark": 0,
        }

        print(
            f"✅ PoseProcessingQueue initialized: {max_workers} workers, {max_queue_size} queue size"
        )

    def start(self):
        """Start the background processing."""
        if self._is_running:
            print("⚠️  Processing queue already running")
            return

        self._is_running = True
        self._processor_thread = threading.Thread(target=self._process_jobs, daemon=True)
        self._processor_thread.start()
        print("🚀 Pose processing queue started")

    def stop(self):
        """Stop the background processing."""
        if not self._is_running:
            return

        self._is_running = False
        if self._processor_thread and self._processor_thread.is_alive():
            self._processor_thread.join(timeout=5.0)

        self._executor.shutdown(wait=True)
        print("🛑 Pose processing queue stopped")

    def enqueue_job(
        self,
        video_id: UUID,
        video_path: str,
        priority: JobPriority = JobPriority.NORMAL,
        max_frames: int = 30,
        callback: Optional[Callable] = None,
    ) -> str:
        """
        Enqueue a pose processing job.

        Args:
            video_id: Video UUID
            video_path: Path to video file
            priority: Job priority level
            max_frames: Maximum frames to process
            callback: Optional callback function when complete

        Returns:
            Job ID string
        """
        job_id = str(uuid.uuid4())

        job = PoseProcessingJob(
            job_id=job_id,
            video_id=video_id,
            video_path=video_path,
            priority=priority,
            max_frames=max_frames,
            callback=callback,
        )

        try:
            # Check queue capacity
            if self._job_queue.qsize() >= self.max_queue_size:
                raise ValueError(f"Queue is full ({self.max_queue_size} jobs)")

            # Add to queue
            self._job_queue.put(job, timeout=1.0)

            # Track in active jobs
            with self._job_lock:
                self._active_jobs[job_id] = job
                current_size = self._job_queue.qsize()
                if current_size > self._stats["queue_high_water_mark"]:
                    self._stats["queue_high_water_mark"] = current_size

            print(f"📋 Queued pose processing job {job_id[:8]} for video {video_id}")
            return job_id

        except Exception as e:
            print(f"❌ Failed to enqueue job: {e}")
            raise

    def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Get job status information."""
        with self._job_lock:
            # Check active jobs
            if job_id in self._active_jobs:
                job = self._active_jobs[job_id]
                return {
                    "job_id": job.job_id,
                    "video_id": str(job.video_id),
                    "status": job.status.value,
                    "progress": job.progress,
                    "created_at": job.created_at.isoformat(),
                    "started_at": job.started_at.isoformat() if job.started_at else None,
                    "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                    "processing_time_ms": job.processing_time_ms,
                    "error": job.error,
                }

            # Check completed jobs
            if job_id in self._completed_jobs:
                job = self._completed_jobs[job_id]
                return {
                    "job_id": job.job_id,
                    "video_id": str(job.video_id),
                    "status": job.status.value,
                    "progress": job.progress,
                    "created_at": job.created_at.isoformat(),
                    "started_at": job.started_at.isoformat() if job.started_at else None,
                    "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                    "processing_time_ms": job.processing_time_ms,
                    "error": job.error,
                    "result_cached": job.result is not None,
                }

            return None

    def cancel_job(self, job_id: str) -> bool:
        """Cancel a queued job."""
        with self._job_lock:
            if job_id in self._active_jobs:
                job = self._active_jobs[job_id]
                if job.status == JobStatus.QUEUED:
                    job.status = JobStatus.CANCELLED
                    job.completed_at = datetime.now()

                    # Move to completed
                    self._completed_jobs[job_id] = job
                    del self._active_jobs[job_id]

                    print(f"🚫 Cancelled job {job_id[:8]}")
                    return True

        return False

    def get_queue_stats(self) -> Dict:
        """Get processing queue statistics."""
        with self._job_lock:
            active_count = len(self._active_jobs)
            completed_count = len(self._completed_jobs)
            queue_size = self._job_queue.qsize()

            return {
                "queue_size": queue_size,
                "active_jobs": active_count,
                "completed_jobs": completed_count,
                "is_running": self._is_running,
                "max_workers": self.max_workers,
                "max_queue_size": self.max_queue_size,
                "stats": self._stats.copy(),
            }

    def cleanup_completed_jobs(self, max_age_hours: int = 24):
        """Clean up old completed jobs (PERFORMANT principle)."""
        cutoff_time = datetime.now().replace(hour=datetime.now().hour - max_age_hours)

        with self._job_lock:
            to_remove = []
            for job_id, job in self._completed_jobs.items():
                if job.completed_at and job.completed_at < cutoff_time:
                    to_remove.append(job_id)

            for job_id in to_remove:
                del self._completed_jobs[job_id]

            if to_remove:
                print(f"🧹 Cleaned up {len(to_remove)} old completed jobs")

    def _process_jobs(self):
        """Main job processing loop (runs in background thread)."""
        print("🔄 Starting job processing loop")

        while self._is_running:
            try:
                # Get next job with timeout
                job = self._job_queue.get(timeout=1.0)

                if job.status == JobStatus.CANCELLED:
                    continue

                # Process the job
                self._executor.submit(self._process_single_job, job)

            except Empty:
                # No jobs in queue, continue loop
                continue
            except Exception as e:
                print(f"❌ Error in job processing loop: {e}")
                time.sleep(1.0)  # Brief pause before retrying

        print("🛑 Job processing loop stopped")

    def _process_single_job(self, job: PoseProcessingJob):
        """Process a single pose analysis job."""
        start_time = time.time()

        try:
            # Update job status
            with self._job_lock:
                job.status = JobStatus.PROCESSING
                job.started_at = datetime.now()
                job.progress = 0.1

            print(f"🔄 Processing pose analysis for video {job.video_id}")

            # Extract poses from video
            analyzer = get_pose_analyzer()
            pose_sequences = analyzer.extract_pose_from_video(
                job.video_path, job.max_frames, job.video_id
            )

            job.progress = 0.6

            # Normalize poses
            from core.computer_vision import normalize_pose_sequence

            normalized_poses = normalize_pose_sequence(pose_sequences)

            job.progress = 0.8

            # Generate movement analysis
            movement_analysis = self._analyze_movement_patterns(pose_sequences, normalized_poses)

            job.progress = 0.9

            # Cache results
            processing_time_ms = int((time.time() - start_time) * 1000)
            success = cache_video_pose_analysis(
                job.video_id,
                pose_sequences,
                normalized_poses,
                movement_analysis,
                processing_time_ms,
            )

            # Update job completion
            with self._job_lock:
                job.status = JobStatus.COMPLETED
                job.completed_at = datetime.now()
                job.progress = 1.0
                job.processing_time_ms = processing_time_ms
                job.result = {
                    "pose_sequences_count": len(pose_sequences),
                    "normalized_poses_count": len(normalized_poses),
                    "movement_analysis": movement_analysis,
                    "cached": success,
                }

                # Update stats
                self._stats["jobs_processed"] += 1
                self._stats["total_processing_time_ms"] += processing_time_ms
                self._stats["average_processing_time_ms"] = (
                    self._stats["total_processing_time_ms"] / self._stats["jobs_processed"]
                )

                # Move to completed
                self._completed_jobs[job.job_id] = job
                if job.job_id in self._active_jobs:
                    del self._active_jobs[job.job_id]

            # Call callback if provided
            if job.callback:
                try:
                    job.callback(job)
                except Exception as e:
                    print(f"⚠️  Callback error for job {job.job_id[:8]}: {e}")

            print(f"✅ Completed pose analysis for video {job.video_id} in {processing_time_ms}ms")

        except Exception as e:
            # Handle job failure
            processing_time_ms = int((time.time() - start_time) * 1000)

            with self._job_lock:
                job.status = JobStatus.FAILED
                job.completed_at = datetime.now()
                job.progress = 0.0
                job.processing_time_ms = processing_time_ms
                job.error = str(e)

                # Update stats
                self._stats["jobs_failed"] += 1

                # Move to completed
                self._completed_jobs[job.job_id] = job
                if job.job_id in self._active_jobs:
                    del self._active_jobs[job.job_id]

            print(f"❌ Failed pose analysis for video {job.video_id}: {e}")

    def _analyze_movement_patterns(
        self, pose_sequences: List[List[float]], normalized_poses: List[List[float]]
    ) -> Dict:
        """Analyze movement patterns from pose data."""
        if not pose_sequences or not normalized_poses:
            return {"movement_type": "none", "confidence": 0.0}

        try:
            # Calculate average confidence
            total_confidence = 0.0
            confidence_count = 0

            for sequence in pose_sequences:
                for i in range(3, len(sequence), 4):  # Every 4th value starting from index 3
                    if i < len(sequence):
                        total_confidence += sequence[i]
                        confidence_count += 1

            avg_confidence = total_confidence / confidence_count if confidence_count > 0 else 0.0

            # Calculate movement variation
            if len(normalized_poses) > 1:
                variations = []
                for i in range(1, len(normalized_poses)):
                    variation = 0.0
                    for j in range(min(len(normalized_poses[i]), len(normalized_poses[i - 1]))):
                        variation += abs(normalized_poses[i][j] - normalized_poses[i - 1][j])
                    variations.append(variation)

                avg_variation = sum(variations) / len(variations) if variations else 0.0
            else:
                avg_variation = 0.0

            # Classify movement type
            if avg_variation > 2.0:
                movement_type = "high_activity"
            elif avg_variation > 1.0:
                movement_type = "moderate_activity"
            elif avg_variation > 0.3:
                movement_type = "low_activity"
            else:
                movement_type = "static"

            return {
                "movement_type": movement_type,
                "confidence": avg_confidence,
                "variation_score": avg_variation,
                "frame_count": len(pose_sequences),
                "analyzed_at": datetime.now().isoformat(),
            }

        except Exception as e:
            print(f"Error analyzing movement patterns: {e}")
            return {"movement_type": "unknown", "confidence": 0.0, "error": str(e)}


# Global queue instance (singleton pattern for PERFORMANT resource usage)
_pose_processing_queue = None


def get_pose_processing_queue() -> PoseProcessingQueue:
    """Get the global pose processing queue instance."""
    global _pose_processing_queue
    if _pose_processing_queue is None:
        _pose_processing_queue = PoseProcessingQueue()
        _pose_processing_queue.start()
    return _pose_processing_queue


def enqueue_video_pose_analysis(
    video_id: UUID,
    video_path: str,
    priority: JobPriority = JobPriority.NORMAL,
    max_frames: int = 30,
    callback: Optional[Callable] = None,
) -> str:
    """Enqueue a video for pose analysis processing."""
    queue = get_pose_processing_queue()
    return queue.enqueue_job(video_id, video_path, priority, max_frames, callback)


def get_processing_job_status(job_id: str) -> Optional[Dict]:
    """Get the status of a processing job."""
    queue = get_pose_processing_queue()
    return queue.get_job_status(job_id)


def cancel_processing_job(job_id: str) -> bool:
    """Cancel a queued processing job."""
    queue = get_pose_processing_queue()
    return queue.cancel_job(job_id)


def get_processing_queue_stats() -> Dict:
    """Get processing queue statistics."""
    queue = get_pose_processing_queue()
    return queue.get_queue_stats()


def cleanup_old_jobs(max_age_hours: int = 24):
    """Clean up old completed jobs."""
    queue = get_pose_processing_queue()
    queue.cleanup_completed_jobs(max_age_hours)


# Auto-start cleanup thread for PERFORMANT resource management
def _start_periodic_cleanup():
    """Start periodic cleanup of old jobs."""

    def cleanup_worker():
        while True:
            time.sleep(3600)  # Run every hour
            try:
                cleanup_old_jobs()
                # Also cleanup database cache
                PoseCacheManager.cleanup_expired_cache()
            except Exception as e:
                print(f"Error in periodic cleanup: {e}")

    cleanup_thread = threading.Thread(target=cleanup_worker, daemon=True)
    cleanup_thread.start()
    print("🧹 Started periodic cleanup thread")


# Start cleanup on module import
_start_periodic_cleanup()
