export async function getGuestToken(): Promise<string | null> {
    // Check if we have a token in memory or localStorage
    // For simplicity, let's use a simple fetch every time or cache it briefly.
    // Ideally, cache in memory variable or localStorage.

    // Check localStorage first
    let token = localStorage.getItem('guestToken');
    // We ideally should check expiration, but let's assume if it fails 401, we retry.
    // For this simple implementation, if no token, fetch one.

    if (!token) {
        try {
            const res = await fetch('/api/auth/token');
            if (res.ok) {
                const data = await res.json();
                token = data.token;
                if (token) localStorage.setItem('guestToken', token);
            }
        } catch (e) {
            console.error("Failed to get guest token", e);
        }
    }
    return token;
}

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
    let token = await getGuestToken();

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    let response = await fetch(url, { ...options, headers });

    // If 401, maybe token expired? Try getting a new one once.
    if (response.status === 401) {
        localStorage.removeItem('guestToken'); // Clear bad token
        token = await getGuestToken(); // Fetch new
        if (token) {
            const newHeaders = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };
            response = await fetch(url, { ...options, headers: newHeaders });
        }
    }

    return response;
}
