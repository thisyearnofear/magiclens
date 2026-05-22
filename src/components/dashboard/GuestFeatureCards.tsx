import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Users, Zap, Palette } from 'lucide-react';

const features = [
  {
    icon: Upload,
    color: 'bg-green-500/20',
    iconColor: 'text-green-400',
    title: 'Upload Content',
    description: 'Share your videos and assets',
  },
  {
    icon: Users,
    color: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    title: 'Collaborate',
    description: 'Work with other creators',
  },
  {
    icon: Zap,
    color: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    title: 'Earn Rewards',
    description: 'Get paid for your creations',
  },
  {
    icon: Palette,
    color: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    title: 'NFT Integration',
    description: 'Mint your assets as NFTs',
  },
];

export function GuestFeatureCards() {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-4">Unlock Full Platform Features</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature) => (
          <Card key={feature.title} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`mt-1 p-2 ${feature.color} rounded-full`}>
                  <feature.icon className={`h-4 w-4 ${feature.iconColor}`} />
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm">{feature.title}</h4>
                  <p className="text-gray-400 text-xs mt-1">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
