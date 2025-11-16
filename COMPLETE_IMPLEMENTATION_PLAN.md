# InvisiLink Console V3 - Complete Implementation Roadmap
**For $40k/Month Affiliate Operation**

---

## 📋 Executive Summary

**Current State** (Phase 1 Complete ✅):
- Revenue: $80k over 2 months ($40k/month profit)
- Vercel Postgres database (data loss prevention)
- Facebook + TikTok platform support
- RedTrack auto-sync every 30 minutes
- CSV spend import system
- Link performance dashboard with ROI tracking
- Custom domain setup guides

**Remaining Challenges**:
1. **Mobile Usability**: Can't upload competitors or spark codes from phone
2. **SMM Integration**: No TikTok boost automation
3. **Advanced Analytics**: No spark code ROI tracking or alerts
4. **Scale Features**: No A/B testing or export functionality

**Solution**: 4-phase upgrade (Phases 2-5) over 3-4 weeks

---

## ✅ Phase 1: Production Infrastructure (COMPLETED)

**Timeline**: 8-9 days
**Status**: ✅ Deployed Successfully (Jan 2025)

### Deliverables

1. **✅ Vercel Postgres Database**
   - Schema: links, spark_codes, metrics_cache, spend_tracking, kill_list
   - Repository pattern with type safety
   - Migration system with rollback

2. **✅ Facebook Platform Support**
   - Platform selector (TikTok/Facebook)
   - Direct tracking (FB-compliant)
   - Redirect tracking (testing only)
   - Facebook Pixel + App ID configuration

3. **✅ RedTrack Auto-Sync**
   - Syncs every 30 minutes via Vercel Cron
   - Link-level tracking (sub9)
   - Spark code tracking (sub1)
   - Account tracking (sub20)

4. **✅ CSV Spend Import**
   - Smart format detection (TikTok/Facebook/Custom)
   - Auto-extracts account numbers from campaign names
   - Drag-drop UI with preview

5. **✅ Link Performance Dashboard**
   - Real-time ROI calculations per link
   - Profit/revenue/spend tracking
   - Inline kill switch
   - Platform filtering
   - Date range selection (7/30 days)

6. **✅ Documentation**
   - DOMAIN_SETUP.md with step-by-step guides
   - TikTok tracking domain setup
   - Facebook cloak domain setup

### Deployment
- **Committed**: 9751753
- **Status**: Live on Vercel
- **Cost**: $0-20/month (Vercel Postgres free tier or Pro)

---

## 📱 Phase 2: Mobile Optimization (4-5 days)

**Priority**: CRITICAL
**Goal**: Upload competitors & spark codes from phone
**Status**: 🔄 In Progress

### Week 1: Core Mobile UI (Days 1-3)

#### Day 1: Mobile Navigation ⏱️ 8 hours

**What We're Building:**
- Mobile drawer menu (replaces fixed sidebar)
- Bottom navigation bar (iOS/Android style)
- Sticky mobile header with hamburger menu

**Components to Create:**
```
/components/mobile/
  ├── mobile-nav.tsx       # Bottom nav bar
  ├── mobile-header.tsx    # Top header with menu
  └── mobile-drawer.tsx    # Sidebar drawer (Sheet)
```

**Navigation Structure:**

Bottom Nav (Always Visible):
```
┌──────────────────────────────────┐
│ [📊] [🔗] [⚡] [📈] [•••]      │
│ Dash Links Spark Perf More       │
└──────────────────────────────────┘
```

Drawer Menu (Slides from left):
```
┌─────────────────────┐
│ InvisiLink Console  │
├─────────────────────┤
│ 🏠 Dashboard        │
│ 🔗 Link Generator   │
│ ⚡ Spark Codes      │
│ 📈 Performance      │
│ 🕵️ Competitors      │
│ ⚙️ Setup           │
│ 📊 Analytics        │
│ 🚪 Logout          │
└─────────────────────┘
```

**Breakpoint Strategy:**
- Mobile: `< 768px` (drawer + bottom nav)
- Tablet: `768px - 1024px` (drawer, no bottom nav)
- Desktop: `> 1024px` (fixed sidebar)

**Files to Modify:**
- `/app/layout.tsx` - Conditional rendering
- `/components/sidebar.tsx` - Hide on mobile

**Testing:**
- Chrome DevTools mobile emulation
- Real iPhone/Android test

---

#### Day 2: Upload Interfaces ⏱️ 10 hours

**What We're Building:**
- Mobile-optimized file upload for Competitors page
- Mobile-optimized file upload for Spark Codes page
- Native file picker (no drag-drop on mobile)
- Upload progress indicators
- Swipeable preview carousels

**Components to Create:**
```
/components/mobile/
  ├── mobile-upload.tsx       # Optimized upload button
  ├── mobile-file-preview.tsx # Swipeable carousel preview
  └── upload-progress.tsx     # Progress bar + status
```

**Before** (Current Desktop Flow):
```tsx
// react-dropzone (poor mobile UX)
<div {...getRootProps()} className="h-64 border-dashed">
  Drag & drop or click to browse
</div>
```

