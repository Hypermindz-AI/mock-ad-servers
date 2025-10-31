/**
 * Meta Marketing API v23.0 Mock Data
 * Hardcoded responses for testing campaign activation
 */

export interface MetaCampaign {
  id: string;
  name: string;
  objective?: string;
  status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  special_ad_categories?: string[];
  created_time?: string;
  updated_time?: string;
}

export interface MetaSuccessResponse {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: number;
  lifetime_budget?: number;
}

export interface MetaErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id?: string;
  };
}

/**
 * Sample successful campaign creation response
 */
export const successCampaignResponse: MetaSuccessResponse = {
  id: '120210000000000000',
  name: 'Mock Meta Campaign',
  status: 'ACTIVE',
  objective: 'OUTCOME_TRAFFIC',
  daily_budget: 5000,
};

/**
 * Sample campaign object for GET requests
 */
export const sampleCampaign: MetaCampaign = {
  id: '120210000000000000',
  name: 'Mock Meta Campaign',
  objective: 'OUTCOME_TRAFFIC',
  status: 'ACTIVE',
  daily_budget: 5000,
  special_ad_categories: [],
  created_time: '2025-10-30T00:00:00+0000',
  updated_time: '2025-10-30T00:00:00+0000',
};

/**
 * Validation error response - Meta format
 */
export const validationErrorResponse: MetaErrorResponse = {
  error: {
    message: 'Invalid parameter',
    type: 'OAuthException',
    code: 100,
    fbtrace_id: 'AaBbCcDdEeFfGg',
  },
};

/**
 * Authentication error response
 */
export const authErrorResponse: MetaErrorResponse = {
  error: {
    message: 'Invalid OAuth access token',
    type: 'OAuthException',
    code: 190,
    fbtrace_id: 'HhIiJjKkLlMmNn',
  },
};

/**
 * Missing required field error
 */
export const missingFieldErrorResponse: MetaErrorResponse = {
  error: {
    message: 'Missing required field',
    type: 'OAuthException',
    code: 100,
    fbtrace_id: 'OoPpQqRrSsTtUu',
  },
};

/**
 * Invalid budget error
 */
export const invalidBudgetErrorResponse: MetaErrorResponse = {
  error: {
    message: 'Invalid budget amount. Budget must be a positive number',
    type: 'OAuthException',
    code: 100,
    fbtrace_id: 'VvWwXxYyZzAaBb',
  },
};

/**
 * Campaign not found error
 */
export const campaignNotFoundErrorResponse: MetaErrorResponse = {
  error: {
    message: 'Campaign not found',
    type: 'OAuthException',
    code: 100,
    fbtrace_id: 'CcDdEeFfGgHhIi',
  },
};

/**
 * Invalid objective error
 */
export const invalidObjectiveErrorResponse: MetaErrorResponse = {
  error: {
    message: 'Invalid objective type',
    type: 'OAuthException',
    code: 100,
    fbtrace_id: 'JjKkLlMmNnOoPp',
  },
};

/**
 * Valid Meta campaign objectives (v23.0)
 */
export const validObjectives = [
  'OUTCOME_AWARENESS',
  'OUTCOME_ENGAGEMENT',
  'OUTCOME_LEADS',
  'OUTCOME_SALES',
  'OUTCOME_TRAFFIC',
  'APP_INSTALLS',
  'BRAND_AWARENESS',
  'EVENT_RESPONSES',
  'LEAD_GENERATION',
  'LINK_CLICKS',
  'LOCAL_AWARENESS',
  'MESSAGES',
  'OFFER_CLAIMS',
  'PAGE_LIKES',
  'POST_ENGAGEMENT',
  'PRODUCT_CATALOG_SALES',
  'REACH',
  'STORE_VISITS',
  'VIDEO_VIEWS',
  'CONVERSIONS',
];

/**
 * Valid Meta campaign statuses
 */
export const validStatuses = [
  'ACTIVE',
  'PAUSED',
  'DELETED',
  'ARCHIVED',
];

