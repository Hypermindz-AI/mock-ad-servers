import { Router } from 'express';
import { createCampaign, updateCampaign, getCampaign } from './controllers';

/**
 * TikTok Marketing API Routes
 * Base URL: /open_api/v1.3
 * API Version: v1.3
 *
 * Authentication: Bearer token in Authorization header
 *
 * All endpoints return responses in TikTok's standard format:
 * {
 *   code: number,      // 0 for success, error codes otherwise
 *   message: string,   // "OK" for success, error description otherwise
 *   data: object       // Response payload
 * }
 */

const router = Router();

/**
 * Create Campaign
 * POST /open_api/v1.3/campaign/create/
 *
 * Creates a new advertising campaign for a TikTok advertiser account.
 *
 * Request Body:
 * {
 *   advertiser_id: string (required) - TikTok advertiser account ID
 *   campaign_name: string (required) - Name of the campaign
 *   objective_type: string (required) - Campaign objective (TRAFFIC, CONVERSIONS, etc.)
 *   budget_mode: string (required) - Budget type (BUDGET_MODE_DAY, BUDGET_MODE_TOTAL, BUDGET_MODE_INFINITE)
 *   budget: number (required for DAY/TOTAL modes) - Budget amount
 * }
 *
 * Response 200 (Success):
 * {
 *   code: 0,
 *   message: "OK",
 *   data: {
 *     campaign_id: "1234567890123456789"
 *   }
 * }
 *
 * Response 400 (Validation Error):
 * {
 *   code: 40001,
 *   message: "Invalid parameter",
 *   data: {}
 * }
 *
 * Response 401 (Auth Error):
 * {
 *   code: 40100,
 *   message: "Authentication failed: Invalid or missing access token",
 *   data: {}
 * }
 */
router.post('/campaign/create/', createCampaign);

/**
 * Update Campaign
 * POST /open_api/v1.3/campaign/update/
 *
 * Updates an existing campaign's properties.
 *
 * Request Body:
 * {
 *   advertiser_id: string (required) - TikTok advertiser account ID
 *   campaign_id: string (required) - ID of campaign to update
 *   operation_status: string (optional) - ENABLE, DISABLE, or DELETE
 *   campaign_name: string (optional) - New campaign name
 *   budget: number (optional) - New budget amount
 * }
 *
 * Response 200 (Success):
 * {
 *   code: 0,
 *   message: "OK",
 *   data: {
 *     campaign_id: "1234567890123456789",
 *     operation_status: "ENABLE"
 *   }
 * }
 *
 * Response 400 (Validation Error):
 * {
 *   code: 40001,
 *   message: "Invalid parameter",
 *   data: {}
 * }
 */
router.post('/campaign/update/', updateCampaign);

/**
 * Get Campaign
 * GET /open_api/v1.3/campaign/get/
 *
 * Retrieves campaign details for an advertiser account.
 *
 * Query Parameters:
 * - advertiser_id: string (required) - TikTok advertiser account ID
 * - campaign_ids: string (optional) - JSON array of campaign IDs to retrieve
 * - filtering: string (optional) - JSON filtering conditions
 * - page: number (optional, default: 1) - Page number
 * - page_size: number (optional, default: 10, max: 100) - Results per page
 *
 * Response 200 (Success):
 * {
 *   code: 0,
 *   message: "OK",
 *   data: {
 *     list: [
 *       {
 *         campaign_id: "1234567890123456789",
 *         advertiser_id: "123456",
 *         campaign_name: "Test Campaign",
 *         objective_type: "TRAFFIC",
 *         budget_mode: "BUDGET_MODE_DAY",
 *         budget: 100.0,
 *         operation_status: "ENABLE",
 *         create_time: "2025-10-30T00:00:00Z",
 *         modify_time: "2025-10-30T00:00:00Z"
 *       }
 *     ],
 *     page_info: {
 *       total_number: 1,
 *       page: 1,
 *       page_size: 10
 *     }
 *   }
 * }
 *
 * Response 400 (Validation Error):
 * {
 *   code: 40001,
 *   message: "Missing required parameter: advertiser_id",
 *   data: {}
 * }
 */
router.get('/campaign/get/', getCampaign);

export default router;
