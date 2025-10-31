import { Request, Response } from 'express';
import {
  validationErrors,
  authErrorResponse,
  VALID_OBJECTIVE_TYPES,
  VALID_BUDGET_MODES,
  VALID_OPERATION_STATUSES,
  TikTokCampaign,
  sampleCampaign,
  TikTokAdGroup,
  sampleAdGroup,
  TikTokAd,
  sampleAd,
  IntegratedReportData,
  sampleReportData,
  VALID_PLACEMENT_TYPES,
  VALID_PLACEMENTS,
  VALID_DATA_LEVELS,
  VALID_DIMENSIONS,
  VALID_METRICS,
  adGroupValidationErrors,
  adValidationErrors,
  reportingValidationErrors
} from './mockData';
import { authConfigs } from '../../config/auth.config';

/**
 * Validate Bearer token from Authorization header
 */
const validateToken = (req: Request): boolean => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return false;
  }

  // Check if header starts with "Bearer "
  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }

  // Extract token (remove "Bearer " prefix)
  const token = authHeader.substring(7);

  // Validate against configured token
  return token === authConfigs.tiktok.validToken;
};

/**
 * Create Campaign Controller
 * POST /open_api/v1.3/campaign/create/
 *
 * Request Body:
 * {
 *   advertiser_id: string (required)
 *   campaign_name: string (required)
 *   objective_type: string (required) - TRAFFIC, CONVERSIONS, APP_PROMOTION, etc.
 *   budget_mode: string (required) - BUDGET_MODE_DAY, BUDGET_MODE_TOTAL, BUDGET_MODE_INFINITE
 *   budget: number (required for DAY and TOTAL modes)
 * }
 *
 * Response 200:
 * {
 *   code: 0,
 *   message: "OK",
 *   data: { campaign_id: "123..." }
 * }
 *
 * Error 400:
 * {
 *   code: 40001,
 *   message: "Validation error message",
 *   data: {}
 * }
 */
export const createCampaign = (req: Request, res: Response) => {
  // Validate authentication
  if (!validateToken(req)) {
    return res.status(401).json(authErrorResponse);
  }

  const { advertiser_id, campaign_name, objective_type, budget_mode, budget } = req.body;

  // Validate required fields
  if (!advertiser_id) {
    return res.status(400).json(validationErrors.missingAdvertiserId);
  }

  if (!campaign_name) {
    return res.status(400).json(validationErrors.missingCampaignName);
  }

  if (!objective_type) {
    return res.status(400).json({
      code: 40001,
      message: 'Missing required parameter: objective_type',
      data: {}
    });
  }

  if (!budget_mode) {
    return res.status(400).json({
      code: 40001,
      message: 'Missing required parameter: budget_mode',
      data: {}
    });
  }

  // Validate objective_type
  if (!VALID_OBJECTIVE_TYPES.includes(objective_type)) {
    return res.status(400).json(validationErrors.invalidObjectiveType);
  }

  // Validate budget_mode
  if (!VALID_BUDGET_MODES.includes(budget_mode)) {
    return res.status(400).json(validationErrors.invalidBudgetMode);
  }

  // Validate budget for non-infinite budget modes
  if (budget_mode !== 'BUDGET_MODE_INFINITE') {
    if (budget === undefined || budget === null) {
      return res.status(400).json({
        code: 40001,
        message: 'Missing required parameter: budget (required for BUDGET_MODE_DAY and BUDGET_MODE_TOTAL)',
        data: {}
      });
    }

    if (typeof budget !== 'number' || budget <= 0) {
      return res.status(400).json(validationErrors.invalidBudget);
    }
  }

  // Generate unique campaign ID
  const campaign_id = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

  // Return success response with campaign ID
  return res.status(200).json({
    code: 0,
    message: 'OK',
    data: {
      campaign_id
    }
  });
};

