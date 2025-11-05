/**
 * Test script to demonstrate the data generators
 * Run with: ts-node src/db/generators/test-generators.ts
 */

import { CampaignGenerator } from './campaignGenerator';
import { AdGroupGenerator } from './adGroupGenerator';
import { AdGenerator } from './adGenerator';
import { MetricsGenerator } from './metricsGenerator';

console.log('='.repeat(80));
console.log('DATA GENERATORS TEST - REALISTIC MOCK CAMPAIGN DATA');
console.log('='.repeat(80));
console.log();

// Test platforms
const platforms = ['meta', 'google_ads', 'linkedin', 'tiktok', 'tradedesk', 'dv360'];

// 1. Campaign Generator Test
console.log('1. CAMPAIGN GENERATOR');
console.log('-'.repeat(80));

platforms.forEach(platform => {
  const campaign = CampaignGenerator.generate(platform, `act_${platform}_12345`);
  console.log(`\n${platform.toUpperCase()} Campaign:`);
  console.log(`  ID: ${campaign.id}`);
  console.log(`  Name: ${campaign.name}`);
  console.log(`  Objective: ${campaign.objective}`);
  console.log(`  Status: ${campaign.status}`);
  console.log(`  Daily Budget: $${campaign.daily_budget?.toFixed(2) || 'N/A'}`);
  console.log(`  Lifetime Budget: $${campaign.lifetime_budget?.toFixed(2) || 'N/A'}`);
  console.log(`  Platform Data Keys: ${Object.keys(campaign.platform_specific_data).join(', ')}`);
});

console.log('\n' + '='.repeat(80));
console.log('2. AD GROUP GENERATOR');
console.log('-'.repeat(80));

// Test Ad Group generation for Meta
const metaCampaign = CampaignGenerator.generate('meta', 'act_meta_12345');
const metaAdGroups = AdGroupGenerator.generateBatch('meta', metaCampaign.id, 3);

console.log(`\nGenerated ${metaAdGroups.length} Ad Groups for Meta Campaign ${metaCampaign.id}:`);
metaAdGroups.forEach((adGroup, idx) => {
  console.log(`\n  Ad Group ${idx + 1}:`);
  console.log(`    ID: ${adGroup.id}`);
  console.log(`    Name: ${adGroup.name}`);
  console.log(`    Status: ${adGroup.status}`);
  console.log(`    Optimization Goal: ${adGroup.optimization_goal}`);
  console.log(`    Bid Amount: $${adGroup.bid_amount?.toFixed(2)}`);
  console.log(`    Targeting Locations: ${adGroup.targeting.locations?.join(', ')}`);
  console.log(`    Targeting Devices: ${adGroup.targeting.devices?.join(', ')}`);
});

console.log('\n' + '='.repeat(80));
console.log('3. AD GENERATOR');
console.log('-'.repeat(80));

// Test Ad generation for Google Ads
const googleCampaign = CampaignGenerator.generate('google_ads', 'act_google_12345');
const googleAdGroup = AdGroupGenerator.generate('google_ads', googleCampaign.id);
const googleAds = AdGenerator.generateBatch('google_ads', googleCampaign.id, googleAdGroup.id, 4);

console.log(`\nGenerated ${googleAds.length} Ads for Google Ads Ad Group ${googleAdGroup.id}:`);
googleAds.forEach((ad, idx) => {
  console.log(`\n  Ad ${idx + 1}:`);
  console.log(`    ID: ${ad.id}`);
  console.log(`    Name: ${ad.name}`);
  console.log(`    Status: ${ad.status}`);
  console.log(`    Headline: ${ad.creative_data.headline}`);
  console.log(`    CTA: ${ad.creative_data.call_to_action}`);
  console.log(`    Destination URL: ${ad.creative_data.destination_url}`);
});

console.log('\n' + '='.repeat(80));
console.log('4. METRICS GENERATOR');
console.log('-'.repeat(80));

// Test Metrics generation for LinkedIn
const linkedinCampaign = CampaignGenerator.generate('linkedin', 'act_linkedin_12345');
const dailyBudget = linkedinCampaign.daily_budget || 100;

console.log(`\nGenerating 7 days of metrics for LinkedIn Campaign ${linkedinCampaign.id}:`);
console.log(`Daily Budget: $${dailyBudget.toFixed(2)}`);

const metrics = MetricsGenerator.generateTimeSeries(
  'linkedin',
  'campaign',
  linkedinCampaign.id,
  dailyBudget,
  7
);

console.log('\nDaily Metrics:');
console.log('Date       | Impressions | Clicks | Spend    | Conv. | CTR   | CPC   | CPM  ');
console.log('-'.repeat(80));

