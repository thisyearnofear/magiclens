/** Demo data for graceful fallback when the backend is unavailable. */

export const DEMO_VIDEOS = [
  { id: 'demo-1', title: 'Argentina vs France — Final Goal', category: 'sports', description: 'Messi lifts the World Cup. The defining moment of 2026.', duration: 12, view_count: 2847, collaboration_count: 3, thumbnail_url: '', file_path: '', user_id: '', created_at: new Date().toISOString() },
  { id: 'demo-2', title: 'Mbappé Hat-trick Celebration', category: 'sports', description: 'Electric atmosphere as France storms back.', duration: 8, view_count: 2102, collaboration_count: 5, thumbnail_url: '', file_path: '', user_id: '', created_at: new Date().toISOString() },
  { id: 'demo-3', title: 'Trophy Lift Ceremony', category: 'sports', description: 'The captain raises the trophy under confetti rain.', duration: 15, view_count: 1893, collaboration_count: 2, thumbnail_url: '', file_path: '', user_id: '', created_at: new Date().toISOString() },
  { id: 'demo-4', title: 'Goalkeeper Save Compilation', category: 'sports', description: 'World-class saves from every group stage match.', duration: 20, view_count: 1456, collaboration_count: 4, thumbnail_url: '', file_path: '', user_id: '', created_at: new Date().toISOString() },
  { id: 'demo-5', title: 'Free Kick Masterclass', category: 'sports', description: 'Every free kick goal from the tournament.', duration: 18, view_count: 1234, collaboration_count: 1, thumbnail_url: '', file_path: '', user_id: '', created_at: new Date().toISOString() },
  { id: 'demo-6', title: 'Fan Celebration in Streets', category: 'culture', description: 'Fans around the world celebrate the final whistle.', duration: 10, view_count: 987, collaboration_count: 0, thumbnail_url: '', file_path: '', user_id: '', created_at: new Date().toISOString() },
]

export const DEMO_PROFILE = {
  id: 'demo-profile',
  user_id: 'demo-user',
  username: 'fan42',
  user_type: 'videographer',
  avatar_url: '',
  bio: 'World Cup 2026 remix artist. Capturing iconic moments with AR overlays.',
  earnings_total: 47.50,
  is_verified: true,
  created_at: new Date().toISOString(),
  last_updated: new Date().toISOString(),
  portfolio_data: {},
}

export const DEMO_CREATORS = [
  { id: 'creator-1', username: 'arlab', user_type: 'artist', avatar_url: '', bio: 'AR overlay designer. Specializing in sports broadcast style.', earnings_total: 230.00, is_verified: true },
  { id: 'creator-2', username: 'edit_pro', user_type: 'videographer', avatar_url: '', bio: 'Professional sports editor. 10 years in broadcast.', earnings_total: 180.50, is_verified: true },
  { id: 'creator-3', username: 'goal_den', user_type: 'both', avatar_url: '', bio: 'Videographer + AR artist. Building the future of fan content.', earnings_total: 95.00, is_verified: false },
  { id: 'creator-4', username: 'kick_master', user_type: 'videographer', avatar_url: '', bio: 'Slow-motion specialist. Every kick matters.', earnings_total: 120.00, is_verified: false },
  { id: 'creator-5', username: 'showtime', user_type: 'artist', avatar_url: '', bio: 'Broadcast graphics designer. Making moments pop.', earnings_total: 310.00, is_verified: true },
  { id: 'creator-6', username: 'ref_review', user_type: 'both', avatar_url: '', bio: 'Tactical analyst + AR overlay creator.', earnings_total: 55.00, is_verified: false },
]

export const DEMO_COLLABS = [
  { id: 'collab-1', title: 'Argentina Goal Remix', description: 'Looking for an AR artist to add flag halos and confetti to the final goal clip.', thumbnail_url: '', category: 'sports', view_count: 456, duration: 12, creator_name: 'fan42', creator_avatar: '', creator_type: 'videographer', active_collabs: 1, created_at: new Date().toISOString() },
  { id: 'collab-2', title: 'Mbappé Hat-trick Edit', description: 'Need a videographer to cut a highlight reel for AR overlay placement.', thumbnail_url: '', category: 'sports', view_count: 312, duration: 8, creator_name: 'arlab', creator_avatar: '', creator_type: 'artist', active_collabs: 2, created_at: new Date().toISOString() },
  { id: 'collab-3', title: 'Trophy Lift — Cinematic Cut', description: 'Collaborative project to create the definitive trophy moment remix.', thumbnail_url: '', category: 'sports', view_count: 201, duration: 15, creator_name: 'goal_den', creator_avatar: '', creator_type: 'both', active_collabs: 0, created_at: new Date().toISOString() },
]

export const DEMO_ICONIC_MOMENTS = [
  { id: 'iconic-1', xlayer_token_id: 1001, xlayer_tx_hash: '0x' + 'a'.repeat(64), xlayer_creator_address: '0x1234', title: 'Argentina Goal Messi', overlay_ids: 'flag-halos,trophy-confetti', day: 1, rank: 1, flow_nft_id: 5001, flow_tx_hash: 'flow-' + 'b'.repeat(64), flow_minted_at: new Date().toISOString(), promoted_by: 'auto-scheduler', status: 'minted', created_at: new Date().toISOString() },
  { id: 'iconic-2', xlayer_token_id: 1002, xlayer_tx_hash: '0x' + 'c'.repeat(64), xlayer_creator_address: '0x5678', title: 'Mbappé Hat-trick Celebration', overlay_ids: 'stadium-sparkles,goal-lower-third', day: 1, rank: 2, flow_nft_id: 5002, flow_tx_hash: 'flow-' + 'd'.repeat(64), flow_minted_at: new Date().toISOString(), promoted_by: 'auto-scheduler', status: 'minted', created_at: new Date().toISOString() },
  { id: 'iconic-3', xlayer_token_id: 1003, xlayer_tx_hash: '0x' + 'e'.repeat(64), xlayer_creator_address: '0x9012', title: 'Trophy Lift Celebration', overlay_ids: 'trophy-confetti,commentary-bubble', day: 1, rank: 3, flow_nft_id: null, flow_tx_hash: null, flow_minted_at: null, promoted_by: 'auto-scheduler', status: 'pending', created_at: new Date().toISOString() },
]
