/**
 * Repository Layer Index
 * Exports all repository classes for database operations
 */

export { CampaignRepository } from './CampaignRepository';
export type { Campaign, CreateCampaignInput, UpdateCampaignInput } from './CampaignRepository';

export { AdGroupRepository } from './AdGroupRepository';
export type { AdGroup, CreateAdGroupInput, UpdateAdGroupInput } from './AdGroupRepository';

export { AdRepository } from './AdRepository';
export type { Ad, CreateAdInput, UpdateAdInput } from './AdRepository';

export { MetricsRepository } from './MetricsRepository';
export type {
  PerformanceMetric,
  CreateMetricInput,
  MetricFilters,
  AggregatedMetrics,
  EntityType
} from './MetricsRepository';
