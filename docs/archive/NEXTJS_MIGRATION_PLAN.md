# Vite → Next.js 16.2 Migration Plan

> **Deadline:** Hackathon submission May 28. Migration must be complete and stable by May 26 to leave 2 days for demo recording + submission.

**Goal:** Migrate the MagicLens Vite SPA (React 18, React Router v7) to Next.js 16.2 (React 19, App Router).

**Risk:** High — this touches every route, every provider, and every config file. Web3 packages (RainbowKit, wagmi) have known ESM/CJS friction with SSR frameworks. Fabric.js and MediaPipe are strictly client-side.

**Mitigation strategy:** Parallel branches. The Vite build stays operational until the Next.js port is verified. No downtime.

---

## Architecture Decisions

| Concern | Decision | Why |
|---|---|---|
| Render strategy | **SPA mode** (`next.config.ts` → `output: 'export'` or static) | The app is 95% client-side interactive AR. SSR provides negligible benefit for pages behind auth walls. |
| Provider wrapping | Single root layout with `'use client'` wrapper | All providers (wagmi, RainbowKit, FCL, Theme, Auth) are client-only. Wrap them in a single `Providers.tsx` marked `'use client'`. |
| Route structure | `app/` directory, one folder per route | 6 main routes + 2 dynamic routes — simple flat structure. |
| Web3 ESM fix | `transpilePackages: ['@rainbow-me/rainbowkit', '@wagmi/core', 'wagmi', 'viem']` | These packages ship ESM-only. Next.js needs to transpile them for the Node.js runtime. |
| WASM for MediaPipe | Copy to `public/wasm/` via next.config or manual copy | MediaPipe Tasks Vision WASM files need to be served as static assets. |
| Backend | Stays as-is (Python/FastAPI) | No change. API calls from the frontend remain the same. |
| Socket.IO | `'use client'` component with dynamic import | Collaboration server stays independent. |

---

## Phase 0: Setup (Parallel Branch)

Before touching the main branch, create a `nextjs-migration` branch for safety.

**Step 0.1: Create migration branch**
```bash
cd /Users/udingethe/Dev/magiclens
git checkout -b nextjs-migration
```

**Step 0.2: Update dependencies**
```bash
cd /Users/udingethe/Dev/magiclens/app
npm install next@latest react@latest react-dom@latest
# Also need: @types/react @types/react-dom for React 19
npm install -D @types/react@latest @types/react-dom@latest
```

**Step 0.3: Create next.config.ts**

`app/next.config.ts`:
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@rainbow-me/rainbowkit',
    '@wagmi/core',
    'wagmi',
    'viem',
  ],
  // SPA mode — all routes handled client-side
  output: 'export',
  // Required for client-side routing in static export
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'flagcdn.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
  webpack: (config) => {
    // Polyfills for web3 packages
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: false,
      crypto: false,
      stream: false,
      assert: false,
      http: false,
      https: false,
      os: false,
      url: false,
    };
    return config;
  },
};

export default nextConfig;
```

**Step 0.4: Update tsconfig.json**

`app/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
    "baseUrl": "."
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Verification:** `npx next --version` shows `16.2.x`. `npx tsc --noEmit --skipLibCheck` passes with 0 errors.

---

## Phase 1: Root Layout + Providers (3 files)

**Step 1.1: Create root layout**

`app/src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MagicLens — AR Remix Layer for Live Sports',
  description: 'Launching with FIFA World Cup 2026. Turn every iconic moment into a mintable remix.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'MagicLens' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 1.2: Create Providers wrapper (client component)**

`app/src/app/Providers.tsx`:
```typescript
'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/lib/web3/wagmi-config';
import { AuthProvider } from '@/auth/AuthProvider';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{ darkMode: darkTheme({ accentColor: '#7c3aed', borderRadius: 'small' }) }}
          coolMode
          appInfo={{ appName: 'MagicLens', learnMoreUrl: 'https://magiclens.app' }}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

**Step 1.3: Move globals.css**

