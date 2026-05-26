import React from 'react';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/auth/AuthProvider';
import { ConnectWallet } from '@/components/ConnectWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Upload, Users, X, Zap, Play, Palette, TrendingUp, Trophy, Sparkles, Medal, ArrowRight } from 'lucide-react';
import { StatsBar } from '@/components/StatsBar';
import { OnboardingToast } from '@/components/OnboardingToast';

export default function LandingPage() {
  const { continueAsGuest } = useAuthContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
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
      <section className="container mx-auto px-4 pt-16 pb-24 text-center relative overflow-hidden">
        {/* Floating decorations */}
        <motion.div
          className="absolute top-20 left-[10%] text-yellow-400/20 text-6xl pointer-events-none"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >✦</motion.div>
        <motion.div
          className="absolute top-40 right-[12%] text-blue-400/15 text-4xl pointer-events-none"
          animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >⬡</motion.div>
        <motion.div
          className="absolute bottom-32 left-[20%] text-purple-400/15 text-5xl pointer-events-none"
          animate={{ y: [0, -25, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        >◇</motion.div>

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
        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <ConnectWallet />
          <Button onClick={continueAsGuest} variant="ghost" size="lg" className="text-white hover:bg-white/10">
            Explore as Guest
          </Button>
        </div>

        {/* Visual mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-sm overflow-hidden">
            {/* Mockup browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <div className="ml-3 flex-1 max-w-[200px] bg-white/10 rounded-full px-3 py-1">
                <span className="text-[10px] text-gray-400">magiclens.app/remix</span>
              </div>
            </div>

            {/* Mockup content */}
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-yellow-400/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="text-left">
                  <div className="text-white text-sm font-medium">AR Overlay Studio</div>
                  <div className="text-gray-500 text-[10px]">Remixing: World Cup Final Highlight</div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-3">
                {[
                  { label: 'Flag', icon: '🏳️', active: true },
                  { label: 'Confetti', icon: '🎊', active: true },
                  { label: 'GOAL!', icon: '⚡', active: true },
                  { label: 'Bubble', icon: '💬', active: false },
                  { label: 'Sparkle', icon: '✨', active: false },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className={`rounded-lg p-2 text-center cursor-pointer transition-all ${
                      item.active
                        ? 'bg-yellow-400/20 border border-yellow-400/40 ring-1 ring-yellow-400/20'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-lg mb-0.5">{item.icon}</div>
                    <div className={`text-[9px] ${item.active ? 'text-yellow-300' : 'text-gray-500'}`}>{item.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Simulated video preview area */}
              <div className="aspect-video bg-gradient-to-br from-blue-900/60 via-purple-900/60 to-indigo-900/60 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-yellow-400/10 to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Play className="h-6 w-6 text-white ml-0.5" />
                </motion.div>

                {/* Pose skeleton dots */}
                {[
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

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Medal className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="text-gray-400 text-[10px]">Pose-aware tracking · 3 overlays active</span>
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
              <h5 className="text-lg font-semibold text-gray-400 mb-3">Guest Mode</h5>
              <ul className="text-gray-300 text-left space-y-2">
                <li className="flex items-start"><X className="h-4 w-4 text-red-400 mt-1 mr-2 flex-shrink-0" />No minting or rewards</li>
                <li className="flex items-start"><X className="h-4 w-4 text-red-400 mt-1 mr-2 flex-shrink-0" />No onchain ownership</li>
                <li className="flex items-start"><Check className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />Browse and explore</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <Play className="h-12 w-12 text-blue-400 mb-4" />
              <CardTitle className="text-white">1. Choose a Match Moment</CardTitle>
              <CardDescription className="text-gray-300">
                Pick a World Cup clip or upload your own. Our pose detector finds the action.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <Palette className="h-12 w-12 text-purple-400 mb-4" />
              <CardTitle className="text-white">2. Drop AR Overlays</CardTitle>
              <CardDescription className="text-gray-300">
                Add flag halos, "GOAL!" lower-thirds, trophy confetti, or GIFs — all pose-aware.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <Trophy className="h-12 w-12 text-green-400 mb-4" />
              <CardTitle className="text-white">3. Mint & Climb the Ranks</CardTitle>
              <CardDescription className="text-gray-300">
                One-click mint on X Layer. Top-10 earn USDT daily. Top-3 become Flow Iconic Moments.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <OnboardingToast />

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
        <div className="flex flex-col items-center text-gray-400 gap-2">
          <p>&copy; 2026 MagicLens. The AR remix layer for live sports.</p>
          <p className="text-sm">
            Built for the <a href="https://web3.okx.com/xlayer/build-x-hackathon/xcup" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">OKX X Cup</a> on X Layer + Flow
          </p>
        </div>
      </footer>
    </div>
  );
}
