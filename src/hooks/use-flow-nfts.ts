// Hook for managing Flow NFTs
import { useState, useEffect, useCallback } from 'react';
import { fcl } from '../lib/flow/fcl-config';
import * as t from '@onflow/types';
import { getUserNFTsScript } from '../lib/flow/scripts/get-user-nfts';
import { mintAssetTransaction } from '../lib/flow/transactions/mint-asset';
import { setupAccountTransaction } from '../lib/flow/transactions/setup-account';

export interface FlowNFT {
  id: number;
  name: string;
  description: string;
  category: number;
  assetType: string;
  fileURL: string;
  thumbnailURL?: string;
  usageCount: number;
  creator: string;
}

export interface MintAssetParams {
  name: string;
  description: string;
  category: number;
  assetType: string;
  fileURL: string;
  thumbnailURL?: string;
  fileSize: number;
  width: number;
  height: number;
  duration?: number;
  tags: string[];
  licenseType: number;
  royaltyPercentage: number;
}

export function useFlowNFTs(userAddress: string | null) {
  const [nfts, setNfts] = useState<FlowNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = useCallback(async () => {
    if (!userAddress) {
      setNfts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fcl.query({
        cadence: getUserNFTsScript,
        args: (arg, t) => [arg(userAddress, t.Address)],
      });

      setNfts(result || []);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
      setNfts([]);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  const setupAccount = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const transactionId = await fcl.mutate({
        cadence: setupAccountTransaction,
        limit: 999,
      });

      const result = await fcl.tx(transactionId).onceSealed();
      console.log('Account setup successful:', result);
      
      return result;
    } catch (err) {
      console.error('Error setting up account:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup account');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const mintAsset = useCallback(async (params: MintAssetParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const transactionId = await fcl.mutate({
        cadence: mintAssetTransaction,
        args: (arg, t) => [
          arg(params.name, t.String),
          arg(params.description, t.String),
          arg(params.category, t.UInt8),
          arg(params.assetType, t.String),
          arg(params.fileURL, t.String),
          arg(params.thumbnailURL || null, t.Optional(t.String)),
          arg(params.fileSize.toString(), t.UInt64),
          arg(params.width.toString(), t.UInt32),
          arg(params.height.toString(), t.UInt32),
          arg(params.duration?.toString() || null, t.Optional(t.UFix64)),
          arg(params.tags, t.Array(t.String)),
          arg(params.licenseType, t.UInt8),
          arg(params.royaltyPercentage.toFixed(2), t.UFix64),
        ],
        limit: 999,
      });

      const result = await fcl.tx(transactionId).onceSealed();
      console.log('NFT minted successfully:', result);
      
      // Refresh NFTs after minting
      await fetchNFTs();
      
      return result;
    } catch (err) {
      console.error('Error minting NFT:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint NFT');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchNFTs]);

  return {
    nfts,
    isLoading,
    error,
    fetchNFTs,
    setupAccount,
    mintAsset,
  };
}