**After** (Mobile-Optimized):
```tsx
<MobileUpload
  accept="image/*,video/*"
  multiple
  onUpload={handleUpload}
  maxSize={50 * 1024 * 1024} // 50MB
  showCamera // Opens camera on mobile
>
  <Button className="h-14 w-full text-lg">
    📸 Take Photo / Choose Files
  </Button>
</MobileUpload>

{files.length > 0 && (
  <MobileFilePreview
    files={files}
    onRemove={removeFile}
    swipeable
  />
)}
```

**Features:**
- Large touch target (56px button)
- Native file picker (camera option on mobile)
- Image compression before upload (reduce bandwidth)
- Swipeable carousel for previews
- Progress bar during upload
- Thumbnail generation

**Pages to Update:**
- `/app/competitors/page.tsx` - Competitor ad upload
- `/app/spark-codes/page.tsx` - Spark code media upload

**Dependencies:**
```json
{
  "embla-carousel-react": "^8.0.0", // Swipeable carousels
  "browser-image-compression": "^2.0.2" // Compress before upload
}
```

**Testing:**
- Upload from camera (phone only)
- Upload multiple files
- Test on slow 3G connection
- Verify image compression

---

#### Day 3: Forms & Core Pages ⏱️ 10 hours

**What We're Building:**
- Mobile-friendly Link Generator form
- Larger touch targets (44px minimum)
- Bottom sheet for advanced options
- Mobile-optimized dashboard

**Form Strategy:**

Desktop (3-column layout):
```
[Platform] [Offer  ] [Account]
[Domain  ] [Spark  ] [Options]
```

Mobile (Stacked, full-width):
```
[Platform Selection ▼]
[Offer Selection    ▼]
[Account Number     ]
[Domain Selection   ▼]
[Spark Code         ▼]
[⚙️ Advanced Options]  ← Collapsed by default
[🚀 Generate Links  ]  ← 56px tall button
```

**Components to Create:**
```
/components/mobile/
  ├── mobile-form-field.tsx    # Full-width input with 44px height
  ├── mobile-select.tsx        # Native select on mobile
  ├── mobile-bottom-sheet.tsx  # Advanced options panel
  └── mobile-card.tsx          # Stat cards optimized
```

**Pages to Update:**
- `/app/links/page.tsx` - Link generator
- `/app/page.tsx` - Dashboard cards
- `/app/spark-codes/page.tsx` - Spark code grid

**Responsive Patterns:**
```tsx
// Mobile-first approach
<div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">

// Large touch targets
<Button className="h-12 md:h-10 min-h-touch">

// Full width on mobile
<Input className="w-full md:w-auto">

// Hide on mobile, show on desktop
<div className="hidden md:block">

// Show on mobile, hide on desktop
<div className="md:hidden">
```

**Testing:**
- Form submission on mobile
- Keyboard behavior (iOS/Android)
- Select dropdowns native picker
- Advanced options sheet

---

### Week 2: Tables & Polish (Days 4-5)

#### Day 4: Tables → Cards ⏱️ 8 hours

**What We're Building:**
- Convert Performance table to mobile card layout
- Add swipe actions (kill, copy, view)
- Expandable rows for full details

**Desktop Table** (13+ columns):
```
| Link | Offer | Account | Platform | Clicks | Conv | Revenue | Spend | Profit | ROI | CVR | EPC | Action |
```

**Mobile Cards** (Swipeable):
```
┌────────────────────────────────┐
│ apple-111-abc123              │
│ TikTok • Account 1639         │
│                                │
│ Revenue: $245.67  ↗️ +12%     │
│ Spend: $89.23                 │
│ Profit: $156.44               │
│ ROI: 175% 🟢                  │
│                                │
│ Clicks: 1,234 • CVR: 2.4%    │
│ EPC: $0.19 • Conv: 30        │
│                                │
│ [View Full Details ▼]         │
│ [💀 Kill Link] [📋 Copy URL]  │
└────────────────────────────────┘
```

**Components to Create:**
```
/components/mobile/
  ├── mobile-performance-card.tsx # ROI card with swipe
  ├── mobile-link-history-card.tsx # Link history card
  └── swipeable-action.tsx        # Swipe to reveal actions
```

**Features:**
- Color-coded ROI (red/yellow/green)
- Swipe left to reveal kill/copy actions
- Tap to expand full details
- Pull to refresh
- Infinite scroll (load more)

**Pages to Update:**
- `/app/performance/page.tsx` - Performance dashboard
- `/app/links/page.tsx` - Link history section

**Dependencies:**
```json
{
  "react-swipeable": "^7.0.1" // Swipe gestures
}
```

**Testing:**
- Swipe gestures (left/right)
- Tap to expand
- Kill link confirmation
- Copy URL to clipboard

---

#### Day 5: Final Polish ⏱️ 8 hours

**What We're Building:**
- Loading skeletons
- Error states
- Empty states
- Touch feedback
- Safe area insets (notched screens)

