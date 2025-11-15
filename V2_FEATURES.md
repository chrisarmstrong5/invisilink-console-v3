# V2 Features Implementation Guide

This document describes all the features ported from affiliate-cloaking-v2 to invisilink-console-v3.

## 🎯 Overview

All critical features from V2 have been successfully integrated into V3's modern Next.js/TypeScript architecture. The implementation maintains V3's existing features (Spark Codes, Competitor Ads, Dashboard Analytics) while adding V2's powerful cloaking capabilities.

---

## ✅ Implemented Features

### 1. **Link Kill Switch System** 🔥

**Description**: Complete link lifecycle management with the ability to instantly block burned/flagged affiliate links.

**Features**:
- One-click kill/restore from link history
- GitHub integration for kill list persistence
- Visual indicators for killed links
- Archive view for all killed links
- Automatic synchronization across sessions

**Usage**:
1. Navigate to the Links page
2. Find the link in history
3. Click "Kill" button
4. Confirm the action
5. Link is instantly blocked and committed to GitHub

**Implementation Files**:
- `lib/kill-list-manager.ts` - Core kill list functionality
- `app/api/kill-list/route.ts` - API for GitHub sync
- `components/kill-switch-button.tsx` - UI component
- `kill-list.json` - Stored in GitHub repo root

**Configuration**:
```typescript
// lib/config.ts
killSwitch: {
  enabled: true,
  storageKey: "affiliate-kill-list",
  githubEnabled: true,
  killListPath: "kill-list.json",
}
```

---

### 2. **Geo-Targeting System** 🌍

**Description**: Target specific countries with client-side geo-blocking using ip-api.com.

**Features**:
- 23 Tier 1 countries supported
- Multi-select country dropdown
- Grouped by region (English-speaking, European, Other)
- Fail-open behavior (allows traffic if geo API is down)
- Caching to reduce API calls
- Visual badges in link history

**Supported Countries**:
- **English-speaking**: US, GB, CA, AU, NZ, IE
- **Nordic**: NO, SE, DK, FI, IS, CH
- **Western Europe**: NL, BE, LU, DE, AT, FR, IT, ES, PT
- **Asia-Pacific**: SG, JP

**Usage**:
1. In Link Generator, expand "Advanced Features (V2)"
2. Enable "Geo-Targeting"
3. Select target countries
4. Generate link
5. Only traffic from selected countries will reach the offer

**Implementation Files**:
- `lib/geo-targeting.ts` - Geo-targeting script generation
- `components/geo-targeting-selector.tsx` - Multi-select UI
- Injected into white pages at generation time

**How It Works**:
1. White page loads in user's browser
2. Script fetches user's country from ip-api.com
3. If country is in allowed list → redirect to offer
4. If country is NOT in allowed list → stay on white page (blocked)
5. Result is cached for 1 hour to reduce API calls

---

### 3. **TikTok Advanced Features** 📱

**Description**: Complete TikTok integration suite for better tracking and conversion optimization.

#### 3a. TikTok Pixel Tracking

**Features**:
- PageView event on load
- ClickButton event on any click
- Configurable Pixel ID
- Validation of Pixel ID format

**Usage**:
1. Enable "TikTok Pixel"
2. Enter your Pixel ID (or use default)
3. Generate link
4. Pixel will track PageView and ClickButton events

#### 3b. Browser Redirect (Force Open)

**Features**:
- Detects TikTok in-app webview
- Forces link to open in external browser
- Improves tracking accuracy
- Handles both Android (intent URL) and iOS

**Usage**:
1. Enable "Force Browser Open"
2. Generate link
3. When clicked from TikTok app, link opens in default browser

**Why This Matters**: TikTok's in-app browser has tracking limitations. Opening in external browser improves pixel firing and conversion tracking.

#### 3c. Strict Bot Detection

**Features**:
- Enhanced detection for ByteDance/TikTok crawlers
- Blocks: bytedance, tiktok, musically user agents
- Prevents TikTok from pre-fetching your offer links

**Usage**:
1. Enable "Strict Bot Detection"
2. Generate link
3. TikTok crawlers will be blocked from accessing your offer

**Implementation Files**:
- `lib/tiktok-pixel.ts` - All TikTok utilities
- `components/tiktok-config.tsx` - Configuration UI
- Injected scripts in `lib/bot-detection.ts`

---

### 4. **Custom Redirect URL** 🔗

**Description**: Bypass RedTrack and redirect to any custom URL.

**Features**:
- Optional custom URL input
- Bypasses RedTrack tracking
- Useful for testing or non-RedTrack offers
- Stored in link history metadata

