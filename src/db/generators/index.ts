/**
 * Data Generators for Mock Ad Servers
 *
 * This module provides realistic data generation for campaigns, ad groups, ads,
 * and performance metrics across 6 advertising platforms:
 * - Meta (Facebook/Instagram)
 * - Google Ads
 * - LinkedIn
 * - TikTok
 * - The Trade Desk
 * - DV360
 */

export { CampaignGenerator } from './campaignGenerator';
export type { GeneratedCampaign } from './campaignGenerator';

export { AdGroupGenerator } from './adGroupGenerator';
export type { GeneratedAdGroup } from './adGroupGenerator';

export { AdGenerator } from './adGenerator';
export type { GeneratedAd } from './adGenerator';

export { MetricsGenerator } from './metricsGenerator';
export type { GeneratedMetric } from './metricsGenerator';
