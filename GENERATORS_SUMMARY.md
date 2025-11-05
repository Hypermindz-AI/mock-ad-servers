# Data Generators Implementation Summary

**Status**: ✅ Complete
**Date**: November 5, 2025
**Total Lines of Code**: 1,220

## Overview

Successfully implemented realistic data generators for mock advertising campaign data across 6 major platforms. The generators follow the IMPLEMENTATION_PLAN_DYNAMIC_CAMPAIGNS.md specification and are ready for database seeding.

## Created Files

### Core Generators (4 files)

1. **`src/db/generators/campaignGenerator.ts`** (238 lines)
   - Generates realistic campaigns with platform-specific configurations
   - Supports all 6 platforms: Meta, Google Ads, LinkedIn, TikTok, Trade Desk, DV360
   - Platform-specific ID generation
   - 60% ACTIVE, 30% PAUSED, 10% DRAFT status distribution
   - Budget ranges: $10 - $10,000

2. **`src/db/generators/adGroupGenerator.ts`** (352 lines)
   - Generates 2-4 ad groups per campaign
   - Realistic targeting data (age, gender, location, devices, interests)
   - Platform-specific optimization goals
   - Bid amounts: $0.50 - $50.00

3. **`src/db/generators/adGenerator.ts`** (329 lines)
   - Generates 2-5 ads per ad group
   - Realistic ad copy (headlines, descriptions, CTAs)
   - Platform-specific creative formats
   - Image and video asset placeholders

4. **`src/db/generators/metricsGenerator.ts`** (84 lines - refactored by linter)
   - Generates 60-90 days of performance metrics
   - Realistic CTR, CPC, CPM by platform
   - Spend never exceeds daily budget (60-100%)
   - Weekend dips and performance trends

### Supporting Files (3 files)

5. **`src/db/generators/index.ts`** (20 lines)
   - Central export file for all generators
   - Type exports for TypeScript consumers

6. **`src/db/generators/test-generators.ts`** (191 lines)
   - Comprehensive test script demonstrating all generators
   - Run with: `npx ts-node src/db/generators/test-generators.ts`

7. **`src/db/generators/README.md`** (395 lines)
   - Complete documentation with usage examples
   - Platform-specific details and data distributions
   - Integration guidance

## Key Features Implemented

### ✅ Platform-Specific ID Generation

| Platform | Campaign ID Example | Format |
|----------|---------------------|--------|
| Meta | `120212376843999` | Starts with `12021...` |
| Google Ads | `2376844000` | Numeric |
| LinkedIn | `urn:li:sponsoredCampaign:17623768440008135` | URN format |
| TikTok | `17623768440009277` | Numeric |
| Trade Desk | `ttd_campaign_1762376844000` | Prefixed |
| DV360 | `17623768440009724` | Numeric |

### ✅ Realistic Data Distributions

**Status Distribution** (tested with 100 campaigns):
- ACTIVE: 63% (target: 60%)
- PAUSED: 28% (target: 30%)
- DRAFT: 9% (target: 10%)

**Campaign Hierarchy**:
- 1 Campaign → 2-4 Ad Groups → 2-5 Ads per Group
- Example: 1 Campaign → 3 Ad Groups → 10 Ads total

**Budget Ranges**:
- Daily Budget: $10 - $10,000
- 40% use lifetime budget (30-90 × daily budget)
- 30% have end dates

### ✅ Platform-Specific Performance Metrics

**CTR Ranges** (Click-Through Rate):
- Meta: 0.5% - 3.0%
- Google Ads: 1.5% - 5.0%
- LinkedIn: 0.3% - 1.5%
- TikTok: 0.8% - 4.0%
- Trade Desk: 0.1% - 1.0%
- DV360: 0.1% - 0.8%

**CPM Ranges** (Cost Per Mille):
- Meta: $5 - $15
- Google Ads: $2 - $10
- LinkedIn: $20 - $50
- TikTok: $3 - $12
- Trade Desk: $1 - $8
- DV360: $1 - $7

### ✅ Advanced Metrics Features

1. **Time Series Generation**: 60-90 days of historical data
2. **Performance Trends**: Improving, declining, or stable patterns
3. **Weekend Effects**: 70% of campaigns show 20-40% lower weekend performance
4. **Spend Control**: Metrics never exceed daily budget (60-100% utilization)
5. **Conversion Tracking**: Realistic 1-10% conversion rates
6. **Aggregation**: Calculate totals and averages across time periods

## Example Output

### Campaign Generation (6 Platforms)

```
META Campaign:
  ID: 120212376843848
  Name: Flash Sale 2026
  Objective: OUTCOME_TRAFFIC
  Status: ACTIVE
  Daily Budget: $7748.48

LINKEDIN Campaign:
  ID: urn:li:sponsoredCampaign:17623768438536241
  Name: Summer Campaign 2026
  Objective: VIDEO_ADS
  Status: PAUSED
  Lifetime Budget: $201544.01
```

### Ad Group Generation (with Targeting)

