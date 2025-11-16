# InvisiLink Console V3 - Production Upgrade Plan
**For $40k/Month Affiliate Operation**

## Executive Summary

**Current State:**
- Revenue: $80k over 2 months ($40k/month profit)
- All data in localStorage (ONE BROWSER CLEAR = TOTAL DATA LOSS)
- No spend tracking system
- TikTok only (no Facebook support)
- Manual RedTrack checking
- Churned TikTok accounts (no stable Business Center)

**Critical Problems:**
1. **Data Loss Risk**: Everything in browser storage
2. **No Spend Tracking**: Flying blind on actual ROI
3. **No Facebook Support**: Missing major traffic source
4. **Manual Processes**: Can't maintain due to ADHD
5. **No Performance Visibility**: Don't know which links are profitable

**Solution:** 4-week production infrastructure upgrade

---

## Phase 1: Emergency Infrastructure (Week 1)
**Timeline:** 8-9 days
**Goal:** Prevent data loss, add Facebook, automate everything

### 1.1 Database Setup (Days 1-2)

**Technology:** Vercel Postgres
- **Why:** Native Next.js integration, serverless, auto-scaling
- **Why NOT Supabase:** Extra complexity, another service
- **Why NOT PlanetScale:** MySQL, less Next.js friendly

**Schema:**
```sql
CREATE TABLE links (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  offer_key TEXT NOT NULL,
  offer_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  domain_id TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tracking_url TEXT NOT NULL,
  white_page_url TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  template_name TEXT,
  spark_code_id TEXT,
  platform TEXT DEFAULT 'tiktok', -- 'tiktok' or 'facebook'

  -- V2 features
  custom_url TEXT,
  filter_type TEXT DEFAULT 'params-only',
  disable_cloaking BOOLEAN DEFAULT false,
  geo_enabled BOOLEAN DEFAULT false,
  geo_countries TEXT[],

  -- TikTok config
  tiktok_pixel_enabled BOOLEAN DEFAULT false,
  tiktok_pixel_id TEXT,
  tiktok_browser_redirect BOOLEAN DEFAULT false,
  tiktok_strict_bot BOOLEAN DEFAULT false,

  -- Facebook config
  facebook_pixel_id TEXT,
  facebook_app_id TEXT,
  facebook_tracking_mode TEXT, -- 'direct' or 'redirect'

  -- Status
  is_killed BOOLEAN DEFAULT false,
  killed_at TIMESTAMP,
  kill_reason TEXT
);

CREATE TABLE spark_codes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  spark_code TEXT NOT NULL,
  video_url TEXT,
  platform TEXT NOT NULL, -- 'tiktok' or 'facebook'
  offer_code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  content_type TEXT,
  media_urls TEXT[],
  tags TEXT[]
);

CREATE TABLE metrics_cache (
  id SERIAL PRIMARY KEY,
  source_type TEXT NOT NULL, -- 'link', 'spark_code', 'campaign', 'account'
  source_id TEXT NOT NULL,
  date DATE NOT NULL,
  platform TEXT, -- 'tiktok', 'facebook', 'both'

  -- RedTrack metrics
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  cvr DECIMAL(5,2) DEFAULT 0,
  epc DECIMAL(6,3) DEFAULT 0,

  synced_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_type, source_id, date, platform)
);

CREATE TABLE spend_tracking (
  id SERIAL PRIMARY KEY,
  source_type TEXT NOT NULL, -- 'link', 'account', 'campaign'
  source_id TEXT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  platform TEXT NOT NULL, -- 'tiktok', 'facebook'
  account_id TEXT,
  campaign_name TEXT,
  notes TEXT,
  import_method TEXT, -- 'manual', 'csv'
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(source_type, source_id, date, platform)
);

CREATE TABLE kill_list (
  slug TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  platform TEXT,
  killed_at TIMESTAMP DEFAULT NOW(),
  reason TEXT,
  restored_at TIMESTAMP,
  original_link_data JSONB
);

-- Indexes
CREATE INDEX idx_links_created ON links(created_at DESC);
CREATE INDEX idx_links_platform ON links(platform);
CREATE INDEX idx_links_killed ON links(is_killed);
CREATE INDEX idx_metrics_source ON metrics_cache(source_type, source_id);
CREATE INDEX idx_metrics_date ON metrics_cache(date DESC);
CREATE INDEX idx_metrics_platform ON metrics_cache(platform);
CREATE INDEX idx_spend_source ON spend_tracking(source_type, source_id, date DESC);
CREATE INDEX idx_spend_platform ON spend_tracking(platform);
```

