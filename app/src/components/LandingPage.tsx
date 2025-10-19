import React from 'react';
import { useAuthContext } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Palette, Users, Zap } from 'lucide-react';

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
            <Button onClick={login} variant="outline" className="bg-white/10 text-white border-white/20">
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
          <Button onClick={continueAsGuest} variant="outline" size="lg" className="text-white border-white/20">
            Continue as Guest
          </Button>
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
          <Button onClick={login} size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500">
            Get Started Now
          </Button>
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