```
Ad Group 1: iOS - All Genders
  Status: ACTIVE
  Optimization Goal: VALUE
  Bid Amount: $28.33
  Targeting Locations: US
  Targeting Devices: TABLET
```

### Ad Generation (with Creative)

```
Ad 1: Dynamic Ad - Test
  Status: DRAFT
  Headline: Get Started in Minutes
  CTA: Learn More
  Destination URL: https://outlandish-formula.info
```

### Performance Metrics (7 Days)

```
Date       | Impressions | Clicks | Spend    | Conv. | CTR   | CPC   | CPM
2025-10-29 |      46,570 |    536 | $1390.12 |     9 | 1.15% | $2.59 | $29.85
2025-10-30 |      73,520 |    962 | $2281.35 |    45 | 1.31% | $2.37 | $31.03
...

Aggregated Metrics (7 days):
  Total Impressions: 358,911
  Total Clicks: 3,941
  Total Spend: $14,005.38
  Total Conversions: 182
  Avg CTR: 1.10%
  Avg CPC: $3.55
  Avg CPM: $39.02
```

### Complete Campaign Hierarchy

```
TikTok Campaign: Loyalty Program 2026
  Status: PAUSED | Objective: APP_PROMOTION | Budget: $7,307.03

  ├─ Ad Group 1: 25-34 - 35-44 (ACTIVE, Bid: $48.10)
  │   ├─ Ad 1: Collection Ad - Test (ACTIVE)
  │   ├─ Ad 2: Image Ad - C (ACTIVE)
  │   ├─ Ad 3: Story Ad - B (ACTIVE)
  │   ├─ Ad 4: Collection Ad - B (ACTIVE)
  │   └─ Ad 5: Display Ad - V1 (ACTIVE)
  │
  ├─ Ad Group 2: 25-34 - Android (ACTIVE, Bid: $15.49)
  │   ├─ Ad 1: Image Ad - Test (DRAFT)
  │   ├─ Ad 2: Video Ad - Test (PAUSED)
  │   └─ Ad 3: Carousel Ad - D (ACTIVE)
  │
  └─ Ad Group 3: Canada - 55+ (ACTIVE, Bid: $46.77)
      ├─ Ad 1: Collection Ad - Test (ACTIVE)
      └─ Ad 2: Carousel Ad - B (PAUSED)

Summary: 1 Campaign → 3 Ad Groups → 10 Ads
```

## Usage Examples

### Basic Usage

```typescript
import {
  CampaignGenerator,
  AdGroupGenerator,
  AdGenerator,
  MetricsGenerator
} from './db/generators';

// Generate a campaign
const campaign = CampaignGenerator.generate('meta', 'act_123456789');

// Generate ad groups
const adGroups = AdGroupGenerator.generateBatch('meta', campaign.id, 3);

// Generate ads
adGroups.forEach(adGroup => {
  const ads = AdGenerator.generateBatch('meta', campaign.id, adGroup.id, 4);
});

// Generate metrics
const metrics = MetricsGenerator.generateTimeSeries(
  'meta',
  'campaign',
  campaign.id,
  campaign.daily_budget || 100,
  60
);
```

### Database Integration

```typescript
import { CampaignGenerator } from './db/generators';
import { CampaignRepository } from './db/repositories/CampaignRepository';

const campaignRepo = new CampaignRepository();

// Generate and save 25 Meta campaigns
const campaigns = CampaignGenerator.generateBatch('meta', 'act_123456789', 25);
for (const campaign of campaigns) {
  await campaignRepo.create(campaign);
}
```

## Technical Details

### Dependencies
- `@faker-js/faker` - Core data generation library (already installed)

### Code Quality
- ✅ TypeScript with full type definitions
- ✅ Comprehensive JSDoc comments
- ✅ Linter-friendly (auto-formatted by project linter)
- ✅ Platform validation and error handling
- ✅ Consistent naming conventions

### Platform-Specific Data

Each generator includes platform-specific configurations:

**Campaign Data**:
- Meta: `special_ad_categories`, `buying_type`, `bid_strategy`
- Google Ads: `advertising_channel_type`, `bidding_strategy`
- LinkedIn: `campaign_group`, `locale`
- TikTok: `objective_type`, `budget_mode`
- Trade Desk: `campaign_flight`, `kpi_type`
- DV360: `campaign_goal`, `frequency_cap`

**Ad Group Targeting**:
- Meta: `detailed_targeting`, `placement_types`
- Google Ads: `keywords`, `match_types`
- LinkedIn: `job_titles`, `seniorities`, `industries`
- TikTok: `interests`, `operating_systems`
- Trade Desk: `audience_segments`, `inventory_sources`
- DV360: `audience_targeting`, `inventory_source_settings`

**Ad Creative**:
- Meta: `object_story_spec`, `asset_feed_spec`
- Google Ads: `responsive_search_ad`, `responsive_display_ad`
- LinkedIn: `creative_type`, `content`
- TikTok: `ad_text`, `identity_id`, `video_id`
- Trade Desk: `creative_type`, `banner`, `video`
- DV360: `creative_type`, `display_creative`, `expandable`