/**
 * Update Campaign Controller
 * POST /open_api/v1.3/campaign/update/
 *
 * Request Body:
 * {
 *   advertiser_id: string (required)
 *   campaign_id: string (required)
 *   operation_status: string (optional) - ENABLE, DISABLE, DELETE
 *   campaign_name: string (optional)
 *   budget: number (optional)
 * }
 *
 * Response 200:
 * {
 *   code: 0,
 *   message: "OK",
 *   data: { campaign_id: "123..." }
 * }
 */
export const updateCampaign = (req: Request, res: Response) => {
  // Validate authentication
  if (!validateToken(req)) {
    return res.status(401).json(authErrorResponse);
  }

  const { advertiser_id, campaign_id, operation_status, budget } = req.body;

  // Validate required fields
  if (!advertiser_id) {
    return res.status(400).json(validationErrors.missingAdvertiserId);
  }

  if (!campaign_id) {
    return res.status(400).json(validationErrors.missingCampaignId);
  }

  // Validate operation_status if provided
  if (operation_status && !VALID_OPERATION_STATUSES.includes(operation_status)) {
    return res.status(400).json(validationErrors.invalidOperationStatus);
  }

  // Validate budget if provided
  if (budget !== undefined && budget !== null) {
    if (typeof budget !== 'number' || budget <= 0) {
      return res.status(400).json(validationErrors.invalidBudget);
    }
  }

  // Return success response
  return res.status(200).json({
    code: 0,
    message: 'OK',
    data: {
      campaign_id,
      ...(operation_status && { operation_status })
    }
  });
};

/**
 * Get Campaign Controller
 * GET /open_api/v1.3/campaign/get/
 *
 * Query Parameters:
 * - advertiser_id: string (required)
 * - campaign_ids: string (optional) - JSON array of campaign IDs
 * - filtering: string (optional) - JSON filtering conditions
 * - page: number (optional, default: 1)
 * - page_size: number (optional, default: 10, max: 100)
 *
 * Response 200:
 * {
 *   code: 0,
 *   message: "OK",
 *   data: {
 *     list: [{ campaign_id, campaign_name, ... }],
 *     page_info: { total_number, page, page_size }
 *   }
 * }
 */
export const getCampaign = (req: Request, res: Response) => {
  // Validate authentication
  if (!validateToken(req)) {
    return res.status(401).json(authErrorResponse);
  }

  const { advertiser_id, campaign_ids } = req.query;

  // Validate required fields
  if (!advertiser_id) {
    return res.status(400).json(validationErrors.missingAdvertiserId);
  }

  // If specific campaign IDs are requested, return those
  if (campaign_ids) {
    try {
      const ids = JSON.parse(campaign_ids as string);
      if (Array.isArray(ids) && ids.length > 0) {
        // Return campaigns for requested IDs
        const campaigns = ids.map((id, index) => ({
          ...sampleCampaign,
          campaign_id: id,
          advertiser_id: advertiser_id as string,
          campaign_name: `Campaign ${index + 1}`
        }));

        return res.status(200).json({
          code: 0,
          message: 'OK',
          data: {
            list: campaigns,
            page_info: {
              total_number: campaigns.length,
              page: 1,
              page_size: campaigns.length
            }
          }
        });
      }
    } catch (error) {
      return res.status(400).json({
        code: 40001,
        message: 'Invalid campaign_ids format: must be a JSON array',
        data: {}
      });
    }
  }

  // Return default sample campaign
  const campaign: TikTokCampaign = {
    ...sampleCampaign,
    advertiser_id: advertiser_id as string
  };

  return res.status(200).json({
    code: 0,
    message: 'OK',
    data: {
      list: [campaign],
      page_info: {
        total_number: 1,
        page: 1,
        page_size: 10
      }
    }
  });
};

// ============================================
// Ad Group Controllers
// ============================================

/**
 * Get Ad Groups Controller
 * GET /open_api/v1.3/adgroup/get/
 */
