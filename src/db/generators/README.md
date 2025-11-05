# Data Generators

Realistic data generators for mock advertising campaign data across 6 major advertising platforms.

## Overview

These generators create realistic mock data for integration testing, including:
- **Campaigns**: Strategic advertising campaigns with platform-specific configurations
- **Ad Groups/Sets**: Targeting and bidding configurations (2-4 per campaign)
- **Ads**: Creative assets and delivery settings (2-5 per ad group)
- **Metrics**: Historical performance data (60-90 days)

## Supported Platforms

1. **Meta (Facebook/Instagram)** - Meta Ads API
2. **Google Ads** - Google Ads API
3. **LinkedIn** - LinkedIn Marketing API
4. **TikTok** - TikTok for Business API
5. **The Trade Desk** - Trade Desk API
6. **DV360** - Display & Video 360 API

## Features

### Campaign Generator

```typescript
import { CampaignGenerator } from './generators';

// Generate single campaign
const campaign = CampaignGenerator.generate('meta', 'act_123456789');

// Generate batch of campaigns
const campaigns = CampaignGenerator.generateBatch('google_ads', 'cus_123456', 25);
```

**Key Features:**
- Platform-specific ID formats (Meta: `12021...`, LinkedIn: `urn:li:...`, etc.)
- Realistic status distribution (60% ACTIVE, 30% PAUSED, 10% DRAFT)
- Budget ranges: $10 - $10,000
- Platform-appropriate objectives and configurations
- 40% chance of lifetime budget vs daily budget
- 30% chance of end date

### Ad Group Generator

```typescript
import { AdGroupGenerator } from './generators';

// Generate ad groups for a campaign
const adGroups = AdGroupGenerator.generateBatch('meta', campaignId, 3);
```

**Key Features:**
- Realistic targeting data (age, gender, location, devices, interests)
- Platform-specific optimization goals
- Bid amounts: $0.50 - $50.00
- 50% chance of ad group level budgets
- Detailed audience targeting configurations

### Ad Generator

```typescript
import { AdGenerator } from './generators';

// Generate ads for an ad group
const ads = AdGenerator.generateBatch('google_ads', campaignId, adGroupId, 5);
```

**Key Features:**
- Realistic ad copy (headlines, descriptions, CTAs)
- Platform-specific creative formats
- Image and video asset placeholders
- Tracking URLs and parameters
- A/B test variations

### Metrics Generator

```typescript
import { MetricsGenerator } from './generators';

// Generate 60 days of historical metrics
const metrics = MetricsGenerator.generateTimeSeries(
  'linkedin',
  'campaign',
  campaignId,
  100, // daily budget
  60   // days
);

// Aggregate metrics
const totals = MetricsGenerator.aggregateMetrics(metrics);
```

**Key Features:**
- Realistic CTR ranges by platform (Meta: 0.5-3%, Google: 1.5-5%, LinkedIn: 0.3-1.5%)
- Platform-specific CPM ranges
- Spend never exceeds daily budget (60-100% spend rate)
- Weekend dips (70% of campaigns show 20-40% lower weekend performance)
- Performance trends: improving, declining, or stable
- Conversion tracking (1-10% conversion rate)

## Platform-Specific ID Formats

| Platform | Campaign ID | Ad Group ID | Ad ID |
|----------|-------------|-------------|-------|
| Meta | `12021...` | `23847...` | `23849...` |
| Google Ads | Numeric | Numeric | Numeric |
| LinkedIn | `urn:li:sponsoredCampaign:...` | `urn:li:sponsoredCampaignGroup:...` | `urn:li:sponsoredCreative:...` |
| TikTok | Numeric | Numeric | Numeric |
| Trade Desk | `ttd_campaign_...` | `ttd_adgroup_...` | `ttd_ad_...` |
| DV360 | Numeric | Numeric | Numeric |

## Realistic Data Distributions

### Status Distribution
- **ACTIVE**: 60%
- **PAUSED**: 30%
- **DRAFT**: 10%

### Budget Distribution
- Daily Budget: $10 - $10,000
- 40% use lifetime budget instead
- Lifetime budget = daily budget × 30-90 days

### Campaign Hierarchy
- 1 Campaign
- 2-4 Ad Groups per Campaign
- 2-5 Ads per Ad Group
- 60-90 days of metrics per entity

### Performance Metrics

**Platform-Specific CTR Ranges:**
- Meta: 0.5% - 3.0%
- Google Ads: 1.5% - 5.0%
- LinkedIn: 0.3% - 1.5%
- TikTok: 0.8% - 4.0%
- Trade Desk: 0.1% - 1.0%
- DV360: 0.1% - 0.8%

