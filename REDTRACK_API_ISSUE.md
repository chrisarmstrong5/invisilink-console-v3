# RedTrack API Integration Issue

## Current Status: ⚠️ API NOT WORKING

The RedTrack API integration is currently **NOT functional**. The API is returning HTML (Swagger UI documentation) instead of JSON data for all endpoints.

## What's Happening

When we make requests to:
```
https://api.redtrack.io/v1/reports/campaigns?from=2025-11-04&to=2025-11-04&groupBy=campaign
```

**Expected:** JSON response with campaign metrics
**Actual:** HTML Swagger UI documentation page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Swagger UI</title>
...
```

## Possible Causes

1. **API Key Invalid/Expired**
   - The API key `Q7xN6gPfPftYvo1YcEXw` may no longer be valid
   - RedTrack may have regenerated your API key

2. **API Endpoint Structure Changed**
   - RedTrack may have updated their API structure
   - The `/reports/campaigns` endpoint may have been renamed or moved

3. **Authentication Method Changed**
   - RedTrack may require additional authentication headers
   - Bearer token format may have changed

## What I've Tested

✅ Tested direct curl requests - same HTML response
✅ Tested multiple endpoints (`/campaigns`, `/reports/campaigns`, `/stats`) - all return HTML
✅ Verified API key is being sent correctly in Authorization header
✅ Confirmed response status is 200 OK (not an auth failure)
✅ Content-Type header shows `text/html; charset=utf-8` instead of `application/json`

## How to Fix

### Step 1: Verify API Key

1. Log in to RedTrack dashboard
2. Go to Settings → API
3. Check if your API key has changed
4. Copy the current valid API key

### Step 2: Check API Documentation

RedTrack's API docs should be at:
- https://api.redtrack.io/docs/index.html (Swagger UI)
- Or check their help center for updated API documentation

Look for:
- Correct endpoint paths for campaign reports
- Required headers/authentication format
- Any API version changes (v1 → v2?)

### Step 3: Update Config

Once you have the correct API key and endpoint structure, update:

**File:** `lib/config.ts`
```typescript
tracker: {
  redtrack: {
    apiKey: "YOUR_NEW_API_KEY_HERE",
    // ... rest of config
  }
}
```

**File:** `lib/api/redtrack.ts`
```typescript
private baseUrl = "https://api.redtrack.io/v1"; // Update if version changed
```

### Step 4: Test API Directly

Test the API with curl to verify it works:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://api.redtrack.io/v1/campaigns"
```

Should return JSON, not HTML.

## Temporary Solution

Until the API is fixed, the dashboard will show an error message:

```
❌ RedTrack API Error: RedTrack API returned HTML instead of JSON
The API endpoint may have changed or the API key is invalid.
Please verify your RedTrack API key and endpoint URLs in the RedTrack dashboard.
```

## What Works Without API

These features still work (they don't depend on RedTrack API):

✅ **Link Generator** - Creates tracking URLs and white page links
✅ **Spark Code Database** - Upload and manage spark codes (uses localStorage)
✅ **Competitor Spy** - Store competitor ads (uses localStorage)

## What Doesn't Work

❌ **Dashboard Metrics** - Revenue, EPC, Clicks, CVR (needs API)
❌ **Revenue Graph** - Time-series data (needs API)
❌ **Active Campaigns Table** - Campaign performance (needs API)
❌ **Spark Code Metrics** - Auto-updating performance data (needs API)

## Contact RedTrack Support

If you can't find the issue in the dashboard, contact RedTrack support:
- Check for API announcements or breaking changes
- Ask for updated API documentation
- Verify your API key is active

## Development Notes

The error handling has been improved to show detailed messages:
- `/app/api/redtrack/route.ts` - API proxy with logging
- `/app/page.tsx` - Dashboard with detailed error toasts

Check browser console and server logs for debugging info.

---

**Last Updated:** 2025-11-04
**Issue Discovered By:** Claude Code during v3 development
