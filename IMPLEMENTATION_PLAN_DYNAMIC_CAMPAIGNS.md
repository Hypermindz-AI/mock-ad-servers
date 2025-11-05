# Implementation Plan: Dynamic Campaigns with Vercel Postgres

**Status**: 🚧 In Progress
**Target**: Vercel Serverless Deployment
**Database**: Vercel Postgres (PostgreSQL)
**Start Date**: 2025-11-05

---

## Executive Summary

Enhance the mock ad servers with persistent storage using Vercel Postgres, pre-seeded realistic campaign data across all 6 platforms, dynamic performance metrics, and full campaign hierarchies. Designed for integration testing with consistent, reproducible data.

### Key Goals
- ✅ Persistent storage across deployments (Vercel Postgres)
- ✅ 10-50 realistic campaigns per platform (150+ total)
- ✅ Full campaign hierarchies (campaigns → ad sets/groups → ads)
- ✅ 60+ days of historical performance metrics
- ✅ Faker.js for realistic test data
- ✅ Static state (manual updates only)
- ✅ Integration testing focused

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│          Express.js API Routes                  │
│   (Meta, Google, LinkedIn, TikTok, TTD, DV360)  │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│          Platform Controllers                    │
│   (Existing API logic, validation)              │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│          Repository Layer (NEW)                  │
│   - CampaignRepository                          │
│   - AdGroupRepository                           │
│   - AdRepository                                │
│   - MetricsRepository                           │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│          Vercel Postgres                        │
│   (Managed PostgreSQL Database)                 │
│   - campaigns                                   │
│   - ad_groups                                   │
│   - ads                                         │
│   - performance_metrics                         │
└─────────────────────────────────────────────────┘
```

---

## Phase 1: Database Infrastructure

### 1.1 Dependencies

**Install via npm:**
```bash
npm install @vercel/postgres
npm install --save-dev @faker-js/faker @types/node
```

**Package Versions:**
- `@vercel/postgres`: Latest (built for Vercel serverless)
- `@faker-js/faker`: Latest (data generation)

### 1.2 Database Schema

**File**: `src/db/schema.sql`

```sql
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
```

### 1.3 Database Connection

**File**: `src/db/database.ts`

```typescript
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

