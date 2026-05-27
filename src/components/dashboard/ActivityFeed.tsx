import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Users, Palette, Zap } from 'lucide-react';

const activityItems = [
  { icon: Upload, color: 'bg-green-500', user: 'Alex Chen', text: 'uploaded a new video', time: '2 hours ago' },
  { icon: Users, color: 'bg-blue-500', user: 'Sarah & Mike', text: 'started collaborating', time: '4 hours ago' },
  { icon: Palette, color: 'bg-purple-500', user: 'Nature Overlays', text: 'asset pack released', time: '1 day ago' },
  { icon: Zap, color: 'bg-yellow-500', user: 'Top Creator', text: 'earned 50 FLOW this week', time: '2 days ago' },
];

export function ActivityFeed() {
  return (
    <div className="lg:col-span-1 order-3 lg:order-1">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white">Platform Activity</h3>
        <span className="px-2 py-0.5 text-[10px] bg-white/10 text-gray-300 rounded-full border border-white/10">Preview</span>
      </div>
      <div className="space-y-4">
        {activityItems.map((item, i) => (
          <Card key={i} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center`}>
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm"><span className="font-medium">{item.user}</span> {item.text}</p>
                  <p className="text-gray-300 text-xs">{item.time}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
