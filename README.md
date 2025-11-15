# InvisiLink Console V3 🚀

Modern affiliate link cloaking system with TikTok Spark integration and comprehensive tracking.

## Overview

InvisiLink Console V3 is a Next.js 16 application that combines:
- **V3 Features**: Modern UI, Spark Code management, Competitor Ads tracking, RedTrack API integration
- **V2 Features**: Advanced cloaking, Geo-targeting, TikTok optimization, Link Kill Switch

Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.

---

## ✨ Key Features

### Core Functionality
- 🔗 **Link Generation** - Create cloaked affiliate links with bot detection
- 🎯 **Smart Bot Filtering** - Params-only (TikTok optimized) or Advanced (UA + params)
- 📊 **Dashboard Analytics** - Real-time revenue tracking via RedTrack API
- ⚡ **Spark Code Management** - TikTok Spark codes with media uploads
- 👀 **Competitor Ads** - Track and analyze competitor creatives
- 🌐 **Multi-Domain Rotation** - Automatic domain usage balancing

### V2 Advanced Features (NEW)
- 🔥 **Link Kill Switch** - Instantly block burned links with GitHub sync
- 🌍 **Geo-Targeting** - Target 23 Tier 1 countries with client-side blocking
- 📱 **TikTok Suite** - Pixel tracking, browser redirect, strict bot detection
- 🔗 **Custom URLs** - Bypass RedTrack for testing or alternative trackers
- ⚠️ **Disable Cloaking** - Instant redirect mode for testing
- 📊 **Enhanced Metadata** - Comprehensive tracking of all link features

[📖 Full V2 Features Documentation](./V2_FEATURES.md)

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts
- **Storage**: LocalStorage + Vercel Blob (media) + GitHub (persistence)
- **Deployment**: Vercel
- **APIs**: RedTrack, ip-api.com, GitHub

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- GitHub account (for white page deployment)
- RedTrack account (for tracking)
- Vercel account (for deployment)

### Installation

1. Clone the repository
```bash
git clone https://github.com/chrisarmstrong5/invisilink-console-v3.git
cd invisilink-console-v3
```

2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables

Create `.env.local`:
```env
GITHUB_TOKEN=your_github_personal_access_token
```

4. Update configuration

Edit `lib/config.ts` with your:
- RedTrack domain and API key
- RedTrack campaign IDs
- Cloak domains
- TikTok Pixel ID (if using)