export const getAdGroup = (req: Request, res: Response) => {
  if (!validateToken(req)) {
    return res.status(401).json(authErrorResponse);
  }

  const { advertiser_id, adgroup_ids } = req.query;

  if (!advertiser_id) {
    return res.status(400).json(validationErrors.missingAdvertiserId);
  }

  // If specific adgroup IDs are requested
  if (adgroup_ids) {
    try {
      const ids = JSON.parse(adgroup_ids as string);
      if (Array.isArray(ids) && ids.length > 0) {
        const adgroups = ids.map((id, index) => ({
          ...sampleAdGroup,
          adgroup_id: id,
          advertiser_id: advertiser_id as string,
          adgroup_name: `Ad Group ${index + 1}`
        }));

        return res.status(200).json({
          code: 0,
          message: 'OK',
          data: {
            list: adgroups,
            page_info: {
              total_number: adgroups.length,
              page: 1,
              page_size: adgroups.length
            }
          }
        });
      }
    } catch (error) {
      return res.status(400).json({
        code: 40001,
        message: 'Invalid adgroup_ids format: must be a JSON array',
        data: {}
      });
    }
  }

  // Return default sample ad group
  const adgroup: TikTokAdGroup = {
    ...sampleAdGroup,
    advertiser_id: advertiser_id as string
  };

  return res.status(200).json({
    code: 0,
    message: 'OK',
    data: {
      list: [adgroup],
      page_info: {
        total_number: 1,
        page: 1,
        page_size: 10
      }
    }
  });
};

/**
 * Create Ad Group Controller
 * POST /open_api/v1.3/adgroup/create/
 */
export const createAdGroup = (req: Request, res: Response) => {
  if (!validateToken(req)) {
    return res.status(401).json(authErrorResponse);
  }

  const {
    advertiser_id,
    campaign_id,
    adgroup_name,
    placement_type,
    placements,
    budget_mode,
    budget
  } = req.body;

  // Validate required fields
  if (!advertiser_id) {
    return res.status(400).json(validationErrors.missingAdvertiserId);
  }

  if (!campaign_id) {
    return res.status(400).json(adGroupValidationErrors.missingCampaignId);
  }

  if (!adgroup_name) {
    return res.status(400).json(adGroupValidationErrors.missingAdGroupName);
  }

  if (!placement_type) {
    return res.status(400).json({
      code: 40001,
      message: 'Missing required parameter: placement_type',
      data: {}
    });
  }

  // Validate placement_type
  if (!VALID_PLACEMENT_TYPES.includes(placement_type)) {
    return res.status(400).json(adGroupValidationErrors.invalidPlacementType);
  }

  // Validate placements if provided
  if (placements) {
    if (!Array.isArray(placements)) {
      return res.status(400).json({
        code: 40001,
        message: 'placements must be an array',
        data: {}
      });
    }

    const invalidPlacements = placements.filter((p: string) => !VALID_PLACEMENTS.includes(p));
    if (invalidPlacements.length > 0) {
      return res.status(400).json(adGroupValidationErrors.invalidPlacements);
    }
  }

  // Validate budget_mode if provided
  if (budget_mode && !VALID_BUDGET_MODES.includes(budget_mode)) {
    return res.status(400).json(validationErrors.invalidBudgetMode);
  }

  // Validate budget if provided and budget_mode is not infinite
  if (budget_mode && budget_mode !== 'BUDGET_MODE_INFINITE') {
    if (budget === undefined || budget === null) {
      return res.status(400).json({
        code: 40001,
        message: 'Missing required parameter: budget (required for BUDGET_MODE_DAY and BUDGET_MODE_TOTAL)',
        data: {}
      });
    }

    if (typeof budget !== 'number' || budget <= 0) {
      return res.status(400).json(validationErrors.invalidBudget);
    }
  }

  // Generate unique ad group ID
  const adgroup_id = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

  return res.status(200).json({
    code: 0,
    message: 'OK',
    data: {
      adgroup_id
    }
  });
};

/**
 * Update Ad Group Controller
 * POST /open_api/v1.3/adgroup/update/
 */
