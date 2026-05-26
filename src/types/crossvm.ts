export interface CrossVMPromotion {
  id: string;
  xlayer_token_id: number;
  xlayer_tx_hash: string;
  xlayer_creator_address: string;
  title: string;
  overlay_ids: string;
  day: number;
  rank: number;
  flow_nft_id: number | null;
  flow_tx_hash: string | null;
  flow_minted_at: string | null;
  promoted_by: string;
  status: 'pending' | 'minted' | 'failed';
  created_at: string;
  flow_mint?: {
    success: boolean;
    nft_id?: number;
    tx_hash?: string;
    network?: string;
    simulated?: boolean;
    error?: string;
  };
}

export interface IconicMomentCheck {
  isIconic: boolean;
  iconicMoment: CrossVMPromotion | null;
}