**Usage**:
1. In "Advanced Link Options"
2. Enter custom URL (e.g., `https://example.com/your-offer`)
3. Generate link
4. Link will redirect to your custom URL instead of RedTrack

**Use Cases**:
- Testing offers without RedTrack
- Using other tracking platforms
- Direct linking to specific landing pages
- A/B testing different tracking setups

---

### 5. **Disable Cloaking** ⚠️

**Description**: Instant redirect with no bot filtering (for testing only).

**Features**:
- Bypasses all bot detection
- Instant redirect to offer
- No user agent checks
- No parameter checks
- Use for testing only

**Usage**:
1. Enable "Disable Cloaking"
2. Generate link
3. All traffic redirected instantly (no filtering)

**Warning**: This defeats the purpose of cloaking! Only use for testing your funnel or debugging issues.

---

### 6. **Enhanced Link History** 📊

**Description**: Comprehensive metadata tracking for every generated link.

**New Metadata Tracked**:
- Filter type (params-only vs advanced)
- Geo-targeting settings (countries)
- TikTok features (pixel, browser redirect, strict detection)
- Custom URL flag
- Disable cloaking flag
- Kill status
- Template name

**Visual Indicators**:
- 🔥 Killed badge for blocked links
- 🌍 Geo-targeting badge with country count
- 📊 Pixel badge for TikTok tracking
- 🔗 Custom URL badge
- ⚠️ No Cloak badge
- Filter type badge (params-only / advanced)

---

## 🏗️ Architecture

### Type System

All features are type-safe using TypeScript:

```typescript
// lib/config.ts
export type LinkHistoryItem = {
  // ... existing fields
  customUrl?: string;
  filterType?: "params-only" | "advanced";
  geoTargeting?: {
    enabled: boolean;
    countries: string[];
  };
  tiktok?: {
    pixelEnabled: boolean;
    pixelId?: string;
    browserRedirectEnabled: boolean;
    strictBotDetectionEnabled: boolean;
  };
  disableCloaking?: boolean;
  isKilled?: boolean;
  killedAt?: string;
  templateName?: string;
};
```

### Script Generation Flow

1. User configures features in UI
2. `generateWhitePage()` called with all options
3. `buildCompleteHeadScript()` combines:
   - Bot detection (params-only or advanced)
   - TikTok Pixel (if enabled)
   - TikTok Browser Redirect (if enabled)
   - Strict bot detection patterns (if enabled)
4. `buildGeoTargetingScript()` adds geo-blocking (if enabled)
5. Scripts injected into white page template
6. White page committed to GitHub
7. Link metadata saved to localStorage

### Data Storage

- **Link History**: localStorage (30 most recent)
- **Kill List**: localStorage + GitHub (`kill-list.json`)
- **Spark Codes**: localStorage
- **Competitor Ads**: localStorage
- **Spend Tracking**: localStorage
- **White Pages**: GitHub repository

---

## 🚀 API Routes

### `/api/kill-list`

**POST** - Sync kill list to GitHub
```typescript
{
  killListJson: string // JSON.stringify(killList)
}
```

**GET** - Fetch kill list from GitHub
```typescript
Response: {
  exists: boolean,
  content: string, // JSON string
  sha?: string
}
```

### `/api/whitepage/generate`

**POST** - Generate white page with all features
```typescript
{
  offerKey: string,
  source: string,
  trackingUrl: string,
  filterType?: "params-only" | "advanced",
  domain: string,
  // V2 Features
  customUrl?: string,
  disableCloaking?: boolean,
  geoTargeting?: {
    enabled: boolean,
    targetCountries: string[]
  },
  tiktok?: {
    pixelEnabled: boolean,
    pixelId: string,
    browserRedirectEnabled: boolean,
    strictBotDetectionEnabled: boolean
  }
}
```

---

## 🎨 UI Components

### `<GeoTargetingSelector />`
Multi-select dropdown with regional grouping for country selection.

### `<TikTokConfig />`
Comprehensive TikTok configuration panel with pixel ID validation.

### `<AdvancedLinkOptions />`
Custom URL input and disable cloaking toggle.

### `<KillSwitchButton />`
One-click kill/restore with confirmation dialog and GitHub sync.

---

## 🔧 Configuration

### Global Settings

