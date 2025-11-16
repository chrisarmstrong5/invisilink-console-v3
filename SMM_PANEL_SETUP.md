# SMM Panel Integration Setup

The InvisiLink Console v3 integrates with SMM panels (SMMFollows or JustAnotherPanel) to automatically boost engagement on your TikTok videos.

## Step 1: Get Your API Key

### Option A: SMMFollows (Recommended)
1. Go to https://smmfollows.com
2. Log in to your account
3. Navigate to Settings → API
4. Copy your API key

### Option B: JustAnotherPanel
1. Go to https://justanotherpanel.com
2. Log in to your account
3. Navigate to Settings → API
4. Copy your API key

## Step 2: Get Service IDs

You need to find the service IDs for TikTok likes, saves, and views.

### Finding Service IDs in SMMFollows/JAP:

1. In your panel dashboard, go to the API documentation section
2. Look for the "Services" endpoint or list
3. Find these services:
   - **TikTok Likes** - Look for service like "TikTok Likes [High Quality]"
   - **TikTok Saves** - Look for service like "TikTok Saves/Favorites"
   - **TikTok Views** (optional) - Look for service like "TikTok Views [Fast]"
4. Note down the **Service ID** (usually a number like `1234`)

### Example Service List Response:
```json
{
  "service": 1234,
  "name": "TikTok Likes - High Quality",
  "type": "default",
  "rate": "0.50",  // Price per 1000
  "min": "10",
  "max": "10000",
  "category": "TikTok"
}
```

## Step 3: Configure Environment Variables

Add these to your Vercel project environment variables (or `.env.local` for local development):

```bash
# SMM Panel - SMMFollows (if using SMMFollows)
SMMFOLLOWS_API_KEY=your_api_key_here

# SMM Panel - JAP (if using JustAnotherPanel)
JAP_API_KEY=your_api_key_here
```

## Step 4: Update Service IDs in Config

Edit `/lib/config.ts` and add your service IDs:

```typescript
smmPanel: {
  provider: "smmfollows", // or "jap"
  smmfollows: {
    apiUrl: "https://smmfollows.com/api/v2",
    apiKey: process.env.SMMFOLLOWS_API_KEY || "",
    services: {
      tiktok: {
        likes: "1234",  // ← Replace with your service ID
        saves: "5678",  // ← Replace with your service ID
        views: "9012",  // ← Replace with your service ID (optional)
      },
    },
  },
}
```

## Step 5: Test the Integration

1. Go to **Spark Codes** page
2. Add a new spark code with:
   - Platform: TikTok
   - TikTok Link: A valid TikTok video URL
   - Engagement Settings: 1900 likes, 180 saves (or your preferred amounts)
3. Click the **"Quick Add Engagement"** button
4. You should see a success message with order IDs
5. Check your SMM panel dashboard to confirm the orders were placed

## API Endpoints

The integration uses standard SMM panel API format:

- **List Services**: `GET ?key=API_KEY&action=services`
- **Place Order**: `POST key=API_KEY&action=add&service=ID&link=URL&quantity=NUM`
- **Check Status**: `POST key=API_KEY&action=status&order=ID`
- **Get Balance**: `POST key=API_KEY&action=balance`

## Cost Calculation

The engagement boost will cost based on your panel's rates:

**Example**:
- TikTok Likes: $0.50 per 1000
- TikTok Saves: $0.80 per 1000
- Order: 1900 likes + 180 saves

**Cost**:
- Likes: (1900 / 1000) × $0.50 = $0.95
- Saves: (180 / 1000) × $0.80 = $0.14
- **Total**: $1.09 per video

Make sure you have sufficient balance in your SMM panel account!

## Switching Providers

To switch from SMMFollows to JustAnotherPanel (or vice versa):

1. Update the `provider` field in `lib/config.ts`:
   ```typescript
   provider: "jap"  // Change from "smmfollows" to "jap"
   ```

2. Make sure you have the JAP API key in your environment variables

3. Update the service IDs for the JAP panel

## Troubleshooting

### "No API key configured" warning
- Add `SMMFOLLOWS_API_KEY` or `JAP_API_KEY` to your environment variables
- Redeploy your Vercel project after adding env vars

### "Failed to boost engagement"
- Check that your API key is correct
- Verify you have sufficient balance in your panel
- Confirm the service IDs are valid
- Make sure the TikTok link format is correct

### "Order failed" for specific service
- The service ID might be incorrect
- The service might be temporarily unavailable
- Check min/max order limits for that service

## Security Note

**Never commit your API keys to Git!** Always use environment variables for sensitive credentials.