export const updateAdGroup = (req: Request, res: Response) => {
  if (!validateToken(req)) {
    return res.status(401).json(authErrorResponse);
  }

  const { advertiser_id, adgroup_id, operation_status, budget } = req.body;

  // Validate required fields
  if (!advertiser_id) {
    return res.status(400).json(validationErrors.missingAdvertiserId);
  }

  if (!adgroup_id) {
    return res.status(400).json(adGroupValidationErrors.missingAdGroupId);
  }

  // Validate operation_status if provided
  if (operation_status && !VALID_OPERATION_STATUSES.includes(operation_status)) {
    return res.status(400).json(validationErrors.invalidOperationStatus);
  }

  // Validate budget if provided
  if (budget !== undefined && budget !== null) {
    if (typeof budget !== 'number' || budget <= 0) {
      return res.status(400).json(validationErrors.invalidBudget);
    }
  }

  return res.status(200).json({
    code: 0,
    message: 'OK',
    data: {
      adgroup_id,
      ...(operation_status && { operation_status })
    }
  });
};

// ============================================
// Ad Controllers
// ============================================

/**
 * Get Ads Controller
 * GET /open_api/v1.3/ad/get/
 */
export const getAd = (req: Request, res: Response) => {
  if (!validateToken(req)) {
    return res.status(401).json(authErrorResponse);
  }

  const { advertiser_id, ad_ids } = req.query;

  if (!advertiser_id) {
    return res.status(400).json(validationErrors.missingAdvertiserId);
  }

  // If specific ad IDs are requested
  if (ad_ids) {
    try {
      const ids = JSON.parse(ad_ids as string);
      if (Array.isArray(ids) && ids.length > 0) {
        const ads = ids.map((id, index) => ({
          ...sampleAd,
          ad_id: id,
          advertiser_id: advertiser_id as string,
          display_name: `Ad ${index + 1}`
        }));

        return res.status(200).json({
          code: 0,
          message: 'OK',
          data: {
            list: ads,
            page_info: {
              total_number: ads.length,
              page: 1,
              page_size: ads.length
            }
          }
        });
      }
    } catch (error) {
      return res.status(400).json({
        code: 40001,
        message: 'Invalid ad_ids format: must be a JSON array',
        data: {}
      });
    }
  }

  // Return default sample ad
  const ad: TikTokAd = {
    ...sampleAd,
    advertiser_id: advertiser_id as string
  };

  return res.status(200).json({
    code: 0,
    message: 'OK',
    data: {
      list: [ad],
      page_info: {
        total_number: 1,
        page: 1,
        page_size: 10
      }
    }
  });
};

/**
 * Create Ad Controller
 * POST /open_api/v1.3/ad/create/
 */
export const createAd = (req: Request, res: Response) => {
  if (!validateToken(req)) {
    return res.status(401).json(authErrorResponse);
  }

  const { advertiser_id, adgroup_id, display_name } = req.body;

  // Validate required fields
  if (!advertiser_id) {
    return res.status(400).json(validationErrors.missingAdvertiserId);
  }

  if (!adgroup_id) {
    return res.status(400).json(adValidationErrors.missingAdGroupId);
  }

  if (!display_name) {
    return res.status(400).json(adValidationErrors.missingDisplayName);
  }

  // Generate unique ad ID
  const ad_id = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

  return res.status(200).json({
    code: 0,
    message: 'OK',
    data: {
      ad_id
    }
  });
};

/**
 * Update Ad Controller
 * POST /open_api/v1.3/ad/update/
 */
export const updateAd = (req: Request, res: Response) => {
  if (!validateToken(req)) {
    return res.status(401).json(authErrorResponse);
  }

  const { advertiser_id, ad_id, operation_status } = req.body;

  // Validate required fields
  if (!advertiser_id) {
    return res.status(400).json(validationErrors.missingAdvertiserId);
  }

  if (!ad_id) {
    return res.status(400).json(adValidationErrors.missingAdId);
  }

  // Validate operation_status if provided
  if (operation_status && !VALID_OPERATION_STATUSES.includes(operation_status)) {
    return res.status(400).json(validationErrors.invalidOperationStatus);
  }

  return res.status(200).json({
    code: 0,
    message: 'OK',
    data: {
      ad_id,
      ...(operation_status && { operation_status })
    }
  });
};

