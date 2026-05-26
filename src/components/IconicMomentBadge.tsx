import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ExternalLink } from 'lucide-react';

interface IconicMomentBadgeProps {
  flowNftId?: number | null;
  flowTxHash?: string | null;
  status?: 'pending' | 'minted' | 'failed';
  size?: 'sm' | 'md' | 'lg';
}

export function IconicMomentBadge({
  flowNftId,
  flowTxHash,
  status = 'minted',
  size = 'sm',
}: IconicMomentBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  if (status === 'minted') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="inline-flex items-center gap-1"
      >
        <Badge
          className={`${sizeClasses[size]} bg-gradient-to-r from-blue-600/40 to-purple-600/40 text-blue-300 border border-blue-400/30 shadow-lg shadow-blue-500/10 font-semibold`}
        >
          <Sparkles className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span className="ml-1">Iconic Moment</span>
          {flowNftId && (
            <span className="ml-1 font-mono opacity-70">#{flowNftId}</span>
          )}
        </Badge>
        {flowTxHash && (
          <a
            href={`https://www.flowdiver.io/tx/${flowTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400/60 hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </motion.div>
    );
  }

  if (status === 'pending') {
    return (
      <Badge
        className={`${sizeClasses[size]} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`}
      >
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5"
        />
        Promoting to Flow...
      </Badge>
    );
  }

  return null;
}
