import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, User, Zap } from 'lucide-react';
import { UserProfile } from '@/lib/sdk';

interface DashboardHeaderProps {
  isGuest: boolean;
  profile: UserProfile | null;
  onDisconnect: () => void;
  onNavigate: (path: string) => void;
}

export function DashboardHeader({ isGuest, profile, onDisconnect, onNavigate }: DashboardHeaderProps) {
  const handleConnectWallet = () => {
    window.location.href = '/';
  };

  const navLinks = [
    { label: 'Browse Videos', path: '/videos' },
    { label: 'Asset Library', path: '/assets' },
    { label: 'Profile', path: '/profile' },
  ];

  return (
    <header className="border-b border-white/10 bg-black/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">MagicLens</h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Button key={link.path} variant="ghost" onClick={() => onNavigate(link.path)} className="text-white">
                {link.label}
              </Button>
            ))}
            {isGuest ? (
              <Button
                onClick={handleConnectWallet}
                className="bg-yellow-400 text-black hover:bg-yellow-500 flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Connect Wallet
              </Button>
            ) : (
              <Button variant="secondary" onClick={onDisconnect} className="bg-white/10 text-white hover:bg-white/20">
                Sign Out
              </Button>
            )}
          </nav>

          {/* Mobile Sheet */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-white" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-gray-900/80 backdrop-blur-sm text-white">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navLinks.map((link) => (
                    <Button key={link.path} variant="ghost" onClick={() => onNavigate(link.path)} className="text-white">
                      {link.label}
                    </Button>
                  ))}
                  {isGuest ? (
                    <Button
                      onClick={handleConnectWallet}
                      className="bg-yellow-400 text-black hover:bg-yellow-500 flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Connect Wallet
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={onDisconnect} className="bg-white/10 text-white hover:bg-white/20">
                      Sign Out
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
