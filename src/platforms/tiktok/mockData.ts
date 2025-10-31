/**
 * TikTok Marketing API Mock Data
 * API Version: v1.3
 *
 * All responses follow TikTok's standard format:
 * {
 *   code: number,      // 0 for success, error codes otherwise
 *   message: string,   // "OK" for success, error description otherwise
 *   data: object       // Response payload
 * }
 */

export interface TikTokCampaign {
  campaign_id: string;
  advertiser_id: string;
  campaign_name: string;
  objective_type: string;
  budget_mode: string;
  budget: number;
  operation_status: string;
  create_time: string;
  modify_time: string;
}

/**
 * Success response for campaign creation
 */
export const successCampaignResponse = {
  code: 0,
  message: 'OK',
  data: {
    campaign_id: '1234567890123456789'
  }
};

/**
 * Success response for campaign update
 */
export const successUpdateResponse = {
  code: 0,
  message: 'OK',
  data: {
    campaign_id: '1234567890123456789',
    operation_status: 'ENABLE'
  }
};

/**
 * Sample campaign object for GET requests
 */
export const sampleCampaign: TikTokCampaign = {
  campaign_id: '1234567890123456789',
  advertiser_id: '123456',
  campaign_name: 'Test TikTok Campaign',
  objective_type: 'TRAFFIC',
  budget_mode: 'BUDGET_MODE_DAY',
  budget: 100.0,
  operation_status: 'ENABLE',
  create_time: '2025-10-30T00:00:00Z',
  modify_time: '2025-10-30T00:00:00Z'
};

/**
 * Success response for getting campaign details
 */
export const successGetCampaignResponse = {
  code: 0,
  message: 'OK',
  data: {
    list: [sampleCampaign],
    page_info: {
      total_number: 1,
      page: 1,
      page_size: 10
    }
  }
};

/**
 * Validation error response (code: 40001)
 * Used for invalid request parameters
 */
export const validationErrorResponse = {
  code: 40001,
  message: 'Invalid parameter',
  data: {}
};

/**
 * Specific validation errors
 */
export const validationErrors = {
  missingAdvertiserId: {
    code: 40001,
    message: 'Missing required parameter: advertiser_id',
    data: {}
  },
  missingCampaignName: {
    code: 40001,
    message: 'Missing required parameter: campaign_name',
    data: {}
  },
  invalidBudget: {
    code: 40001,
    message: 'Invalid budget: must be a positive number',
    data: {}
  },
  missingCampaignId: {
    code: 40001,
    message: 'Missing required parameter: campaign_id',
    data: {}
  },
  invalidObjectiveType: {
    code: 40001,
    message: 'Invalid objective_type. Supported values: TRAFFIC, CONVERSIONS, APP_PROMOTION, REACH, VIDEO_VIEWS',
    data: {}
  },
  invalidBudgetMode: {
    code: 40001,
    message: 'Invalid budget_mode. Supported values: BUDGET_MODE_DAY, BUDGET_MODE_TOTAL, BUDGET_MODE_INFINITE',
    data: {}
  },
  invalidOperationStatus: {
    code: 40001,
    message: 'Invalid operation_status. Supported values: ENABLE, DISABLE, DELETE',
    data: {}
  }
};

/**
 * Authentication error response (code: 40100)
 * Used for missing or invalid access tokens
 */
export const authErrorResponse = {
  code: 40100,
  message: 'Authentication failed: Invalid or missing access token',
  data: {}
};

/**
 * Authorization error response (code: 40104)
 * Used for insufficient permissions
 */
export const authorizationErrorResponse = {
  code: 40104,
  message: 'Authorization failed: Insufficient permissions for this operation',
  data: {}
};

/**
 * Rate limit error response (code: 40002)
 */
export const rateLimitErrorResponse = {
  code: 40002,
  message: 'Rate limit exceeded. Please try again later.',
  data: {
    retry_after: 60
  }
};

/**
 * Server error response (code: 50000)
 */
export const serverErrorResponse = {
  code: 50000,
  message: 'Internal server error',
  data: {}
};

/**
 * Valid objective types for campaigns
 */
export const VALID_OBJECTIVE_TYPES = [
  'TRAFFIC',
  'CONVERSIONS',
  'APP_PROMOTION',
  'REACH',
  'VIDEO_VIEWS',
  'LEAD_GENERATION',
  'PRODUCT_SALES'
];

/**
 * Valid budget modes for campaigns
 */
export const VALID_BUDGET_MODES = [
  'BUDGET_MODE_DAY',
  'BUDGET_MODE_TOTAL',
  'BUDGET_MODE_INFINITE'
];

/**
 * Valid operation statuses for campaigns
 */
export const VALID_OPERATION_STATUSES = [
  'ENABLE',
  'DISABLE',
  'DELETE'
];

// ============================================
// Ad Group Types and Mock Data
// ============================================

export interface TikTokAdGroup {
  adgroup_id: string;
  advertiser_id: string;
  campaign_id: string;
  adgroup_name: string;
  placement_type: string;
  placements: string[];
  budget_mode: string;
  budget: number;
  schedule_type: string;
  operation_status: string;
  create_time: string;
  modify_time: string;
}

