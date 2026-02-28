import * as SecureStore from 'expo-secure-store';
import configs from '../config/AppConfig';
import Logger from '../config/Logger';

/**
 * Refreshes the access token using the refresh token
 * @returns The new access token or null if refresh failed
 */
async function refreshAccessToken(): Promise<string | null> {
    try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        
        if (!refreshToken) {
            Logger.error('AUTH', 'No refresh token available');
            return null;
        }

        const url = configs.USER_AUTH_BASE_URL + configs.USER_AUTH_REFRESH_TOKEN_PATH;
        Logger.info('AUTH', 'Attempting to refresh access token');
        Logger.request(url, 'POST', { refreshToken: '***' });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refreshToken: refreshToken,
            }),
        });

        if (response.status !== 200) {
            const errorText = await response.text();
            Logger.response(url, response.status, errorText);
            Logger.error('AUTH', 'Token refresh failed', errorText);
            return null;
        }

        const jsonResponse = await response.json();
        Logger.response(url, response.status);
        Logger.success('AUTH', 'Token refreshed successfully');

        // Store the new tokens
        await SecureStore.setItemAsync('userToken', jsonResponse.token);
        if (jsonResponse.refreshToken) {
            await SecureStore.setItemAsync('refreshToken', jsonResponse.refreshToken);
        }

        return jsonResponse.token;
    } catch (error) {
        Logger.error('AUTH', 'Exception during token refresh', error);
        return null;
    }
}

/**
 * Makes an authenticated fetch request with automatic token refresh
 * @param url The URL to fetch
 * @param options The fetch options (headers, method, body, etc.)
 * @returns The fetch response
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Get the current access token
    const token = await SecureStore.getItemAsync('userToken');

    Logger.debug('AUTH', `Making authenticated request with token: ${token ? token.substring(0, 4) + '***' : 'No Token'}`);
    
    // Create a new options object for this fetch call
    const fetchOptions: RequestInit = {
        ...options,
        headers: options.headers ? { ...(options.headers as Record<string, string>) } : {},
    };

    // Add Authorization header if token exists
    if (token && typeof fetchOptions.headers === 'object' && !Array.isArray(fetchOptions.headers)) {
            Logger.debug('AUTH', `Setting the Authorization header with token: ${token.substring(0, 4)}***`);
        (fetchOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
    
    // Check if body is FormData
    const isFormData = fetchOptions.body instanceof FormData;

    // Make the initial request
    let response = await fetch(url, fetchOptions);
    
    // Log response details for debugging
    Logger.debug('AUTH', `Response Status: ${response.status} ${response.statusText}`);
    Logger.debug('AUTH', `Response Headers: Content-Type: ${response.headers.get('content-type')}`);
    // Logger.debug('AUTH', `Response Body: body: ${JSON.stringify(await response.clone().json())}`);
    
    // Check if response is JSON and has EXPIRED_TOKEN errorCode
    const contentType = response.headers.get('content-type');

    if (response.status === 403) {
        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        try {
            const jsonData = await clonedResponse.json();
            
            // Log response body for error or non-ok status
            if (!response.ok || jsonData.errorCode) {
                Logger.debug('AUTH', `Response Body: ${JSON.stringify(jsonData)}`);
            }
            
            // Check if token is expired
            if ((jsonData.errorCode === 'INVALID_TOKEN' || jsonData.errorCode === 'EXPIRED_TOKEN')) {
                Logger.warning('AUTH', 'Access token expired, attempting refresh');
                
                // Try to refresh the token
                const newToken = await refreshAccessToken();
                
                if (newToken) {
                    // For FormData requests, we cannot retry with the same body
                    // because FormData streams can only be consumed once
                    if (isFormData) {
                        Logger.error('AUTH', 'FormData request expired - cannot retry with consumed FormData');
                        return response;
                    }
                    
                    // For non-FormData requests, create new options with new token
                    const retryOptions: RequestInit = {
                        ...options,
                        headers: options.headers ? { ...(options.headers as Record<string, string>) } : {},
                    };
                    
                    if (typeof retryOptions.headers === 'object' && !Array.isArray(retryOptions.headers)) {
                        (retryOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
                    }
                    
                    // Retry the original request with new token
                    Logger.info('AUTH', 'Retrying request with new token');
                    response = await fetch(url, retryOptions);
                    Logger.success('AUTH', 'Request completed successfully with refreshed token');
                    Logger.debug('AUTH', `Retry Response Status: ${response.status} ${response.statusText}`);
                } else {
                    Logger.error('AUTH', 'Token refresh failed, user needs to re-authenticate');
                    // Token refresh failed, return the original response
                    // The calling code should handle this by redirecting to login
                }
            }
        } catch (error) {
            // If JSON parsing fails, log response text for debugging
            try {
                const clonedResponse = response.clone();
                const responseText = await clonedResponse.text();
                if (!response.ok && responseText) {
                    Logger.debug('AUTH', `Response Body (non-JSON): ${responseText}`);
                }
            } catch (textError) {
                Logger.debug('AUTH', 'Could not read response body');
            }
            // This might be a non-JSON response or a different error
        }
    } else if (!response.ok) {
        // Log response body for non-JSON error responses
        try {
            const clonedResponse = response.clone();
            const responseText = await clonedResponse.text();
            Logger.debug('AUTH', `Response Body (Content-Type: ${contentType}): ${responseText}`);
        } catch (error) {
            Logger.debug('AUTH', 'Could not read response body');
        }
    }
    
    return response;
}

/**
 * Helper to check if we need to sign out due to refresh failure
 * Use this after getting a response from authenticatedFetch
 */
export async function shouldSignOut(response: Response): Promise<boolean> {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        try {
            const clonedResponse = response.clone();
            const jsonData = await clonedResponse.json();
            return jsonData.errorCode === 'EXPIRED_TOKEN';
        } catch {
            return false;
        }
    }
    return false;
}

/**
 * Wrapper around authenticatedFetch that provides enhanced error logging
 * and handles network errors with detailed context
 */
export async function authenticatedFetchWithErrorHandling(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    try {
        return await authenticatedFetch(url, options);
    } catch (error) {
        const errorDetails = {
            url,
            method: options.method || 'GET',
            errorMessage: error instanceof Error ? error.message : String(error),
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorStack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
        };
        
        Logger.error('AUTH', 'Network request failed with exception', errorDetails);
        throw error;
    }
}
