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
