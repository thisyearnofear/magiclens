import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/auth/AuthProvider';
import { ConnectWallet } from '@/components/ConnectWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Zap, Play, Pause, TrendingUp, Trophy, Medal, ArrowRight } from 'lucide-react';
import { StatsBar } from '@/components/StatsBar';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { ScrollRevealSection } from '@/components/ScrollRevealSection';

const HERO_CLIPS = [
  { src: '/clips/demo1.mp4', label: 'Match-winning Goal' },
  { src: '/clips/demo2.mp4', label: 'Trophy Lift Ceremony' },
  { src: '/clips/demo3.mp4', label: 'Fan Celebration' },
];

export default function LandingPage() {
  const { continueAsGuest } = useAuthContext();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Stadium background image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=80&auto=format)',
        }}
      />
      <div className="fixed inset-0 z-[1] bg-gradient-to-br from-purple-950/90 via-blue-950/85 to-indigo-950/90" />

      {/* Gooey animated blobs */}
      <svg className="fixed inset-0 z-[2] w-full h-full pointer-events-none opacity-30" aria-hidden="true">
        <defs>
          <filter id="gooey-landing">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -20" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
        <g filter="url(#gooey-landing)">
          <circle
            cx="15%" cy="20%" r="120"
            fill="rgba(168,85,247,0.5)"
            style={{ animation: 'gooey-blob-1 12s ease-in-out infinite' }}
          />
          <circle
            cx="80%" cy="25%" r="100"
            fill="rgba(59,130,246,0.4)"
            style={{ animation: 'gooey-blob-2 15s ease-in-out infinite 2s' }}
          />
          <circle
            cx="50%" cy="70%" r="90"
            fill="rgba(250,204,21,0.25)"
            style={{ animation: 'gooey-blob-3 18s ease-in-out infinite 4s' }}
          />
        </g>
      </svg>

      {/* Content layer */}
      <div className="relative z-[3]">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">MagicLens</h1>
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-400/20 text-yellow-400 rounded-full border border-yellow-400/30">
              Launching with FIFA World Cup 2026
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ConnectWallet />
            <Button onClick={continueAsGuest} variant="ghost" className="text-white hover:bg-white/10 hidden sm:inline-flex">
              Guest
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-20 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-yellow-400/10 border border-yellow-400/30 rounded-full">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="text-yellow-400 text-sm font-medium">OKX X Cup Hackathon — World Cup 2026</span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-bold text-white mb-4 max-w-4xl mx-auto leading-tight">
          The <span className="text-yellow-400">AR Remix Layer</span> for Live Sports
        </h2>
        <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Drop pose-aware AR overlays on match clips. Mint as NFTs on X Layer. Earn USDT. Top remixes become Flow Iconic Moments.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mb-12">
          <ConnectWallet />
          <Button onClick={continueAsGuest} variant="ghost" size="lg" className="text-white hover:bg-white/10">
            Explore as Guest
          </Button>
        </div>

        {/* Hero video player */}
        <HeroVideoPlayer />
      </section>

      <StatsBar />

      {/* Value Proposition Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">Connect. Create. Earn.</h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
            <CardHeader>
              <div className="p-3 bg-blue-500/20 rounded-full w-fit">
                <Play className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="text-white mt-4">One-Click Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Connect with <strong className="text-white">OKX Wallet</strong>, MetaMask, or any EVM wallet
                via RainbowKit. Your Flow wallet links automatically. No chain pickers.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
            <CardHeader>
              <div className="p-3 bg-green-500/20 rounded-full w-fit">
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
              <CardTitle className="text-white mt-4">Mint & Earn Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Mint your AR remix as an NFT on X Layer. Climb the daily leaderboard.
                Top-10 earn USDT rewards. Top-3 become Flow "Iconic Moment" NFTs.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
            <CardHeader>
              <div className="p-3 bg-purple-500/20 rounded-full w-fit">
                <Zap className="h-8 w-8 text-purple-400" />
              </div>
              <CardTitle className="text-white mt-4">Cross-Chain by Design</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Volume remixes on X Layer (low fees, USDT/OKB liquidity).
                Premium collectibles on Flow Cadence (NBA Top Shot lineage).
                One app, two chains, seamless UX.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gradient-to-r from-yellow-400/20 to-purple-400/20 rounded-3xl p-8 text-center max-w-4xl mx-auto">
          <h4 className="text-2xl font-bold text-white mb-4">Choose Your Path</h4>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h5 className="text-lg font-semibold text-yellow-400 mb-3">OKX / EVM Wallet</h5>
              <ul className="text-gray-300 text-left space-y-2">
                <li className="flex items-start"><Check className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />Mint remix NFTs on X Layer</li>
                <li className="flex items-start"><Check className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />Claim USDT rewards</li>
                <li className="flex items-start"><Check className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />Leaderboard & daily prizes</li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-blue-400 mb-3">Flow Wallet</h5>
              <ul className="text-gray-300 text-left space-y-2">
                <li className="flex items-start"><Check className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />Premium "Iconic Moment" NFTs</li>
                <li className="flex items-start"><Check className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />Gasless transactions</li>
                <li className="flex items-start"><Check className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />Curator & collaboration layer</li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-gray-300 mb-3">Guest Mode</h5>
              <ul className="text-gray-300 text-left space-y-2">
                <li className="flex items-start"><X className="h-4 w-4 text-red-400 mt-1 mr-2 flex-shrink-0" />No minting or rewards</li>
                <li className="flex items-start"><X className="h-4 w-4 text-red-400 mt-1 mr-2 flex-shrink-0" />No onchain ownership</li>
                <li className="flex items-start"><Check className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />Browse and explore</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <ScrollRevealSection />

      <OnboardingWizard />

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-yellow-400/20 to-purple-400/20 rounded-3xl p-12">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Create Iconic Moments?</h3>
          <p className="text-xl text-gray-300 mb-8">
            Launching with FIFA World Cup 2026. Next: Wimbledon, NBA Finals, F1, Olympics LA 2028.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <ConnectWallet />
            <Button onClick={continueAsGuest} variant="ghost" size="lg" className="text-white hover:bg-white/10">
              Explore as Guest
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/10">
        <div className="flex flex-col items-center text-gray-300 gap-2">
          <p>&copy; 2026 MagicLens. The AR remix layer for live sports.</p>
          <p className="text-sm">
            Built for the <a href="https://web3.okx.com/xlayer/build-x-hackathon/xcup" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">OKX X Cup</a> on X Layer + Flow
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}

function HeroVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeClip, setActiveClip] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const switchClip = (index: number) => {
    setActiveClip(index);
    setIsPlaying(false);
    const video = videoRef.current;
    if (video) {
      video.load();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="max-w-3xl mx-auto"
    >
      <div className="relative bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-sm overflow-hidden">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <div className="ml-3 flex-1 max-w-[200px] bg-white/10 rounded-full px-3 py-1">
            <span className="text-[10px] text-gray-300">magiclens.app/remix</span>
          </div>
        </div>

        {/* Studio header */}
        <div className="p-4 sm:pb-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="text-left">
              <div className="text-white text-sm font-medium">AR Overlay Studio</div>
              <div className="text-gray-300 text-[10px]">Remixing: {HERO_CLIPS[activeClip].label}</div>
            </div>
          </div>

          {/* Video player */}
          <div
            className="aspect-video bg-black rounded-xl border border-white/10 relative overflow-hidden cursor-pointer group"
            onClick={handlePlay}
          >
            <video
              ref={videoRef}
              src={HERO_CLIPS[activeClip].src}
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {/* Play/Pause overlay */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} bg-black/30`}>
              <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/25 transition-colors">
                {isPlaying
                  ? <Pause className="h-5 w-5 text-white" />
                  : <Play className="h-5 w-5 text-white ml-0.5" />}
              </div>
            </div>
            {/* Pose tracking dots */}
            {isPlaying && [
              { x: '45%', y: '25%' }, { x: '50%', y: '30%' },
              { x: '48%', y: '50%' }, { x: '35%', y: '65%' }, { x: '60%', y: '65%' },
            ].map((dot, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"
                style={{ left: dot.x, top: dot.y }}
                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>

          {/* Clip selector tabs */}
          <div className="flex gap-2 mt-3">
            {HERO_CLIPS.map((clip, i) => (
              <button
                key={clip.src}
                onClick={() => switchClip(i)}
                className={`flex-1 text-center px-3 py-1.5 rounded-lg text-xs transition-all ${
                  i === activeClip
                    ? 'bg-yellow-400/20 border border-yellow-400/40 text-yellow-300'
                    : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                {clip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Medal className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-gray-300 text-[10px]">Pose-aware tracking · AR overlays ready</span>
            </div>
            <motion.div
              className="text-yellow-400 text-xs font-medium flex items-center gap-1"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Mint Remix <ArrowRight className="h-3 w-3" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