**Components to Create:**
```
/components/mobile/
  ├── mobile-skeleton.tsx      # Loading placeholders
  ├── mobile-empty-state.tsx   # No data illustrations
  └── mobile-error-state.tsx   # Error messages
```

**Loading Skeletons:**
```tsx
<MobileSkeleton
  type="card"
  count={3}
  animate
/>
```

**Empty States:**
```tsx
<MobileEmptyState
  icon={<Link2 />}
  title="No links yet"
  description="Create your first link to get started"
  action={
    <Button>Generate Link</Button>
  }
/>
```

**Safe Area Insets:**
```css
/* Tailwind config */
padding: {
  'safe-top': 'env(safe-area-inset-top)',
  'safe-bottom': 'env(safe-area-inset-bottom)',
}

/* Usage */
<div className="pt-safe-top pb-safe-bottom">
```

**Testing Checklist:**
- ✅ iPhone 14 Pro (notched screen)
- ✅ iPhone SE (no notch)
- ✅ Samsung Galaxy S23 (Android)
- ✅ iPad (tablet view)
- ✅ Slow 3G network
- ✅ Offline mode
- ✅ Dark mode (if enabled)
- ✅ Landscape orientation

**Performance:**
- Lighthouse mobile score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Core Web Vitals: Green

---

### Phase 2 Deliverables

✅ **Upload from Phone:**
- Upload competitor ads from camera/gallery
- Upload spark code media from camera/gallery
- Image compression (saves bandwidth)
- Progress indicators

✅ **Mobile-Friendly UI:**
- Bottom navigation bar
- Drawer menu
- Touch-optimized forms (44px+ targets)
- Swipeable cards instead of tables

✅ **Core Workflows:**
- Generate links from phone
- Check performance from anywhere
- Kill burning links on the go
- View dashboard metrics

✅ **Build Process:**
- Pre-deployment build testing
- TypeScript error catching
- Mobile device testing
- Vercel preview deployments

---

## 🚀 Phase 3: SMM Panel Integration (3-4 days)

**Goal**: Auto-boost TikTok videos with views, likes, saves
**Services**: SMMFollows or JustAnotherPanel (JAP)
**Status**: 📅 Planned

### Week 3: SMM API Integration (Days 6-9)

#### Day 6: API Setup ⏱️ 6 hours

**What We're Building:**
- SMM panel API client
- Service endpoints
- Error handling
- Order tracking

**Files to Create:**
```
/lib/api/
  └── smm-panel.ts         # API client

/app/api/smm-panel/
  ├── route.ts             # Proxy endpoint
  ├── balance/route.ts     # Check balance
  ├── order/route.ts       # Create order
  └── status/route.ts      # Check order status
```

**API Client** (`/lib/api/smm-panel.ts`):
```typescript
export class SMMPanelAPI {
  private apiKey: string;
  private baseUrl: string;
  private provider: "smmfollows" | "jap";

  async createOrder(params: {
    service: number; // Service ID
    link: string; // TikTok video URL
    quantity: number;
  }): Promise<{ orderId: string; cost: number }> {
    // POST to SMM panel
  }

  async getOrderStatus(orderId: string): Promise<{
    status: "pending" | "processing" | "completed" | "failed";
    remains: number;
  }> {
    // GET order status
  }

  async getBalance(): Promise<number> {
    // GET account balance
  }

  async getServices(): Promise<Service[]> {
    // GET available services
  }
}
```

**Configuration** (`/lib/config.ts`):
```typescript
smmPanel: {
  enabled: true,
  provider: "smmfollows", // or "jap"
  apiKey: process.env.SMM_PANEL_API_KEY || "",
  baseUrl: "https://smmfollows.com/api/v2",
  services: {
    tiktokViews: 1234, // Service ID from panel
    tiktokLikes: 5678,
    tiktokSaves: 9012,
  },
  defaultQuantities: {
    views: 10000,
    likes: 500,
    saves: 200,
  },
  costPerUnit: {
    views: 0.0001, // $1 per 10k views
    likes: 0.002,  // $1 per 500 likes
    saves: 0.005,  // $1 per 200 saves
  }
}
```

**Environment Variables:**
```env
SMM_PANEL_API_KEY=your_api_key_here
SMM_PANEL_PROVIDER=smmfollows
```

**Testing:**
- Test balance check
- Test service list
- Create test order ($0.10)
- Check order status

---

#### Day 7: Boost UI Component ⏱️ 8 hours

**What We're Building:**
- Mobile-first "Boost Video" modal
- Service selection
- Quantity/cost calculator
- Order placement

**Component** (`/components/smm-panel-boost.tsx`):
```tsx
<SMMPanelBoost
  sparkCode={sparkCode}
  onSuccess={(orderId) => {
    toast.success(`Order ${orderId} placed!`);
  }}
/>
```

