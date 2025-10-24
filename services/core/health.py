"""Health check and system monitoring for MagicLens."""
import psutil
import time
from typing import Dict, Any
from datetime import datetime
from loguru import logger


class HealthCheck:
    """System health monitoring."""
    
    def __init__(self):
        self.start_time = time.time()
    
    async def check_database(self) -> Dict[str, Any]:
        """Check database connection health."""
        try:
            from core.database import pool
            
            if pool is None:
                return {
                    "status": "down",
                    "message": "Database pool not initialized"
                }
            
            # Try to get a connection
            conn = pool.getconn()
            pool.putconn(conn)
            
            return {
                "status": "up",
                "pool_size": pool.getconn.__self__._pool.qsize() if hasattr(pool, '_pool') else "unknown"
            }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "down",
                "error": str(e)
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        """Check Redis connection health."""
        try:
            from core.render_queue import render_queue
            
            # Try to get queue stats
            stats = render_queue.get_queue_stats()
            
            return {
                "status": "up",
                "queued": stats.get("queued", 0),
                "processing": stats.get("processing", 0)
            }
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return {
                "status": "down",
                "error": str(e)
            }
    
    async def check_flow_service(self) -> Dict[str, Any]:
        """Check Flow blockchain service health."""
        try:
            from core.flow_service import flow_service
            
            return {
                "status": "configured" if any(flow_service.contract_addresses.values()) else "unconfigured",
                "network": flow_service.network,
                "access_node": flow_service.access_node,
                "contracts": {
                    name: "configured" if addr else "missing"
                    for name, addr in flow_service.contract_addresses.items()
                }
            }
        except Exception as e:
            logger.error(f"Flow service health check failed: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get system resource metrics."""
        try:
            return {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage('/').percent,
                "uptime_seconds": int(time.time() - self.start_time)
            }
        except Exception as e:
            logger.error(f"System metrics collection failed: {e}")
            return {
                "error": str(e)
            }
    
    async def get_full_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status."""
        database = await self.check_database()
        redis = await self.check_redis()
        flow = await self.check_flow_service()
        system = self.get_system_metrics()
        
        # Determine overall status
        critical_services = [database["status"], redis["status"]]
        if any(s == "down" for s in critical_services):
            overall_status = "unhealthy"
        elif flow["status"] == "unconfigured":
            overall_status = "degraded"
        else:
            overall_status = "healthy"
        
        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": database,
                "redis": redis,
                "flow": flow
            },
            "system": system
        }


# Global health check instance
health_check = HealthCheck()
