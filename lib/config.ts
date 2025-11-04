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
      id: "cartrewards",
      name: "CartRewards",
      url: "https://www.cartrewards.pro",
      status: "active",
    },
    {
      id: "appflow32",
      name: "AppFlow32",
      url: "https://appflow32.com",
      status: "active",
    },
    {
      id: "bluewhale47",
      name: "BlueWhale47",
      url: "https://bluewhale47.xyz",
      status: "active",
    },
    {
      id: "creds4cart",
      name: "Creds4Cart",
      url: "https://creds4cart.xyz",
      status: "active",
    },
    {
      id: "tvyoo",
      name: "TvYoo",
      url: "https://tvyoo.xyz",
      status: "active",
    },
  ],
  defaultCloakDomain: "cartrewards",
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
  contentType: "video" | "slideshow";
  mediaUrls: string[];
  landerScreenshotUrl?: string;
  competitor: string;
  niche: string;
  tags: string[];
  notes: string;
  createdDate: string;
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
};
