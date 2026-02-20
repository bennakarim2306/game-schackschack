# Token Refresh Implementation Guide

## Overview

The app now supports automatic access token refresh when the backend responds with `"errorCode": "EXPIRED_TOKEN"`. This implementation uses the refresh token stored during sign-in/sign-up to obtain a new access token transparently.

## What Was Added

### 1. Refresh Token Endpoint Configuration
Added to [config/AppConfig.ts](config/AppConfig.ts):
```typescript
USER_AUTH_REFRESH_TOKEN_PATH: '/api/v1/auth/refresh'
```

### 2. Authenticated Fetch Utility
Created [utils/AuthenticatedFetch.ts](utils/AuthenticatedFetch.ts) with:

- **`authenticatedFetch(url, options)`**: Drop-in replacement for `fetch()` that:
  - Automatically adds Bearer token to Authorization header
  - Detects `"errorCode": "EXPIRED_TOKEN"` in responses
  - Calls refresh endpoint with refresh token
  - Stores new access token (and refresh token if provided)
  - Automatically retries the original request with new token

- **`shouldSignOut(response)`**: Helper to check if user should be signed out due to failed refresh

## How to Use

### Before (Old Code):
```typescript
const token = await SecureStore.getItemAsync('userToken');

const response = await fetch(url, {
    method: "GET",
    headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
    }
});
```

### After (New Code):
```typescript
import { authenticatedFetch } from '../utils/AuthenticatedFetch';

const response = await authenticatedFetch(url, {
    method: "GET",
    headers: {
        Accept: "application/json"
    }
});
// Authorization header is added automatically
// Token refresh happens automatically if needed
```

## What Happens Automatically

1. **Initial Request**: 
   - Gets current access token from SecureStore
   - Adds it to Authorization header
   - Makes the request

2. **If Token Expired**:
   - Detects `"errorCode": "EXPIRED_TOKEN"` in response
   - Retrieves refresh token from SecureStore
   - Calls `/api/v1/auth/refresh` endpoint with refresh token
   - Stores new access token (and new refresh token if provided)
   - Retries original request with new access token
   - Returns the successful response

3. **If Refresh Fails**:
   - Returns the original EXPIRED_TOKEN response
   - Calling code should redirect user to login

## Files That Need Updating

All files with `fetch()` calls to authenticated endpoints have been successfully updated to use `authenticatedFetch()`:

### Screens:
- [x] [screens/AddItemScreen.tsx](screens/AddItemScreen.tsx) - ✅ Completed (3 fetch calls updated)
- [x] [screens/QueryItems.tsx](screens/QueryItems.tsx) - ✅ Completed
- [x] [screens/QueryFoodScreen.tsx](screens/QueryFoodScreen.tsx) - ✅ Completed
- [x] [screens/ContactsList.tsx](screens/ContactsList.tsx) - ✅ Completed (2 fetch calls updated)

### Services:
- [x] [services/game/gameService.ts](services/game/gameService.ts) - ✅ Completed

**All authenticated API calls now support automatic token refresh!**

## Migration Steps for Each File

1. **Add import**:
   ```typescript
   import { authenticatedFetch } from '../utils/AuthenticatedFetch';
   ```

2. **Replace `fetch()` with `authenticatedFetch()`**:
   - Keep all the same options
   - Remove manual token retrieval (`SecureStore.getItemAsync('userToken')`)
   - Remove Authorization header (it's added automatically)

3. **Optional: Handle Sign Out**:
   ```typescript
   if (await shouldSignOut(response)) {
       // Redirect to login screen
       navigation.navigate('LoginStackNavigator');
   }
   ```

## Example Implementation

See [screens/AddItemScreen.tsx](screens/AddItemScreen.tsx) lines ~75-110 for a complete example of the updated pattern.

## Backend Response Format

The utility expects the backend to return JSON responses with this format when token is expired:
```json
{
    "errorCode": "EXPIRED_TOKEN",
    "message": "Access token has expired"
}
```

## Token Storage

Both tokens are stored securely in SecureStore:
- **userToken**: Short-lived access token (used for API requests)
- **refreshToken**: Long-lived refresh token (valid for several years)

Updated in:
- Sign in - [navigations/MainStackNavigator.tsx](navigations/MainStackNavigator.tsx#L104-L106)
- Sign up - [navigations/MainStackNavigator.tsx](navigations/MainStackNavigator.tsx#L150-L152)
- Sign out - Both tokens deleted [navigations/MainStackNavigator.tsx](navigations/MainStackNavigator.tsx#L113-L114)

## Notes

- The utility only works for JSON responses with "errorCode" field
- Non-JSON responses are passed through unchanged
- Token refresh is atomic - concurrent requests won't cause multiple refresh calls
- All logging is handled through the Logger utility for consistency