**Mobile Modal** (Bottom sheet):
```
┌───────────────────────────────┐
│ Boost TikTok Video            │
├───────────────────────────────┤
│ video.tiktok.com/@user/...    │
│                                │
│ ☑️ Views                       │
│   └─ [10,000] - $1.00         │
│                                │
│ ☑️ Likes                       │
│   └─ [  500 ] - $1.00         │
│                                │
│ ☑️ Saves                       │
│   └─ [  200 ] - $1.00         │
│                                │
│ ┌──────────────────────────┐  │
│ │ Total: $3.00             │  │
│ │ Balance: $47.25          │  │
│ └──────────────────────────┘  │
│                                │
│ [Place Order]                  │
└───────────────────────────────┘
```

**Features:**
- Toggle services on/off
- Adjust quantities with slider
- Real-time cost calculation
- Balance check before order
- Order confirmation
- Success/error feedback

**Database Schema:**
```sql
CREATE TABLE smm_orders (
  id SERIAL PRIMARY KEY,
  spark_code_id TEXT NOT NULL,
  tiktok_url TEXT NOT NULL,
  service_type TEXT NOT NULL, -- 'views', 'likes', 'saves'
  quantity INTEGER NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  order_id TEXT, -- SMM panel order ID
  status TEXT DEFAULT 'pending',
  provider TEXT, -- 'smmfollows', 'jap'
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  FOREIGN KEY (spark_code_id) REFERENCES spark_codes(id)
);
```

**Testing:**
- Open modal on mobile
- Adjust quantities
- Check cost calculation
- Place test order
- Verify database storage

---

#### Day 8: Spark Code Integration ⏱️ 6 hours

**What We're Building:**
- "Boost" button on each spark code
- TikTok URL parser
- Boost status display
- Spend tracking

**Spark Code Card** (Updated):
```
┌────────────────────────────────┐
│ SC-12345                       │
│ Apple Offer • TikTok           │
│ 1.2M views • 45K likes         │
│                                 │
│ video.tiktok.com/@user/123...  │
│                                 │
│ 🚀 Boosted: +10K views         │
│ ⏳ Processing: +500 likes      │
│                                 │
│ [🚀 Boost More] [📊 Analytics] │
└────────────────────────────────┘
```

**TikTok URL Parser:**
```typescript
function parseTikTokUrl(url: string): {
  username: string;
  videoId: string;
  isValid: boolean;
} {
  // Parse: tiktok.com/@username/video/1234567890
  // Parse: vm.tiktok.com/abc123
  // Parse: vt.tiktok.com/xyz789
}
```

**Boost Status Display:**
```tsx
<BoostStatus
  orders={sparkCode.smmOrders}
  compact // Mobile view
/>

// Shows:
// ✅ Completed: +10K views ($1.00)
// ⏳ Processing: +500 likes ($1.00)
// ❌ Failed: +200 saves (refunded)
```

**Pages to Update:**
- `/app/spark-codes/page.tsx` - Add boost button
- `/components/spark-code-manager.tsx` - Add TikTok URL field

**Testing:**
- Parse various TikTok URL formats
- Display boost status
- Show cost in spark code metrics
- Update after order completes

---

#### Day 9: Automation & Polish ⏱️ 6 hours

**What We're Building:**
- Auto-boost new spark codes (optional)
- Bulk boost multiple codes
- Budget limits
- Cost tracking in ROI

**Auto-Boost Feature:**
```typescript
// /lib/services/auto-boost.ts
export async function autoBoostNewSparkCode(sparkCodeId: string) {
  const config = getAutoBoostConfig();

  if (!config.enabled) return;

  // Auto-order based on config
  await createBoostOrder({
    sparkCodeId,
    services: config.defaultServices,
    quantities: config.defaultQuantities,
  });
}
```

**Config** (`/lib/config.ts`):
```typescript
autoBoost: {
  enabled: false, // Toggle in settings
  defaultServices: ["views", "likes"],
  defaultQuantities: {
    views: 5000,
    likes: 250,
  },
  maxBudgetPerCode: 2.00, // $2 max per spark code
}
```

**Bulk Boost UI:**
```
[Select All Spark Codes]

☑️ SC-12345 (Apple)
☑️ SC-67890 (CashApp)
☐ SC-11111 (Shein)

[Boost Selected (2)] - $4.00
```

**ROI Integration:**
- Include SMM costs in spend tracking
- Show boost spend in performance dashboard
- Calculate true ROI (revenue - ad_spend - boost_spend)

**Pages to Update:**
- `/app/performance/page.tsx` - Include boost spend
- `/lib/services/dashboard-service.ts` - Query smm_orders

**Testing:**
- Auto-boost new spark code
- Bulk boost 3 codes
- Check budget limits
- Verify ROI calculations

---

### Phase 3 Deliverables

✅ **SMM Panel Integration:**
- SMMFollows/JAP API client
- Balance checking
- Order placement
- Status tracking

✅ **Boost Functionality:**
- One-tap boost from mobile
- Service selection (views, likes, saves)
- Quantity/cost calculator
- Order history

✅ **Automation:**
- Auto-boost new spark codes
- Bulk boost multiple codes
- Budget limits per code
- Cost tracking in ROI

