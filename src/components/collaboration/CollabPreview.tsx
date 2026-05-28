import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, User, Eye, Clock, Users, Play, Zap } from 'lucide-react';

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

interface CollabPreviewProps {
  collab: OpenCollaboration;
  onJoin: (id: string) => void;
  onClose: () => void;
  isAuthenticated: boolean;
}

const categoryColors: Record<string, string> = {
  urban: 'bg-blue-500/20 text-blue-300',
  nature: 'bg-green-500/20 text-green-300',
  indoor: 'bg-yellow-500/20 text-yellow-300',
  sport: 'bg-red-500/20 text-red-300',
  event: 'bg-purple-500/20 text-purple-300',
};

export function CollabPreview({ collab, onJoin, onClose, isAuthenticated }: CollabPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        layoutId={`collab-${collab.id}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white/5 border-white/10 overflow-hidden shadow-2xl">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
            {collab.thumbnail_url ? (
              <img src={collab.thumbnail_url} alt={collab.title} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="h-16 w-16 text-gray-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-gray-400 hover:text-white hover:bg-black/70 transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Top badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {collab.category && (
                <Badge className={`text-xs px-2 py-0.5 ${categoryColors[collab.category] || 'bg-white/10 text-gray-300'}`}>
                  {collab.category}
                </Badge>
              )}
              <Badge className="bg-indigo-500/30 text-indigo-300 text-xs border border-indigo-400/30">
                <Users className="h-3 w-3 mr-1" />
                Open Collab
              </Badge>
            </div>

            {/* Duration */}
            {collab.duration && (
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
                {Math.floor(collab.duration / 60)}:{(collab.duration % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6">
            {/* Creator info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                {collab.creator_avatar ? (
                  <img src={collab.creator_avatar} alt={collab.creator_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h4 className="text-white font-medium text-sm">{collab.creator_name || 'Anonymous'}</h4>
                {collab.creator_type && (
                  <p className="text-gray-500 text-xs capitalize">{collab.creator_type}</p>
                )}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{collab.title}</h2>

            {/* Description */}
            {collab.description && (
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{collab.description}</p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5 pb-4 border-b border-white/5">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                {collab.view_count?.toLocaleString() || 0} views
              </span>
              {collab.active_collabs !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {collab.active_collabs} active collabs
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {collab.created_at ? new Date(collab.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
              </span>
            </div>

            {/* Join CTA */}
            <Button
              onClick={() => onJoin(collab.id)}
              disabled={!isAuthenticated}
              size="lg"
              className="w-full h-11 bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isAuthenticated ? 'Join This Collaboration' : 'Connect Wallet to Join'}
            </Button>
            {!isAuthenticated && (
              <p className="text-gray-500 text-xs text-center mt-2">Connect a wallet to collaborate on remixes</p>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
