const GUEST_ID_KEY = 'magiclens:guest_id';

function newGuestId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID().toLowerCase();
    }
  } catch {
    // fall through to Math.random fallback
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Stable per-browser guest identity. Survives refresh; cleared only with site data. */
export function getGuestId(): string {
  try {
    const existing = localStorage.getItem(GUEST_ID_KEY);
    if (existing) return existing;
    const id = newGuestId();
    localStorage.setItem(GUEST_ID_KEY, id);
    return id;
  } catch {
    return newGuestId();
  }
}

/**
 * Server-safe guest address (`guest:<uuid>`, 42 chars — fits the
 * VARCHAR(64) address columns). Replaces the old shared GUEST_ADDR
 * placeholder so each guest's entries, referrals and rewards are
 * attributable and claimable after they connect a wallet.
 */
export function getGuestAddress(): string {
  return `guest:${getGuestId()}`;
}

export function isGuestAddress(addr: string | null | undefined): boolean {
  return !!addr && addr.startsWith('guest:');
}

export function isGuestTxHash(txHash: string | null | undefined): boolean {
  return !!txHash && txHash.startsWith('guest-');
}

/** Deterministic negative placeholder token id for unminted guest entries. */
export function guestTokenId(txHash: string): number {
  let h = 0;
  for (let i = 0; i < txHash.length; i++) {
    h = (Math.imul(h, 31) + txHash.charCodeAt(i)) | 0;
  }
  return -(Math.abs(h) % 900000 + 100000);
}
