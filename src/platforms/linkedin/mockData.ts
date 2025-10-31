/**
 * LinkedIn Marketing API 202510 Mock Data
 * URN format: urn:li:sponsoredCampaign:{id}
 */

export interface LinkedInCampaign {
  id: string;
  account: string;
  name: string;
  type: string;
  status: string;
  dailyBudget?: {
    amount: string;
    currencyCode: string;
  };
  totalBudget?: {
    amount: string;
    currencyCode: string;
  };
  createdAt?: number;
  lastModifiedAt?: number;
}

// In-memory storage for campaigns
export const campaignStore: Map<string, LinkedInCampaign> = new Map();

// Success response for campaign creation
export const successCampaignResponse = {
  id: 'urn:li:sponsoredCampaign:456',
  status: 'ACTIVE',
  account: 'urn:li:sponsoredAccount:123',
  name: 'Test Campaign',
  type: 'TEXT_AD',
  dailyBudget: {
    amount: '50',
    currencyCode: 'USD'
  },
  createdAt: Date.now(),
  lastModifiedAt: Date.now()
};

// Sample campaign object
export const sampleCampaign: LinkedInCampaign = {
  id: 'urn:li:sponsoredCampaign:789',
  account: 'urn:li:sponsoredAccount:123',
  name: 'Sample LinkedIn Campaign',
  type: 'TEXT_AD',
  status: 'ACTIVE',
  dailyBudget: {
    amount: '100',
    currencyCode: 'USD'
  },
  totalBudget: {
    amount: '10000',
    currencyCode: 'USD'
  },
  createdAt: Date.now() - 86400000, // 1 day ago
  lastModifiedAt: Date.now()
};

// Validation error response (400)
export const validationErrorResponse = {
  status: 400,
  code: 'INVALID_REQUEST',
  message: 'Validation failed',
  details: [
    {
      field: 'dailyBudget.amount',
      message: 'Budget amount must be greater than 0'
    }
  ]
};

// Auth error response (401)
export const authErrorResponse = {
  serviceErrorCode: 401,
  message: 'Invalid access token',
  status: 401
};

// Version header missing error
export const versionHeaderMissingError = {
  serviceErrorCode: 400,
  message: 'Missing required header: Linkedin-Version',
  status: 400
};

// Invalid version header error
export const invalidVersionHeaderError = {
  serviceErrorCode: 400,
  message: 'Invalid Linkedin-Version header. Expected: 202510',
  status: 400
};

// Campaign not found error (404)
export const campaignNotFoundError = {
  serviceErrorCode: 404,
  message: 'Campaign not found',
  status: 404
};

// Missing required field error
export const missingFieldError = (fieldName: string) => ({
  status: 400,
  code: 'INVALID_REQUEST',
  message: 'Missing required field',
  details: [
    {
      field: fieldName,
      message: `${fieldName} is required`
    }
  ]
});

// Invalid budget error
export const invalidBudgetError = {
  status: 400,
  code: 'INVALID_REQUEST',
  message: 'Invalid budget amount',
  details: [
    {
      field: 'dailyBudget.amount',
      message: 'Budget amount must be a positive number'
    }
  ]
};

// Invalid campaign type error
export const invalidCampaignTypeError = {
  status: 400,
  code: 'INVALID_REQUEST',
  message: 'Invalid campaign type',
  details: [
    {
      field: 'type',
      message: 'Campaign type must be one of: TEXT_AD, SPONSORED_UPDATES, SPONSORED_INMAILS, DYNAMIC'
    }
  ]
};

// Invalid status error
export const invalidStatusError = {
  status: 400,
  code: 'INVALID_REQUEST',
  message: 'Invalid campaign status',
  details: [
    {
      field: 'status',
      message: 'Status must be one of: ACTIVE, PAUSED, ARCHIVED, COMPLETED, CANCELED'
    }
  ]
};

// Valid campaign types
export const VALID_CAMPAIGN_TYPES = ['TEXT_AD', 'SPONSORED_UPDATES', 'SPONSORED_INMAILS', 'DYNAMIC'];

// Valid campaign statuses
export const VALID_CAMPAIGN_STATUSES = ['ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED', 'CANCELED'];

// Helper function to generate campaign URN
export const generateCampaignUrn = (): string => {
  const id = Math.floor(100000 + Math.random() * 900000);
  return `urn:li:sponsoredCampaign:${id}`;
};

// Helper function to validate account URN format
export const isValidAccountUrn = (urn: string): boolean => {
  return /^urn:li:sponsoredAccount:\d+$/.test(urn);
};

// Helper function to validate campaign URN format
export const isValidCampaignUrn = (urn: string): boolean => {
  return /^urn:li:sponsoredCampaign:\d+$/.test(urn);
};

// Initialize with sample campaign
campaignStore.set(sampleCampaign.id, sampleCampaign);

// ============================================
// Campaign Groups (LinkedIn 202510)
// ============================================

export interface LinkedInCampaignGroup {
  id: string;
  account: string;
  name: string;
  status: string;
  runSchedule?: {
    start: number;
    end?: number;
  };
  totalBudget?: {
    amount: string;
    currencyCode: string;
  };
  createdAt?: number;
  lastModifiedAt?: number;
}

// In-memory storage for campaign groups
export const campaignGroupStore: Map<string, LinkedInCampaignGroup> = new Map();