**Platform-Specific CPM Ranges:**
- Meta: $5 - $15
- Google Ads: $2 - $10
- LinkedIn: $20 - $50
- TikTok: $3 - $12
- Trade Desk: $1 - $8
- DV360: $1 - $7

## Usage Examples

### Complete Campaign Hierarchy

```typescript
import {
  CampaignGenerator,
  AdGroupGenerator,
  AdGenerator,
  MetricsGenerator
} from './generators';

// 1. Generate campaign
const campaign = CampaignGenerator.generate('tiktok', 'act_tiktok_12345');

// 2. Generate ad groups (2-4)
const adGroups = AdGroupGenerator.generateBatch('tiktok', campaign.id, 3);

// 3. Generate ads for each ad group (2-5 per group)
adGroups.forEach(adGroup => {
  const ads = AdGenerator.generateBatch('tiktok', campaign.id, adGroup.id, 4);
  console.log(`Generated ${ads.length} ads for ${adGroup.name}`);
});

// 4. Generate 60 days of metrics
const metrics = MetricsGenerator.generateTimeSeries(
  'tiktok',
  'campaign',
  campaign.id,
  campaign.daily_budget || 100,
  60
);

console.log(`Generated ${metrics.length} days of performance data`);
```

### A/B Testing Scenario

```typescript
import { MetricsGenerator } from './generators';

// Compare two ad variants
const { variantA, variantB, winner } = MetricsGenerator.generateComparativeMetrics(
  'meta',
  'ad',
  'ad_123_variant_a',
  'ad_123_variant_b',
  50, // daily budget per variant
  30  // test duration in days
);

console.log(`Winner: Variant ${winner}`);
console.log(`Variant A CTR: ${MetricsGenerator.aggregateMetrics(variantA).avg_ctr}%`);
console.log(`Variant B CTR: ${MetricsGenerator.aggregateMetrics(variantB).avg_ctr}%`);
```

### Hourly Metrics Breakdown

```typescript
import { MetricsGenerator } from './generators';

// Get hourly performance for today
const hourlyMetrics = MetricsGenerator.generateHourlyMetrics(
  'google_ads',
  'campaign',
  'campaign_123',
  new Date(),
  200 // daily budget
);

// Find peak hour
const peakHour = hourlyMetrics.reduce((prev, current) =>
  current.clicks > prev.clicks ? current : prev
);

console.log(`Peak hour: ${peakHour.date.getHours()}:00 with ${peakHour.clicks} clicks`);
```

## Testing

Run the test script to see example output:

```bash
npx ts-node src/db/generators/test-generators.ts
```

This will display:
1. Campaign generation for all 6 platforms
2. Ad group generation with targeting
3. Ad generation with creative data
4. 7 days of metrics with aggregation
5. Complete campaign hierarchy
6. Platform-specific ID formats
7. Status distribution validation

## Data Quality

All generated data includes:
- ✅ Realistic business names and copy
- ✅ Valid URLs and domain names
- ✅ Platform-specific configurations
- ✅ Consistent relationships (campaign → ad group → ad)
- ✅ Metrics that respect budget constraints
- ✅ Weekend and trend patterns in performance
- ✅ Industry-standard CTR, CPC, CPM ranges

## Integration with Database

These generators are designed to work with the database seeding scripts:

```typescript
import { CampaignGenerator } from './generators';
import { CampaignRepository } from '../repositories/CampaignRepository';

const campaignRepo = new CampaignRepository();

// Generate and save campaigns
const campaigns = CampaignGenerator.generateBatch('meta', 'act_123', 10);
for (const campaign of campaigns) {
  await campaignRepo.create(campaign);
}
```

## Dependencies

- `@faker-js/faker` - Core data generation library

## Best Practices

1. **Consistent Account IDs**: Use the same account ID when generating related entities
2. **Budget Constraints**: Always pass daily budget to metrics generator
3. **Time Series**: Generate at least 30 days of metrics for meaningful trends
4. **Batch Generation**: Use batch methods for better performance
5. **Platform Validation**: Verify platform-specific data matches API requirements

## Future Enhancements

- [ ] Seasonal trends (Q4 shopping, summer lulls)
- [ ] Geographic performance variations
- [ ] Device-specific performance
- [ ] Dayparting patterns
- [ ] Budget pacing algorithms
- [ ] Ad fatigue simulation
- [ ] Competitive bidding effects

## License

MIT
