from typing import Dict, List, Optional, Tuple
from uuid import UUID
from datetime import datetime, timedelta
from core.user import User
from core.access import authenticated
from core.videos import Video
from core.artist_assets import ArtistAsset
from core.collaborations import Collaboration
from core.ai_analysis_service import get_smart_overlay_recommendations, analyze_video_for_overlays
import json

class SmartRecommendationEngine:
    """Intelligent overlay recommendation system with learning capabilities."""
    
    def __init__(self):
        self.recommendation_cache = {}  # In production: Redis
        self.learning_data = {}         # In production: Analytics DB
    
    def get_personalized_recommendations(self, user: User, video_id: UUID, limit: int = 5) -> List[Dict]:
        """Get personalized overlay recommendations based on user history and AI analysis."""
        
        # Get base AI recommendations
        ai_recommendations = get_smart_overlay_recommendations(user, video_id, limit * 2)
        
        # Get user preferences and history
        user_profile = self._build_user_profile(user)
        
        # Apply personalization scoring
        personalized_recs = []
        for rec in ai_recommendations:
            # Calculate personalized score
            rec['personalization_score'] = self._calculate_personalization_score(
                rec, user_profile
            )
            
            # Enhance reasoning with personal context
            rec['reasoning'] = self._enhance_reasoning_with_personalization(
                rec['reasoning'], rec['personalization_score'], user_profile
            )
            
            personalized_recs.append(rec)
        
        # Sort by combined AI confidence + personalization
        personalized_recs.sort(
            key=lambda x: (x['confidence_score'] * 0.6 + x['personalization_score'] * 0.4),
            reverse=True
        )
        
        return personalized_recs[:limit]
    
    def get_trending_recommendations(self, user: User, video_id: UUID, limit: int = 3) -> List[Dict]:
        """Get trending overlay recommendations based on recent popular combinations."""
        
        # Get video analysis for context
        analysis = analyze_video_for_overlays(user, video_id)
        video_tags = analysis.get('tags', [])
        
        # Find trending assets from recent successful collaborations
        trending_assets = self._get_trending_assets(video_tags, days=7)
        
        recommendations = []
        for asset_data in trending_assets[:limit]:
            asset = ArtistAsset(**asset_data)
            
            # Generate placement for trending asset
            placement = self._generate_trending_placement(asset, analysis)
            
            recommendations.append({
                'asset': asset.__dict__,
                'artist_name': asset_data.get('artist_name', 'Unknown'),
                'placement': placement,
                'confidence_score': 0.8,  # High confidence for trending
                'personalization_score': 0.5,
                'reasoning': f"Trending now - used in {asset_data.get('usage_count', 0)} recent videos",
                'trend_info': {
                    'usage_count': asset_data.get('usage_count', 0),
                    'success_rate': asset_data.get('success_rate', 0.75),
                    'trending_since': asset_data.get('trending_since')
                }
            })
        
        return recommendations
    
    def get_style_similar_recommendations(self, user: User, video_id: UUID, reference_asset_id: UUID, limit: int = 4) -> List[Dict]:
        """Get recommendations similar to a specific asset style."""
        
        # Get reference asset
        reference_assets = ArtistAsset.sql(
            "SELECT * FROM artist_assets WHERE id = %(asset_id)s",
            {"asset_id": reference_asset_id}
        )
        
        if not reference_assets:
            return []
        
        reference_asset = ArtistAsset(**reference_assets[0])
        
        # Get video analysis
        analysis = analyze_video_for_overlays(user, video_id)
        
        # Find style-similar assets
        similar_assets = self._find_style_similar_assets(
            reference_asset, analysis, limit * 2
        )
        
        recommendations = []
        for i, asset_data in enumerate(similar_assets[:limit]):
            asset = ArtistAsset(**asset_data)
            
            # Generate smart placement
            placement = self._generate_style_consistent_placement(
                asset, reference_asset, analysis, i
            )
            
            similarity_score = asset_data.get('similarity_score', 0.7)
            
            recommendations.append({
                'asset': asset.__dict__,
                'artist_name': asset_data.get('artist_name', 'Unknown'),
                'placement': placement,
                'confidence_score': similarity_score,
                'personalization_score': 0.6,
                'reasoning': f"Similar style to your selected overlay - {similarity_score:.0%} match",
                'similarity_info': {
                    'reference_asset_id': str(reference_asset_id),
                    'similarity_score': similarity_score,
                    'matching_attributes': asset_data.get('matching_attributes', [])
                }
            })
        
        return recommendations
    
    def record_recommendation_interaction(self, user: User, video_id: UUID, asset_id: UUID, action: str, metadata: Optional[Dict] = None):
        """Record user interaction with recommendations for learning."""
        
        interaction = {
            'user_id': str(user.id),
            'video_id': str(video_id),
            'asset_id': str(asset_id),
            'action': action,  # 'view', 'apply', 'dismiss', 'modify'
            'timestamp': datetime.now().isoformat(),
            'metadata': metadata or {}
        }
        
        # Store interaction (in production: analytics database)
        interaction_key = f"interaction_{user.id}_{datetime.now().strftime('%Y%m%d')}"
        if interaction_key not in self.learning_data:
            self.learning_data[interaction_key] = []
        
        self.learning_data[interaction_key].append(interaction)
        
        # Update user profile learning
        self._update_user_learning_profile(user, interaction)
    
    def _build_user_profile(self, user: User) -> Dict:
        """Build user preference profile from collaboration history."""
        
        # Get user's collaboration history
        collaborations_data = Collaboration.sql(
            """
            SELECT c.*, v.category as video_category, v.tags as video_tags
            FROM collaborations c 
            JOIN videos v ON c.video_id = v.id
            WHERE c.artist_id = %(user_id)s OR v.uploader_id = %(user_id)s
            ORDER BY c.created_at DESC
            LIMIT 20
            """,
            {"user_id": user.id}
        )
        
        # Analyze patterns
        preferred_categories = {}
        preferred_tags = {}
        collaboration_patterns = []
        
        for collab in collaborations_data:
            # Track category preferences
            category = collab.get('video_category', 'general')
            preferred_categories[category] = preferred_categories.get(category, 0) + 1
            
            # Track tag preferences
            tags = collab.get('video_tags', '')
            if tags:
                for tag in tags.split(','):
                    tag = tag.strip().lower()
                    preferred_tags[tag] = preferred_tags.get(tag, 0) + 1
            
            # Track collaboration success
            collaboration_patterns.append({
                'status': collab.get('status'),
                'category': category,
                'created_at': collab.get('created_at')
            })
        
        # Calculate preferences
        top_categories = sorted(preferred_categories.items(), key=lambda x: x[1], reverse=True)[:3]
        top_tags = sorted(preferred_tags.items(), key=lambda x: x[1], reverse=True)[:5]
        
        success_rate = len([p for p in collaboration_patterns if p['status'] == 'approved']) / max(len(collaboration_patterns), 1)
        
        return {
            'user_id': str(user.id),
            'preferred_categories': [cat for cat, _ in top_categories],
            'preferred_tags': [tag for tag, _ in top_tags],
            'collaboration_success_rate': success_rate,
            'activity_level': len(collaboration_patterns),
            'recent_activity': collaboration_patterns[:5],
            'profile_strength': min(len(collaboration_patterns) / 10, 1.0)  # 0-1 based on experience
        }
    
    def _calculate_personalization_score(self, recommendation: Dict, user_profile: Dict) -> float:
        """Calculate how well a recommendation matches user preferences."""
        
        score = 0.0
        asset = recommendation.get('asset', {})
        asset_tags = asset.get('tags', '').lower().split(',') if asset.get('tags') else []
        
        # Category matching
        asset_category = asset.get('category', '')
        if asset_category in user_profile.get('preferred_categories', []):
            score += 0.3
        
        # Tag matching
        user_tags = user_profile.get('preferred_tags', [])
        tag_overlap = len(set(asset_tags) & set(user_tags))
        if user_tags:
            score += (tag_overlap / len(user_tags)) * 0.4
        
        # Success rate bonus for experienced users
        if user_profile.get('collaboration_success_rate', 0) > 0.7:
            score += 0.1
        
        # Activity level adjustment
        activity_level = user_profile.get('activity_level', 0)
        if activity_level > 5:  # Experienced user
            score += 0.1
        elif activity_level < 2:  # New user - boost popular items
            if recommendation.get('confidence_score', 0) > 0.7:
                score += 0.2
        
        # Profile strength weighting
        profile_strength = user_profile.get('profile_strength', 0.1)
        score *= profile_strength + 0.3  # Ensure minimum influence
        
        return min(round(score, 3), 1.0)
    
    def _enhance_reasoning_with_personalization(self, base_reasoning: str, personalization_score: float, user_profile: Dict) -> str:
        """Add personalized context to recommendation reasoning."""
        
        if personalization_score > 0.7:
            preferred_tags = user_profile.get('preferred_tags', [])[:2]
            if preferred_tags:
                return f"{base_reasoning} Perfect match for your preference for {' and '.join(preferred_tags)} content."
        
        elif personalization_score > 0.4:
            return f"{base_reasoning} Matches your video style preferences."
        
        elif user_profile.get('activity_level', 0) < 2:
            return f"{base_reasoning} Popular choice for new creators."
        
        return base_reasoning
    
    def _get_trending_assets(self, video_tags: List[str], days: int = 7) -> List[Dict]:
        """Get assets trending in recent collaborations."""
        
        since_date = datetime.now() - timedelta(days=days)
        
        # Find assets used in recent successful collaborations
        trending_data = ArtistAsset.sql(
            """
            SELECT 
                a.*,
                u.display_name as artist_name,
                COUNT(o.id) as usage_count,
                AVG(CASE WHEN c.status = 'approved' THEN 1.0 ELSE 0.0 END) as success_rate,
                MIN(c.created_at) as trending_since
            FROM artist_assets a
            JOIN users u ON a.uploader_id = u.id
            LEFT JOIN overlays o ON a.id = o.asset_id
            LEFT JOIN collaborations c ON o.collaboration_id = c.id
            WHERE 
                a.status = 'approved' AND
                c.created_at > %(since_date)s
            GROUP BY a.id, u.display_name
            HAVING usage_count >= 2
            ORDER BY usage_count DESC, success_rate DESC
            LIMIT 10
            """,
            {"since_date": since_date}
        )
        
        # Filter by relevance to video tags if available
        if video_tags:
            relevant_trending = []
            for asset_data in trending_data:
                asset_tags = asset_data.get('tags', '').lower()
                if any(tag.lower() in asset_tags for tag in video_tags[:3]):
                    relevant_trending.append(asset_data)
            
            return relevant_trending if relevant_trending else trending_data[:3]
        
        return trending_data
    
    def _find_style_similar_assets(self, reference_asset: ArtistAsset, analysis: Dict, limit: int) -> List[Dict]:
        """Find assets with similar style to reference asset."""
        
        reference_tags = set(reference_asset.tags.lower().split(',')) if reference_asset.tags else set()
        reference_category = reference_asset.category
        reference_type = reference_asset.asset_type
        
        # Get potential similar assets
        similar_assets_data = ArtistAsset.sql(
            """
            SELECT 
                a.*,
                u.display_name as artist_name
            FROM artist_assets a
            JOIN users u ON a.uploader_id = u.id
            WHERE 
                a.status = 'approved' AND
                a.id != %(reference_id)s AND
                (a.category = %(category)s OR a.asset_type = %(asset_type)s)
            ORDER BY a.created_at DESC
            LIMIT %(limit)s
            """,
            {
                "reference_id": reference_asset.id,
                "category": reference_category,
                "asset_type": reference_type,
                "limit": limit * 2
            }
        )
        
        # Calculate similarity scores
        scored_assets = []
        for asset_data in similar_assets_data:
            asset_tags = set(asset_data.get('tags', '').lower().split(',')) if asset_data.get('tags') else set()
            
            # Calculate similarity
            similarity_score = 0.0
            
            # Tag similarity (40%)
            if reference_tags and asset_tags:
                tag_overlap = len(reference_tags & asset_tags)
                tag_similarity = tag_overlap / len(reference_tags | asset_tags)
                similarity_score += tag_similarity * 0.4
            
            # Category match (30%)
            if asset_data.get('category') == reference_category:
                similarity_score += 0.3
            
            # Type match (20%)
            if asset_data.get('asset_type') == reference_type:
                similarity_score += 0.2
            
            # Artist match (10% bonus)
            if asset_data.get('uploader_id') == reference_asset.uploader_id:
                similarity_score += 0.1
            
            if similarity_score > 0.3:  # Minimum threshold
                asset_data['similarity_score'] = similarity_score
                asset_data['matching_attributes'] = self._identify_matching_attributes(
                    reference_asset, asset_data, reference_tags, asset_tags
                )
                scored_assets.append(asset_data)
        
        # Sort by similarity score
        scored_assets.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return scored_assets[:limit]
    
    def _identify_matching_attributes(self, reference_asset: ArtistAsset, asset_data: Dict, ref_tags: set, asset_tags: set) -> List[str]:
        """Identify what makes assets similar."""
        
        attributes = []
        
        if asset_data.get('category') == reference_asset.category:
            attributes.append(f"Same category ({reference_asset.category})")
        
        if asset_data.get('asset_type') == reference_asset.asset_type:
            attributes.append(f"Same format ({reference_asset.asset_type})")
        
        common_tags = ref_tags & asset_tags
        if common_tags:
            attributes.append(f"Shared themes: {', '.join(list(common_tags)[:2])}")
        
        if asset_data.get('uploader_id') == reference_asset.uploader_id:
            attributes.append("Same artist")
        
        return attributes
    
    def _generate_trending_placement(self, asset: ArtistAsset, analysis: Dict) -> Dict:
        """Generate placement for trending assets based on popular patterns."""
        
        # Use popular placement patterns for trending items
        duration = analysis.get('duration', 10)
        
        return {
            'position': {
                'x': 150,  # Popular position
                'y': 100,
                'scaleX': 0.8,
                'scaleY': 0.8,
                'angle': 0
            },
            'timing': {
                'startTime': duration * 0.2,  # Start after intro
                'endTime': duration * 0.8,    # End before outro
                'fadeIn': 0.5,
                'fadeOut': 0.5
            },
            'layerOrder': 1
        }
    
    def _generate_style_consistent_placement(self, asset: ArtistAsset, reference_asset: ArtistAsset, analysis: Dict, index: int) -> Dict:
        """Generate placement that's consistent with reference style."""
        
        duration = analysis.get('duration', 10)
        
        # Create complementary placement to reference
        positions = [
            {'x': 200, 'y': 150},
            {'x': 500, 'y': 200},
            {'x': 100, 'y': 300},
            {'x': 600, 'y': 100}
        ]
        
        position = positions[index % len(positions)]
        
        return {
            'position': {
                'x': position['x'],
                'y': position['y'],
                'scaleX': 0.7,
                'scaleY': 0.7,
                'angle': 0
            },
            'timing': {
                'startTime': duration * (0.1 + index * 0.2),
                'endTime': duration * (0.4 + index * 0.2),
                'fadeIn': 0.3,
                'fadeOut': 0.3
            },
            'layerOrder': index + 2  # Layer after reference
        }
    
    def _update_user_learning_profile(self, user: User, interaction: Dict):
        """Update user learning profile based on interactions."""
        
        # In production, this would update a learning model
        # For now, just log the interaction pattern
        learning_key = f"learning_{user.id}"
        
        if learning_key not in self.learning_data:
            self.learning_data[learning_key] = {
                'user_id': str(user.id),
                'preferences': {},
                'patterns': [],
                'updated_at': datetime.now().isoformat()
            }
        
        profile = self.learning_data[learning_key]
        
        # Update preferences based on positive interactions
        if interaction['action'] in ['apply', 'approve']:
            metadata = interaction.get('metadata', {})
            
            # Learn from asset preferences
            if 'asset_category' in metadata:
                category = metadata['asset_category']
                profile['preferences'][f'category_{category}'] = profile['preferences'].get(f'category_{category}', 0) + 1
            
            if 'asset_tags' in metadata:
                for tag in metadata['asset_tags']:
                    profile['preferences'][f'tag_{tag}'] = profile['preferences'].get(f'tag_{tag}', 0) + 1
        
        # Track patterns
        profile['patterns'].append({
            'action': interaction['action'],
            'timestamp': interaction['timestamp'],
            'context': interaction.get('metadata', {})
        })
        
        # Keep only recent patterns (last 50)
        profile['patterns'] = profile['patterns'][-50:]
        profile['updated_at'] = datetime.now().isoformat()