```typescript
// lib/config.ts
export const config = {
  // ... existing config
  geoTargeting: {
    enabled: true,
    apiUrl: "http://ip-api.com/json",
    countries: [ /* 23 countries */ ]
  },
  tiktok: {
    pixelDefaults: {
      enabled: false,
      pixelId: "D45OCM3C77U0CLRNMLJG"
    },
    browserRedirect: {
      enabled: false,
      forceBrowserOpen: true
    },
    strictBotDetection: {
      enabled: false,
      additionalPatterns: ["bytedance", "tiktok", "musically"]
    }
  },
  killSwitch: {
    enabled: true,
    storageKey: "affiliate-kill-list",
    githubEnabled: true,
    killListPath: "kill-list.json"
  }
};
```

---

## 📝 Usage Examples

### Example 1: Geo-Targeted TikTok Campaign

```
Offer: Apple Pay
Account: 1639
Geo-Targeting: Enabled (US, GB, CA)
TikTok Pixel: Enabled (D45OCM3C77U0CLRNMLJG)
Browser Redirect: Enabled
Filter Type: params-only
```

**Result**: Only users from US, GB, or CA can access the offer. TikTok pixel tracks events. Link opens in external browser.

### Example 2: Custom URL with No Cloaking

```
Custom URL: https://mylandingpage.com/offer
Disable Cloaking: Enabled
```

**Result**: All traffic instantly redirected to custom URL with no filtering. Useful for testing.

### Example 3: Killed Link

```
Generated link: https://apptime.pro/apple-1639-abc123
Action: Kill link via UI
```

**Result**: Link added to kill list, committed to GitHub, visual indicator shows 🔥 Killed badge. Can be restored later.

---

## 🐛 Troubleshooting

### Geo-Targeting Not Working

1. Check browser console for errors
2. Verify ip-api.com is accessible
3. Check cache (clear localStorage `geo_cache`)
4. Test with VPN from different countries

### TikTok Pixel Not Firing

1. Verify Pixel ID is correct (20 chars, alphanumeric)
2. Check browser console for TikTok pixel errors
3. Ensure pixel is enabled in Business Center
4. Test with TikTok Pixel Helper extension

### Kill Switch Not Syncing

1. Verify GITHUB_TOKEN environment variable is set
2. Check API route logs for errors
3. Verify kill-list.json was created in GitHub repo
4. Check browser localStorage for kill list data

---

## 🔮 Future Enhancements

### Planned Features (Not Yet Implemented)

1. **Link Manager Page** - Dedicated interface for managing all links
2. **Archive Page** - View only killed links with restore capability
3. **Settings Page** - Centralized configuration for all V2 features
4. **Edge Config Integration** - Real-time kill switch via Vercel Edge Config
5. **Multi-Tracker Support** - Add MaxConv tracker alongside RedTrack
6. **VA Help Documentation** - Built-in guide for virtual assistants
7. **Domain Health Metrics** - Track performance by cloak domain
8. **Automated Testing** - E2E tests for all V2 features

---

## 📊 Comparison: V2 vs V3

| Feature | V2 | V3 (Current) |
|---------|----|----|
| Link Kill Switch | ✅ | ✅ |
| Geo-Targeting (23 countries) | ✅ | ✅ |
| TikTok Pixel | ✅ | ✅ |
| Browser Redirect | ✅ | ✅ |
| Strict Bot Detection | ✅ | ✅ |
| Custom Redirect URL | ✅ | ✅ |
| Disable Cloaking | ✅ | ✅ |
| Enhanced Link History | ✅ | ✅ |
| Spark Codes Management | ❌ | ✅ |
| Competitor Ads | ❌ | ✅ |
| Dashboard Analytics | ❌ | ✅ |
| RedTrack API Integration | ❌ | ✅ |
| Modern UI (React/Tailwind) | ❌ | ✅ |
| TypeScript | ❌ | ✅ |
| Next.js 16 | ❌ | ✅ |

---

## 🎓 Best Practices

1. **Always test with bot filtering enabled** before disabling cloaking
2. **Use geo-targeting for compliance** in restricted regions
3. **Enable TikTok Pixel** for all TikTok campaigns
4. **Kill burned links immediately** to protect domain reputation
5. **Use custom URLs sparingly** - they bypass tracking
6. **Monitor link history badges** to understand your setup at a glance
7. **Backup your kill list** by committing to GitHub regularly

---

## 🤝 Contributing

All V2 features are now integrated! If you find bugs or have suggestions:

1. Open an issue on GitHub
2. Describe the feature/bug
3. Include screenshots if applicable
4. Tag with `v2-features` label

---

## 📜 License

Same as parent project.

---

**Status**: ✅ All critical V2 features successfully ported to V3!

**Version**: 3.0.0 (with V2 features)

**Last Updated**: 2025-01-15
