# MagicLens — Growth Intel & Research Playbook

Data-driven strategy notes powered by [Monid](https://monid.ai) (`monid` CLI — see
`~/.config/devin/skills/monid/SKILL.md`). Monid runs cost real but tiny money
(our test calls were $0.001); keep `maxItems`/`count` small and one query per call.

## Market validation — TikTok sports-edit culture (Nov 2026)

Endpoint: `tikhub /api/v1/tiktok/app/v3/fetch_video_search_result` ($0.001/call,
~5s). Results live at `search_item_list[].aweme_info` (153 fields/video).

**Top "football edit" videos, last 30 days, US region, sorted by likes:**

| Plays | Likes | Shares | Content | Creator |
|-------|-------|--------|---------|---------|
| 31.5M | 1.9M | 52K | Cristiano Ronaldo 2008-era edit | @zorxy7.aep |
| 16.2M | 1.6M | 460K | Lamine Yamal edit, slowed track | @scrollball |
| 8.4M | 1.5M | 105K | Mbappé goal edit | @hugoxnjr_edit7 |
| 7.4M | 1.2M | 35K | Mbappé skills edit | @stars_njr |
| 6.4M | 978K | 41K | Cherki skills edit | @stars_njr |

**What this proves:**

1. **The wedge is validated.** Fan-made remixes of sports moments are a massive,
   current content category — tens of millions of plays per video — produced today
   with generic tooling (CapCut velocity templates + slowed music). No dedicated
   sports-remix product exists.
2. **AR demand exists but is underserved.** "AR filter sports" hits are CapCut
   template tutorials (2M plays) and generic Effect House effects. Pose-aware
   overlays on real match moments are a genuinely differentiated format.
3. **Fans reward star players, nostalgia, celebrations** — Ronaldo, Mbappé, Yamal,
   Messi; "2008", "The End 💔"; "best celly" — not generic match footage. Clip
   packs and featured remixes should mirror this.
4. **Sound drives edits.** Every top video rides a slowed/trending track. Audio
   is a remix dimension worth considering.

## Strategic play: creator seeding loop

Edit creators (typically 50K–500K followers, mid-tier) are the exact recruit
profile for remix battles: they already make this content and compete naturally.

```
recruit edit creators → remix with MagicLens → 9:16 share-card back to TikTok → signups
```

The 9:16 share-card export + Post to X already exists (`IconicMomentFocus`).
TikTok is the awareness channel; MagicLens is the creation layer.

## Monid endpoint map for MagicLens

Legend: prices as of Nov 2026. `health` was `stable/healthy` unless noted.

### TikTok (primary awareness channel)

| Use | Endpoint | Price |
|-----|----------|-------|
| Video search (tested) | `tikhub /api/v1/tiktok/app/v3/fetch_video_search_result` | $0.001/call |
| Creator's video list | `anyapi /tiktok.profile_videos` | $0.0006–0.0032 |
| Hashtag videos | `anyapi /tiktok.hashtag_videos` | $0.00033–0.0032 |
| Video comments (sentiment) | `anyapi /tiktok.video_comments` | $0.0006–0.0032 |
| Videos using a sound | `litescrape /tiktok/song-videos` or `anyapi /tiktok.song_videos` | $0.00015–0.0032 |
| Sound stats | `litescrape /tiktok/song` | $0.00015/call |
| Trending feed | `litescrape /tiktok/trending-feed` | $0.00015/call |
| Trending hashtags (by country) | `anyapi /tiktok.trending_hashtags` | $0.00055–0.0012 |
| Creator profile + milestones | `tikhub /api/v1/tiktok/analytics/fetch_creator_info_and_milestones` | $0.001/call |
| Full profile + post history | `apify /apidojo/tiktok-profile-scraper` | $0.0003/result |
| Live room status (match watching) | `litescrape /tiktok/live` | $0.00015/call |

### X / Twitter (our existing share channel)

| Use | Endpoint | Price |
|-----|----------|-------|
| Advanced tweet search | `anyapi /twitter.search` | $0.0001–0.0006 |
| User profile + counts | `twitterdata.io /users` | $0.00025/call |
| User's tweets | `twitterdata.io /users/tweets` | $0.00025/call |
| Search accounts | `anyapi /twitter.search_users` | $0.0001–0.0007 |

### Instagram Reels (secondary channel)

| Use | Endpoint | Price |
|-----|----------|-------|
| Reels keyword search | `anyapi /instagram.reels_search` | $0.00188–0.0024 |
| Trending reels | `anyapi /instagram.trending_reels` | $0.0012 |
| Account's reels | `anyapi /instagram.user_reels` | $0.0008–0.0032 |
| Profile metadata | `apify /apify/instagram-profile-scraper` | $0.00081/result |

### Communities & long-form

| Use | Endpoint | Price |
|-----|----------|-------|
| Subreddit posts (r/soccer, r/nba edits) | `litescrape /reddit/subreddit-posts` | $0.00015/call |
| Post comments | `anyapi /reddit.post_comments` | $0.00058–0.0012 |
| YouTube channel videos | `anyapi /youtube.channel_videos` | $0.0008–0.0032 |
| YouTube comments | `mrscraper /youtube/comments` | $0.01/call |

### Trends, news, competitors

| Use | Endpoint | Price |
|-----|----------|-------|
| Google Trends interest | `anyapi /google.trends` (up to 5 terms) | $0.002–0.016 |
| Currently trending searches | `litescrape /google/trends` | $0.00015/call |
| App Store reviews (CapCut, Top Shot) | `litescrape /app-store/reviews` | $0.00015/call |
| News search | `context.dev /news/search` or `search1api /promo/news` | $0.0005–0.002 |
| Any URL → clean markdown | `context.dev /web/scrape/markdown` | $0.002 |
| File delivery to endpoints needing URLs | `sfs` provider (`/put`, `/cat`) | free (1GB) |

## Repeatable playbooks

**Weekly trend check** (~$0.01): `fetch_video_search_result` for "football edit"
+ "nba edit" (sort_type=1, publish_time=7) → compare play counts week over week
→ steer pack priorities toward whatever's spiking.

**Creator seed list** (~$0.05): search sports-edit keywords → collect
`author.unique_id` + engagement → `profile_videos` on top candidates → rank by
median plays, not follower count → outreach list.

**Launch-day listening** (~$0.02): `anyapi /twitter.search` for "magiclens"
+ "AR remix" hourly on launch/feature days; `tiktok.search_keyword` for
watermarked share-cards appearing organically.

**Competitor watch** (~$0.01/mo): `app-store/reviews` on CapCut + Top Shot for
complaint mining (what fans wish existed); `google.trends` on "sports edit" vs
"fan token" for narrative timing.