// ============================================
// Integrated Reporting Controller
// ============================================

/**
 * Get Integrated Reports Controller
 * GET /open_api/v1.3/reports/integrated/get/
 *
 * Note: TikTok's Integrated Reporting endpoint uses GET but accepts
 * a request body (POST-style GET), which is handled via query params
 * in this mock implementation.
 */
export const getIntegratedReport = (req: Request, res: Response) => {
  if (!validateToken(req)) {
    return res.status(401).json(authErrorResponse);
  }

  const { advertiser_id } = req.query;

  // Parse request body from query or body (supports both)
  let requestData: any;

  if (req.method === 'POST' || Object.keys(req.body).length > 0) {
    requestData = req.body;
  } else {
    // Try to parse from query params
    requestData = {
      advertiser_id,
      ...req.query
    };
  }

  const {
    data_level,
    dimensions,
    metrics,
    start_date,
    end_date,
    page = 1,
    page_size = 10
  } = requestData;

  // Validate required fields
  if (!advertiser_id && !requestData.advertiser_id) {
    return res.status(400).json(validationErrors.missingAdvertiserId);
  }

  if (!data_level) {
    return res.status(400).json(reportingValidationErrors.missingDataLevel);
  }

  if (!dimensions) {
    return res.status(400).json(reportingValidationErrors.missingDimensions);
  }

  if (!metrics) {
    return res.status(400).json(reportingValidationErrors.missingMetrics);
  }

  if (!start_date) {
    return res.status(400).json(reportingValidationErrors.missingStartDate);
  }

  if (!end_date) {
    return res.status(400).json(reportingValidationErrors.missingEndDate);
  }

  // Validate data_level
  if (!VALID_DATA_LEVELS.includes(data_level)) {
    return res.status(400).json(reportingValidationErrors.invalidDataLevel);
  }

  // Validate dimensions
  const dimensionsArray = Array.isArray(dimensions) ? dimensions : [dimensions];
  const invalidDimensions = dimensionsArray.filter((d: string) => !VALID_DIMENSIONS.includes(d));
  if (invalidDimensions.length > 0) {
    return res.status(400).json(reportingValidationErrors.invalidDimensions);
  }

  // Validate metrics
  const metricsArray = Array.isArray(metrics) ? metrics : [metrics];
  const invalidMetrics = metricsArray.filter((m: string) => !VALID_METRICS.includes(m));
  if (invalidMetrics.length > 0) {
    return res.status(400).json(reportingValidationErrors.invalidMetrics);
  }

  // Generate mock report data based on data_level
  const reportData: IntegratedReportData = {
    ...sampleReportData,
    stat_time_day: start_date
  };

  // Add dimension fields based on data_level
  if (data_level === 'AUCTION_CAMPAIGN') {
    reportData.campaign_id = '1234567890123456789';
  } else if (data_level === 'AUCTION_ADGROUP') {
    reportData.campaign_id = '1234567890123456789';
    reportData.adgroup_id = '9876543210987654321';
  } else if (data_level === 'AUCTION_AD') {
    reportData.campaign_id = '1234567890123456789';
    reportData.adgroup_id = '9876543210987654321';
    reportData.ad_id = '5555555555555555555';
  }

  // Filter report data to only include requested dimensions and metrics
  const filteredData: any = {};
  [...dimensionsArray, ...metricsArray].forEach((field: string) => {
    if (field in reportData) {
      filteredData[field] = reportData[field as keyof IntegratedReportData];
    }
  });

  return res.status(200).json({
    code: 0,
    message: 'OK',
    data: {
      list: [filteredData],
      page_info: {
        page: parseInt(page as string) || 1,
        page_size: parseInt(page_size as string) || 10,
        total_number: 1
      }
    }
  });
};
