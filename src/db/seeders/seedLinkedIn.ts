/**
 * LinkedIn Platform Seeder
 * Generates 20 campaigns with full hierarchy and 60 days of metrics
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

export async function seedLinkedIn(): Promise<{
  campaigns: number;
  adGroups: number;
  ads: number;
  metrics: number;
}> {
  console.log('🌱 Seeding LinkedIn campaigns...');

  const campaignRepo = new CampaignRepository();
  const adGroupRepo = new AdGroupRepository();
  const adRepo = new AdRepository();
  const metricsRepo = new MetricsRepository();

  const ACCOUNT_ID = 'urn:li:sponsoredAccount:123456789';
  const CAMPAIGN_COUNT = 20;
  const METRICS_DAYS = 60;

  let totalAdGroups = 0;
  let totalAds = 0;
  let totalMetrics = 0;

  // Check if LinkedIn campaigns already exist
  const existing = await campaignRepo.findByAccountId('linkedin', ACCOUNT_ID);
  if (existing.length > 0) {
    console.log(`   ℹ️  LinkedIn already has ${existing.length} campaigns, skipping`);
    return { campaigns: existing.length, adGroups: 0, ads: 0, metrics: 0 };
  }

  // Generate campaigns
  const campaigns = CampaignGenerator.generateBatch('linkedin', ACCOUNT_ID, CAMPAIGN_COUNT);

  for (const campaign of campaigns) {
    // Create campaign
    const createdCampaign = await campaignRepo.create(campaign);

    // Generate 2-4 campaign groups per campaign
    const campaignGroupCount = faker.number.int({ min: 2, max: 4 });
    const campaignGroups = AdGroupGenerator.generateBatch('linkedin', createdCampaign.id, campaignGroupCount);

    for (const campaignGroup of campaignGroups) {
      const createdCampaignGroup = await adGroupRepo.create(campaignGroup);
      totalAdGroups++;

      // Generate 2-5 creatives per campaign group
      const creativeCount = faker.number.int({ min: 2, max: 5 });
      const creatives = AdGenerator.generateBatch('linkedin', createdCampaign.id, createdCampaignGroup.id, creativeCount);

      for (const creative of creatives) {
        await adRepo.create(creative);
        totalAds++;
      }
    }

    // Generate 60 days of metrics for campaign
    const dailyBudget = createdCampaign.daily_budget || createdCampaign.lifetime_budget! / 30 || 100;
    const campaignMetrics = MetricsGenerator.generateTimeSeries(
      'linkedin',
      'campaign',
      createdCampaign.id,
      dailyBudget,
      METRICS_DAYS
    );

    await metricsRepo.createBatch(campaignMetrics);
    totalMetrics += campaignMetrics.length;
  }

  console.log(`   ✅ LinkedIn: ${CAMPAIGN_COUNT} campaigns, ${totalAdGroups} campaign groups, ${totalAds} creatives, ${totalMetrics} metrics`);

  return {
    campaigns: CAMPAIGN_COUNT,
    adGroups: totalAdGroups,
    ads: totalAds,
    metrics: totalMetrics
  };
}
