import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

const REFERRAL_KEY = 'magiclens_referrer';

export function useReferrer() {
  const searchParams = useSearchParams();
  const refFromUrl = searchParams?.get('ref') || null;

  const storedRef = typeof window !== 'undefined'
    ? localStorage.getItem(REFERRAL_KEY)
    : null;

  const referrerAddress = useMemo(() => {
    if (refFromUrl) {
      localStorage.setItem(REFERRAL_KEY, refFromUrl);
      return refFromUrl;
    }
    return storedRef;
  }, [refFromUrl, storedRef]);

  const clearReferrer = useCallback(() => {
    localStorage.removeItem(REFERRAL_KEY);
  }, []);

  return { referrerAddress, clearReferrer };
}
