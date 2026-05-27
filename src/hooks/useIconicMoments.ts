import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { promoteToIconic, getIconicMoments, checkIconicStatus } from '@/lib/crossvm-client';
import { measureUserAction } from '@/lib/action-observability';
import type { CrossVMPromotion, IconicMomentCheck } from '@/types/crossvm';

interface UseIconicMomentsOptions {
  day?: number;
  autoFetch?: boolean;
}

export function useIconicMoments({ day, autoFetch = true }: UseIconicMomentsOptions = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['iconic-moments', day ?? 'all'];
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);

  const momentsQuery = useQuery({
    queryKey,
    queryFn: () => getIconicMoments(day),
    enabled: autoFetch,
    staleTime: 15_000,
    retry: 1,
  });

  const promoteMutation = useMutation({
    mutationFn: async (params: {
      xlayerTokenId: number;
      xlayerTxHash: string;
      xlayerCreatorAddress: string;
      title: string;
      overlayIds?: string;
      day?: number;
      rank: number;
    }) => {
      const key = `${params.day ?? day ?? 1}-${params.xlayerTokenId}`;
      setPromoting(key);
      setError(null);
      return measureUserAction(
        'promote_to_iconic',
        (actionId) => promoteToIconic({ ...params, idempotencyKey: actionId }),
        { day: params.day ?? day ?? 1, rank: params.rank, tokenId: params.xlayerTokenId }
      );
    },
    onSuccess: (result) => {
      queryClient.setQueryData<CrossVMPromotion[]>(queryKey, (prev = []) => {
        const withoutDuplicate = prev.filter((moment) => moment.id !== result.id);
        return [result, ...withoutDuplicate];
      });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Promotion failed');
    },
    onSettled: () => {
      setPromoting(null);
    },
  });

  const fetchMoments = useCallback(async () => {
    setError(null);
    const result = await momentsQuery.refetch();
    if (result.error) {
      const msg = result.error instanceof Error ? result.error.message : 'Failed to fetch iconic moments';
      setError(msg);
      throw result.error;
    }
    return result.data ?? [];
  }, [momentsQuery]);

  const promote = useCallback((params: {
    xlayerTokenId: number;
    xlayerTxHash: string;
    xlayerCreatorAddress: string;
    title: string;
    overlayIds?: string;
    day?: number;
    rank: number;
  }) => {
    return promoteMutation.mutateAsync(params);
  }, [promoteMutation]);

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

  return {
    moments: momentsQuery.data ?? [],
    loading: momentsQuery.isLoading,
    error: error ?? (momentsQuery.error instanceof Error ? momentsQuery.error.message : null),
    promoting,
    fetchMoments,
    promote,
    check,
    isPromoting,
  };
}
