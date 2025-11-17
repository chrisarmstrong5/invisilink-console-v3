export const config = {
  version: "3.0.0",
  tracker: {
    redtrack: {
      domain: "rgbad.ttrk.io",
      apiKey: "nCrQE1kOLkDCJIv3ICRc",
      campaigns: {
        apple: "68f263c889a41cac70e5e7b7",
        cashapp: "68f7bc0c2d2b6680994d5388",
        shein: "68f263faf60872eff773cc28",
        venmo: "68f13c163343a00cc969f345",
        "freecash-videos": "68f263b73c5ffa8783c96340",
        "freecash-ads": "68f264210c2c5efb7b51f8f0",
        "freecash-main": "68f2da1034eb992247b16d9c",
        "freecash-games": "68f2db673c5ffa8783eb1db2",
        "freecash-surveys": "68f2db4a89a41cac7003a716",
        "freecash-paypal": "68f2da34f60872eff7932c41",
        "swift-venmo": "68f921685ebbc2423812f7f6",
        "swift-amazon": "690108768a856f65525f0a7d",
      },
    },
  },
  offerCodes: {
    apple: "AP",
    cashapp: "CA",
    shein: "SH",
    venmo: "VN",
    "freecash-videos": "FV",
    "freecash-ads": "FA",
    "freecash-main": "FM",
    "freecash-games": "FG",
    "freecash-surveys": "FS",
    "freecash-paypal": "FP",
    "swift-venmo": "SV",
    "swift-amazon": "SA",
  },
  cloakDomains: [
    {
      id: "apptime-pro",
      name: "AppTime Pro",
      url: "https://apptime.pro",
      status: "active",
    },
    {
      id: "appflow32",
      name: "AppFlow32",
      url: "https://appflow32.com",
      status: "active",
    },
  ],
  defaultCloakDomain: "appflow32",
  github: {
    owner: "chrisarmstrong5",
    repo: "invisilink-console-v3",
    branch: "main",
    token: process.env.GITHUB_TOKEN || "",
  },
  whitePageTemplates: [
    {
      id: "storefront-v1",
      name: "Storefront — Cedar & Slate (Dark)",
      description: "Moody monochrome layout designed for premium products.",
      path: "/white-pages/templates/storefront-v1.html",
      theme: "dark",
    },
    {
      id: "storefront-v2",
      name: "Storefront — Sunbeam Atelier (Light)",
      description: "Light, airy layout with warm highlights and soft typography.",
      path: "/white-pages/templates/storefront-v2.html",
      theme: "light",
    },
    {
      id: "storefront-v3",
      name: "Storefront — Electric Bazaar (Neon)",
      description: "Bold neon palette targeting energetic product drops.",
      path: "/white-pages/templates/storefront-v3.html",
      theme: "neon",
    },
    {
      id: "whitepage-1",
      name: "WhitePage 1 — Olive Live Chat",
      description: "Inline legacy template converted from WhitePage1 (olive video app).",
      path: "/white-pages/templates/whitepage-1-single.html",
      theme: "legacy",
    },
    {
      id: "whitepage-2",
      name: "WhitePage 2 — Olive Feature Overview",
      description: "Inline legacy template converted from WhitePage2 with policy links inlined.",
      path: "/white-pages/templates/whitepage-2-single.html",
      theme: "legacy",
    },
    {
      id: "whitepage-3",
      name: "WhitePage 3 — Olive Premium Highlights",
      description: "Inline legacy template converted from Whitepage3 single-page variant.",
      path: "/white-pages/templates/whitepage-3-single.html",
      theme: "legacy",
    },
    {
      id: "whitepage-4",
      name: "WhitePage 4 — Olive Creator Stories",
      description: "Inline legacy template converted from Whitepage4 with animated sections.",
      path: "/white-pages/templates/whitepage-4-single.html",
      theme: "legacy",
    },
    {
      id: "whitepage-5",
      name: "WhitePage 5 — Olive Live Stream Hub",
      description: "Inline legacy template converted from Whitepage5 storefront layout.",
      path: "/white-pages/templates/whitepage-5-single.html",
      theme: "legacy",
    },
  ],
  headScriptDefaults: {
    placementParam: "ppc",
    botPlacementValue: "__PLACEMENT__",
    delayMs: 50,
  },
  whitePageProject: {
    deploymentDomain: "https://affiliate-cloaking-v3.vercel.app",
    repoPath: "white-pages/deploy-root",
  },
  // Admin domain configuration for security
  security: {
    // The admin domain where the console is accessed
    // All other domains are treated as cloak domains
    adminDomain: "affiliate-cloaking-v3.vercel.app",
    // Alternative admin domains (e.g., custom domain, production URL)
    additionalAdminDomains: [
      "invisilink-console-v3.vercel.app",
      "localhost:3000",
    ],
  },
  offers: {
    apple: { name: "Apple Pay", code: "AP" },
    cashapp: { name: "Cash App", code: "CA" },
    shein: { name: "Shein", code: "SH" },
    venmo: { name: "Venmo", code: "VN" },
    "freecash-videos": { name: "FreeCash Videos", code: "FV" },
    "freecash-ads": { name: "FreeCash Ads", code: "FA" },
    "freecash-main": { name: "FreeCash Main", code: "FM" },
    "freecash-games": { name: "FreeCash Games", code: "FG" },
    "freecash-surveys": { name: "FreeCash Surveys", code: "FS" },
    "freecash-paypal": { name: "FreeCash PayPal", code: "FP" },
    "swift-venmo": { name: "Swift Venmo", code: "SV" },
    "swift-amazon": { name: "Heel Amazon", code: "SA" },
  },
  // V2 Features Configuration
  geoTargeting: {
    enabled: true,
    apiUrl: "http://ip-api.com/json",
    countries: [
      // English-speaking countries
      { code: "US", name: "United States", region: "english-speaking" },
      { code: "GB", name: "United Kingdom", region: "english-speaking" },
      { code: "CA", name: "Canada", region: "english-speaking" },
      { code: "AU", name: "Australia", region: "english-speaking" },
      { code: "NZ", name: "New Zealand", region: "english-speaking" },
      { code: "IE", name: "Ireland", region: "english-speaking" },
      // Nordic countries
      { code: "NO", name: "Norway", region: "european" },
      { code: "SE", name: "Sweden", region: "european" },
      { code: "DK", name: "Denmark", region: "european" },
      { code: "FI", name: "Finland", region: "european" },
      { code: "IS", name: "Iceland", region: "european" },
      { code: "CH", name: "Switzerland", region: "european" },
      // Western Europe
      { code: "NL", name: "Netherlands", region: "european" },
      { code: "BE", name: "Belgium", region: "european" },
      { code: "LU", name: "Luxembourg", region: "european" },
      { code: "DE", name: "Germany", region: "european" },
      { code: "AT", name: "Austria", region: "european" },
      { code: "FR", name: "France", region: "european" },
      { code: "IT", name: "Italy", region: "european" },
      { code: "ES", name: "Spain", region: "european" },
      { code: "PT", name: "Portugal", region: "european" },
      // Asia-Pacific
      { code: "SG", name: "Singapore", region: "other" },
      { code: "JP", name: "Japan", region: "other" },
    ] as GeoTargetingCountry[],
  },
  tiktok: {
    pixelDefaults: {
      enabled: false,
      pixelId: "D45OCM3C77U0CLRNMLJG",
    },
    browserRedirect: {
      enabled: false,
      forceBrowserOpen: true,
    },
    strictBotDetection: {
      enabled: false,
      additionalPatterns: ["bytedance", "tiktok", "musically"],
    },
  },
  // Facebook Platform Configuration (NEW)
  facebook: {
    // Facebook cloak domains (separate from TikTok domains)
    domains: [
      // Add your Facebook domains here
      // Example: { id: "fb-domain-1", name: "FB Domain 1", url: "https://yourdomain.com", status: "active" }
    ] as CloakDomain[],
    defaultDomain: "", // Will be set when domains are added
    pixelDefaults: {
      enabled: false,
      pixelId: "", // Set your Facebook Pixel ID
    },
    appDefaults: {
      appId: "", // Set your Facebook App ID
    },
    trackingModes: {
      direct: {
        enabled: true,
        description: "FB-compliant direct tracking (no redirects)",
      },
      redirect: {
        enabled: true,
        description: "Redirect tracking (for testing only, may get banned)",
      },
      defaultMode: "direct" as "direct" | "redirect",
    },
    // Facebook Conversion API (CAPI) - Optional for Phase 3
    capi: {
      enabled: false,
      accessToken: "", // FB CAPI access token
    },
  },
  smmPanel: {
    // Primary provider
    provider: "smmfollows" as "smmfollows" | "jap",
    smmfollows: {
      apiUrl: "https://smmfollows.com/api/v2",
      apiKey: "17a96f7102a90f6f7c6c82d9c6f6676c",
      services: {
        tiktok: {
          likes: "9620", // Service ID for TikTok likes
          saves: "6037", // Service ID for TikTok saves
          views: "", // Service ID for TikTok views (not provided)
        },
      },
    },
    jap: {
      apiUrl: "https://justanotherpanel.com/api/v2",
      apiKey: process.env.JAP_API_KEY || "",
      services: {
        tiktok: {
          likes: "", // Service ID for TikTok likes (get from panel)
          saves: "", // Service ID for TikTok saves (get from panel)
          views: "", // Service ID for TikTok views (get from panel)
        },
      },
    },
    defaults: {
      likes: 1900,
      saves: 180,
      views: 0, // Optional: can add views too
    },
  },
  killSwitch: {
    enabled: true,
    storageKey: "affiliate-kill-list",
    githubEnabled: true,
    killListPath: "kill-list.json",
  },
};