Copy `app/src/index.css` → `app/src/app/globals.css`. Remove the old `index.css` import from main.tsx (which won't exist after migration).

**Step 1.4: Copy static assets**

```bash
mkdir -p app/public/wasm
cp -r app/node_modules/@mediapipe/tasks-vision/wasm/* app/public/wasm/
cp -r app/node_modules/@mediapipe/tasks-vision/vision_bundle.mjs app/public/
cp app/public/packs app/public/packs  # already exists under public/
```

**Verification:** `npx next build` succeeds with 0 errors (even if routes are empty).

---

## Phase 2: App Router Entry + Auth Gating (2 files)

The current Router.tsx gates behind `SignedIn`/`SignedOut`. In Next.js, this becomes a client component that conditionally renders landing vs dashboard.

**Step 2.1: Create root page (the old Router logic)**

`app/src/app/page.tsx`:
```typescript
'use client';

import { useAuthContext } from '@/auth/AuthProvider';
import LandingPage from '@/components/LandingPage';
import Dashboard from '@/components/Dashboard';
import { WrongNetworkBanner } from '@/components/WrongNetworkBanner';

export default function Home() {
  const { isConnected } = useAuthContext();

  if (!isConnected) return <LandingPage />;

  return (
    <>
      <WrongNetworkBanner />
      <Dashboard />
    </>
  );
}
```

**Step 2.2: Create dynamic route files**

File structure under `app/src/app/`:
```
app/
  page.tsx              → / (landing or dashboard)
  remix/
    page.tsx            → /remix (RemixFlow)
    [txHash]/
      page.tsx          → /remix/:txHash (PublicRemix)
  leaderboard/
    page.tsx            → /leaderboard
  dashboard/
    page.tsx            → /dashboard (redirect to /)
  videos/
    page.tsx            → /videos
  assets/
    page.tsx            → /assets
  upload-video/
    page.tsx            → /upload-video
  upload-asset/
    page.tsx            → /upload-asset
  collaboration/
    [id]/
      page.tsx          → /collaboration/:id
  profile/
    page.tsx            → /profile
    [id]/
      page.tsx          → /profile/:id
  flow/
    page.tsx            → /flow
  ai-enhance/
    [videoId]/
      page.tsx          → /ai-enhance/:videoId
```

Each route file is a thin wrapper:
```typescript
// app/src/app/leaderboard/page.tsx
'use client';
import Leaderboard from '@/components/Leaderboard';
export default function LeaderboardPage() { return <Leaderboard />; }
```

---

## Phase 3: Client Component Fixes

**All existing components** (`app/src/components/*`, `app/src/hooks/*`, `app/src/auth/*`) already use browser APIs. The migration needs:

1. **Add `'use client'`** to every component file that uses: `useState`, `useEffect`, browser APIs, event handlers, or any library that accesses `window`/`document`. This is ~40 files. Easiest approach: add `'use client'` as the first line to all component files, then remove from any that truly don't need it (discovered via build errors).

2. **Remove React Router imports**: `useParams` → `useParams` from `next/navigation`. `useNavigate` → `useRouter` from `next/navigation`. `useParams` stays the same name but imports from `next/navigation`.

3. **Update vite.config.ts aliases** — already handled by `paths` in tsconfig.json (the `@/` alias works in both Vite and Next.js).

4. **Dynamic imports for heavy libraries** — Fabric.js and MediaPipe should use `next/dynamic` with `ssr: false`:

```typescript
// Before:
import { usePoseLandmarker } from '@/hooks/usePoseLandmarker';

// After:
const usePoseLandmarker = dynamic(() => import('@/hooks/usePoseLandmarker'), { ssr: false });
```

---

## Phase 4: Build + Deploy

**Step 4.1: Update package.json scripts**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

**Step 4.2: Update vercel.json**
```json
{
  "framework": "nextjs",
  "installCommand": "cd app && npm install --legacy-peer-deps",
  "buildCommand": "cd app && npm run build",
  "outputDirectory": "app/.next"
}
```

**Step 4.3: Remove obsolete files**
- `app/vite.config.ts`
- `app/index.html`
- `app/src/main.tsx`
- `app/src/components/Router.tsx`
- `app/pnpm-lock.yaml` (already in .gitignore)

**Step 4.4: Build test**
```bash
cd app
npm run build
# Expected: no errors, all routes compiled
```

---

## Rollback Plan

If the Next.js migration breaks something critical with <48 hours to deadline:

1. Keep the `nextjs-migration` branch open
2. `git checkout main`
3. The Vite build still deploys from `main`
4. Submit the hackathon from `main`

This is why we work on a branch — zero risk to the submission timeline.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RainbowKit crashes in SSR | Medium | High | `transpilePackages` + `'use client'` on all web3 code |
| Fabric.js canvas breaks | Low | High | Dynamic import with `ssr: false` |
| MediaPipe WASM not found | Medium | Medium | Copy WASM to `public/wasm/`, verify path |
| React 19 breaks a dependency | Low | Medium | Pin deps that don't support React 19 yet |
| Build time too slow | Low | Medium | Next.js 16.2 has faster Turbopack |
| Missing `'use client'` on 1 component | High | Low | Build will fail with clear error message — easy to fix |