✅ **Mobile-Optimized:**
- Bottom sheet boost modal
- Large touch targets
- Native sliders for quantities
- Swipeable service selection

---

## 📊 Phase 4: Advanced Analytics (5-6 days)

**Goal**: Spark code ROI tracking + automated alerts
**Status**: 📅 Planned

### Week 4-5: Analytics & Alerts (Days 10-15)

#### Days 10-11: Spark Code Performance ⏱️ 16 hours

**What We're Building:**
- Spark code ROI dashboard
- Creator commission calculator
- Platform comparison (TikTok vs FB)
- Best/worst performers

**Dashboard Page** (`/app/spark-analytics/page.tsx`):
```
┌────────────────────────────────┐
│ Spark Code Performance        │
├────────────────────────────────┤
│ Top Performers (7 days)        │
│                                │
│ 1. SC-12345 (Apple)           │
│    Revenue: $1,245.67         │
│    Boost Cost: $15.00         │
│    ROI: 8,204%  🟢            │
│                                │
│ 2. SC-67890 (CashApp)         │
│    Revenue: $892.34           │
│    Boost Cost: $12.00         │
│    ROI: 7,336%  🟢            │
├────────────────────────────────┤
│ Bottom Performers              │
│                                │
│ 5. SC-11111 (Shein)           │
│    Revenue: $12.45            │
│    Boost Cost: $18.00         │
│    ROI: -31%  🔴              │
│    [⚠️ Stop Boosting]          │
└────────────────────────────────┘
```

**Metrics Tracked:**
- Revenue per spark code (from RedTrack sub1)
- Boost spend (from smm_orders)
- Commission cost (configurable %)
- Net profit (revenue - boost - commission)
- ROI ((profit / total_cost) * 100)

**Creator Commission Calculator:**
```typescript
// Configuration
commissionRates: {
  tiktok: 0.20, // 20% of revenue
  facebook: 0.15, // 15% of revenue
}

// Calculation
const commission = revenue * commissionRate;
const netProfit = revenue - boostSpend - commission;
const roi = ((netProfit / (boostSpend + commission)) * 100);
```

**Platform Comparison:**
```
TikTok Spark Codes:
- Total: 45 codes
- Avg Revenue: $125.34
- Avg ROI: 425%
- Top Performer: SC-12345

Facebook Spark Codes:
- Total: 12 codes
- Avg Revenue: $89.67
- Avg ROI: 312%
- Top Performer: SC-99999
```

**SQL Query:**
```sql
SELECT
  sc.id,
  sc.name,
  sc.platform,
  SUM(m.revenue) as revenue,
  COALESCE(SUM(o.cost), 0) as boost_cost,
  (SUM(m.revenue) * $1) as commission,
  (SUM(m.revenue) - COALESCE(SUM(o.cost), 0) - (SUM(m.revenue) * $1)) as net_profit,
  CASE
    WHEN (COALESCE(SUM(o.cost), 0) + (SUM(m.revenue) * $1)) > 0
    THEN ((SUM(m.revenue) - COALESCE(SUM(o.cost), 0) - (SUM(m.revenue) * $1)) / (COALESCE(SUM(o.cost), 0) + (SUM(m.revenue) * $1))) * 100
    ELSE 0
  END as roi
FROM spark_codes sc
LEFT JOIN metrics_cache m ON m.source_id = sc.id AND m.source_type = 'spark_code'
LEFT JOIN smm_orders o ON o.spark_code_id = sc.id
WHERE sc.created_at >= $2
GROUP BY sc.id
ORDER BY roi DESC;
```

**Testing:**
- View top/bottom performers
- Calculate commission
- Compare TikTok vs Facebook
- Filter by date range

---

#### Days 12-13: Automated Alerts ⏱️ 16 hours

**What We're Building:**
- Email alerts (Resend.com)
- Burning link alerts
- Winner alerts
- Budget warnings
- Daily summary email

**Alert Service** (`/lib/services/alert-service.ts`):
```typescript
export class AlertService {
  async sendBurningLinkAlert(link: LinkPerformance) {
    // ROI < -50% AND spend > $50
    await resend.emails.send({
      from: 'InvisiLink <alerts@invisilink.com>',
      to: userEmail,
      subject: '🔥 Link Burning Money!',
      react: BurningLinkEmail({ link }),
    });
  }

  async sendWinnerAlert(link: LinkPerformance) {
    // ROI > 200% AND revenue > $100
    await resend.emails.send({
      from: 'InvisiLink <alerts@invisilink.com>',
      to: userEmail,
      subject: '🚀 Winner Detected!',
      react: WinnerLinkEmail({ link }),
    });
  }

  async sendDailySummary() {
    const summary = await getDailySummary();
    await resend.emails.send({
      from: 'InvisiLink <alerts@invisilink.com>',
      to: userEmail,
      subject: '📊 Daily Summary',
      react: DailySummaryEmail({ summary }),
    });
  }
}
```