**Files to Create:**
- `/lib/db/schema.sql`
- `/lib/db/client.ts`
- `/lib/db/migrate.ts`
- `/scripts/db-migrate.sh`

**Time:** 8 hours (1 day)

---

### 1.2 LocalStorage Migration (Days 2-3)

**Goal:** Zero-downtime migration with rollback capability

**Implementation:**
1. **Auto-migration on first load**
2. **Visual progress indicator**
3. **Keep localStorage as 30-day backup**
4. **Export backup functionality**

**ADHD-Friendly Approach:**
- No manual steps required
- One-click "Migrate Now" button
- Can skip and do later
- Visual urgency (but no guilt)

**Files to Create:**
- `/lib/db/migration-service.ts`
- `/components/migration-banner.tsx`
- `/app/api/export-backup/route.ts`

**Files to Modify:**
- `/app/layout.tsx` (add MigrationBanner)

**Time:** 12 hours (1.5 days)

---

### 1.3 Facebook Platform Support (Days 3-5)

**Goal:** Support Facebook campaigns alongside TikTok

**Features:**
1. **Platform selector** (TikTok vs Facebook)
2. **FB domain rotation** (separate from TikTok)
3. **FB Pixel injection** in white pages
4. **FB App ID** configuration
5. **Dual tracking modes:**
   - Direct tracking (FB-compliant)
   - Redirect tracking (backup/testing)

**Config Additions:**
```typescript
// lib/config.ts
export const config = {
  // ... existing config

  // Facebook domains (for campaigns)
  facebookDomains: [
    { id: "fb-1", name: "FB Domain 1", url: "https://fb-domain-1.com" },
    { id: "fb-2", name: "FB Domain 2", url: "https://fb-domain-2.com" },
  ],

  // Facebook tracking
  facebook: {
    defaultPixelId: "YOUR_PIXEL_ID",
    defaultAppId: "YOUR_APP_ID",
    trackingModes: ["direct", "redirect"],
    defaultTrackingMode: "direct", // FB-compliant
  },

  // Platform-specific settings
  platforms: {
    tiktok: {
      trackingMode: "redirect",
      macros: "__CAMPAIGN_ID__,__AD_ID__,__CID__",
    },
    facebook: {
      trackingMode: "direct",
      macros: "{{campaign.name}},{{adset.name}},{{ad.name}}",
    },
  },
};
```

**White Page Updates:**
```typescript
// lib/bot-detection.ts - Add FB pixel support
export function buildFacebookPixel(pixelId: string, appId?: string): string {
  return `
    <!-- Facebook Pixel Code -->
    <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    </script>
  `;
}
```

**Link Generator UI Updates:**
```typescript
// app/links/page.tsx additions
const [platform, setPlatform] = useState<'tiktok' | 'facebook'>('tiktok');
const [facebookPixelId, setFacebookPixelId] = useState(config.facebook.defaultPixelId);
const [facebookAppId, setFacebookAppId] = useState(config.facebook.defaultAppId);
const [facebookTrackingMode, setFacebookTrackingMode] = useState<'direct' | 'redirect'>('direct');
```

**Files to Create:**
- `/lib/facebook-tracking.ts` (FB pixel, CAPI placeholders)
- `/lib/direct-tracking.ts` (Universal script for FB direct tracking)
- `/components/platform-selector.tsx`
- `/components/facebook-config.tsx`

**Files to Modify:**
- `/lib/config.ts` (add FB config)
- `/lib/bot-detection.ts` (add FB pixel builder)
- `/lib/white-page-generator.ts` (conditional FB/TT logic)
- `/app/links/page.tsx` (add platform selection + FB fields)

