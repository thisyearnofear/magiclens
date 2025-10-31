import os
import requests
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class GifService:
    def __init__(self):
        self.tenor_api_key = os.getenv('TENOR_API_KEY')
        self.giphy_api_key = os.getenv('GIPHY_API_KEY')
        self.pexels_api_key = os.getenv('PEXELS_API_KEY')
        self.tenor_client_key = os.getenv('TENOR_CLIENT_KEY', 'augmented_reality_app')
        self.tenor_base_url = "https://tenor.googleapis.com/v2"
        self.giphy_base_url = "https://api.giphy.com/v1"
        self.pexels_base_url = "https://api.pexels.com/v1"
        self.pexels_video_url = "https://api.pexels.com/videos"
        
    def search_tenor_gifs(self, query: str, limit: int = 20) -> List[Dict]:
        """Search for GIFs using Tenor API"""
        if not self.tenor_api_key:
            logger.warning("Tenor API key not configured")
            return []
            
        try:
            url = f"{self.tenor_base_url}/search"
            params = {
                'q': query,
                'key': self.tenor_api_key,
                'client_key': self.tenor_client_key,
                'limit': limit,
                'media_filter': 'gif',
                'contentfilter': 'high'  # Family-friendly content
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            gifs = []
            
            for result in data.get('results', []):
                media_formats = result.get('media_formats', {})
                gif_data = {
                    'id': result.get('id'),
                    'title': result.get('title', ''),
                    'preview_url': media_formats.get('tinygif', {}).get('url', ''),
                    'full_url': media_formats.get('gif', {}).get('url', ''),
                    'source': 'tenor',
                    'tags': result.get('tags', []),
                    'content_description': result.get('content_description', '')
                }
                gifs.append(gif_data)
                
            return gifs
            
        except Exception as e:
            logger.error(f"Error searching Tenor GIFs: {e}")
            return []
    
    def get_tenor_categories(self) -> List[Dict]:
        """Get trending categories from Tenor"""
        if not self.tenor_api_key:
            return []
            
        try:
            url = f"{self.tenor_base_url}/categories"
            params = {
                'key': self.tenor_api_key,
                'client_key': self.tenor_client_key,
                'type': 'trending'
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            categories = []
            
            for tag in data.get('tags', []):
                categories.append({
                    'name': tag.get('name'),
                    'path': tag.get('path'),
                    'image': tag.get('image')
                })
                
            return categories
            
        except Exception as e:
            logger.error(f"Error fetching Tenor categories: {e}")
            return []
    
    def get_tenor_featured(self, limit: int = 20) -> List[Dict]:
        """Get featured GIFs from Tenor"""
        if not self.tenor_api_key:
            return []
            
        try:
            url = f"{self.tenor_base_url}/featured"
            params = {
                'key': self.tenor_api_key,
                'client_key': self.tenor_client_key,
                'limit': limit,
                'contentfilter': 'high'
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            gifs = []
            
            for result in data.get('results', []):
                media_formats = result.get('media_formats', {})
                gif_data = {
                    'id': result.get('id'),
                    'title': result.get('title', ''),
                    'preview_url': media_formats.get('tinygif', {}).get('url', ''),
                    'full_url': media_formats.get('gif', {}).get('url', ''),
                    'source': 'tenor',
                    'tags': result.get('tags', [])
                }
                gifs.append(gif_data)
                
            return gifs
            
        except Exception as e:
            logger.error(f"Error fetching Tenor featured GIFs: {e}")
            return []
    
    def register_tenor_share(self, gif_id: str, search_term: str = "") -> bool:
        """Register a share event with Tenor to improve recommendations"""
        if not self.tenor_api_key:
            return False
            
        try:
            url = f"{self.tenor_base_url}/registershare"
            params = {
                'id': gif_id,
                'key': self.tenor_api_key,
                'client_key': self.tenor_client_key,
                'q': search_term
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            return True
            
        except Exception as e:
            logger.error(f"Error registering Tenor share: {e}")
            return False
    
    def search_giphy_gifs(self, query: str, limit: int = 20) -> List[Dict]:
        """Search for GIFs using Giphy API"""
        if not self.giphy_api_key:
            logger.warning("Giphy API key not configured")
            return []
            
        try:
            url = f"{self.giphy_base_url}/gifs/search"
            params = {
                'q': query,
                'api_key': self.giphy_api_key,
                'limit': limit,
                'rating': 'g'
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            gifs = []
            
            for result in data.get('data', []):
                images = result.get('images', {})
                gif_data = {
                    'id': result.get('id'),
                    'title': result.get('title', ''),
                    'preview_url': images.get('fixed_height_small', {}).get('url', ''),
                    'full_url': images.get('original', {}).get('url', ''),
                    'source': 'giphy'
                }
                gifs.append(gif_data)
                
            return gifs
            
        except Exception as e:
            logger.error(f"Error searching Giphy GIFs: {e}")
            return []
    
    def search_gifs(self, query: str, limit: int = 20, source: str = 'all') -> List[Dict]:
        """Search for GIFs from multiple sources"""
        all_gifs = []
        
        if source == 'all' or source == 'tenor':
            # Prioritize Tenor since we have better integration
            tenor_limit = limit if source == 'tenor' else max(limit // 2, limit - 10)
            tenor_gifs = self.search_tenor_gifs(query, tenor_limit)
            all_gifs.extend(tenor_gifs)
        
        if source == 'all' or source == 'giphy':
            remaining_limit = limit - len(all_gifs)
            if remaining_limit > 0:
                giphy_gifs = self.search_giphy_gifs(query, remaining_limit)
                all_gifs.extend(giphy_gifs)
        
        return all_gifs[:limit]

# Global instance for easy import
gif_service = GifService()

async def search_overlay_gifs(query: str, category: str = None, limit: int = 20) -> List[Dict]:
    """Search for overlay GIFs with optional category filtering"""
    # Enhance query with category if provided
    search_query = f"{category} {query}" if category else query
    
    # Use the global service instance
    return gif_service.search_gifs(search_query, limit, 'tenor')

async def get_smart_gif_overlays(video_analysis: Dict) -> List[Dict]:
    """Get AI-curated GIF overlays based on video analysis"""
    # Extract key information from video analysis
    scene_type = video_analysis.get('scene_type', 'general')
    mood = video_analysis.get('mood', 'neutral')
    activity = video_analysis.get('primary_activity', 'general')
    tags = video_analysis.get('tags', [])
    
    # Build smart search queries based on analysis
    search_queries = []
    
    # Primary query based on activity and mood
    if activity and mood:
        search_queries.append(f"{activity} {mood}")
    
    # Secondary queries based on scene type
    if scene_type:
        search_queries.append(f"{scene_type} overlay")
    
    # Tag-based queries
    for tag in tags[:2]:  # Use top 2 tags
        search_queries.append(tag)
    
    # Fallback queries
    if not search_queries:
        search_queries = ['celebration', 'sparkles', 'effects']
    
    # Search for GIFs using multiple queries
    all_results = []
    results_per_query = max(1, 15 // len(search_queries))
    
    for query in search_queries:
        results = gif_service.search_gifs(query, results_per_query, 'tenor')
        all_results.extend(results)
    
    # Remove duplicates and limit results
    seen_ids = set()
    unique_results = []
    for result in all_results:
        if result['id'] not in seen_ids:
            seen_ids.add(result['id'])
            unique_results.append(result)
            if len(unique_results) >= 20:
                break
    
    return unique_results