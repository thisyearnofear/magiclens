"""Prometheus metrics configuration and custom metrics."""
import time
from functools import wraps
from typing import Dict, Any
from prometheus_client import Counter, Histogram, Gauge, Info, generate_latest
from prometheus_fastapi_instrumentator import Instrumentator
from loguru import logger


# Custom metrics
render_jobs_total = Counter(
    'render_jobs_total',
    'Total number of render jobs processed',
    ['status', 'priority']
)

render_job_duration = Histogram(
    'render_job_duration_seconds',
    'Time spent processing render jobs',
    ['status'],
    buckets=[1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600]
)

render_queue_size = Gauge(
    'render_queue_size',
    'Current number of jobs in render queue'
)

render_processing_jobs = Gauge(
    'render_processing_jobs',
    'Current number of jobs being processed'
)

video_uploads_total = Counter(
    'video_uploads_total',
    'Total number of video uploads',
    ['status']
)

video_upload_size = Histogram(
    'video_upload_size_bytes',
    'Size of uploaded videos in bytes',
    buckets=[1024*1024, 10*1024*1024, 50*1024*1024, 100*1024*1024, 500*1024*1024, 1024*1024*1024]
)

websocket_connections = Gauge(
    'websocket_connections_active',
    'Number of active WebSocket connections'
)

ai_analysis_requests = Counter(
    'ai_analysis_requests_total',
    'Total number of AI analysis requests',
    ['provider', 'status']
)

ai_analysis_duration = Histogram(
    'ai_analysis_duration_seconds',
    'Time spent on AI analysis',
    ['provider'],
    buckets=[0.1, 0.5, 1, 2, 5, 10, 30, 60]
)

storage_operations = Counter(
    'storage_operations_total',
    'Total number of storage operations',
    ['operation', 'backend', 'status']
)

storage_operation_duration = Histogram(
    'storage_operation_duration_seconds',
    'Time spent on storage operations',
    ['operation', 'backend'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
)

# Application info
app_info = Info('magiclens_app', 'MagicLens application information')


class MetricsManager:
    """Manager for application metrics."""
    
    def __init__(self):
        self.instrumentator = None
        self._initialized = False
    
    def init_metrics(self, app):
        """Initialize Prometheus metrics for FastAPI app."""
        if self._initialized:
            return
        
        try:
            # Initialize FastAPI instrumentator
            self.instrumentator = Instrumentator(
                should_group_status_codes=True,
                should_ignore_untemplated=True,
                should_respect_env_var=True,
                should_instrument_requests_inprogress=True,
                excluded_handlers=["/health", "/metrics"],
                env_var_name="ENABLE_METRICS",
                inprogress_name="http_requests_inprogress",
                inprogress_labels=True,
            )
            
            # Add custom metrics
            self.instrumentator.add(
                self._http_request_size_metric()
            ).add(
                self._http_response_size_metric()
            )
            
            # Instrument the app
            self.instrumentator.instrument(app)
            
            # Set application info
            app_info.info({
                'version': '1.0.0',  # This could come from environment
                'component': 'magiclens-api'
            })
            
            self._initialized = True
            logger.info("Prometheus metrics initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize metrics: {e}")
    
    def expose_metrics(self, app):
        """Expose metrics endpoint."""
        if self.instrumentator:
            self.instrumentator.expose(app, endpoint="/metrics")
    
    def _http_request_size_metric(self):
        """Custom metric for HTTP request size."""
        METRIC = Histogram(
            "http_request_size_bytes",
            "Size of HTTP requests in bytes",
            buckets=[100, 1000, 10000, 100000, 1000000]
        )
        
        def instrumentation(info):
            if hasattr(info.request, 'headers'):
                content_length = info.request.headers.get('content-length')
                if content_length:
                    METRIC.observe(int(content_length))
        
        return instrumentation
    
    def _http_response_size_metric(self):
        """Custom metric for HTTP response size."""
        METRIC = Histogram(
            "http_response_size_bytes",
            "Size of HTTP responses in bytes",
            buckets=[100, 1000, 10000, 100000, 1000000]
        )
        
        def instrumentation(info):
            if hasattr(info.response, 'headers'):
                content_length = info.response.headers.get('content-length')
                if content_length:
                    METRIC.observe(int(content_length))
        
        return instrumentation


# Global metrics manager instance
metrics_manager = MetricsManager()


def track_render_job(func):
    """Decorator to track render job metrics."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        status = "success"
        
        try:
            result = await func(*args, **kwargs)
            return result
        except Exception as e:
            status = "error"
            raise
        finally:
            duration = time.time() - start_time
            render_job_duration.labels(status=status).observe(duration)
            render_jobs_total.labels(status=status, priority="normal").inc()
    
    return wrapper


def track_ai_analysis(provider: str):
    """Decorator to track AI analysis metrics."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = "success"
            
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = "error"
                raise
            finally:
                duration = time.time() - start_time
                ai_analysis_duration.labels(provider=provider).observe(duration)
                ai_analysis_requests.labels(provider=provider, status=status).inc()
        
        return wrapper
    return decorator


def track_storage_operation(operation: str, backend: str):
    """Decorator to track storage operation metrics."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            status = "success"
            
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                status = "error"
                raise
            finally:
                duration = time.time() - start_time
                storage_operation_duration.labels(operation=operation, backend=backend).observe(duration)
                storage_operations.labels(operation=operation, backend=backend, status=status).inc()
        
        return wrapper
    return decorator


def update_queue_metrics(queue_size: int, processing_jobs: int):
    """Update render queue metrics."""
    render_queue_size.set(queue_size)
    render_processing_jobs.set(processing_jobs)


def track_video_upload(size_bytes: int, status: str = "success"):
    """Track video upload metrics."""
    video_uploads_total.labels(status=status).inc()
    if status == "success":
        video_upload_size.observe(size_bytes)


def track_websocket_connection(delta: int):
    """Track WebSocket connection changes."""
    websocket_connections.inc(delta)


def get_metrics_text() -> str:
    """Get metrics in Prometheus text format."""
    return generate_latest().decode('utf-8')