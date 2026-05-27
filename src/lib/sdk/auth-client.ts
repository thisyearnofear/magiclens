import { createClient, createConfig } from '@hey-api/client-fetch';
import { STORAGE_KEYS } from '@/lib/constants';
import { getApiBaseUrl } from '@/lib/api-base';

export const getAuthenticatedClient = () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return createClient(
        createConfig({
            baseUrl: getApiBaseUrl(),
            headers,
        })
    );
};

export const authClient = getAuthenticatedClient();