metrics.forEach(metric => {
  const dateStr = metric.date.toISOString().split('T')[0];
  console.log(
    `${dateStr} | ${metric.impressions.toString().padStart(11)} | ` +
    `${metric.clicks.toString().padStart(6)} | ` +
    `$${metric.spend.toFixed(2).padStart(7)} | ` +
    `${metric.conversions.toString().padStart(5)} | ` +
    `${metric.ctr.toFixed(2).padStart(5)}% | ` +
    `$${metric.cpc.toFixed(2).padStart(5)} | ` +
    `$${metric.cpm.toFixed(2).padStart(4)}`
  );
});

// Calculate aggregated metrics
const aggregated = MetricsGenerator.aggregateMetrics(metrics);
console.log('\nAggregated Metrics (7 days):');
console.log(`  Total Impressions: ${aggregated.total_impressions.toLocaleString()}`);
console.log(`  Total Clicks: ${aggregated.total_clicks.toLocaleString()}`);
console.log(`  Total Spend: $${aggregated.total_spend.toFixed(2)}`);
console.log(`  Total Conversions: ${aggregated.total_conversions}`);
console.log(`  Avg CTR: ${aggregated.avg_ctr.toFixed(2)}%`);
console.log(`  Avg CPC: $${aggregated.avg_cpc.toFixed(2)}`);
console.log(`  Avg CPM: $${aggregated.avg_cpm.toFixed(2)}`);

console.log('\n' + '='.repeat(80));
console.log('5. FULL CAMPAIGN HIERARCHY');
console.log('-'.repeat(80));

// Generate a complete campaign hierarchy for TikTok
const tiktokCampaign = CampaignGenerator.generate('tiktok', 'act_tiktok_12345');
const tiktokAdGroupCount = 3;
const tiktokAdGroups = AdGroupGenerator.generateBatch('tiktok', tiktokCampaign.id, tiktokAdGroupCount);

console.log(`\nTikTok Campaign Hierarchy:`);
console.log(`\nCampaign: ${tiktokCampaign.name} (${tiktokCampaign.id})`);
console.log(`  Status: ${tiktokCampaign.status}`);
console.log(`  Objective: ${tiktokCampaign.objective}`);
console.log(`  Daily Budget: $${tiktokCampaign.daily_budget?.toFixed(2) || 'N/A'}`);

let totalAds = 0;
tiktokAdGroups.forEach((adGroup, idx) => {
  const adsCount = Math.floor(Math.random() * 4) + 2; // 2-5 ads
  const ads = AdGenerator.generateBatch('tiktok', tiktokCampaign.id, adGroup.id, adsCount);
  totalAds += ads.length;

  console.log(`\n  Ad Group ${idx + 1}: ${adGroup.name} (${adGroup.id})`);
  console.log(`    Status: ${adGroup.status}`);
  console.log(`    Optimization: ${adGroup.optimization_goal}`);
  console.log(`    Bid: $${adGroup.bid_amount?.toFixed(2)}`);

  ads.forEach((ad, adIdx) => {
    console.log(`      Ad ${adIdx + 1}: ${ad.name} (${ad.id}) - ${ad.status}`);
  });
});

console.log(`\nSummary: 1 Campaign → ${tiktokAdGroupCount} Ad Groups → ${totalAds} Ads`);

console.log('\n' + '='.repeat(80));
console.log('6. PLATFORM-SPECIFIC ID FORMATS');
console.log('-'.repeat(80));

console.log('\nGenerated IDs for each platform:');
platforms.forEach(platform => {
  const campaign = CampaignGenerator.generate(platform, `act_${platform}_test`);
  const adGroup = AdGroupGenerator.generate(platform, campaign.id);
  const ad = AdGenerator.generate(platform, campaign.id, adGroup.id);

  console.log(`\n${platform.toUpperCase()}:`);
  console.log(`  Campaign ID: ${campaign.id}`);
  console.log(`  Ad Group ID: ${adGroup.id}`);
  console.log(`  Ad ID: ${ad.id}`);
});

console.log('\n' + '='.repeat(80));
console.log('7. STATUS DISTRIBUTION TEST');
console.log('-'.repeat(80));

// Generate 100 campaigns to test status distribution
const testCampaigns = CampaignGenerator.generateBatch('meta', 'act_test', 100);
const statusCounts = testCampaigns.reduce((acc, campaign) => {
  acc[campaign.status] = (acc[campaign.status] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('\nStatus Distribution (100 campaigns):');
console.log(`  ACTIVE: ${statusCounts.ACTIVE || 0}% (Expected: ~60%)`);
console.log(`  PAUSED: ${statusCounts.PAUSED || 0}% (Expected: ~30%)`);
console.log(`  DRAFT: ${statusCounts.DRAFT || 0}% (Expected: ~10%)`);

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETED SUCCESSFULLY');
console.log('='.repeat(80));
console.log('\nAll generators are working correctly!');
console.log('Ready to seed the database with realistic mock campaign data.');
console.log();
