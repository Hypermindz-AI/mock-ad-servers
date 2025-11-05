/**
 * DV360 Platform Seeder
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

export async function seedDV360(): Promise<{
  campaigns: number;
  adGroups: number;
  ads: number;
  metrics: number;
}> {
  console.log('🌱 Seeding DV360 campaigns...');

  const campaignRepo = new CampaignRepository();
  const adGroupRepo = new AdGroupRepository();
  const adRepo = new AdRepository();
  const metricsRepo = new MetricsRepository();

  const ACCOUNT_ID = 'advertiser_987654321';
  const CAMPAIGN_COUNT = 20;
  const METRICS_DAYS = 60;

  let totalAdGroups = 0;
  let totalAds = 0;
  let totalMetrics = 0;

  // Check if DV360 campaigns already exist
  const existing = await campaignRepo.findByAccountId('dv360', ACCOUNT_ID);
  if (existing.length > 0) {
    console.log(`   ℹ️  DV360 already has ${existing.length} campaigns, skipping`);
    return { campaigns: existing.length, adGroups: 0, ads: 0, metrics: 0 };
  }

  // Generate campaigns
  const campaigns = CampaignGenerator.generateBatch('dv360', ACCOUNT_ID, CAMPAIGN_COUNT);

  for (const campaign of campaigns) {
    // Create campaign
    const createdCampaign = await campaignRepo.create(campaign);

    // Generate 2-4 insertion orders per campaign
    const insertionOrderCount = faker.number.int({ min: 2, max: 4 });
    const insertionOrders = AdGroupGenerator.generateBatch('dv360', createdCampaign.id, insertionOrderCount);

    for (const insertionOrder of insertionOrders) {
      const createdInsertionOrder = await adGroupRepo.create(insertionOrder);
      totalAdGroups++;

      // Generate 2-5 line items per insertion order
      const lineItemCount = faker.number.int({ min: 2, max: 5 });
      const lineItems = AdGenerator.generateBatch('dv360', createdCampaign.id, createdInsertionOrder.id, lineItemCount);

      for (const lineItem of lineItems) {
        await adRepo.create(lineItem);
        totalAds++;
      }
    }

    // Generate 60 days of metrics for campaign
    const dailyBudget = createdCampaign.daily_budget || createdCampaign.lifetime_budget! / 30 || 100;
    const campaignMetrics = MetricsGenerator.generateTimeSeries(
      'dv360',
      'campaign',
      createdCampaign.id,
      dailyBudget,
      METRICS_DAYS
    );

    await metricsRepo.createBatch(campaignMetrics);
    totalMetrics += campaignMetrics.length;
  }

  console.log(`   ✅ DV360: ${CAMPAIGN_COUNT} campaigns, ${totalAdGroups} insertion orders, ${totalAds} line items, ${totalMetrics} metrics`);

  return {
    campaigns: CAMPAIGN_COUNT,
    adGroups: totalAdGroups,
    ads: totalAds,
    metrics: totalMetrics
  };
}