**Time:** 18 hours (2.25 days)

---

### 1.4 CSV Spend Import (Days 5-6)

**Goal:** 15-second spend import from TikTok/FB Ads Manager

**User Flow:**
1. Export campaign report from TikTok/FB (5 seconds)
2. Drag CSV file into console (instant)
3. Console parses and previews (instant)
4. Click "Import All" (5 seconds)
5. Done

**Smart Parsing:**
```typescript
// Extracts account number from campaign name
// Examples:
//   "ApplePay-1639-SC5-tiktok" → account: "1639"
//   "CashApp-3175-SC12-facebook" → account: "3175"
//   "Apple Pay - 1639 - Spark 5" → account: "1639"

function parseCampaignName(name: string): {
  offer: string;
  account: string;
  sparkCode?: string;
  platform: 'tiktok' | 'facebook';
} {
  // Smart regex matching for various formats
}
```

**Supported Formats:**
- TikTok Ads Manager CSV
- Facebook Ads Manager CSV
- Custom CSV (columns: Campaign, Spend, Date)

**Files to Create:**
- `/components/csv-importer.tsx` (drag-drop UI)
- `/lib/services/csv-parser.ts` (TikTok/FB format detection)
- `/app/api/spend/import/route.ts` (bulk insert endpoint)

**Files to Modify:**
- `/app/page.tsx` (add CSV import button)

**Time:** 10 hours (1.25 days)

---

### 1.5 RedTrack Auto-Sync (Days 6-7)

**Goal:** Automatic sync every 30 minutes

**Architecture:**
```
Vercel Cron (every 30 min)
  → /api/cron/sync-redtrack
    → RedTrackSyncService.syncAll()
      → Fetch reports grouped by:
         - sub9 (link slug)
         - sub1 (spark code)
         - sub20 (source)
      → Upsert into metrics_cache
      → Return sync summary
```

**Implementation:**
```typescript
// lib/services/redtrack-sync.ts
export class RedTrackSyncService {
  async syncAll(): Promise<SyncResult> {
    const links = await db.links.findAll({ isKilled: false });
    const today = new Date().toISOString().split('T')[0];
    const dateRange = { from: today, to: today };

    // Fetch all reports
    const [linkReports, sparkReports, sourceReports] = await Promise.all([
      redtrackApi.getReports(dateRange, ['sub9']), // by link
      redtrackApi.getReports(dateRange, ['sub1']), // by spark code
      redtrackApi.getReports(dateRange, ['sub20']), // by source
    ]);

    // Upsert into database
    for (const report of linkReports) {
      await db.metricsCache.upsert({
        source_type: 'link',
        source_id: report.sub9,
        date: today,
        clicks: report.clicks,
        conversions: report.conversions,
        revenue: report.revenue,
        cvr: report.cvr,
        epc: report.epc,
        synced_at: new Date(),
      });
    }

    // Same for spark codes and sources...

    return {
      synced: linkReports.length + sparkReports.length + sourceReports.length,
      timestamp: new Date()
    };
  }
}
```

**Vercel Cron Setup:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/sync-redtrack",
    "schedule": "*/30 * * * *"
  }]
}
```

**Manual Sync:**
```typescript
// Add "Sync Now" button to dashboard
<Button onClick={async () => {
  setLoading(true);
  await fetch('/api/cron/sync-redtrack', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
  });
  setLoading(false);
  toast.success('Synced!');
}}>
  {loading ? <Loader2 className="animate-spin" /> : 'Sync Now'}
</Button>
```

**Files to Create:**
- `/lib/services/redtrack-sync.ts`
- `/app/api/cron/sync-redtrack/route.ts`
- `/components/sync-status.tsx`

**Files to Modify:**
- `/vercel.json` (add cron)
- `/app/page.tsx` (add SyncStatus)

**Environment Variables:**
```env
CRON_SECRET=generate_random_secret_here
```

**Time:** 10 hours (1.25 days)

---

### 1.6 Link Performance Dashboard (Days 7-8)

**Goal:** Real-time ROI tracking with kill switch

**Dashboard Metrics:**
```typescript
interface LinkPerformance {
  slug: string;
  offerName: string;
  accountNumber: string;
  sparkCodeId?: string;
  platform: 'tiktok' | 'facebook';

