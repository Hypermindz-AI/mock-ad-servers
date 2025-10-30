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