5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
invisilink-console-v3/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── links/page.tsx              # Link Generator
│   ├── spark-codes/page.tsx        # Spark Code Manager
│   ├── competitors/page.tsx        # Competitor Ads
│   └── api/
│       ├── whitepage/generate/     # White page generation
│       ├── kill-list/              # Kill switch sync
│       ├── github/commit/          # GitHub integration
│       ├── redtrack/               # RedTrack API proxy
│       └── upload/                 # Media upload
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── geo-targeting-selector.tsx  # V2: Geo-targeting UI
│   ├── tiktok-config.tsx           # V2: TikTok features
│   ├── advanced-link-options.tsx   # V2: Custom URL + disable cloak
│   └── kill-switch-button.tsx      # V2: Kill/restore links
├── lib/
│   ├── config.ts                   # Global configuration
│   ├── bot-detection.ts            # Bot filtering scripts
│   ├── white-page-generator.ts     # White page orchestration
│   ├── kill-list-manager.ts        # V2: Kill switch logic
│   ├── geo-targeting.ts            # V2: Geo-blocking
│   └── tiktok-pixel.ts             # V2: TikTok features
├── public/
│   └── white-pages/
│       ├── templates/              # White page templates
│       └── deploy-root/            # Deployed white pages
└── vercel.json                     # Vercel configuration
```

---

## 🎯 Usage

### Generate a Basic Link

1. Navigate to "Links" page
2. Select offer (e.g., Apple Pay)
3. Enter account number
4. Choose cloak domain
5. Select bot filtering (params-only recommended for TikTok)
6. Click "Generate Links"

### Use Advanced Features

#### Geo-Targeting
1. Expand "Advanced Features (V2)"
2. Enable "Geo-Targeting"
3. Select target countries (e.g., US, GB, CA)
4. Generate link
5. Only selected countries will access offer

#### TikTok Pixel
1. Enable "TikTok Pixel"
2. Enter Pixel ID (or use default)
3. Enable "Force Browser Open" (recommended)
4. Generate link

#### Kill a Link
1. Find link in history
2. Click "Kill" button
3. Confirm action
4. Link is instantly blocked and synced to GitHub

[📖 More Examples in V2_FEATURES.md](./V2_FEATURES.md)

---

## 🔧 Configuration

### RedTrack Setup

Edit `lib/config.ts`:

```typescript
tracker: {
  redtrack: {
    domain: "your-domain.ttrk.io",
    apiKey: "your-api-key",
    campaigns: {
      apple: "campaign-id-1",
      cashapp: "campaign-id-2",
      // ... more campaigns
    }
  }
}
```

### Cloak Domains

```typescript
cloakDomains: [
  {
    id: "domain1",
    name: "Domain Name",
    url: "https://yourdomain.com",
    status: "active"
  },
  // ... more domains
]
```

### GitHub Integration

1. Create Personal Access Token with `repo` permissions
2. Add to `.env.local` as `GITHUB_TOKEN`
3. Configure repo in `lib/config.ts`:

```typescript
github: {
  owner: "your-username",
  repo: "invisilink-console-v3",
  branch: "main",
  token: process.env.GITHUB_TOKEN || ""
}
```

---

## 📊 Dashboard

The dashboard provides:
- **Today vs Yesterday** stats (revenue, clicks, conversions)
- **Revenue Time Series** (7 or 30 days)
- **Campaign Performance** table with:
  - EPC (Earnings Per Click)
  - CVR (Conversion Rate)
  - ROI (Return on Investment)
  - Custom spend tracking

---

## 🎨 White Pages

### Templates

5 storefront templates + 5 legacy templates included:
- Storefront v1-v3 (modern e-commerce designs)
- WhitePage 1-5 (legacy Olive app templates)

### Customization

Templates are in `public/white-pages/templates/`.

To add custom templates:
1. Create HTML file in templates directory
2. Add `{{HEAD_SCRIPT}}` placeholder in `<head>`
3. Register in `lib/config.ts` under `whitePageTemplates`

---

## 🔐 Security

### Environment Variables

Never commit:
- `GITHUB_TOKEN`
- RedTrack API keys
- TikTok Pixel IDs (if sensitive)

### Bot Detection

Two modes:
1. **Params-only**: Checks only `ppc` parameter (TikTok optimized)
2. **Advanced**: Checks `ppc` + user agent patterns

Blocked user agents:
- bot, crawler, spider
- google, facebook
- headless, phantomjs, selenium
- bytedance, tiktok (if strict detection enabled)

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variable: `GITHUB_TOKEN`
4. Deploy

### Manual Deployment

```bash
npm run build
npm run start
```

---

## 🐛 Troubleshooting

### Common Issues

**Links not generating**
- Check RedTrack campaign IDs in config
- Verify GitHub token has repo permissions
- Check browser console for errors

**Geo-targeting not working**
- Verify ip-api.com is accessible
- Clear localStorage `geo_cache`
- Test with VPN

**TikTok Pixel not firing**
- Validate Pixel ID format (20 alphanumeric chars)
- Check TikTok Business Center setup
- Use TikTok Pixel Helper extension

**Kill switch not syncing**
- Verify `GITHUB_TOKEN` environment variable
- Check API logs in Vercel
- Ensure `kill-list.json` exists in repo

[📖 Full Troubleshooting Guide](./V2_FEATURES.md#-troubleshooting)

---

## 📈 Roadmap

### Completed ✅
- [x] V2 Feature Parity
- [x] Link Kill Switch
- [x] Geo-Targeting (23 countries)
- [x] TikTok Advanced Suite
- [x] Custom Redirect URLs
- [x] Enhanced Link Metadata

### Planned 🚧
- [ ] Link Manager Page (dedicated interface)
- [ ] Archive Page (killed links view)
- [ ] Settings Page (centralized config)
- [ ] Edge Config Integration (real-time kill switch)
- [ ] MaxConv Tracker Support
- [ ] E2E Testing Suite
- [ ] Domain Health Metrics

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- Built on Next.js 16 and React 19
- UI components from shadcn/ui and Radix UI
- Inspired by affiliate-cloaking-v2

---

## 📞 Support

- Issues: [GitHub Issues](https://github.com/chrisarmstrong5/invisilink-console-v3/issues)
- Documentation: [V2 Features Guide](./V2_FEATURES.md)
- Contact: Open an issue on GitHub

---

**Version**: 3.0.0 (with V2 features)

**Status**: ✅ Production Ready

**Last Updated**: 2025-01-15