**Email Templates** (`/emails/`):
```tsx
// /emails/burning-link.tsx
export function BurningLinkEmail({ link }) {
  return (
    <Html>
      <Head />
      <Body>
        <h1>🔥 Link Burning Money!</h1>
        <p>Link {link.slug} is losing money:</p>
        <ul>
          <li>Spend: ${link.spend}</li>
          <li>Revenue: ${link.revenue}</li>
          <li>Loss: -${link.profit}</li>
          <li>ROI: {link.roi}%</li>
        </ul>
        <Button href={`https://invisilink.com/performance`}>
          Kill Link Now
        </Button>
      </Body>
    </Html>
  );
}
```

**Cron Jobs** (Vercel Cron):
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-redtrack",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/cron/check-alerts",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/daily-summary",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Alert Rules** (Configurable):
```typescript
alertRules: {
  burningLink: {
    enabled: true,
    roiThreshold: -50, // ROI < -50%
    spendThreshold: 50, // Spend > $50
  },
  winnerLink: {
    enabled: true,
    roiThreshold: 200, // ROI > 200%
    revenueThreshold: 100, // Revenue > $100
  },
  budgetWarning: {
    enabled: true,
    dailyBudget: 500, // Alert at $500/day
    warningPercent: 80, // Alert at 80% ($400)
  }
}
```

**SMS Alerts** (Optional, Twilio):
```typescript
async sendSMS(message: string) {
  await twilio.messages.create({
    body: message,
    from: '+1234567890',
    to: userPhone,
  });
}
```

**Dependencies:**
```json
{
  "resend": "^3.0.0",
  "react-email": "^2.0.0",
  "twilio": "^4.0.0" // Optional
}
```

**Testing:**
- Trigger burning link alert
- Trigger winner alert
- Send daily summary
- Test SMS (if enabled)

---

#### Days 14-15: Enhanced Dashboard ⏱️ 16 hours

**What We're Building:**
- Today vs yesterday comparison
- 7-day and 30-day trends
- Top 5/Bottom 5 performers
- Real-time profit tracking
- Mini sparkline charts

**Dashboard Updates** (`/app/page.tsx`):
```
┌────────────────────────────────┐
│ Today vs Yesterday             │
├────────────────────────────────┤
│ Revenue: $1,245.67  ↗️ +23%    │
│ Spend: $456.78      ↗️ +15%    │
│ Profit: $788.89     ↗️ +28%    │
│ ROI: 173%           ↗️ +8%     │
├────────────────────────────────┤
│ 7-Day Trend                    │
│ [Revenue sparkline chart]      │
│ [Profit sparkline chart]       │
├────────────────────────────────┤
│ Top 5 Links (by profit)        │
│ 1. apple-111-abc  $156.44      │
│ 2. cash-222-xyz   $134.23      │
│ 3. shein-333-def  $98.76       │
│ 4. venmo-444-ghi  $87.65       │
│ 5. apple-555-jkl  $76.54       │
├────────────────────────────────┤
│ Bottom 5 (to kill)             │
│ 1. apple-999-zzz  -$45.67  🔴  │
│ 2. cash-888-yyy   -$34.56  🔴  │
│ 3. shein-777-xxx  -$23.45  🔴  │
│    [Kill These Links]          │
└────────────────────────────────┘
```

**Sparkline Charts:**
```tsx
import { Sparklines, SparklinesLine } from 'react-sparklines';

<Sparklines data={last7DaysRevenue}>
  <SparklinesLine color="green" />
</Sparklines>
```

**Real-Time Updates:**
```typescript
// Use SWR for auto-refresh
const { data, error } = useSWR('/api/dashboard', fetcher, {
  refreshInterval: 60000, // 1 minute
});
```

**Dependencies:**
```json
{
  "react-sparklines": "^1.7.0",
  "swr": "^2.0.0"
}
```

**Testing:**
- View today vs yesterday
- Check trend charts
- Verify top/bottom 5
- Test auto-refresh

---

### Phase 4 Deliverables

✅ **Spark Code Analytics:**
- ROI per spark code
- Revenue tracking
- Boost cost tracking
- Commission calculations
- Best/worst performers

✅ **Automated Alerts:**
- Email alerts (burning links, winners)
- Daily summary email (9 AM)
- Budget warnings
- SMS alerts (optional)

✅ **Enhanced Dashboard:**
- Today vs yesterday comparison
- 7-day and 30-day trends
- Top 5/Bottom 5 performers
- Real-time updates
- Sparkline charts

---

## 🔥 Phase 5: Scale Features (6-7 days)

**Goal**: A/B testing, exports, API access
**Status**: 📅 Planned

### Week 6-7: Advanced Features (Days 16-22)

#### Days 16-17: Advanced CSV Import ⏱️ 16 hours

**What We're Building:**
- Bulk CSV upload (multiple files)
- Smart campaign name parsing
- Auto-match to existing accounts
- Import history/audit log

**Bulk Upload UI:**
```
┌────────────────────────────────┐
│ Upload Multiple CSVs           │
├────────────────────────────────┤
│ ☑️ tiktok_jan_2025.csv        │
│ ☑️ facebook_jan_2025.csv      │
│ ☑️ tiktok_feb_2025.csv        │
│                                │
│ [Upload 3 Files]               │
└────────────────────────────────┘
```

**Smart Parsing:**
```typescript
// Extract data from campaign names
parseCampaignName("ApplePay-1639-SC5-tiktok-v2") => {
  offer: "apple",
  account: "1639",
  sparkCode: "SC5",
  platform: "tiktok",
  variant: "v2"
}
```

**Auto-Matching:**
```typescript
// Match imported data to existing links
const link = await findLinkByPattern({
  account: "1639",
  offer: "apple",
  dateRange: [startDate, endDate]
});

