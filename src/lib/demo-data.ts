/** Demo data shown when backend is unavailable. All content is clearly labeled as preview data. */

export const DEMO_PREFIX = '[Preview] ';

export const DEMO_VIDEOS = [
  { id: 'demo-1', title: DEMO_PREFIX + 'Soccer Match Highlight', category: 'sports', description: 'A sample sports clip for preview. Replace with your own video.', duration: 12, view_count: 142, collaboration_count: 3, thumbnail_url: '', file_path: '', user_id: '', created_at: new Date().toISOString() },
  { id: 'demo-2', title: DEMO_PREFIX + 'Goal Celebration Sequence', category: 'sports', description: 'Example celebration footage for testing AR overlays.', duration: 8, view_count: 89, collaboration_count: 5, thumbnail_url: '', file_path: '', user_id: '', created_at: new Date().toISOString() },
  { id: 'demo-3', title: DEMO_PREFIX + 'Award Ceremony Clip', category: 'sports', description: 'Sample trophy presentation footage.', duration: 15, view_count: 56, collaboration_count: 2, thumbnail_url: '', file_path: '', user_id: '', created_at: new Date().toISOString() },
  { id: 'demo-4', title: DEMO_PREFIX + 'Athlete Interview', category: 'sports', description: 'Example post-match interview for overlay placement testing.', duration: 20, view_count: 34, collaboration_count: 1, thumbnail_url: '', file_path: '', user_id: '', created_at: new Date().toISOString() },
  { id: 'demo-5', title: DEMO_PREFIX + 'Stadium Atmosphere', category: 'culture', description: 'Sample crowd and stadium footage.', duration: 18, view_count: 67, collaboration_count: 0, thumbnail_url: '', file_path: '', user_id: '', created_at: new Date().toISOString() },
]

export const DEMO_PROFILE = {
  id: 'demo-profile',
  user_id: 'demo-user',
  username: 'demo_user',
  user_type: 'videographer' as const,
  avatar_url: '',
  bio: 'Preview profile — connect a wallet to create your real profile.',
  earnings_total: 0,
  is_verified: false,
  created_at: new Date().toISOString(),
  last_updated: new Date().toISOString(),
  portfolio_data: {},
}

export const DEMO_CREATORS = [
  { id: 'creator-1', username: 'demo_artist_1', user_type: 'artist', avatar_url: '', bio: 'Preview artist profile. Real profiles appear when users sign up.', earnings_total: 0, is_verified: false },
  { id: 'creator-2', username: 'demo_editor_1', user_type: 'videographer', avatar_url: '', bio: 'Preview videographer profile.', earnings_total: 0, is_verified: false },
  { id: 'creator-3', username: 'demo_both_1', user_type: 'both', avatar_url: '', bio: 'Preview creator profile (artist + videographer).', earnings_total: 0, is_verified: false },
]

export const DEMO_COLLABS = [
  { id: 'collab-1', title: DEMO_PREFIX + 'Sample Collab — AR Overlay Test', description: 'Preview collaboration. Real collaborations are created by users.', thumbnail_url: '', category: 'sports', view_count: 12, duration: 10, creator_name: 'demo_user', creator_avatar: '', creator_type: 'videographer', active_collabs: 0, created_at: new Date().toISOString() },
  { id: 'collab-2', title: DEMO_PREFIX + 'Sample Collab — Video Edit', description: 'Another preview collaboration.', thumbnail_url: '', category: 'sports', view_count: 8, duration: 15, creator_name: 'demo_artist_1', creator_avatar: '', creator_type: 'artist', active_collabs: 0, created_at: new Date().toISOString() },
]

export const DEMO_ICONIC_MOMENTS = [
  { id: 'iconic-1', xlayer_token_id: 1001, xlayer_tx_hash: '0x' + 'a'.repeat(64), xlayer_creator_address: '0x1234', title: DEMO_PREFIX + 'Sample Iconic Moment', overlay_ids: 'flag-halos,trophy-confetti', day: 1, rank: 1, flow_nft_id: 5001, flow_tx_hash: 'flow-' + 'b'.repeat(64), flow_minted_at: new Date().toISOString(), promoted_by: 'auto-scheduler', status: 'minted', created_at: new Date().toISOString() },
  { id: 'iconic-2', xlayer_token_id: 1002, xlayer_tx_hash: '0x' + 'c'.repeat(64), xlayer_creator_address: '0x5678', title: DEMO_PREFIX + 'Another Sample Moment', overlay_ids: 'stadium-sparkles', day: 1, rank: 2, flow_nft_id: 5002, flow_tx_hash: 'flow-' + 'd'.repeat(64), flow_minted_at: new Date().toISOString(), promoted_by: 'auto-scheduler', status: 'minted', created_at: new Date().toISOString() },
]

export const DEMO_LEADERBOARD_ENTRIES = [
  { rank: 1, title: DEMO_PREFIX + 'Sample Remix 1', creator: '@demo_user_1', votes: 100, reward: '$30 USDT (example)', color: 'text-yellow-400', tokenId: 1001, txHash: '0x' + 'a'.repeat(64) },
  { rank: 2, title: DEMO_PREFIX + 'Sample Remix 2', creator: '@demo_user_2', votes: 80, reward: '$20 USDT (example)', color: 'text-gray-300', tokenId: 1002, txHash: '0x' + 'b'.repeat(64) },
  { rank: 3, title: DEMO_PREFIX + 'Sample Remix 3', creator: '@demo_user_3', votes: 60, reward: '$12 USDT (example)', color: 'text-amber-600', tokenId: 1003, txHash: '0x' + 'c'.repeat(64) },
  { rank: 4, title: DEMO_PREFIX + 'Sample Remix 4', creator: '@demo_user_4', votes: 40, reward: '$8 USDT (example)', color: 'text-gray-400', tokenId: 1004, txHash: '0x' + 'd'.repeat(64) },
  { rank: 5, title: DEMO_PREFIX + 'Sample Remix 5', creator: '@demo_user_5', votes: 20, reward: '$7 USDT (example)', color: 'text-gray-400', tokenId: 1005, txHash: '0x' + 'e'.repeat(64) },
]
