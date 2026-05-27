const PRODUCTION_API_BASE = 'https://magiclens.thisyearnofear.com';
const LOCAL_API_BASE = 'http://localhost:8000';

function isBrowserLocalhost() {
  return typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (configured && configured !== LOCAL_API_BASE) {
    return configured.replace(/\/$/, '');
  }

  if (configured === LOCAL_API_BASE && isBrowserLocalhost()) {
    return LOCAL_API_BASE;
  }

  if (process.env.NODE_ENV === 'development') {
    return configured || LOCAL_API_BASE;
  }

  return PRODUCTION_API_BASE;
}

