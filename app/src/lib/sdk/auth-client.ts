import { createClient, createConfig } from '@hey-api/client-fetch';

// Create a function that returns a fresh client with current token
export const getAuthenticatedClient = () => {
    const token = localStorage.getItem('magiclens_token');
    console.log('🔑 Creating authenticated client - Token:', token ? 'Found' : 'Not found');

    const headers: Record<string, string> = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Added Authorization header to client');
    }

    // Don't set Content-Type here - let individual requests set their own
    // This is important for file uploads which need multipart/form-data

    return createClient(
        createConfig({
            baseUrl: import.meta.env.VITE_API_BASE_URL || '',
            headers: headers
        })
    );
};

// For backward compatibility
export const authClient = getAuthenticatedClient();