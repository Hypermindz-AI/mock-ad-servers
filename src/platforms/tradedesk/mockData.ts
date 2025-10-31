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

/**
 * Ad Group interfaces and mock data
 */
export interface TTDAdGroup {
  AdGroupId: string;
  AdGroupName: string;
  CampaignId: string;
  Budget?: {
    Amount: number;
    CurrencyCode: string;
    DailyTargetAmount?: number;
  };
  MaxBid?: {
    Amount: number;
    CurrencyCode: string;
  };
  BaseBidCPM?: {
    Amount: number;
    CurrencyCode: string;
  };
  Availability?: string;
  PacingMode?: string;
  RTBAttributes?: {
    BidList?: string[];
  };
}

export const sampleAdGroup: TTDAdGroup = {
  AdGroupId: 'ttd_adgroup_abc123',
  AdGroupName: 'Test Ad Group',
  CampaignId: 'ttd_campaign_789xyz',
  Budget: {
    Amount: 5000,
    CurrencyCode: 'USD',
    DailyTargetAmount: 100,
  },
  MaxBid: {
    Amount: 10.50,
    CurrencyCode: 'USD',
  },
  BaseBidCPM: {
    Amount: 5.00,
    CurrencyCode: 'USD',
  },
  Availability: 'Active',
  PacingMode: 'EvenPacing',
  RTBAttributes: {
    BidList: ['bid_001', 'bid_002'],
  },
};

/**
 * Creative interfaces and mock data
 */
export interface TTDCreative {
  CreativeId: string;
  CreativeName: string;
  AdvertiserId: string;
  CreativeType: string;
  ThirdPartyTag?: string;
  ClickthroughUrl?: string;
  LandingPageUrl?: string;
  Availability?: string;
  CreativeAttributes?: {
    Width?: number;
    Height?: number;
    FileSize?: number;
  };
}

export const sampleCreative: TTDCreative = {
  CreativeId: 'ttd_creative_xyz789',
  CreativeName: 'Test Banner Creative',
  AdvertiserId: 'advertiser_abc123',
  CreativeType: 'ThirdPartyTag',
  ThirdPartyTag: '<script src="https://example.com/ad.js"></script>',
  ClickthroughUrl: 'https://example.com/click',
  LandingPageUrl: 'https://example.com/landing',
  Availability: 'Active',
  CreativeAttributes: {
    Width: 300,
    Height: 250,
    FileSize: 150000,
  },
};

/**
 * Campaign Query Response interfaces and mock data
 */
export interface TTDCampaignQueryRequest {
  AdvertiserIds: string[];
  PageStartIndex?: number;
  PageSize?: number;
}

export interface TTDCampaignQueryResponse {
  Result: TTDCampaign[];
  ResultCount: number;
}

export const sampleCampaignQueryResponse: TTDCampaignQueryResponse = {
  Result: sampleCampaigns,
  ResultCount: sampleCampaigns.length,
};

/**
 * Campaign Reporting interfaces and mock data
 */
export interface TTDCampaignReport {
  CampaignId: string;
  CampaignName: string;
  AdvertiserId: string;
  Impressions: number;
  Clicks: number;
  TotalCost: number;
  Conversions: number;
  CTR?: number;
  CPC?: number;
  CPM?: number;
  ConversionRate?: number;
}

export interface TTDCampaignReportingResponse {
  Result: TTDCampaignReport[];
  ResultCount: number;
}

export const sampleCampaignReport: TTDCampaignReport = {
  CampaignId: 'ttd_campaign_789xyz',
  CampaignName: 'Test Campaign',
  AdvertiserId: 'advertiser_abc123',
  Impressions: 100000,
  Clicks: 500,
  TotalCost: 1500.00,
  Conversions: 25,
  CTR: 0.5,
  CPC: 3.00,
  CPM: 15.00,
  ConversionRate: 5.0,
};

export const sampleCampaignReports: TTDCampaignReport[] = [
  sampleCampaignReport,
  {
    CampaignId: 'ttd_campaign_456def',
    CampaignName: 'Brand Awareness Campaign',
    AdvertiserId: 'advertiser_abc123',
    Impressions: 250000,
    Clicks: 1200,
    TotalCost: 3750.00,
    Conversions: 60,
    CTR: 0.48,
    CPC: 3.125,
    CPM: 15.00,
    ConversionRate: 5.0,
  },
  {
    CampaignId: 'ttd_campaign_123ghi',
    CampaignName: 'Performance Campaign',
    AdvertiserId: 'advertiser_xyz789',
    Impressions: 500000,
    Clicks: 3000,
    TotalCost: 7500.00,
    Conversions: 150,
    CTR: 0.6,
    CPC: 2.50,
    CPM: 15.00,
    ConversionRate: 5.0,
  },
];

export const sampleCampaignReportingResponse: TTDCampaignReportingResponse = {
  Result: sampleCampaignReports,
  ResultCount: sampleCampaignReports.length,
};
