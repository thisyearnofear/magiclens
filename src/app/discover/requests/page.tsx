'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StadiumBackdrop } from '@/components/StadiumBackdrop';
import { MobileNav } from '@/components/MobileNav';
import {
  Inbox, Send, Check, X, Loader2,
  AlertCircle, RefreshCw, MessageSquare, User,
  ArrowLeft,
} from 'lucide-react';
import { useAuthContext } from '@/auth/AuthProvider';
import { STORAGE_KEYS } from '@/lib/constants';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface CollabRequest {
  id: string;
  from_user_id: string;
  from_username: string;
  to_profile_id: string;
  to_username: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string | null;
  responded_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  accepted: 'bg-green-500/20 text-green-300 border-green-500/30',
  declined: 'bg-red-500/20 text-red-300 border-red-500/30',
};

function RequestCard({
  request,
  direction,
  onRespond,
  responding,
}: {
  request: CollabRequest;
  direction: 'incoming' | 'outgoing';
  onRespond: (id: string, action: 'accept' | 'decline') => Promise<void>;
  responding: string | null;
}) {
  const isPending = request.status === 'pending';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
              <User className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-semibold text-sm">
                  {direction === 'incoming' ? request.from_username : request.to_username}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 border ${STATUS_COLORS[request.status] || 'bg-white/5 text-gray-300'}`}
                >
                  {request.status === 'pending' ? 'Pending' : request.status === 'accepted' ? 'Accepted' : 'Declined'}
                </Badge>
                <span className="text-gray-600 text-[10px] ml-auto">
                  {request.created_at ? new Date(request.created_at).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric',
                  }) : ''}
                </span>
              </div>

              {/* Direction label */}
              <p className="text-gray-500 text-[11px] mt-0.5">
                {direction === 'incoming' ? 'Wants to collaborate with you' : `Sent to ${request.to_username}`}
              </p>

              {/* Message */}
              {request.message && (
                <div className="mt-2 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
                  <p className="text-gray-400 text-xs italic leading-relaxed">
                    &ldquo;{request.message}&rdquo;
                  </p>
                </div>
              )}

              {/* Actions (incoming + pending only) */}
              {direction === 'incoming' && isPending && (
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={() => onRespond(request.id, 'accept')}
                    disabled={responding === request.id}
                    size="sm"
                    className="h-7 text-[11px] bg-green-500 hover:bg-green-400 text-white"
                  >
                    {responding === request.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Accept
                  </Button>
                  <Button
                    onClick={() => onRespond(request.id, 'decline')}
                    disabled={responding === request.id}
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Decline
                  </Button>
                </div>
              )}

              {/* Responded timestamp */}
              {request.responded_at && (
                <p className="text-gray-600 text-[10px] mt-2">
                  Responded {new Date(request.responded_at).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RequestSkeleton() {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RequestsPage() {
  const router = useRouter();
  const { isConnected } = useAuthContext();

  const [incoming, setIncoming] = useState<CollabRequest[]>([]);
  const [outgoing, setOutgoing] = useState<CollabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      setError('You must be logged in to view requests');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/discover/my_requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setIncoming(data.incoming || []);
        setOutgoing(data.outgoing || []);
      } else {
        setError(data.error || 'Failed to load requests');
      }
    } catch {
      setError('Backend unreachable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleRespond = useCallback(async (requestId: string, action: 'accept' | 'decline') => {
    setResponding(requestId);
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    try {
      const res = await fetch(`${API_BASE}/api/discover/respond_request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ request_id: requestId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === 'accept' ? 'Request accepted!' : 'Request declined');
        setIncoming(prev =>
          prev.map(r => r.id === requestId ? { ...r, status: action === 'accept' ? 'accepted' : 'declined', responded_at: new Date().toISOString() } : r)
        );
      } else {
        toast.error(data.error || 'Failed to respond');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setResponding(null);
    }
  }, []);

  const pendingCount = incoming.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StadiumBackdrop />
      <div className="relative z-[3]">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <MobileNav title="Requests" icon={<Inbox className="h-8 w-8 text-indigo-400 shrink-0" />} />
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchRequests}
                disabled={loading}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">Collaboration Requests</h2>
            <p className="text-gray-300">
              Review requests from creators who want to work with you.
            </p>
          </motion.div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 w-fit border border-white/5 mb-8">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                activeTab === 'incoming'
                  ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
                  : 'text-gray-300 hover:text-gray-300'
              }`}
            >
              <Inbox className="h-3.5 w-3.5" />
              Incoming
              {pendingCount > 0 && (
                <Badge className="ml-1 bg-green-500/30 text-green-300 text-[9px] px-1 py-0">{pendingCount}</Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('outgoing')}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                activeTab === 'outgoing'
                  ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
                  : 'text-gray-300 hover:text-gray-300'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              Sent
              {outgoing.length > 0 && (
                <Badge className="ml-1 bg-indigo-500/30 text-indigo-300 text-[9px] px-1 py-0">{outgoing.length}</Badge>
              )}
            </button>
          </div>

          {/* Error */}
          {error && !loading && (
            <Card className="bg-red-500/10 border-red-500/30 mb-8">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                <p className="text-gray-300 text-sm flex-1">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchRequests} className="border-red-500/30 text-red-400 shrink-0">
                  <RefreshCw className="h-4 w-4 mr-1" /> Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <RequestSkeleton key={i} />)}
            </div>
          )}

          {/* Incoming requests */}
          {!loading && activeTab === 'incoming' && (
            <AnimatePresence mode="wait">
              {incoming.filter(r => r.status === 'pending').length === 0 && incoming.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <Inbox className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">No incoming requests</h3>
                  <p className="text-gray-300 text-sm mb-6">
                    When someone sends you a collaboration request, it will appear here.
                  </p>
                  <Button
                    onClick={() => router.push('/discover')}
                    variant="outline"
                    className="border-indigo-500/30 text-indigo-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Discover Creators
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {/* Pending first, then history */}
                  {incoming.filter(r => r.status === 'pending').length > 0 && (
                    <>
                      <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                        New Requests
                      </h3>
                      {incoming.filter(r => r.status === 'pending').map(request => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          direction="incoming"
                          onRespond={handleRespond}
                          responding={responding}
                        />
                      ))}
                      <div className="border-t border-white/5 my-4" />
                    </>
                  )}
                  {incoming.filter(r => r.status !== 'pending').length > 0 && (
                    <>
                      <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                        History
                      </h3>
                      {incoming.filter(r => r.status !== 'pending').map(request => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          direction="incoming"
                          onRespond={handleRespond}
                          responding={responding}
                        />
                      ))}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Outgoing requests */}
          {!loading && activeTab === 'outgoing' && (
            <AnimatePresence mode="wait">
              {outgoing.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <Send className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">No sent requests</h3>
                  <p className="text-gray-300 text-sm mb-6">
                    Requests you send to creators will appear here.
                  </p>
                  <Button
                    onClick={() => router.push('/discover')}
                    variant="outline"
                    className="border-indigo-500/30 text-indigo-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Find Creators
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {outgoing.map(request => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      direction="outgoing"
                      onRespond={handleRespond}
                      responding={responding}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