export class Database {
  /**
   * Initialize database schema
   */
  static async initialize(): Promise<void> {
    try {
      // Check if schema exists
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'campaigns'
        );
      `;

      const schemaExists = result.rows[0].exists;

      if (!schemaExists) {
        console.log('📊 Initializing database schema...');
        const schemaSQL = fs.readFileSync(
          path.join(__dirname, 'schema.sql'),
          'utf-8'
        );
        await sql.query(schemaSQL);
        console.log('✅ Database schema initialized');
      } else {
        console.log('✅ Database schema already exists');
      }
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Check database connection
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await sql`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  static async getStats() {
    const [campaigns, adGroups, ads, metrics] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM campaigns`,
      sql`SELECT COUNT(*) as count FROM ad_groups`,
      sql`SELECT COUNT(*) as count FROM ads`,
      sql`SELECT COUNT(*) as count FROM performance_metrics`
    ]);

    return {
      campaigns: parseInt(campaigns.rows[0].count),
      adGroups: parseInt(adGroups.rows[0].count),
      ads: parseInt(ads.rows[0].count),
      metrics: parseInt(metrics.rows[0].count)
    };
  }

  /**
   * Reset database (for testing)
   */
  static async reset(): Promise<void> {
    await sql`TRUNCATE campaigns, ad_groups, ads, performance_metrics CASCADE`;
    console.log('✅ Database reset complete');
  }
}
```

---

## Phase 2: Data Generation

### 2.1 Campaign Generator

**File**: `src/db/generators/campaignGenerator.ts`

```typescript
import { faker } from '@faker-js/faker';

export interface GeneratedCampaign {
  id: string;
  platform: string;
  account_id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget: number;
  lifetime_budget?: number;
  start_date: Date;
  end_date?: Date;
  platform_specific_data: any;
}

export class CampaignGenerator {
  /**
   * Generate realistic campaign name
   */
  static generateName(platform: string): string {
    const prefixes = [
      'Spring Sale', 'Black Friday', 'Q4 Launch', 'Summer Campaign',
      'Product Launch', 'Brand Awareness', 'Lead Generation', 'Retargeting',
      'Holiday Special', 'New Customer', 'Loyalty Program', 'Flash Sale'
    ];

    const prefix = faker.helpers.arrayElement(prefixes);
    const year = faker.date.future().getFullYear();
    return `${prefix} ${year}`;
  }

  /**
   * Generate campaign for specific platform
   */
  static generate(platform: string, accountId: string): GeneratedCampaign {
    const statusDistribution = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'PAUSED', 'PAUSED', 'DRAFT'];
    const status = faker.helpers.arrayElement(statusDistribution);

    const dailyBudget = faker.number.float({ min: 10, max: 10000, precision: 0.01 });

    const campaign: GeneratedCampaign = {
      id: this.generateId(platform),
      platform,
      account_id: accountId,
      name: this.generateName(platform),
      objective: this.getObjective(platform),
      status,
      daily_budget: dailyBudget,
      start_date: faker.date.past({ years: 0.5 }),
      platform_specific_data: {}
    };

    // 30% chance of having end date
    if (faker.datatype.boolean({ probability: 0.3 })) {
      campaign.end_date = faker.date.future({ years: 0.5 });
    }

    // 40% chance of lifetime budget instead of daily
    if (faker.datatype.boolean({ probability: 0.4 })) {
      campaign.lifetime_budget = dailyBudget * faker.number.int({ min: 30, max: 90 });
      delete campaign.daily_budget;
    }

    return campaign;
  }

  /**
   * Generate platform-specific ID
   */
  private static generateId(platform: string): string {
    const timestamp = Date.now();
    const random = faker.number.int({ min: 1000, max: 9999 });

    switch (platform) {
      case 'meta':
        return `12021${timestamp.toString().slice(-10)}`;
      case 'google_ads':
        return `${timestamp.toString().slice(-10)}`;
      case 'linkedin':
        return `urn:li:sponsoredCampaign:${timestamp}${random}`;
      case 'tiktok':
        return `${timestamp}${random}`;
      case 'tradedesk':
        return `ttd_campaign_${timestamp}`;
      case 'dv360':
        return `${timestamp}${random}`;
      default:
        return `${platform}_${timestamp}${random}`;
    }
  }

  /**
   * Get platform-appropriate objective
   */
  private static getObjective(platform: string): string {
    const objectives: Record<string, string[]> = {
      meta: ['OUTCOME_TRAFFIC', 'OUTCOME_SALES', 'OUTCOME_AWARENESS', 'OUTCOME_LEADS'],
      google_ads: ['SEARCH', 'DISPLAY', 'VIDEO', 'SHOPPING'],
      linkedin: ['TEXT_AD', 'SPONSORED_CONTENT', 'SPONSORED_INMAILS', 'VIDEO_ADS'],
      tiktok: ['TRAFFIC', 'CONVERSIONS', 'APP_PROMOTION', 'REACH'],
      tradedesk: ['BRAND_AWARENESS', 'CLICKS', 'CONVERSIONS', 'VIDEO_COMPLETION'],
      dv360: ['BRAND_AWARENESS', 'OFFLINE_ACTION', 'ONLINE_ACTION', 'APP_INSTALL']
    };

    return faker.helpers.arrayElement(objectives[platform] || ['TRAFFIC']);
  }

  /**
   * Generate multiple campaigns
   */
  static generateBatch(
    platform: string,
    accountId: string,
    count: number
  ): GeneratedCampaign[] {
    return Array.from({ length: count }, () => this.generate(platform, accountId));
  }
}
```

### 2.2 Ad Group Generator

**File**: `src/db/generators/adGroupGenerator.ts`

Similar structure for generating 2-4 ad groups per campaign with targeting data.

### 2.3 Ad Generator

**File**: `src/db/generators/adGenerator.ts`

Generate 2-5 ads per ad group with creative data.

### 2.4 Metrics Generator

**File**: `src/db/generators/metricsGenerator.ts`

```typescript
import { faker } from '@faker-js/faker';

export interface GeneratedMetric {
  platform: string;
  entity_type: 'campaign' | 'ad_group' | 'ad';
  entity_id: string;
  date: Date;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

export class MetricsGenerator {
  /**
   * Generate realistic daily metrics
   */
  static generateDaily(
    platform: string,
    entityType: string,
    entityId: string,
    date: Date,
    dailyBudget: number
  ): GeneratedMetric {
    // Base metrics on budget
    const spend = faker.number.float({
      min: dailyBudget * 0.6,
      max: dailyBudget * 1.0,
      precision: 0.01
    });

    const impressions = faker.number.int({ min: 1000, max: 50000 });
    const clicks = Math.floor(impressions * faker.number.float({ min: 0.005, max: 0.05 }));
    const conversions = Math.floor(clicks * faker.number.float({ min: 0.01, max: 0.10 }));

    const ctr = (clicks / impressions) * 100;
    const cpc = spend / clicks;
    const cpm = (spend / impressions) * 1000;

    return {
      platform,
      entity_type: entityType as any,
      entity_id: entityId,
      date,
      impressions,
      clicks,
      spend: parseFloat(spend.toFixed(2)),
      conversions,
      ctr: parseFloat(ctr.toFixed(2)),
      cpc: parseFloat(cpc.toFixed(2)),
      cpm: parseFloat(cpm.toFixed(2))
    };
  }

  /**
   * Generate time-series metrics (60-90 days)
   */
  static generateTimeSeries(
    platform: string,
    entityType: string,
    entityId: string,
    dailyBudget: number,
    days: number = 60
  ): GeneratedMetric[] {
    const metrics: GeneratedMetric[] = [];
    const today = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      metrics.push(this.generateDaily(platform, entityType, entityId, date, dailyBudget));
    }

    return metrics;
  }
}
```

---

## Phase 3: Repository Layer

### 3.1 Campaign Repository

**File**: `src/db/repositories/CampaignRepository.ts`

```typescript
import { sql } from '@vercel/postgres';
import { GeneratedCampaign } from '../generators/campaignGenerator';

export interface Campaign extends GeneratedCampaign {
  created_at?: Date;
  updated_at?: Date;
}

export class CampaignRepository {
  /**
   * Create campaign
   */
  async create(campaign: Campaign): Promise<Campaign> {
    const result = await sql`
      INSERT INTO campaigns (
        id, platform, account_id, name, objective, status,
        daily_budget, lifetime_budget, start_date, end_date,
        platform_specific_data
      ) VALUES (
        ${campaign.id}, ${campaign.platform}, ${campaign.account_id},
        ${campaign.name}, ${campaign.objective}, ${campaign.status},
        ${campaign.daily_budget || null}, ${campaign.lifetime_budget || null},
        ${campaign.start_date}, ${campaign.end_date || null},
        ${JSON.stringify(campaign.platform_specific_data)}
      )
      RETURNING *
    `;

    return this.mapRow(result.rows[0]);
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<Campaign | null> {
    const result = await sql`
      SELECT * FROM campaigns WHERE id = ${id}
    `;

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Find by account ID
   */
  async findByAccountId(platform: string, accountId: string): Promise<Campaign[]> {
    const result = await sql`
      SELECT * FROM campaigns
      WHERE platform = ${platform}
      AND account_id = ${accountId}
      ORDER BY created_at DESC
    `;

    return result.rows.map(row => this.mapRow(row));
  }

  /**
   * Update campaign
   */
  async update(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
    const setClauses: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        setClauses.push(`${key} = $${values.length + 1}`);
        values.push(value);
      }
    });

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE campaigns
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Map database row to Campaign object
   */
  private mapRow(row: any): Campaign {
    return {
      id: row.id,
      platform: row.platform,
      account_id: row.account_id,
      name: row.name,
      objective: row.objective,
      status: row.status,
      daily_budget: parseFloat(row.daily_budget),
      lifetime_budget: row.lifetime_budget ? parseFloat(row.lifetime_budget) : undefined,
      start_date: new Date(row.start_date),
      end_date: row.end_date ? new Date(row.end_date) : undefined,
      platform_specific_data: row.platform_specific_data,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}
```

### 3.2 Other Repositories

Similar patterns for:
- `AdGroupRepository.ts`
- `AdRepository.ts`
- `MetricsRepository.ts`

---

## Phase 4: Seeding Scripts

### 4.1 Meta Seeder

**File**: `src/db/seeders/seedMeta.ts`

```typescript
import { CampaignGenerator } from '../generators/campaignGenerator';
import { AdGroupGenerator } from '../generators/adGroupGenerator';
import { AdGenerator } from '../generators/adGenerator';
import { MetricsGenerator } from '../generators/metricsGenerator';
import { CampaignRepository } from '../repositories/CampaignRepository';
// ... other repositories

export async function seedMeta() {
  console.log('🌱 Seeding Meta campaigns...');

  const campaignRepo = new CampaignRepository();
  const adGroupRepo = new AdGroupRepository();
  const adRepo = new AdRepository();
  const metricsRepo = new MetricsRepository();

  const ACCOUNT_ID = 'act_123456789';
  const CAMPAIGN_COUNT = 25;

  // Generate campaigns
  const campaigns = CampaignGenerator.generateBatch('meta', ACCOUNT_ID, CAMPAIGN_COUNT);

  for (const campaign of campaigns) {
    // Create campaign
    const createdCampaign = await campaignRepo.create(campaign);

    // Generate 2-4 ad sets per campaign
    const adSetCount = faker.number.int({ min: 2, max: 4 });
    const adSets = AdGroupGenerator.generateBatch('meta', createdCampaign.id, adSetCount);

    for (const adSet of adSets) {
      const createdAdSet = await adGroupRepo.create(adSet);

      // Generate 2-5 ads per ad set
      const adCount = faker.number.int({ min: 2, max: 5 });
      const ads = AdGenerator.generateBatch('meta', createdCampaign.id, createdAdSet.id, adCount);

      for (const ad of ads) {
        await adRepo.create(ad);
      }
    }

    // Generate 60 days of metrics
    const metrics = MetricsGenerator.generateTimeSeries(
      'meta',
      'campaign',
      createdCampaign.id,
      createdCampaign.daily_budget || 100,
      60
    );

    await metricsRepo.createBatch(metrics);
  }

  console.log(`✅ Seeded ${CAMPAIGN_COUNT} Meta campaigns`);
}
```

### 4.2 Main Seeder

**File**: `src/db/seeders/seedAll.ts`

```typescript
import { seedMeta } from './seedMeta';
import { seedGoogleAds } from './seedGoogleAds';
import { seedLinkedIn } from './seedLinkedIn';
import { seedTikTok } from './seedTikTok';
import { seedTradeDesk } from './seedTradeDesk';
import { seedDV360 } from './seedDV360';
import { Database } from '../database';

export async function seedAll() {
  console.log('🌱 Starting database seeding...');

  try {
    // Check if database is already seeded
    const stats = await Database.getStats();
    if (stats.campaigns > 0) {
      console.log('ℹ️  Database already contains data, skipping seed');
      return;
    }

    // Seed all platforms in parallel
    await Promise.all([
      seedMeta(),
      seedGoogleAds(),
      seedLinkedIn(),
      seedTikTok(),
      seedTradeDesk(),
      seedDV360()
    ]);

    const finalStats = await Database.getStats();
    console.log('✅ Seeding complete!');
    console.log(`   📊 Total: ${finalStats.campaigns} campaigns, ${finalStats.adGroups} ad groups, ${finalStats.ads} ads`);
    console.log(`   📈 ${finalStats.metrics} performance data points`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}
```

---

## Phase 5: Platform Integration

### 5.1 Update Meta Controllers

**File**: `src/platforms/meta/controllers.ts`

**Changes:**
```typescript
// BEFORE
import { campaignStorage } from './mockData';

export const createCampaign = (req: Request, res: Response) => {
  const campaign = { id: generateId(), ...req.body };
  campaignStorage.set(campaign.id, campaign);
  res.json(campaign);
};

// AFTER
import { CampaignRepository } from '../../db/repositories/CampaignRepository';
import { MetricsRepository } from '../../db/repositories/MetricsRepository';

const campaignRepo = new CampaignRepository();
const metricsRepo = new MetricsRepository();

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepo.create({
      id: generateId(),
      platform: 'meta',
      account_id: req.params.adAccountId,
      ...req.body
    });

    // Auto-generate 30 days of historical metrics
    const metrics = MetricsGenerator.generateTimeSeries(
      'meta',
      'campaign',
      campaign.id,
      campaign.daily_budget || 100,
      30
    );
    await metricsRepo.createBatch(metrics);

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Campaign creation failed' });
  }
};
```

### 5.2 Repeat for All Platforms

- Google Ads
- LinkedIn
- TikTok
- Trade Desk
- DV360

---

## Phase 6: Admin Endpoints

**File**: `src/routes/admin.ts`

```typescript
import express from 'express';
import { Database } from '../db/database';
import { seedAll } from '../db/seeders/seedAll';

const router = express.Router();

// Database health check
router.get('/health', async (req, res) => {
  const healthy = await Database.healthCheck();
  res.json({ healthy, timestamp: new Date().toISOString() });
});

// Get database stats
router.get('/stats', async (req, res) => {
  const stats = await Database.getStats();
  res.json(stats);
});

// Reset and reseed database
router.post('/reset', async (req, res) => {
  await Database.reset();
  await seedAll();
  res.json({ message: 'Database reset and reseeded' });
});

// Seed only (if empty)
router.post('/seed', async (req, res) => {
  await seedAll();
  res.json({ message: 'Database seeded' });
});

export default router;
```

---

## Phase 7: Vercel Configuration

### 7.1 Environment Variables

**Vercel Dashboard → Project → Settings → Environment Variables:**

```
POSTGRES_URL="************"
POSTGRES_PRISMA_URL="************"
POSTGRES_URL_NON_POOLING="************"
POSTGRES_USER="************"
POSTGRES_HOST="************"
POSTGRES_PASSWORD="************"
POSTGRES_DATABASE="************"
```

These are automatically set by Vercel Postgres addon.

### 7.2 Startup Hook

**File**: `src/index.ts`

```typescript
import { Database } from './db/database';
import { seedAll } from './db/seeders/seedAll';

// Initialize database on cold start
(async () => {
  try {
    await Database.initialize();
    await seedAll(); // Only seeds if empty
    console.log('✅ Database ready');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
})();

// Rest of Express app setup...
```

---

## Testing Strategy

### Unit Tests
- Repository methods
- Data generators
- Metrics calculations

### Integration Tests
```typescript
describe('Meta Campaigns with Postgres', () => {
  beforeAll(async () => {
    await Database.initialize();
    await Database.reset();
    await seedMeta();
  });

  it('should list campaigns with seeded data', async () => {
    const response = await request(app)
      .get('/meta/v23.0/act_123456789/campaigns')
      .set('Authorization', 'Bearer mock_meta_access_token_abcdef');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
});
```

---

## Deployment Checklist

- [ ] Add Vercel Postgres addon in Vercel dashboard
- [ ] Set environment variables
- [ ] Deploy application
- [ ] Verify `/admin/health` endpoint
- [ ] Check `/admin/stats` shows seeded data
- [ ] Test all 6 platform endpoints
- [ ] Run production test suite
- [ ] Monitor Vercel function logs

---

## Parallel Implementation Tasks

### Task Group 1: Infrastructure (Core Team)
1. Database module & schema
2. Repository base classes
3. Connection pooling setup

### Task Group 2: Generators (Data Team)
1. Campaign generator
2. Ad group generator
3. Ad generator
4. Metrics generator

### Task Group 3: Seeders (Platform Teams)
- Team A: Meta + Google Ads
- Team B: LinkedIn + TikTok
- Team C: Trade Desk + DV360

### Task Group 4: Controller Updates (Platform Teams)
- Each team updates their platform controllers
- Run parallel to Task Group 3

### Task Group 5: Testing & Docs
- Integration tests
- Documentation updates
- Deployment guide

---

## Timeline

**Week 1:**
- Days 1-2: Infrastructure + Generators
- Days 3-4: Seeders + Initial Testing
- Day 5: First platform migration (Meta)

**Week 2:**
- Days 1-3: Remaining platform migrations
- Days 4-5: Testing, documentation, deployment

**Total: 10 working days with 3 parallel teams**

---

## Success Metrics

✅ 150+ campaigns seeded across 6 platforms
✅ 300+ ad groups created
✅ 1000+ ads generated
✅ 9000+ performance data points (60 days × 150 campaigns)
✅ All 538 existing tests passing
✅ New integration tests for Postgres
✅ Production deployment successful
✅ Database response time < 200ms p95

---

## Rollback Plan

If issues arise:
1. Revert to previous deployment (Vercel instant rollback)
2. In-memory Maps remain as fallback
3. Can disable Postgres via environment variable
4. Zero downtime rollback

---

**Status**: Ready for parallel implementation with subagents
**Next**: Launch 6 subagents for parallel development
