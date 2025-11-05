/**
 * Google Ads Platform Seeder
 * Generates 25 campaigns with full hierarchy and 60 days of metrics
 */

import { faker } from '@faker-js/faker';
import { CampaignGenerator } from '../generators/campaignGenerator';
import { AdGroupGenerator } from '../generators/adGroupGenerator';
import { AdGenerator } from '../generators/adGenerator';
import { MetricsGenerator } from '../generators/metricsGenerator';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { AdGroupRepository } from '../repositories/AdGroupRepository';
import { AdRepository } from '../repositories/AdRepository';
import { MetricsRepository } from '../repositories/MetricsRepository';

export async function seedGoogleAds(): Promise<{
  campaigns: number;
  adGroups: number;
  ads: number;
  metrics: number;
}> {
  console.log('🌱 Seeding Google Ads campaigns...');

  const campaignRepo = new CampaignRepository();
  const adGroupRepo = new AdGroupRepository();
  const adRepo = new AdRepository();
  const metricsRepo = new MetricsRepository();

  const ACCOUNT_ID = '123-456-7890';
  const CAMPAIGN_COUNT = 25;
  const METRICS_DAYS = 60;

  let totalAdGroups = 0;
  let totalAds = 0;
  let totalMetrics = 0;

  // Check if Google Ads campaigns already exist
  const existing = await campaignRepo.findByAccountId('google_ads', ACCOUNT_ID);
  if (existing.length > 0) {
    console.log(`   ℹ️  Google Ads already has ${existing.length} campaigns, skipping`);
    return { campaigns: existing.length, adGroups: 0, ads: 0, metrics: 0 };
  }

  // Generate campaigns
  const campaigns = CampaignGenerator.generateBatch('google_ads', ACCOUNT_ID, CAMPAIGN_COUNT);

  for (const campaign of campaigns) {
    // Create campaign
    const createdCampaign = await campaignRepo.create(campaign);

    // Generate 2-4 ad groups per campaign
    const adGroupCount = faker.number.int({ min: 2, max: 4 });
    const adGroups = AdGroupGenerator.generateBatch('google_ads', createdCampaign.id, adGroupCount);

    for (const adGroup of adGroups) {
      const createdAdGroup = await adGroupRepo.create(adGroup);
      totalAdGroups++;

      // Generate 2-5 ads per ad group
      const adCount = faker.number.int({ min: 2, max: 5 });
      const ads = AdGenerator.generateBatch('google_ads', createdCampaign.id, createdAdGroup.id, adCount);

      for (const ad of ads) {
        await adRepo.create(ad);
        totalAds++;
      }
    }

    // Generate 60 days of metrics for campaign
    const dailyBudget = createdCampaign.daily_budget || createdCampaign.lifetime_budget! / 30 || 100;
    const campaignMetrics = MetricsGenerator.generateTimeSeries(
      'google_ads',
      'campaign',
      createdCampaign.id,
      dailyBudget,
      METRICS_DAYS
    );

    await metricsRepo.createBatch(campaignMetrics);
    totalMetrics += campaignMetrics.length;
  }

  console.log(`   ✅ Google Ads: ${CAMPAIGN_COUNT} campaigns, ${totalAdGroups} ad groups, ${totalAds} ads, ${totalMetrics} metrics`);

  return {
    campaigns: CAMPAIGN_COUNT,
    adGroups: totalAdGroups,
    ads: totalAds,
    metrics: totalMetrics
  };
}
