import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Users, Clock, Eye, User } from 'lucide-react';

interface CreatorInfo {
  id: string;
  username: string;
  user_type: string;
  avatar_url?: string;
  bio?: string;
  earnings_total?: number;
  is_verified?: boolean;
}

interface OpenCollaboration {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  category?: string;
  view_count?: number;
  duration?: number;
  created_at?: string;
  creator_name?: string;
  creator_avatar?: string;
  creator_type?: string;
  active_collabs?: number;
}

interface CollabCardProps {
  collab: OpenCollaboration;
  onStartCollab: (videoId: string) => void;
  isAuthenticated: boolean;
}

export function CollabCard({ collab, onStartCollab, isAuthenticated }: CollabCardProps) {
  const categoryColors: Record<string, string> = {
    urban: 'bg-blue-500/20 text-blue-300',
    nature: 'bg-green-500/20 text-green-300',
    indoor: 'bg-yellow-500/20 text-yellow-300',
    sport: 'bg-red-500/20 text-red-300',
    event: 'bg-purple-500/20 text-purple-300',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="bg-white/5 border-white/10 hover:border-indigo-400/30 hover:bg-white/10 transition-all overflow-hidden group">
        {/* Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
          {collab.thumbnail_url ? (
            <img src={collab.thumbnail_url} alt={collab.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="h-12 w-12 text-gray-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {collab.category && (
              <Badge className={`text-[10px] px-1.5 py-0.5 ${categoryColors[collab.category] || 'bg-white/10 text-gray-300'}`}>
                {collab.category}
              </Badge>
            )}
            <Badge className="bg-indigo-500/30 text-indigo-300 text-[10px] border border-indigo-400/30">
              <Users className="h-3 w-3 mr-0.5" />
              Collab
            </Badge>
          </div>

          {/* Duration */}
          {collab.duration && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
              {Math.floor(collab.duration / 60)}:{(collab.duration % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Info */}
        <CardContent className="p-3">
          <h3 className="text-white font-semibold text-sm truncate group-hover:text-indigo-300 transition-colors">
            {collab.title}
          </h3>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
            <User className="h-3 w-3" />
            <span className="truncate">{collab.creator_name || 'Anonymous'}</span>
            {collab.creator_type && (
              <Badge className="text-[9px] bg-white/5 text-gray-500 px-1 py-0">{collab.creator_type}</Badge>
            )}
          </div>

          {collab.description && (
            <p className="text-gray-500 text-xs mt-1.5 line-clamp-2">{collab.description}</p>
          )}

          {/* Stats + CTA */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {collab.view_count?.toLocaleString() || 0}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {collab.created_at ? new Date(collab.created_at).toLocaleDateString() : 'Recent'}
              </span>
            </div>
            <Button
              onClick={() => onStartCollab(collab.id)}
              disabled={!isAuthenticated}
              size="sm"
              className="h-7 text-[11px] bg-indigo-500 hover:bg-indigo-400 text-white"
            >
              {isAuthenticated ? 'Join' : 'Connect to Join'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