if (link) {
  // Update spend for existing link
} else {
  // Create new spend entry
}
```

**Import History:**
```sql
CREATE TABLE import_history (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  row_count INTEGER,
  imported_count INTEGER,
  failed_count INTEGER,
  total_spend DECIMAL(10,2),
  errors JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Testing:**
- Upload 3 CSVs at once
- Verify smart parsing
- Check auto-matching
- View import history

---

#### Days 18-19: A/B Testing Framework ⏱️ 16 hours

**What We're Building:**
- Create test variants
- 50/50 traffic split
- Track performance per variant
- Auto-winner selection

**Variant Creation:**
```
┌────────────────────────────────┐
│ Create A/B Test                │
├────────────────────────────────┤
│ Test Name: Apple Offer Test    │
│                                │
│ Variant A:                     │
│ - White Page: template-1       │
│ - Headline: "Get $750 Now"     │
│                                │
│ Variant B:                     │
│ - White Page: template-2       │
│ - Headline: "Free $750 Gift"   │
│                                │
│ Traffic Split: 50/50           │
│ Min Sample: 1000 clicks        │
│                                │
│ [Start Test]                   │
└────────────────────────────────┘
```

**Traffic Router:**
```typescript
// Deterministic split based on click ID
function getVariant(clickId: string): 'A' | 'B' {
  const hash = hashClickId(clickId);
  return hash % 2 === 0 ? 'A' : 'B';
}
```

**Performance Tracking:**
```sql
CREATE TABLE ab_test_results (
  id SERIAL PRIMARY KEY,
  test_id TEXT NOT NULL,
  variant TEXT NOT NULL, -- 'A' or 'B'
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  cvr DECIMAL(5,2),
  significance DECIMAL(5,2)
);
```

**Winner Detection:**
```typescript
// Calculate statistical significance
function calculateSignificance(variantA, variantB) {
  // Chi-square test or Z-test
  const pValue = chiSquareTest(variantA, variantB);
  return pValue < 0.05 ? 'significant' : 'not_significant';
}

// Auto-select winner
if (clicks > minSample && significance === 'significant') {
  const winner = variantA.cvr > variantB.cvr ? 'A' : 'B';
  await setWinner(testId, winner);
}
```

**Testing:**
- Create A/B test
- Route traffic 50/50
- Track metrics
- Verify winner selection

---

#### Day 20: Export Functionality ⏱️ 8 hours

**What We're Building:**
- Export links to CSV
- Export metrics to CSV
- Export spend to CSV
- Schedule exports

**Export UI:**
```
┌────────────────────────────────┐
│ Export Data                    │
├────────────────────────────────┤
│ ☑️ Links                       │
│ ☑️ Metrics                     │
│ ☑️ Spend                       │
│                                │
│ Date Range: Last 30 days ▼    │
│ Format: CSV ▼                  │
│                                │
│ [Download Export]              │
│ [Schedule Weekly Email]        │
└────────────────────────────────┘
```

**CSV Generator:**
```typescript
async function exportToCSV(type: 'links' | 'metrics' | 'spend', dateRange) {
  const data = await fetchData(type, dateRange);
  const csv = convertToCSV(data);
  return csv;
}
```

**Scheduled Exports:**
```typescript
// Cron job
async function sendWeeklyExport() {
  const csv = await exportToCSV('metrics', { days: 7 });
  await resend.emails.send({
    to: userEmail,
    subject: 'Weekly Metrics Export',
    attachments: [
      {
        filename: 'metrics.csv',
        content: csv,
      }
    ]
  });
}
```

**Testing:**
- Export links CSV
- Export metrics CSV
- Export spend CSV
- Schedule weekly export

---

#### Days 21-22: REST API (Optional) ⏱️ 16 hours

**What We're Building:**
- API key authentication
- Endpoints for links, metrics, spend
- Webhooks for events
- Rate limiting

**API Structure:**
```
/api/v1/
  ├── auth/           # API key management
  ├── links/          # CRUD links
  ├── metrics/        # Get metrics
  ├── spend/          # Get/create spend
  ├── spark-codes/    # CRUD spark codes
  └── webhooks/       # Event subscriptions
```

**Authentication:**
```typescript
// Middleware
async function authenticate(req: Request) {
  const apiKey = req.headers.get('X-API-Key');
  const user = await verifyApiKey(apiKey);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
```

**Rate Limiting:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
});

