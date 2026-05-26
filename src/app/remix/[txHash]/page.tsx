import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

const PublicRemix = dynamic(() => import('@/components/PublicRemix'));

export async function generateMetadata({ params }: { params: Promise<{ txHash: string }> }): Promise<Metadata> {
  const { txHash } = await params;
  const title = 'MagicLens AR Remix';
  const description = 'A World Cup moment remixed with AR overlays and minted as an NFT on MagicLens.';
  const url = `https://magiclens.vercel.app/remix/${txHash}`;

  return {
    title: `${title} | MagicLens`,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: [{ url: 'https://magiclens.app/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://magiclens.app/og-image.png'],
    },
  };
}

export default function PublicRemixPage() {
  return <PublicRemix />;
}