export type SparkCode = {
  id: string;
  name: string;
  sparkCode: string;
  videoUrl?: string;
  platform: "tiktok" | "facebook";
  offerCode: string;
  createdDate: string;
  contentType?: "video" | "slideshow";
  mediaUrls?: string[];
  tags?: string[];
  // Social post links (for Facebook/Instagram)
  instagramPostLink?: string;
  facebookPostLink?: string;
  // TikTok link (for engagement boosting)
  tiktokLink?: string;
  // Engagement boost settings
  engagementSettings?: {
    likes: number;
    saves: number;
  };
  metrics: {
    clicks: number;
    conversions: number;
    cvr: number;
    revenue: number;
    spend: number;
    roi: number;
  };
};

export type CompetitorAd = {
  id: string;
  creatorName: string;
  platform: string;
  contentType: "video" | "slideshow";
  mediaUrls: string[];
  adContent?: string;
  sparkCode?: string;
  productName?: string;
  productLink?: string;
  capturedDate: Date;
  tags?: string[];
  createdAt?: Date;
};

export type LinkHistoryItem = {
  id: string;
  timestamp: string;
  offer: string;
  account: string;
  sparkCode?: string;
  domain: string;
  trackingUrl: string;
  whitePageUrl: string;
  campaignName: string;
  platform?: "tiktok" | "facebook"; // NEW: Platform support
  // V2 features
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
  // NEW: Facebook configuration
  facebook?: {
    pixelId?: string;
    appId?: string;
    trackingMode?: "direct" | "redirect";
  };
  disableCloaking?: boolean;
  isKilled?: boolean;
  killedAt?: string;
  templateName?: string;
};

export type KillListItem = {
  slug: string;
  domain: string;
  killedAt: string;
  reason?: string;
  canRestore: boolean;
  originalLink: LinkHistoryItem;
};

export type GeoTargetingCountry = {
  code: string;
  name: string;
  region: "english-speaking" | "european" | "other";
};

export type CloakDomain = {
  id: string;
  name: string;
  url: string;
  status: "active" | "inactive" | "burned";
};