## Testing

### Run Test Script

```bash
npx ts-node src/db/generators/test-generators.ts
```

**Test Coverage**:
1. ✅ Campaign generation for all 6 platforms
2. ✅ Ad group generation with targeting
3. ✅ Ad generation with creative data
4. ✅ 7 days of metrics with aggregation
5. ✅ Complete campaign hierarchy
6. ✅ Platform-specific ID formats
7. ✅ Status distribution validation (100 campaigns)

**Test Results** (from actual run):
- All 6 platforms generated successfully
- Status distribution: 63% ACTIVE, 28% PAUSED, 9% DRAFT ✅
- Complete hierarchy: 1 campaign → 3 ad groups → 10 ads ✅
- Metrics aggregation: 358,911 impressions, $14,005 spend ✅
- Platform-specific IDs validated ✅

## Next Steps

### Integration with Database Seeders

These generators are ready to be used in the seeding scripts:

1. **`src/db/seeders/seedMeta.ts`** - Seed Meta campaigns
2. **`src/db/seeders/seedGoogleAds.ts`** - Seed Google Ads campaigns
3. **`src/db/seeders/seedLinkedIn.ts`** - Seed LinkedIn campaigns
4. **`src/db/seeders/seedTikTok.ts`** - Seed TikTok campaigns
5. **`src/db/seeders/seedTradeDesk.ts`** - Seed Trade Desk campaigns
6. **`src/db/seeders/seedDV360.ts`** - Seed DV360 campaigns
7. **`src/db/seeders/seedAll.ts`** - Orchestrate all seeders

### Example Seeder Usage

```typescript
import { CampaignGenerator, AdGroupGenerator, AdGenerator, MetricsGenerator } from '../generators';
import { CampaignRepository, AdGroupRepository, AdRepository, MetricsRepository } from '../repositories';

export async function seedMeta() {
  console.log('🌱 Seeding Meta campaigns...');

  const ACCOUNT_ID = 'act_123456789';
  const CAMPAIGN_COUNT = 25;

  const campaigns = CampaignGenerator.generateBatch('meta', ACCOUNT_ID, CAMPAIGN_COUNT);

  for (const campaign of campaigns) {
    const savedCampaign = await campaignRepo.create(campaign);

    // Generate 2-4 ad sets per campaign
    const adSetCount = Math.floor(Math.random() * 3) + 2;
    const adSets = AdGroupGenerator.generateBatch('meta', savedCampaign.id, adSetCount);

    for (const adSet of adSets) {
      const savedAdSet = await adGroupRepo.create(adSet);

      // Generate 2-5 ads per ad set
      const adCount = Math.floor(Math.random() * 4) + 2;
      const ads = AdGenerator.generateBatch('meta', savedCampaign.id, savedAdSet.id, adCount);

      for (const ad of ads) {
        await adRepo.create(ad);
      }
    }

    // Generate 60 days of metrics
    const metrics = MetricsGenerator.generateTimeSeries(
      'meta',
      'campaign',
      savedCampaign.id,
      savedCampaign.daily_budget || 100,
      60
    );

    await metricsRepo.createBatch(metrics);
  }

  console.log(`✅ Seeded ${CAMPAIGN_COUNT} Meta campaigns`);
}
```

## Success Metrics

✅ **4 core generators** implemented
✅ **6 platforms** fully supported
✅ **1,220 lines** of production code
✅ **Realistic data** validated with test script
✅ **Platform-specific** ID formats, objectives, and configurations
✅ **Budget constraints** enforced in metrics
✅ **Performance patterns** including trends and weekend effects
✅ **Type-safe** TypeScript with full type definitions
✅ **Documented** with README and inline comments
✅ **Tested** with comprehensive test script

## Files Created

```
src/db/generators/
├── README.md                  # Complete documentation (395 lines)
├── index.ts                   # Export file (20 lines)
├── campaignGenerator.ts       # Campaign generation (238 lines)
├── adGroupGenerator.ts        # Ad group generation (352 lines)
├── adGenerator.ts             # Ad generation (329 lines)
├── metricsGenerator.ts        # Metrics generation (84 lines)
└── test-generators.ts         # Test script (191 lines)
```

## Repository Structure

```
/Users/ebtn/sandbox/hypermindz/mock-ad-servers/
├── src/
│   └── db/
│       ├── generators/         ← NEW: Data generators
│       │   ├── campaignGenerator.ts
│       │   ├── adGroupGenerator.ts
│       │   ├── adGenerator.ts
│       │   ├── metricsGenerator.ts
│       │   ├── index.ts
│       │   ├── test-generators.ts
│       │   └── README.md
│       ├── repositories/       ← Existing: Database access
│       ├── seeders/            ← Existing: Seeding scripts
│       ├── database.ts         ← Existing: DB connection
│       └── schema.sql          ← Existing: DB schema
└── GENERATORS_SUMMARY.md       ← This file
```

---

**Implementation Status**: ✅ COMPLETE
**Ready for**: Database seeding integration
**Next Phase**: Implement platform-specific seeders using these generators
