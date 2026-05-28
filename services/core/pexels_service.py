import os
import requests
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

SUGGESTED_QUERIES = [
    {"label": "Goal Celebrations", "query": "soccer goal celebration football"},
    {"label": "Stadium Crowds", "query": "football stadium crowd fans cheering"},
    {"label": "Match Action", "query": "soccer match football game playing"},
    {"label": "Trophy Moments", "query": "trophy celebration sports champion"},
    {"label": "Training & Skills", "query": "football training soccer skills practice"},
    {"label": "Fan Culture", "query": "football fans crowd waving flags"},
]

PEXELS_VIDEO_URL = "https://api.pexels.com/videos"


def _format_video(video: Dict) -> Dict:
    video_files = video.get("video_files", [])
    if not video_files:
        return {}
    hd = next((vf for vf in video_files if vf.get("quality") == "hd"), video_files[0])
    user = video.get("user", {})
    return {
        "id": video.get("id"),
        "title": video.get("url", "").split("/")[-2].replace("-", " ").title() or "Pexels Video",
        "video_url": hd.get("link"),
        "preview_url": video.get("image"),
        "duration": video.get("duration", 0),
        "width": video.get("width", 0),
        "height": video.get("height", 0),
        "photographer": user.get("name", "Unknown"),
        "photographer_url": user.get("url", "https://www.pexels.com"),
        "source": "pexels",
    }


def search_videos(query: str, limit: int = 12) -> List[Dict]:
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        logger.warning("PEXELS_API_KEY not configured")
        return []
    try:
        resp = requests.get(
            f"{PEXELS_VIDEO_URL}/search",
            headers={"Authorization": api_key},
            params={"query": query, "per_page": limit, "orientation": "landscape"},
            timeout=10,
        )
        resp.raise_for_status()
        return [v for v in (_format_video(v) for v in resp.json().get("videos", [])) if v]
    except Exception as e:
        logger.error(f"Pexels search failed: {e}")
        return []


# Backward-compatible wrapper used by existing route
async def get_environmental_inspiration(category: str = None, limit: int = 20) -> List[Dict]:
    query = "nature park street city outdoor"
    if category:
        query = category
    return search_videos(query, limit)