export const sampleAdGroup: TikTokAdGroup = {
  adgroup_id: '9876543210987654321',
  advertiser_id: '123456',
  campaign_id: '1234567890123456789',
  adgroup_name: 'Test Ad Group',
  placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
  placements: ['PLACEMENT_TIKTOK', 'PLACEMENT_PANGLE'],
  budget_mode: 'BUDGET_MODE_DAY',
  budget: 50.0,
  schedule_type: 'SCHEDULE_START_END',
  operation_status: 'ENABLE',
  create_time: '2025-10-30T00:00:00Z',
  modify_time: '2025-10-30T00:00:00Z'
};

/**
 * Valid placement types for ad groups
 */
export const VALID_PLACEMENT_TYPES = [
  'PLACEMENT_TYPE_AUTOMATIC',
  'PLACEMENT_TYPE_NORMAL'
];

/**
 * Valid placements
 */
export const VALID_PLACEMENTS = [
  'PLACEMENT_TIKTOK',
  'PLACEMENT_PANGLE',
  'PLACEMENT_GLOBAL_APP_BUNDLE'
];

// ============================================
// Ad Types and Mock Data
// ============================================

export interface TikTokAd {
  ad_id: string;
  advertiser_id: string;
  adgroup_id: string;
  display_name: string;
  operation_status: string;
  create_time: string;
  modify_time: string;
  creatives?: any;
}

export const sampleAd: TikTokAd = {
  ad_id: '5555555555555555555',
  advertiser_id: '123456',
  adgroup_id: '9876543210987654321',
  display_name: 'Test Ad',
  operation_status: 'ENABLE',
  create_time: '2025-10-30T00:00:00Z',
  modify_time: '2025-10-30T00:00:00Z'
};

// ============================================
// Integrated Reporting Types and Mock Data
// ============================================

export interface IntegratedReportData {
  campaign_id?: string;
  adgroup_id?: string;
  ad_id?: string;
  stat_time_day?: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  conversions: number;
}

export const sampleReportData: IntegratedReportData = {
  campaign_id: '1234567890123456789',
  stat_time_day: '2025-01-15',
  spend: 150.25,
  impressions: 10000,
  clicks: 500,
  cpc: 0.30,
  cpm: 15.03,
  ctr: 5.0,
  conversions: 25
};

/**
 * Valid data levels for reporting
 */
export const VALID_DATA_LEVELS = [
  'AUCTION_CAMPAIGN',
  'AUCTION_ADGROUP',
  'AUCTION_AD'
];

/**
 * Valid dimensions for reporting
 */
export const VALID_DIMENSIONS = [
  'campaign_id',
  'adgroup_id',
  'ad_id',
  'stat_time_day',
  'stat_time_hour'
];

/**
 * Valid metrics for reporting
 */
export const VALID_METRICS = [
  'spend',
  'impressions',
  'clicks',
  'cpc',
  'cpm',
  'ctr',
  'conversions',
  'conversion_rate',
  'cost_per_conversion'
];

// ============================================
// Additional Validation Errors
// ============================================

export const adGroupValidationErrors = {
  missingCampaignId: {
    code: 40001,
    message: 'Missing required parameter: campaign_id',
    data: {}
  },
  missingAdGroupName: {
    code: 40001,
    message: 'Missing required parameter: adgroup_name',
    data: {}
  },
  missingAdGroupId: {
    code: 40001,
    message: 'Missing required parameter: adgroup_id',
    data: {}
  },
  invalidPlacementType: {
    code: 40001,
    message: 'Invalid placement_type. Supported values: PLACEMENT_TYPE_AUTOMATIC, PLACEMENT_TYPE_NORMAL',
    data: {}
  },
  invalidPlacements: {
    code: 40001,
    message: 'Invalid placements. Supported values: PLACEMENT_TIKTOK, PLACEMENT_PANGLE, PLACEMENT_GLOBAL_APP_BUNDLE',
    data: {}
  }
};

export const adValidationErrors = {
  missingAdGroupId: {
    code: 40001,
    message: 'Missing required parameter: adgroup_id',
    data: {}
  },
  missingDisplayName: {
    code: 40001,
    message: 'Missing required parameter: display_name',
    data: {}
  },
  missingAdId: {
    code: 40001,
    message: 'Missing required parameter: ad_id',
    data: {}
  }
};

export const reportingValidationErrors = {
  missingDataLevel: {
    code: 40001,
    message: 'Missing required parameter: data_level',
    data: {}
  },
  missingDimensions: {
    code: 40001,
    message: 'Missing required parameter: dimensions',
    data: {}
  },
  missingMetrics: {
    code: 40001,
    message: 'Missing required parameter: metrics',
    data: {}
  },
  missingStartDate: {
    code: 40001,
    message: 'Missing required parameter: start_date',
    data: {}
  },
  missingEndDate: {
    code: 40001,
    message: 'Missing required parameter: end_date',
    data: {}
  },
  invalidDataLevel: {
    code: 40001,
    message: 'Invalid data_level. Supported values: AUCTION_CAMPAIGN, AUCTION_ADGROUP, AUCTION_AD',
    data: {}
  },
  invalidDimensions: {
    code: 40001,
    message: 'Invalid dimensions. Each dimension must be one of: campaign_id, adgroup_id, ad_id, stat_time_day, stat_time_hour',
    data: {}
  },
  invalidMetrics: {
    code: 40001,
    message: 'Invalid metrics. Each metric must be one of: spend, impressions, clicks, cpc, cpm, ctr, conversions, conversion_rate, cost_per_conversion',
    data: {}
  }
};
