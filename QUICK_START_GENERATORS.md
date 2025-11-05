# Quick Start: Data Generators

## Test the Generators (1 minute)

```bash
# Run the comprehensive test suite
npx ts-node src/db/generators/test-generators.ts
```

This will show you:
- Campaign generation for all 6 platforms
- Ad group targeting examples
- Ad creative examples
- 7 days of performance metrics
- Complete campaign hierarchy
- Status distribution validation

## Basic Usage (Copy & Paste)

### Generate a Complete Campaign Hierarchy

```typescript
import {
  CampaignGenerator,
  AdGroupGenerator,
  AdGenerator,
  MetricsGenerator
} from './src/db/generators';

// 1. Generate campaign
const campaign = CampaignGenerator.generate('meta', 'act_123456789');

// 2. Generate 3 ad groups
const adGroups = AdGroupGenerator.generateBatch('meta', campaign.id, 3);

// 3. Generate ads for each ad group
adGroups.forEach(adGroup => {
  const ads = AdGenerator.generateBatch('meta', campaign.id, adGroup.id, 4);
  console.log(`Created ${ads.length} ads for ${adGroup.name}`);
});

// 4. Generate 60 days of metrics
const metrics = MetricsGenerator.generateTimeSeries(
  'meta',
  'campaign',
  campaign.id,
  campaign.daily_budget || 100,
  60
);

console.log(`Generated ${metrics.length} days of performance data`);
```

## Supported Platforms

Use these exact strings:
- `'meta'` - Facebook/Instagram
- `'google_ads'` - Google Ads
- `'linkedin'` - LinkedIn
- `'tiktok'` - TikTok
- `'tradedesk'` - The Trade Desk
- `'dv360'` - Display & Video 360

## Key Features at a Glance

### Campaign Generator
```typescript
// Single campaign
const campaign = CampaignGenerator.generate('meta', 'act_123456789');

// Batch of 25 campaigns
const campaigns = CampaignGenerator.generateBatch('meta', 'act_123456789', 25);
```

**Generates:**
- Platform-specific IDs (Meta: `12021...`, LinkedIn: `urn:li:...`)
- Status: 60% ACTIVE, 30% PAUSED, 10% DRAFT
- Budget: $10 - $10,000
- Platform-specific configurations

### Ad Group Generator
```typescript
// Generate 2-4 ad groups per campaign
const count = Math.floor(Math.random() * 3) + 2;
const adGroups = AdGroupGenerator.generateBatch('meta', campaignId, count);
```

**Generates:**
- Realistic targeting (age, gender, location, devices)
- Bid amounts: $0.50 - $50
- Platform-specific optimization goals

### Ad Generator
```typescript
// Generate 2-5 ads per ad group
const count = Math.floor(Math.random() * 4) + 2;
const ads = AdGenerator.generateBatch('meta', campaignId, adGroupId, count);
```

**Generates:**
- Headlines, descriptions, CTAs
- Creative assets (images, videos)
- Tracking URLs

### Metrics Generator
```typescript
// Generate 60 days of realistic metrics
const metrics = MetricsGenerator.generateTimeSeries(
  'meta',
  'campaign',
  campaignId,
  100, // daily budget
  60   // days
);

// Aggregate metrics
const totals = MetricsGenerator.aggregateMetrics(metrics);
console.log(`Total Spend: $${totals.total_spend}`);
console.log(`Avg CTR: ${totals.avg_ctr}%`);
```

**Generates:**
- Platform-specific CTR ranges (Meta: 0.5-3%, Google: 1.5-5%)
- Realistic CPM and CPC
- Spend never exceeds budget
- Weekend dips and performance trends

## Example Output

### Campaign
```javascript
{
  id: "120212376843848",
  platform: "meta",
  name: "Flash Sale 2026",
  objective: "OUTCOME_TRAFFIC",
  status: "ACTIVE",
  daily_budget: 7748.48,
  platform_specific_data: {
    special_ad_categories: [],
    buying_type: "AUCTION",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP"
  }
}
```

### Metrics
```javascript
{
  date: "2025-10-29",
  impressions: 46570,
  clicks: 536,
  spend: 1390.12,
  conversions: 9,
  ctr: 1.15,
  cpc: 2.59,
  cpm: 29.85
}
```

## Realistic Data Distributions

| Metric | Value |
|--------|-------|
| Status Distribution | 60% ACTIVE, 30% PAUSED, 10% DRAFT |
| Budget Range | $10 - $10,000 |
| Ad Groups per Campaign | 2-4 |
| Ads per Ad Group | 2-5 |
| Historical Metrics | 60-90 days |
| Spend Rate | 60-100% of budget |
| CTR (Meta) | 0.5% - 3.0% |
| CTR (Google) | 1.5% - 5.0% |
| CPM (Meta) | $5 - $15 |
| CPM (LinkedIn) | $20 - $50 |

## Files & Documentation

- **`src/db/generators/README.md`** - Complete documentation
- **`src/db/generators/test-generators.ts`** - Test all generators
- **`GENERATORS_SUMMARY.md`** - Implementation details
- **`EXAMPLE_GENERATED_DATA.json`** - Sample output

## Integration with Seeders

The generators are ready to use in your seeding scripts:

```typescript
// src/db/seeders/seedMeta.ts
import { CampaignGenerator } from '../generators';
import { CampaignRepository } from '../repositories';

export async function seedMeta() {
  const campaigns = CampaignGenerator.generateBatch('meta', 'act_123456789', 25);

  for (const campaign of campaigns) {
    await campaignRepo.create(campaign);
    // ... generate ad groups, ads, metrics
  }
}
```

## Need Help?

1. **Test Script**: `npx ts-node src/db/generators/test-generators.ts`
2. **Full Documentation**: `src/db/generators/README.md`
3. **Example Data**: `EXAMPLE_GENERATED_DATA.json`
4. **Implementation Details**: `GENERATORS_SUMMARY.md`

---

**Ready to seed?** All generators are tested and working!