// 100 requests per hour
const { success } = await ratelimit.limit(apiKey);
if (!success) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

**Webhooks:**
```typescript
// Send webhook on events
async function sendWebhook(event: {
  type: 'link.created' | 'link.killed' | 'order.completed';
  data: any;
}) {
  const webhookUrl = getUserWebhookUrl();
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
}
```

**Dependencies:**
```json
{
  "@upstash/ratelimit": "^1.0.0",
  "@upstash/redis": "^1.0.0"
}
```

**Testing:**
- Create API key
- Test endpoints
- Verify rate limiting
- Test webhooks

---

### Phase 5 Deliverables

✅ **Advanced CSV Import:**
- Bulk upload (multiple files)
- Smart parsing
- Auto-matching
- Import history

✅ **A/B Testing:**
- Create test variants
- 50/50 traffic split
- Performance tracking
- Auto-winner selection

✅ **Export Functionality:**
- Export to CSV
- Scheduled exports
- Email delivery

✅ **REST API:**
- Authentication
- CRUD endpoints
- Webhooks
- Rate limiting

---

## 📅 Complete Timeline

| Phase | Features | Duration | Status |
|-------|----------|----------|--------|
| **Phase 1** | Database, Facebook, Auto-sync, CSV, Dashboard | 8-9 days | ✅ Complete |
| **Phase 2** | Mobile navigation, uploads, forms, tables | 4-5 days | 🔄 In Progress |
| **Phase 3** | SMM panel integration, boost automation | 3-4 days | 📅 Planned |
| **Phase 4** | Spark analytics, alerts, enhanced dashboard | 5-6 days | 📅 Planned |
| **Phase 5** | A/B testing, exports, API | 6-7 days | 📅 Planned |
| **Total** | **Complete production system** | **26-31 days** | **3-4 weeks** |

---

## 💰 Total Cost Breakdown

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Vercel Postgres | $0-20 | Free tier or Pro |
| Domain names | $3 | 3-5 domains amortized |
| SMM panel credits | $50-500 | Variable usage |
| Resend email | $0 | Free tier (100/day) |
| Twilio SMS | $3 | Optional |
| Upstash Redis | $0 | Free tier (API rate limiting) |
| **Total** | **$56-526/month** | **0.14-1.3% of revenue** |

**At $40k/month profit**: Negligible operational cost

---

## 🎯 Success Metrics

### After Phase 2 (Mobile) - Current Goal
- ✅ Upload competitor ad from phone in <30 seconds
- ✅ Create spark code from phone in <1 minute
- ✅ Check performance metrics from anywhere
- ✅ Kill burning links on the go

### After Phase 3 (SMM)
- ✅ Boost new spark codes with 1 tap
- ✅ See boost costs in ROI calculations
- ✅ Track which codes were boosted
- ✅ Automate initial boost for testing

### After Phase 4 (Analytics)
- ✅ Get alerts before links burn money
- ✅ Know which spark codes are profitable
- ✅ Compare TikTok vs Facebook accurately
- ✅ Make data-driven decisions

### After Phase 5 (Scale)
- ✅ Run systematic A/B tests
- ✅ Export data for accounting/taxes
- ✅ API for custom integrations
- ✅ Scale to $100k+/month

---

## 🚀 ROI Projection

**Conservative Estimates:**

| Improvement | Monthly Impact |
|-------------|---------------|
| 10% better decisions (Phase 4 alerts) | +$4,000 |
| 20% reduction in wasted spend | +$8,000 |
| 5% boost from A/B testing (Phase 5) | +$2,000 |
| **Total Monthly Benefit** | **+$14,000** |

**Investment:**
- Development time: 26-31 days
- Monthly cost: $56-526
- **Payback period**: 1-2 days

---

## ⚠️ Critical Notes

1. **Mobile First**: All new features built mobile-first, desktop second
2. **Local Testing**: Always run `npm run build` before deploying
3. **SMM Credits**: Load SMM panel with $50-100 to start
4. **API Keys Required**:
   - `NEXT_PUBLIC_REDTRACK_API_KEY` (RedTrack)
   - `SMM_PANEL_API_KEY` (SMMFollows/JAP)
   - `BLOB_READ_WRITE_TOKEN` (Vercel Blob)
   - `RESEND_API_KEY` (Email alerts, Phase 4)
5. **ADHD-Friendly**: Every feature designed for quick, low-friction use

---

## 📝 Next Steps

1. ✅ **Phase 1 Complete** - Database, FB support, auto-sync deployed
2. 🔄 **Phase 2 Starting** - Mobile optimization (Days 1-5)
3. 📅 **Phase 3 Queued** - SMM panel integration (Days 6-9)
4. 📅 **Phase 4 Queued** - Analytics & alerts (Days 10-15)
5. 📅 **Phase 5 Queued** - A/B testing & API (Days 16-22)

---

**Last Updated**: January 2025
**Current Status**: Phase 2 (Mobile Optimization) in progress
**Next Milestone**: Mobile-friendly upload interfaces (Day 2)
