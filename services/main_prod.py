"""
Production entrypoint for MagicLens AR Video Platform.

This module provides production-ready server configuration.
"""
import os
import uvicorn
import multiprocessing

def get_server_config():
    """Get server configuration from environment variables."""
    return {
        "app": "api.bootstrap:app",
        "host": os.getenv("SERVER_HOST", "0.0.0.0"),
        "port": int(os.getenv("SERVER_PORT", "8000")),
        "workers": int(os.getenv("SERVER_WORKERS", str(multiprocessing.cpu_count()))),
        "log_level": os.getenv("LOG_LEVEL", "info").lower(),
        "access_log": True,
        "proxy_headers": True,
        "forwarded_allow_ips": "*",
        # Production settings
        "reload": False,
        "loop": "uvloop",  # Use uvloop for better performance
        "http": "httptools",  # Use httptools for better performance
        "limit_concurrency": 1000,
        "limit_max_requests": 10000,
        "timeout_keep_alive": 5,
    }

if __name__ == "__main__":
    config = get_server_config()
    print(f"🚀 Starting MagicLens API Server")
    print(f"   Host: {config['host']}:{config['port']}")
    print(f"   Workers: {config['workers']}")
    print(f"   Environment: {os.getenv('ENV', 'production')}")
    print(f"   Log Level: {config['log_level']}")
    
    uvicorn.run(**config)