// Helper function to generate campaign group URN
export const generateCampaignGroupUrn = (): string => {
  const id = Math.floor(100000 + Math.random() * 900000);
  return `urn:li:sponsoredCampaignGroup:${id}`;
};

// Helper function to validate campaign group URN format
export const isValidCampaignGroupUrn = (urn: string): boolean => {
  return /^urn:li:sponsoredCampaignGroup:\d+$/.test(urn);
};

// Sample campaign group
export const sampleCampaignGroup: LinkedInCampaignGroup = {
  id: 'urn:li:sponsoredCampaignGroup:111111',
  account: 'urn:li:sponsoredAccount:123',
  name: 'Q4 Marketing Campaign Group',
  status: 'ACTIVE',
  runSchedule: {
    start: Date.now() - 86400000,
    end: Date.now() + 2592000000
  },
  totalBudget: {
    amount: '50000',
    currencyCode: 'USD'
  },
  createdAt: Date.now() - 172800000,
  lastModifiedAt: Date.now()
};

// Initialize with sample campaign group
campaignGroupStore.set(sampleCampaignGroup.id, sampleCampaignGroup);

// ============================================
// Creatives (LinkedIn 202510)
// ============================================

export interface LinkedInCreative {
  id: string;
  campaign: string;
  status: string;
  type: string;
  content?: {
    title?: string;
    description?: string;
    landingPageUrl?: string;
    imageUrl?: string;
  };
  createdAt?: number;
  lastModifiedAt?: number;
}

// In-memory storage for creatives
export const creativeStore: Map<string, LinkedInCreative> = new Map();

// Helper function to generate creative URN
export const generateCreativeUrn = (): string => {
  const id = Math.floor(100000 + Math.random() * 900000);
  return `urn:li:sponsoredCreative:${id}`;
};

// Helper function to validate creative URN format
export const isValidCreativeUrn = (urn: string): boolean => {
  return /^urn:li:sponsoredCreative:\d+$/.test(urn);
};

// Valid creative types
export const VALID_CREATIVE_TYPES = ['SINGLE_IMAGE', 'VIDEO', 'CAROUSEL', 'TEXT'];

// Sample creative
export const sampleCreative: LinkedInCreative = {
  id: 'urn:li:sponsoredCreative:222222',
  campaign: sampleCampaign.id,
  status: 'ACTIVE',
  type: 'SINGLE_IMAGE',
  content: {
    title: 'Engage with Our Brand',
    description: 'Discover innovative solutions for your business',
    landingPageUrl: 'https://example.com/landing',
    imageUrl: 'https://example.com/images/ad-creative.jpg'
  },
  createdAt: Date.now() - 86400000,
  lastModifiedAt: Date.now()
};

// Initialize with sample creative
creativeStore.set(sampleCreative.id, sampleCreative);

// ============================================
// Analytics Data (LinkedIn 202510)
// ============================================

export interface LinkedInAnalyticsData {
  campaignId: string;
  dateRange: {
    start: string;
    end: string;
  };
  impressions: number;
  clicks: number;
  costInLocalCurrency: string;
  conversions: number;
  externalWebsiteConversions?: number;
  landingPageClicks?: number;
  videoViews?: number;
  engagements?: number;
}

// Helper function to generate mock analytics data
export const generateAnalyticsData = (
  campaignId: string,
  dateRange: { start: string; end: string }
): LinkedInAnalyticsData => {
  const impressions = Math.floor(1000 + Math.random() * 9000);
  const clicks = Math.floor(impressions * (0.01 + Math.random() * 0.05));
  const conversions = Math.floor(clicks * (0.05 + Math.random() * 0.15));
  const cost = (clicks * (2 + Math.random() * 8)).toFixed(2);

  return {
    campaignId,
    dateRange,
    impressions,
    clicks,
    costInLocalCurrency: cost,
    conversions,
    externalWebsiteConversions: Math.floor(conversions * 0.7),
    landingPageClicks: Math.floor(clicks * 0.9),
    videoViews: Math.floor(impressions * 0.3),
    engagements: Math.floor(impressions * 0.02)
  };
};

// ============================================
// Pagination Helper
// ============================================

export interface PaginationParams {
  start?: number;
  count?: number;
}

export interface PaginatedResponse<T> {
  elements: T[];
  paging: {
    start: number;
    count: number;
    total: number;
  };
}

export const paginateResults = <T>(
  items: T[],
  params: PaginationParams
): PaginatedResponse<T> => {
  const start = params.start || 0;
  const count = params.count || 10;
  const total = items.length;

  const elements = items.slice(start, start + count);

  return {
    elements,
    paging: {
      start,
      count: elements.length,
      total
    }
  };
};

// ============================================
// Error Responses for New Endpoints
// ============================================

export const campaignGroupNotFoundError = {
  serviceErrorCode: 404,
  message: 'Campaign group not found',
  status: 404
};

export const creativeNotFoundError = {
  serviceErrorCode: 404,
  message: 'Creative not found',
  status: 404
};

export const invalidDateRangeError = {
  status: 400,
  code: 'INVALID_REQUEST',
  message: 'Invalid date range',
  details: [
    {
      field: 'dateRange',
      message: 'Start date must be before end date'
    }
  ]
};

export const invalidCreativeTypeError = {
  status: 400,
  code: 'INVALID_REQUEST',
  message: 'Invalid creative type',
  details: [
    {
      field: 'type',
      message: 'Creative type must be one of: SINGLE_IMAGE, VIDEO, CAROUSEL, TEXT'
    }
  ]
};
