import os
import requests
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class PexelsService:
    def __init__(self):
        self.api_key = os.getenv('PEXELS_API_KEY')
        self.base_url = "https://api.pexels.com/v1"
        self.video_url = "https://api.pexels.com/videos"
        
    def search_environmental_videos(self, query: str = "nature park street", limit: int = 20) -> List[Dict]:
        """Search for environmental footage videos from Pexels"""
        if not self.api_key:
            logger.warning("Pexels API key not configured")
            return []
            
        try:
            url = f"{self.video_url}/search"
            headers = {
                'Authorization': self.api_key
            }
            params = {
                'query': query,
                'per_page': limit,
                'orientation': 'landscape'  # Better for environmental footage
            }
            
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            videos = []
            
            for video in data.get('videos', []):
                # Get the best quality video file
                video_files = video.get('video_files', [])
                if not video_files:
                    continue
                    
                # Prefer HD quality
                hd_video = next((vf for vf in video_files if vf.get('quality') == 'hd'), video_files[0])
                
                video_data = {
                    'id': video.get('id'),
                    'title': f"Environmental footage by {video.get('user', {}).get('name', 'Unknown')}",
                    'description': f"Duration: {video.get('duration', 0)}s",
                    'preview_url': video.get('image'),
                    'video_url': hd_video.get('link'),
                    'duration': video.get('duration', 0),
                    'width': video.get('width', 0),
                    'height': video.get('height', 0),
                    'photographer': video.get('user', {}).get('name', 'Unknown'),
                    'photographer_url': video.get('user', {}).get('url', ''),
                    'source': 'pexels'
                }
                videos.append(video_data)
                
            return videos
            
        except Exception as e:
            logger.error(f"Error searching Pexels videos: {e}")
            return []
    
    def get_curated_environmental_videos(self, limit: int = 20) -> List[Dict]:
        """Get curated environmental videos from Pexels"""
        if not self.api_key:
            return []
            
        try:
            url = f"{self.video_url}/popular"
            headers = {
                'Authorization': self.api_key
            }
            params = {
                'per_page': limit
            }
            
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            videos = []
            
            # Filter for environmental content
            environmental_keywords = ['nature', 'park', 'street', 'city', 'forest', 'beach', 'urban', 'outdoor']
            
            for video in data.get('videos', []):
                video_files = video.get('video_files', [])
                if not video_files:
                    continue
                
                # Check if video seems environmental (basic filtering)
                tags = video.get('tags', [])
                is_environmental = any(keyword in ' '.join(tags).lower() for keyword in environmental_keywords)
                
                if is_environmental or len(videos) < limit // 2:  # Include some even if not perfectly matched
                    hd_video = next((vf for vf in video_files if vf.get('quality') == 'hd'), video_files[0])
                    
                    video_data = {
                        'id': video.get('id'),
                        'title': f"Environmental footage by {video.get('user', {}).get('name', 'Unknown')}",
                        'description': f"Duration: {video.get('duration', 0)}s",
                        'preview_url': video.get('image'),
                        'video_url': hd_video.get('link'),
                        'duration': video.get('duration', 0),
                        'width': video.get('width', 0),
                        'height': video.get('height', 0),
                        'photographer': video.get('user', {}).get('name', 'Unknown'),
                        'photographer_url': video.get('user', {}).get('url', ''),
                        'source': 'pexels',
                        'tags': tags
                    }
                    videos.append(video_data)
                    
                if len(videos) >= limit:
                    break
                    
            return videos
            
        except Exception as e:
            logger.error(f"Error fetching curated Pexels videos: {e}")
            return []
    
    def get_environmental_categories(self) -> List[Dict]:
        """Get predefined environmental video categories"""
        return [
            {
                'name': 'Urban Streets',
                'query': 'city street urban walking',
                'description': 'Bustling city life and street scenes'
            },
            {
                'name': 'Nature Parks',
                'query': 'park nature trees walking',
                'description': 'Peaceful parks and natural settings'
            },
            {
                'name': 'Beaches & Water',
                'query': 'beach ocean water waves',
                'description': 'Coastal and water environments'
            },
            {
                'name': 'Forests & Trees',
                'query': 'forest trees woodland hiking',
                'description': 'Dense forests and wooded areas'
            },
            {
                'name': 'Public Spaces',
                'query': 'plaza square public people',
                'description': 'Town squares and gathering places'
            },
            {
                'name': 'Suburban Areas',
                'query': 'suburban neighborhood residential',
                'description': 'Quiet residential neighborhoods'
            }
        ]

# Global instance
pexels_service = PexelsService()

async def get_environmental_inspiration(category: str = None, limit: int = 20) -> List[Dict]:
    """Get environmental footage inspiration for videographers"""
    if category:
        # Search specific category
        categories = pexels_service.get_environmental_categories()
        category_data = next((c for c in categories if c['name'].lower() == category.lower()), None)
        if category_data:
            return pexels_service.search_environmental_videos(category_data['query'], limit)
    
    # Return curated mix
    return pexels_service.get_curated_environmental_videos(limit)