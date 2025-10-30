/**
 * The Trade Desk API v3 Mock Data
 * All properties use PascalCase as per TTD API specification
 */

export interface TTDCampaign {
  CampaignId: string;
  CampaignName: string;
  AdvertiserId: string;
  Budget: {
    Amount: number;
    CurrencyCode: string;
  };
  StartDate: string;
  EndDate?: string;
  Availability: string;
  CampaignConversionReportingColumns?: string[];
}

export interface TTDErrorResponse {
  Message: string;
  ErrorCode?: string;
}

/**
 * Success response for campaign creation
 */
export const successCampaignResponse: Partial<TTDCampaign> = {
  CampaignId: 'ttd_campaign_789xyz',
  CampaignName: 'Test Campaign',
};

/**
 * Full campaign object for GET requests
 */
export const sampleCampaign: TTDCampaign = {
  CampaignId: 'ttd_campaign_789xyz',
  CampaignName: 'Test Campaign',
  AdvertiserId: 'advertiser_abc123',
  Budget: {
    Amount: 10000,
    CurrencyCode: 'USD',
  },
  StartDate: '2025-11-01T00:00:00Z',
  EndDate: '2025-12-31T23:59:59Z',
  Availability: 'Active',
  CampaignConversionReportingColumns: ['revenue', 'conversions'],
};

/**
 * Validation error response (400)
 */
export const validationErrorResponse: TTDErrorResponse = {
  Message: 'Invalid request: Missing required field',
  ErrorCode: 'VALIDATION_ERROR',
};

/**
 * Auth error response (401)
 */
export const authErrorResponse: TTDErrorResponse = {
  Message: 'Invalid or expired token',
  ErrorCode: 'UNAUTHORIZED',
};

/**
 * Campaign not found response (404)
 */
export const notFoundResponse: TTDErrorResponse = {
  Message: 'Campaign not found',
  ErrorCode: 'NOT_FOUND',
};

/**
 * Updated campaign response for PUT requests
 */
export const updatedCampaignResponse: TTDCampaign = {
  CampaignId: 'ttd_campaign_789xyz',
  CampaignName: 'Updated Campaign',
  AdvertiserId: 'advertiser_abc123',
  Budget: {
    Amount: 15000,
    CurrencyCode: 'USD',
  },
  StartDate: '2025-11-01T00:00:00Z',
  EndDate: '2025-12-31T23:59:59Z',
  Availability: 'Paused',
  CampaignConversionReportingColumns: ['revenue', 'conversions'],
};

/**
 * Sample campaign list for future use
 */
export const sampleCampaigns: TTDCampaign[] = [
  sampleCampaign,
  {
    CampaignId: 'ttd_campaign_456def',
    CampaignName: 'Brand Awareness Campaign',
    AdvertiserId: 'advertiser_abc123',
    Budget: {
      Amount: 25000,
      CurrencyCode: 'USD',
    },
    StartDate: '2025-10-15T00:00:00Z',
    EndDate: '2025-11-15T23:59:59Z',
    Availability: 'Active',
  },
  {
    CampaignId: 'ttd_campaign_123ghi',
    CampaignName: 'Performance Campaign',
    AdvertiserId: 'advertiser_xyz789',
    Budget: {
      Amount: 50000,
      CurrencyCode: 'USD',
    },
    StartDate: '2025-11-01T00:00:00Z',
    Availability: 'Active',
  },
];