/**
 * In-memory campaign storage (for mock persistence within session)
 */
export const campaignStorage: Map<string, MetaCampaign> = new Map([
  ['120210000000000000', sampleCampaign],
]);

/**
 * Helper function to generate unique campaign ID
 */
export const generateCampaignId = (): string => {
  return `1202100000${Date.now().toString().slice(-8)}`;
};

/**
 * Helper function to generate Facebook trace ID
 */
export const generateFbTraceId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 14; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Ad Set Interface
 */
export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  billing_event?: string;
  optimization_goal?: string;
  bid_amount?: number;
  daily_budget?: number;
  lifetime_budget?: number;
  targeting?: any;
  created_time?: string;
  updated_time?: string;
}

/**
 * Ad Interface
 */
export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  status: string;
  creative?: any;
  created_time?: string;
  updated_time?: string;
}

/**
 * Campaign Insights Interface
 */
export interface MetaCampaignInsights {
  impressions: string;
  clicks: string;
  spend: string;
  cpc: string;
  cpm: string;
  ctr: string;
  date_start?: string;
  date_stop?: string;
}

/**
 * Pagination Response
 */
export interface MetaPaginationResponse<T> {
  data: T[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

/**
 * In-memory ad set storage
 */
export const adSetStorage: Map<string, MetaAdSet> = new Map();

/**
 * In-memory ad storage
 */
export const adStorage: Map<string, MetaAd> = new Map();

/**
 * Helper function to generate unique ad set ID
 */
export const generateAdSetId = (): string => {
  return `2301100000${Date.now().toString().slice(-8)}`;
};

/**
 * Helper function to generate unique ad ID
 */
export const generateAdId = (): string => {
  return `2302100000${Date.now().toString().slice(-8)}`;
};

/**
 * Helper function to generate cursor for pagination
 */
export const generateCursor = (): string => {
  return Buffer.from(Date.now().toString() + Math.random().toString()).toString('base64');
};

/**
 * Valid billing events for ad sets
 */
export const validBillingEvents = [
  'IMPRESSIONS',
  'CLICKS',
  'LINK_CLICKS',
  'POST_ENGAGEMENT',
  'APP_INSTALLS',
  'VIDEO_VIEWS',
  'THRUPLAY',
];

/**
 * Valid optimization goals for ad sets
 */
export const validOptimizationGoals = [
  'REACH',
  'LINK_CLICKS',
  'IMPRESSIONS',
  'OFFSITE_CONVERSIONS',
  'CONVERSIONS',
  'APP_INSTALLS',
  'ENGAGEMENT',
  'LEAD_GENERATION',
  'QUALITY_CALL',
  'THRUPLAY',
  'AD_RECALL_LIFT',
  'VALUE',
  'LANDING_PAGE_VIEWS',
];

/**
 * Sample insights data generator
 */
export const generateInsightsData = (
  datePreset?: string,
  timeRange?: { since: string; until: string }
): MetaCampaignInsights => {
  const impressions = Math.floor(Math.random() * 50000) + 10000;
  const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
  const spend = (Math.random() * 5000 + 1000).toFixed(2);
  const cpc = (parseFloat(spend) / clicks).toFixed(2);
  const cpm = ((parseFloat(spend) / impressions) * 1000).toFixed(2);
  const ctr = ((clicks / impressions) * 100).toFixed(2);

  let dateStart: string;
  let dateStop: string;

  if (timeRange) {
    dateStart = timeRange.since;
    dateStop = timeRange.until;
  } else {
    const now = new Date();
    const daysAgo = datePreset === 'last_30d' ? 30 : datePreset === 'last_7d' ? 7 : 365;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    dateStart = startDate.toISOString().split('T')[0];
    dateStop = now.toISOString().split('T')[0];
  }

  return {
    impressions: impressions.toString(),
    clicks: clicks.toString(),
    spend,
    cpc,
    cpm,
    ctr,
    date_start: dateStart,
    date_stop: dateStop,
  };
};
