import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import ClientProviders from './ClientProviders';
import { CursorGlow } from '@/components/CursorGlow';
import { FilmGrain } from '@/components/FilmGrain';
import './globals.css';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'MagicLens — AR Remix Layer for Live Sports',
  description: 'Turn every iconic sports moment into a mintable, remixable, ownable piece of fan culture. Dual-chain: X Layer + Flow.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'MagicLens — AR Remix Layer for Live Sports',
    description: 'Turn every iconic sports moment into a mintable, remixable, ownable piece of fan culture. Dual-chain: X Layer + Flow.',
    url: 'https://magiclens.vercel.app',
    siteName: 'MagicLens',
    images: [{ url: 'https://magiclens.app/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MagicLens — AR Remix Layer',
    description: 'Turn every iconic sports moment into a mintable, remixable, ownable piece of fan culture.',
    images: ['https://magiclens.app/og-image.png'],
    creator: '@magiclensx',
    site: '@magiclensx',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MagicLens',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MagicLens" />
        <link rel="manifest" href="/manifest.json" />
        <script defer data-domain="magiclens.vercel.app" src="https://plausible.io/js/script.js"></script>
      </head>
      <body className={`${displayFont.variable} ${monoFont.variable}`}>
        <CursorGlow />
        <FilmGrain />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