  // Metrics
  clicks: number;
  conversions: number;
  revenue: number;
  spend: number;
  profit: number; // revenue - spend
  roi: number; // (profit / spend) * 100
  cvr: number;
  epc: number;

  // Status
  isKilled: boolean;
  createdAt: Date;
}
```

**SQL Query:**
```sql
SELECT
  l.slug,
  l.offer_name,
  l.account_number,
  l.spark_code_id,
  l.platform,
  l.is_killed,
  SUM(m.clicks) as clicks,
  SUM(m.conversions) as conversions,
  SUM(m.revenue) as revenue,
  AVG(m.cvr) as cvr,
  AVG(m.epc) as epc,
  COALESCE(SUM(s.amount), 0) as spend,
  (SUM(m.revenue) - COALESCE(SUM(s.amount), 0)) as profit,
  CASE
    WHEN SUM(s.amount) > 0
    THEN ((SUM(m.revenue) - SUM(s.amount)) / SUM(s.amount)) * 100
    ELSE 0
  END as roi
FROM links l
LEFT JOIN metrics_cache m ON m.source_id = l.slug AND m.date >= $1
LEFT JOIN spend_tracking s ON s.source_id = l.account_number AND s.date >= $1
WHERE l.created_at >= $1
GROUP BY l.slug, l.offer_name, l.account_number, l.spark_code_id, l.platform, l.is_killed
ORDER BY roi DESC;
```

**UI Features:**
- **Sortable table** (profit, ROI, clicks, CVR)
- **Color coding:**
  - Red: ROI < 0%
  - Yellow: ROI 0-100%
  - Green: ROI > 100%
- **Kill switch inline**
- **Date range filter** (7 days, 30 days, custom)
- **Platform filter** (All, TikTok, Facebook)
- **Export CSV**

**Files to Create:**
- `/lib/services/dashboard-service.ts`
- `/components/performance-table.tsx`
- `/app/performance/page.tsx`

**Files to Modify:**
- `/app/page.tsx` (add link to performance page)

**Time:** 12 hours (1.5 days)

---

### 1.7 Custom Domain Setup Guides (Day 9)

**Goal:** Documentation for domain purchase and configuration

**Guides to Create:**

1. **TikTok Custom Tracking Domain**
   - Why you need it (professional, better CTR)
   - Where to buy ($10-15/year recommendations)
   - DNS configuration (CNAME setup)
   - RedTrack integration
   - SSL certificate setup
   - Testing verification

2. **Facebook Campaign Domains**
   - Why you need multiple (domain rotation)
   - Recommended count (2-3 to start)
   - DNS configuration
   - SSL setup
   - Adding to V3 console
   - Testing

**Files to Create:**
- `/docs/TIKTOK_TRACKING_DOMAIN.md`
- `/docs/FACEBOOK_DOMAINS.md`
- `/scripts/verify-domain.ts` (domain verification script)

**Time:** 4 hours (0.5 days)

---

## Phase 1 Summary

**Total Time:** 8-9 days (70-80 hours)

**Deliverables:**
- ✅ Vercel Postgres database (prevents data loss)
- ✅ One-click localStorage migration
- ✅ Facebook platform support (dual tracking)
- ✅ CSV spend import (15 seconds/day)
- ✅ RedTrack auto-sync (every 30 min)
- ✅ Performance dashboard (ROI + kill switch)
- ✅ Domain setup guides

**Deployment Strategy:**
1. **Day 1-2:** Deploy database (non-breaking, API only)
2. **Day 3:** Deploy migration banner (opt-in)
3. **Day 5:** Enable Facebook support (additive)
4. **Day 6:** Enable CSV import
5. **Day 7:** Enable auto-sync (background)
6. **Day 9:** Full cutover (migration recommended)

**Cost Breakdown:**
- Vercel Postgres: $0 (free tier) or $20/month (Pro if >256MB)
- Domains: $36/year (~$3/month)
- **Total: $3-23/month**

**At $40k/month profit, this is 0.05% of revenue**

---

## Phase 2: Advanced Analytics (Week 2)
**Timeline:** 7 days

### Deliverables:
1. **Spark Code ROI Tracking**
   - Revenue per spark code
   - Best/worst performers
   - Creator commission calculator
   - Platform comparison (TikTok vs FB spark codes)

2. **Automated Alerts**
   - Email alerts (Resend, free tier)
   - Burning link alerts (ROI < -50%, spend > $50)
   - Winner alerts (ROI > 200%, revenue > $100)
   - Budget warnings (daily spend > threshold)
   - Daily summary email (9 AM)

3. **Enhanced Dashboard**
   - Today vs yesterday comparison
   - 7-day and 30-day trends
   - Top 5 performers (by profit)
   - Bottom 5 performers (to kill)
   - Real-time profit tracking
   - Mini sparkline charts

4. **Multi-Account Management**
   - Track TikTok + FB accounts separately
   - Per-account budgets
   - Account performance comparison
   - Budget progress bars
   - Auto-pause suggestions

**Time:** 56 hours (7 days)

**Monthly Cost:** +$3 (Twilio SMS alerts)

---

## Phase 3: Scale Features (Weeks 3-4)
**Timeline:** 9 days

### Deliverables:
1. **Advanced CSV Import**
   - Bulk upload (multiple CSVs at once)
   - Smart campaign name parsing
   - Auto-match to existing accounts
   - Import history/audit log
   - Error handling + retry

2. **A/B Testing Framework**
   - Create test variants
   - 50/50 traffic split
   - Track performance per variant
   - Auto-winner selection
   - Statistical significance calculator

3. **Export Functionality**
   - Export links to CSV
   - Export metrics to CSV
   - Export spend to CSV
   - Schedule weekly/monthly exports
   - Email exports automatically

4. **REST API**
   - Authentication (API keys)
   - Endpoints for links, metrics, spend
   - Webhooks for real-time events
   - Rate limiting
   - Documentation

5. **Facebook CAPI (Optional)**
   - Server-side conversion tracking
   - Better iOS 14.5+ attribution
   - Automatic event sending
   - Deduplication with pixel

**Time:** 70 hours (9 days)

**Monthly Cost:** $0 (no additional services)

---

## Final Summary

### Total Implementation Time:
- Phase 1: 8-9 days
- Phase 2: 7 days
- Phase 3: 9 days
- **Total: 24-25 days (5 weeks)**

### Total Cost:
- **One-time:** $36/year (domains)
- **Monthly:** $3-26 (database + alerts)
- **At $40k/month profit:** 0.065% of revenue

### Expected Outcomes:

**After Phase 1 (Week 1):**
- Zero data loss risk
- Facebook campaigns enabled
- Spend tracking automated
- RedTrack syncing automatically
- Performance visibility

**After Phase 2 (Week 2):**
- Know best spark codes/offers
- Automated alerts before links burn
- Compare TikTok vs Facebook
- Better decision-making

**After Phase 3 (Weeks 3-4):**
- Systematic A/B testing
- Export data for taxes
- API for integrations
- Scale to $100k+/month

### ROI Projection:

**Conservative estimate:**
- 10% profit increase from better decisions: +$4k/month
- 20% reduction in wasted spend: +$8k/month
- **Total impact: +$12k/month**

**Investment:**
- Development time: 25 days
- Monthly cost: $26/month
- **Payback period: 2 days**

---

## Next Steps

1. **Approve this plan** ✅ (DONE)
2. **Create Vercel Postgres database** (5 minutes)
3. **Set environment variables** (5 minutes)
4. **Begin Phase 1 implementation** (starting now)

**Delivery timeline:** Phase 1 complete in 8-9 days

---

## Notes

- This plan accommodates churned TikTok accounts (CSV import instead of API)
- Facebook support includes both direct (compliant) and redirect tracking
- All migrations are zero-downtime with rollback capability
- ADHD-friendly: auto-prompts, minimal friction, visual urgency
- Scalable to $1M+/month with no architecture changes needed

---

**Last Updated:** 2025-01-15
**Plan Status:** APPROVED - Starting Phase 1
