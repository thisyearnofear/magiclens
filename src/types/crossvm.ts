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
  /** Source clip URL for Screening Room premieres; null falls back to the house reel. */
  media_url?: string | null;
  /** TapeOut ICONIC-GATE verdict — the on-chain circuit that approved promotion. */
  tapeout?: {
    circuit_id: number;
    processor: string;
    inputs_hex: string;
    output_hex: string;
    promote: number;
    score: number;
    /** True when the circuit approved promotion (1) or rejected it (0). */
    promoted_by_circuit?: boolean;
    verified: boolean;
  } | null;
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
