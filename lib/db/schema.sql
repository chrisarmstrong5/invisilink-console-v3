-- InvisiLink Console V3 - Database Schema
-- Production-grade schema for $40k/month affiliate operation

-- ======================
-- CORE TABLES
-- ======================

-- Links table: Stores all generated affiliate links
CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Offer information
  offer_key TEXT NOT NULL,
  offer_name TEXT NOT NULL,
  account_number TEXT NOT NULL,

  -- Domain & URLs
  domain_id TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tracking_url TEXT NOT NULL,
  white_page_url TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  template_name TEXT,

  -- Spark code attribution
  spark_code_id TEXT,

  -- Platform (NEW: Facebook support)
  platform TEXT DEFAULT 'tiktok', -- 'tiktok' or 'facebook'

  -- V2 Features
  custom_url TEXT,
  filter_type TEXT DEFAULT 'params-only',
  disable_cloaking BOOLEAN DEFAULT false,

  -- Geo-targeting
  geo_enabled BOOLEAN DEFAULT false,
  geo_countries TEXT[], -- Array of ISO country codes

  -- TikTok configuration
  tiktok_pixel_enabled BOOLEAN DEFAULT false,
  tiktok_pixel_id TEXT,
  tiktok_browser_redirect BOOLEAN DEFAULT false,
  tiktok_strict_bot BOOLEAN DEFAULT false,

  -- Facebook configuration (NEW)
  facebook_pixel_id TEXT,
  facebook_app_id TEXT,
  facebook_tracking_mode TEXT, -- 'direct' or 'redirect'

  -- Kill switch
  is_killed BOOLEAN DEFAULT false,
  killed_at TIMESTAMP,
  kill_reason TEXT
);

-- Spark codes table: Creator/ad attribution
CREATE TABLE IF NOT EXISTS spark_codes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  spark_code TEXT NOT NULL,
  video_url TEXT,
  platform TEXT NOT NULL, -- 'tiktok' or 'facebook'
  offer_code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Media
  content_type TEXT,
  media_urls TEXT[],

  -- Organization
  tags TEXT[]
);

-- Metrics cache: RedTrack data synced every 30 min
CREATE TABLE IF NOT EXISTS metrics_cache (
  id SERIAL PRIMARY KEY,

  -- Source identification
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

  -- Sync metadata
  synced_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(source_type, source_id, date, platform)
);

-- Spend tracking: CSV imports or manual entry
CREATE TABLE IF NOT EXISTS spend_tracking (
  id SERIAL PRIMARY KEY,

  -- Source identification
  source_type TEXT NOT NULL, -- 'link', 'account', 'campaign'
  source_id TEXT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,

  -- Platform & account
  platform TEXT NOT NULL, -- 'tiktok', 'facebook'
  account_id TEXT,
  campaign_name TEXT,

  -- Import metadata
  import_method TEXT, -- 'manual', 'csv'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(source_type, source_id, date, platform)
);

-- Kill list: Burned links
CREATE TABLE IF NOT EXISTS kill_list (
  slug TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  platform TEXT,
  killed_at TIMESTAMP DEFAULT NOW(),
  reason TEXT,
  restored_at TIMESTAMP,

  -- Preserve original link data for potential restoration
  original_link_data JSONB
);

-- ======================
-- INDEXES FOR PERFORMANCE
-- ======================

-- Links indexes
CREATE INDEX IF NOT EXISTS idx_links_created ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_platform ON links(platform);
CREATE INDEX IF NOT EXISTS idx_links_account ON links(account_number);
CREATE INDEX IF NOT EXISTS idx_links_offer ON links(offer_key);
CREATE INDEX IF NOT EXISTS idx_links_killed ON links(is_killed);
CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);

-- Spark codes indexes
CREATE INDEX IF NOT EXISTS idx_spark_platform ON spark_codes(platform);
CREATE INDEX IF NOT EXISTS idx_spark_offer ON spark_codes(offer_code);

-- Metrics indexes
CREATE INDEX IF NOT EXISTS idx_metrics_source ON metrics_cache(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics_cache(date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_platform ON metrics_cache(platform);
CREATE INDEX IF NOT EXISTS idx_metrics_synced ON metrics_cache(synced_at DESC);

-- Spend indexes
CREATE INDEX IF NOT EXISTS idx_spend_source ON spend_tracking(source_type, source_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_spend_platform ON spend_tracking(platform);
CREATE INDEX IF NOT EXISTS idx_spend_date ON spend_tracking(date DESC);
CREATE INDEX IF NOT EXISTS idx_spend_account ON spend_tracking(account_id);

-- Kill list indexes
CREATE INDEX IF NOT EXISTS idx_kill_date ON kill_list(killed_at DESC);
CREATE INDEX IF NOT EXISTS idx_kill_platform ON kill_list(platform);

-- ======================
-- FUTURE TABLES (Phase 2-3)
-- ======================

-- Accounts table: Multi-account management (Phase 2)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'tiktok', 'facebook'
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'archived'
  daily_budget DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_platform ON accounts(platform);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);

-- Alert history: Track sent alerts (Phase 2)
CREATE TABLE IF NOT EXISTS alert_history (
  id SERIAL PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'burning_link', 'winner', 'budget_warning', 'daily_summary'
  source_type TEXT,
  source_id TEXT,
  message TEXT NOT NULL,
  sent_via TEXT, -- 'email', 'sms'
  sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_type ON alert_history(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_sent ON alert_history(sent_at DESC);

-- A/B test variants: Systematic testing (Phase 3)
CREATE TABLE IF NOT EXISTS ab_test_variants (
  id TEXT PRIMARY KEY,
  test_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  offer_key TEXT NOT NULL,
  account_number TEXT NOT NULL,
  link_id TEXT NOT NULL REFERENCES links(id),
  traffic_split DECIMAL(5,2) DEFAULT 50.00, -- Percentage
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  is_winner BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_ab_test ON ab_test_variants(test_name);
CREATE INDEX IF NOT EXISTS idx_ab_active ON ab_test_variants(ended_at) WHERE ended_at IS NULL;
