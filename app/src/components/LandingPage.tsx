import React from 'react';
import { useAuthContext } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Upload, Users, X, Zap, Play, Palette, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const { login, continueAsGuest } = useAuthContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">MagicLens</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={login} variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              Connect Wallet
            </Button>
            <Button onClick={continueAsGuest} variant="ghost" className="text-white hover:bg-white/10">
              Guest
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-6xl font-bold text-white mb-6">
          Bring <span className="text-yellow-400">Magic</span> to Reality
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          The collaborative platform where videographers and digital artists create everyday magic.
          Upload your environmental videos, add whimsical AR-style overlays, and share the wonder.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={login} size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500">
            Connect Wallet & Create
          </Button>
          <Button onClick={continueAsGuest} variant="secondary" size="lg" className="bg-white/10 text-white hover:bg-white/20">
            Continue as Guest
          </Button>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-4xl font-bold text-white text-center mb-16">Why Connect Your Flow Wallet?</h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
            <CardHeader>
              <div className="p-3 bg-blue-500/20 rounded-full w-fit">
                <Upload className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="text-white mt-4">Full Creative Control</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Upload your videos and assets, collaborate with other creators, and build your portfolio
                on the Flow blockchain.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
            <CardHeader>
              <div className="p-3 bg-green-500/20 rounded-full w-fit">
                <Users className="h-8 w-8 text-green-400" />
              </div>
              <CardTitle className="text-white mt-4">Earn From Your Work</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Get paid for collaborations, receive tips from viewers, and participate in the creator economy.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
            <CardHeader>
              <div className="p-3 bg-purple-500/20 rounded-full w-fit">
                <Zap className="h-8 w-8 text-purple-400" />
              </div>
              <CardTitle className="text-white mt-4">Own Your Creations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Mint your AR assets as NFTs, maintain ownership of your intellectual property,
                and build lasting value.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gradient-to-r from-yellow-400/20 to-purple-400/20 rounded-3xl p-8 text-center max-w-4xl mx-auto">
          <h4 className="text-2xl font-bold text-white mb-4">Guest Mode vs Full Access</h4>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h5 className="text-lg font-semibold text-yellow-400 mb-3">Guest Mode</h5>
              <ul className="text-gray-300 text-left space-y-2">
                <li className="flex items-start">
                  <X className="h-4 w-4 text-red-400 mt-1 mr-2 flex-shrink-0" />
                  No uploads or publishing
                </li>
                <li className="flex items-start">
                  <X className="h-4 w-4 text-red-400 mt-1 mr-2 flex-shrink-0" />
                  No earnings or payments
                </li>
                <li className="flex items-start">
                  <X className="h-4 w-4 text-red-400 mt-1 mr-2 flex-shrink-0" />
                  No profile or portfolio
                </li>
                <li className="flex items-start">
                  <X className="h-4 w-4 text-red-400 mt-1 mr-2 flex-shrink-0" />
                  No collaboration features
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-green-400 mb-3">Connected Wallet</h5>
              <ul className="text-gray-300 text-left space-y-2">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />
                  Full upload and publishing access
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />
                  Earn from collaborations and tips
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />
                  Persistent profile and portfolio
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />
                  Advanced collaboration tools
                </li>
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
              <CardTitle className="text-white">Upload Videos</CardTitle>
              <CardDescription className="text-gray-300">
                Videographers upload 30-second environmental videos of parks, streets, and everyday spaces.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <Palette className="h-12 w-12 text-purple-400 mb-4" />
              <CardTitle className="text-white">Add Magic</CardTitle>
              <CardDescription className="text-gray-300">
                Digital artists overlay whimsical animations, creatures, and effects to bring videos to life.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <Users className="h-12 w-12 text-green-400 mb-4" />
              <CardTitle className="text-white">Collaborate & Earn</CardTitle>
              <CardDescription className="text-gray-300">
                Both creators earn from viral collaborative videos through tips and revenue sharing.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-yellow-400/20 to-purple-400/20 rounded-3xl p-12">
          <h3 className="text-4xl font-bold text-white mb-6">Ready to Create Magic?</h3>
          <p className="text-xl text-gray-300 mb-8">
            Join the community of creators bringing wonder to everyday moments.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={login} size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500">
              Get Started Now
            </Button>
            <Button onClick={continueAsGuest} variant="secondary" size="lg" className="bg-white/10 text-white hover:bg-white/20">
              Explore as Guest
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/10">
        <div className="flex items-center justify-center text-gray-400">
          <p>&copy; 2025 MagicLens. Bringing magic to reality.</p>
        </div>
      </footer>
    </div>
  );
}