# Global recommendation engine instance
recommendation_engine = SmartRecommendationEngine()

# API Functions

@authenticated
def get_video_overlay_recommendations(user: User, video_id: UUID, recommendation_type: str = 'personalized', limit: int = 5) -> Dict:
    """Get overlay recommendations for a video with multiple recommendation strategies."""
    
    recommendations = {
        'video_id': str(video_id),
        'user_id': str(user.id),
        'generated_at': datetime.now().isoformat(),
        'recommendations': []
    }
    
    if recommendation_type == 'personalized':
        recommendations['recommendations'] = recommendation_engine.get_personalized_recommendations(
            user, video_id, limit
        )
        recommendations['type'] = 'AI + Personal Preferences'
        
    elif recommendation_type == 'trending':
        recommendations['recommendations'] = recommendation_engine.get_trending_recommendations(
            user, video_id, limit
        )
        recommendations['type'] = 'Trending Now'
        
    else:  # 'smart' or default
        recommendations['recommendations'] = get_smart_overlay_recommendations(
            user, video_id, limit
        )
        recommendations['type'] = 'AI Content Analysis'
    
    return recommendations

@authenticated
def get_similar_style_recommendations(user: User, video_id: UUID, reference_asset_id: UUID, limit: int = 4) -> Dict:
    """Get recommendations similar to a specific asset."""
    
    similar_recs = recommendation_engine.get_style_similar_recommendations(
        user, video_id, reference_asset_id, limit
    )
    
    return {
        'video_id': str(video_id),
        'reference_asset_id': str(reference_asset_id),
        'recommendations': similar_recs,
        'type': 'Style Similar',
        'generated_at': datetime.now().isoformat()
    }

@authenticated
def track_recommendation_interaction(user: User, video_id: UUID, asset_id: UUID, action: str, metadata: Optional[Dict] = None) -> bool:
    """Track user interaction with recommendations for learning."""
    
    recommendation_engine.record_recommendation_interaction(
        user, video_id, asset_id, action, metadata
    )
    
    return True