# MagicLens — 2-Minute Demo Video Storyboard

> **For the OKX X Cup submission (May 28 deadline).** Each scene maps to a live UI route. The video should be a screen recording with voiceover, no cuts between scenes that break flow.

## Scene 1: Hook (0:00–0:15)

| Element | Detail |
|---|---|
| **Visual** | Landing page at `/` with World Cup 2026 badge visible |
| **Voiceover** | "MagicLens is the AR remix layer for live sports. Every iconic moment becomes a mintable, remixable, ownable piece of fan culture. We launch with the 2026 FIFA World Cup." |
| **Interaction** | Hover over the "Connect Wallet" button, show that RainbowKit lists OKX Wallet first |
| **On-screen** | `OKX X Cup Hackathon — World Cup 2026` badge |

## Scene 2: Pick a Clip (0:15–0:30)

| Element | Detail |
|---|---|
| **Navigation** | Click "Connect Wallet & Mint" → authenticate → land on dashboard |
| **Route** | `/dashboard` → click "Create Remix" → `/remix` |
| **Visual** | ClipPicker shows 3 demo match moments: "Match-winning Goal", "Trophy Lift Ceremony", "Fan Celebration" |
| **Voiceover** | "Connect your wallet, pick a match moment from the World Cup, and get ready to remix. It takes about 10 seconds." |
| **Interaction** | Click on "Match-winning Goal" card |

## Scene 3: Add AR Overlays (0:30–0:50)

| Element | Detail |
|---|---|
| **Route** | `/remix` (step 2 of 4: ARWorkspace) |
| **Visual** | Full-screen editor with video placeholder + 4 World Cup overlay packs on the right sidebar |
| **Voiceover** | "Now the fun part. Drop pose-aware AR overlays — country flag halos, GOAL! lower-thirds, trophy confetti, commentary bubbles. These are curated World Cup packs on X Layer." |
| **Interaction** | Click "Country Flag Halos" then "GOAL! Lower-Third" — both turn "Selected" |
| **On-screen** | Badges appear on the video preview showing selected overlays |

## Scene 4: Preview the Remix (0:50–1:00)

| Element | Detail |
|---|---|
| **Route** | `/remix` (step 3 of 4: RemixPreview) |
| **Visual** | Full video preview with mock overlay elements visible (flag halo, GOAL! banner, score overlay) |
| **Voiceover** | "Preview your remix before minting. Everything is in-place, just how you designed it." |
| **On-screen** | Metadata card: "Match-winning Goal using Flag Halos, GOAL! Lower-Third" with X Layer badge |

## Scene 5: One-Click Mint (1:00–1:15)

| Element | Detail |
|---|---|
| **Interaction** | Click "Mint Remix on X Layer" |
| **Visual** | Wallet confirmation popup (RainbowKit modal) → approve → transaction processing |
| **Voiceover** | "One click and it's onchain. Your remix is an NFT on X Layer — zero gas cost during the hackathon." |
| **On-screen** | MintConfirmation shows: transaction hash, X Layer badge, "Minted!" green checkmark |

## Scene 6: Leaderboard (1:15–1:30)

| Element | Detail |
|---|---|
| **Navigation** | Click "View Leaderboard" |
| **Route** | `/leaderboard` |
| **Visual** | Top-10 table with prize pool banner ($100 USDT), ranked remixes with votes, Flow badges on top 3 |
| **Voiceover** | "Your remix lands on the daily leaderboard. Top 10 earn USDT rewards. Top 3 automatically become premium Iconic Moment NFTs on Flow — cross-chain by design." |
| **On-screen** | Highlight the #3 entry with Flow "Iconic" badge. Pan down to the Flow section in the leaderboard. |

## Scene 7: The Cross-Chain Payoff (1:30–1:45)

| Element | Detail |
|---|---|
| **Route** | Back to `/dashboard` |
| **Visual** | Dashboard showing both wallets connected (Flow + EVM). EventCard with stats |
| **Voiceover** | "This is the dual-chain story. X Layer handles the volume — thousands of fan remixes, low fees, USDT rewards. Flow handles the premium — Iconic Moment NFTs backed by the same tech as NBA Top Shot. One app, two chains, seamless UX." |
| **On-screen** | Pointer to EventCard: "8 Iconic Moments", pointer to blockchain section: "Top 3 → Flow" |

## Scene 8: What's Next (1:45–2:00)

| Element | Detail |
|---|---|
| **Visual** | Final slide — dark gradient background, text overlay: |
| **Text** | "Today: World Cup. Next: Wimbledon, NBA Finals, F1. The AR remix layer for every sport." |
| **Voiceover** | "Today, the World Cup. Next, Wimbledon, the NBA Finals, F1. MagicLens is the AR remix layer for every sport. Built on X Layer and Flow. Connect your wallet and start creating." |
| **On-screen** | MagicLens logo, `magiclens.app` URL, OKX X Cup + Flow logos |

## Production Notes

- **Screen capture area**: 1440×900 or 1920×1080, browser maximized
- **Cursor**: Use a visible cursor effect (macOS: System Settings → Accessibility → Display → Cursor size)
- **Recording tool**: OBS or QuickTime Player (free, no watermark)
- **Audio**: USB microphone or AirPods; record voiceover separately for clean audio
- **Music**: Low-volume ambient track (Uppbeat/StreamBeats, free with attribution)
- **Duration target**: 1:45–2:15 (2:00 ideal)
- **End card**: Leave the final slide on screen for 3 seconds after voiceover ends

## UI Routes Reference

| Route | Component | Purpose |
|---|---|---|
| `/` | LandingPage | Connect wallet entry |
| `/dashboard` | Dashboard | Home — event card, quick actions, activity |
| `/remix` | RemixFlow | 4-step wizard: clip → AR → preview → mint |
| `/leaderboard` | Leaderboard | Top-10 table with prizes |
| `/upload-video` | VideoUpload | Upload match clips |
| `/videos` | VideoGallery | Browse all videos |
