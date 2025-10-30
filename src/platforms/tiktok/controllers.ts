import { Request, Response } from 'express';
import {
  validationErrors,
  authErrorResponse,
  VALID_OBJECTIVE_TYPES,
  VALID_BUDGET_MODES,
  VALID_OPERATION_STATUSES,
  TikTokCampaign,
  sampleCampaign
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
