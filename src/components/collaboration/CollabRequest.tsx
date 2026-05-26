import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, X, Check, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Creator {
  id: string;
  username: string;
  user_type: string;
  avatar_url?: string;
  bio?: string;
  earnings_total?: number;
  is_verified?: boolean;
}

interface CollabRequestProps {
  creator: Creator;
  onSendRequest: (creatorId: string) => Promise<void>;
  onClose: () => void;
}

export function CollabRequest({ creator, onSendRequest, onClose }: CollabRequestProps) {
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await onSendRequest(creator.id);
      setSent(true);
      toast.success('Collaboration request sent!', {
        description: `${creator.username} will be notified.`,
      });
    } catch (err) {
      toast.error('Failed to send request', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-gray-900 border-white/10 w-full max-w-sm shadow-2xl">
            <CardContent className="p-6">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {sent ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-1">Request Sent!</h3>
                  <p className="text-gray-400 text-sm">
                    {creator.username} will review your request.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Creator info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url} alt={creator.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{creator.username}</h3>
                      <p className="text-gray-400 text-xs capitalize">{creator.user_type}</p>
                    </div>
                  </div>

                  {creator.bio && (
                    <p className="text-gray-400 text-sm mb-4">{creator.bio}</p>
                  )}

                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <div className="flex justify-between">
                      <span>Role</span>
                      <span className="text-white capitalize">{creator.user_type}</span>
                    </div>
                    {creator.earnings_total !== undefined && (
                      <div className="flex justify-between">
                        <span>Earnings</span>
                        <span className="text-yellow-400">${creator.earnings_total.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSend}
                    disabled={sending}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 text-white"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Collaboration Request
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
