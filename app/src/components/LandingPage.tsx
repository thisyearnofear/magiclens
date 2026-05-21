import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuthContext } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Upload, Users, X, Zap, Play, Palette, TrendingUp, Trophy } from 'lucide-react';
import { StatsBar } from '@/components/StatsBar';

export default function LandingPage() {
  const { login, continueAsGuest } = useAuthContext();

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
            <div className="hidden md:block">
              <ConnectButton.Custom>
                {({ openConnectModal, account }) => (
                  account?.address ? (
                    <span className="text-white/70 text-sm">EVM: {account.displayName}</span>
                  ) : (
                    <Button
                      onClick={openConnectModal}
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
                    >
                      OKX Wallet / EVM
                    </Button>
                  )
                )}
              </ConnectButton.Custom>
            </div>
            <Button onClick={login} variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              Connect Flow Wallet
            </Button>
            <Button onClick={continueAsGuest} variant="ghost" className="text-white hover:bg-white/10">
              Guest
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-yellow-400/10 border border-yellow-400/30 rounded-full">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="text-yellow-400 text-sm font-medium">OKX X Cup Hackathon — World Cup 2026</span>
        </div>
        <h2 className="text-6xl font-bold text-white mb-6">
          The <span className="text-yellow-400">AR Remix Layer</span> for Live Sports
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Turn every iconic sports moment into a mintable, remixable, ownable piece of fan culture.
          Drop pose-aware AR overlays on match clips, mint as NFTs on <strong className="text-white">X Layer</strong>,
          and earn USDT. Top remixes become premium <strong className="text-white">Flow</strong> "Iconic Moment" NFTs.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <ConnectButton.Custom>
            {({ openConnectModal, account }) => (
              <Button
                onClick={openConnectModal}
                size="lg"
                className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
              >
                {account?.address
                  ? `${account.displayName} — Connected`
                  : 'Connect Wallet & Mint'}
              </Button>
            )}
          </ConnectButton.Custom>
          <Button onClick={login} variant="secondary" size="lg" className="bg-white/10 text-white hover:bg-white/20">
            Connect Flow Wallet
          </Button>
          <Button onClick={continueAsGuest} variant="ghost" size="lg" className="text-white hover:bg-white/10">
            Explore as Guest
          </Button>
        </div>
      </section>

      <StatsBar />

      {/* Value Proposition Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-4xl font-bold text-white text-center mb-16">Connect. Create. Earn.</h3>

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
        <h3 className="text-4xl font-bold text-white text-center mb-12">How It Works</h3>
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

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-yellow-400/20 to-purple-400/20 rounded-3xl p-12">
          <h3 className="text-4xl font-bold text-white mb-6">Ready to Create Iconic Moments?</h3>
          <p className="text-xl text-gray-300 mb-8">
            Launching with FIFA World Cup 2026. Next: Wimbledon, NBA Finals, F1, Olympics LA 2028.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button
                  onClick={openConnectModal}
                  size="lg"
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  Connect Wallet & Get Started
                </Button>
              )}
            </ConnectButton.Custom>
            <Button onClick={login} variant="secondary" size="lg" className="bg-white/10 text-white hover:bg-white/20">
              Connect Flow Wallet
            </Button>
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
