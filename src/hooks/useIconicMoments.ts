import { useState, useEffect, useCallback } from 'react';
import { promoteToIconic, getIconicMoments, checkIconicStatus } from '@/lib/crossvm-client';
import type { CrossVMPromotion, IconicMomentCheck } from '@/types/crossvm';

interface UseIconicMomentsOptions {
  day?: number;
  autoFetch?: boolean;
}

export function useIconicMoments({ day, autoFetch = true }: UseIconicMomentsOptions = {}) {
  const [moments, setMoments] = useState<CrossVMPromotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);

  const fetchMoments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIconicMoments(day);
      setMoments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch iconic moments');
    } finally {
      setLoading(false);
    }
  }, [day]);

  const promote = useCallback(async (params: {
    xlayerTokenId: number;
    xlayerTxHash: string;
    xlayerCreatorAddress: string;
    title: string;
    overlayIds?: string;
    day?: number;
    rank: number;
  }) => {
    const key = `${params.day}-${params.xlayerTokenId}`;
    setPromoting(key);
    setError(null);
    try {
      const result = await promoteToIconic(params);
      setMoments(prev => [result, ...prev]);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Promotion failed';
      setError(msg);
      throw err;
    } finally {
      setPromoting(null);
    }
  }, []);

  const check = useCallback(async (tokenId: number, checkDay?: number): Promise<IconicMomentCheck> => {
    try {
      return await checkIconicStatus(checkDay ?? day ?? 1, tokenId);
    } catch {
      return { isIconic: false, iconicMoment: null };
    }
  }, [day]);

  const isPromoting = useCallback((day: number, tokenId: number) => {
    return promoting === `${day}-${tokenId}`;
  }, [promoting]);

  useEffect(() => {
    if (autoFetch) {
      fetchMoments();
    }
  }, [autoFetch, fetchMoments]);

  return {
    moments,
    loading,
    error,
    promoting,
    fetchMoments,
    promote,
    check,
    isPromoting,
  };
}
