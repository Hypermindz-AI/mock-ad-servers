-- Campaigns table (unified for all platforms)
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  objective TEXT,
  status TEXT NOT NULL,
  daily_budget DECIMAL(10, 2),
  lifetime_budget DECIMAL(10, 2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  platform_specific_data JSONB DEFAULT '{}'::jsonb,

  -- Indexes for performance
  CONSTRAINT chk_platform CHECK (platform IN ('meta', 'google_ads', 'linkedin', 'tiktok', 'tradedesk', 'dv360'))
);

CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_campaigns_account ON campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON campaigns(created_at DESC);

-- Ad Groups/Sets table
CREATE TABLE IF NOT EXISTS ad_groups (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  optimization_goal TEXT,
  bid_amount DECIMAL(10, 2),
  daily_budget DECIMAL(10, 2),
  targeting JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  platform_specific_data JSONB DEFAULT '{}'::jsonb,

  FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  CONSTRAINT chk_ag_platform CHECK (platform IN ('meta', 'google_ads', 'linkedin', 'tiktok', 'tradedesk', 'dv360'))
);

CREATE INDEX IF NOT EXISTS idx_adgroups_campaign ON ad_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_adgroups_platform ON ad_groups(platform);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  ad_group_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  creative_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  platform_specific_data JSONB DEFAULT '{}'::jsonb,

  FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY(ad_group_id) REFERENCES ad_groups(id) ON DELETE CASCADE,
  CONSTRAINT chk_ad_platform CHECK (platform IN ('meta', 'google_ads', 'linkedin', 'tiktok', 'tradedesk', 'dv360'))
);

CREATE INDEX IF NOT EXISTS idx_ads_campaign ON ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_adgroup ON ads(ad_group_id);
CREATE INDEX IF NOT EXISTS idx_ads_platform ON ads(platform);

-- Performance Metrics table (time-series data)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('campaign', 'ad_group', 'ad')),
  entity_id TEXT NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10, 2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr DECIMAL(5, 2) DEFAULT 0,
  cpc DECIMAL(10, 2) DEFAULT 0,
  cpm DECIMAL(10, 2) DEFAULT 0,

  UNIQUE(platform, entity_type, entity_id, date)
);

CREATE INDEX IF NOT EXISTS idx_metrics_entity ON performance_metrics(entity_type, entity_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON performance_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_platform ON performance_metrics(platform);

-- Database version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_version (version, description) VALUES (1, 'Initial schema')
ON CONFLICT (version) DO NOTHING;
