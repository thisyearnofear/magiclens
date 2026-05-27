/**
 * Grove (Lens) storage client for uploading NFT metadata.
 * Uses the one-step immutable upload API — no SDK needed.
 * See: https://lens.xyz/docs/storage
 */

const GROVE_API = 'https://api.grove.storage';
// Use Ethereum mainnet chain_id for immutable persistence (testnet content may be pruned)
const CHAIN_ID = 1;

export interface RemixMetadata {
  name: string;
  description: string;
  image: string;
  externalUrl: string;
  attributes: { trait_type: string; value: string }[];
}

/**
 * Upload Remix metadata JSON to Grove and return the gateway URL
 * suitable for use as an ERC-721 tokenURI.
 */
export async function uploadMetadataToGrove(meta: RemixMetadata): Promise<string> {
  const body = {
    name: meta.name,
    description: meta.description,
    image: meta.image,
    external_url: meta.externalUrl,
    attributes: meta.attributes,
  };

  const res = await fetch(`${GROVE_API}?chain_id=${CHAIN_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Grove upload failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.gateway_url as string;
}
