import { Router } from 'express';
import {
  createCampaign,
  updateCampaign,
  getCampaign,
  getAdGroup,
  createAdGroup,
  updateAdGroup,
  getAd,
  createAd,
  updateAd,
  getIntegratedReport
} from './controllers';

/**
 * TikTok Marketing API Routes
 * Base URL: /tiktok/v1.3
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
 * POST /tiktok/v1.3/campaign/create/
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
 * POST /tiktok/v1.3/campaign/update/
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
 * GET /tiktok/v1.3/campaign/get/
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

/**
 * Get Ad Group
 * GET /tiktok/v1.3/adgroup/get/
 *
 * Retrieves ad group details for an advertiser account.
 *
 * Query Parameters:
 * - advertiser_id: string (required) - TikTok advertiser account ID
 * - adgroup_ids: string (optional) - JSON array of ad group IDs to retrieve
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
 *         adgroup_id: "9876543210987654321",
 *         advertiser_id: "123456",
 *         campaign_id: "1234567890123456789",
 *         adgroup_name: "Test Ad Group",
 *         placement_type: "PLACEMENT_TYPE_AUTOMATIC",
 *         placements: ["PLACEMENT_TIKTOK", "PLACEMENT_PANGLE"],
 *         budget_mode: "BUDGET_MODE_DAY",
 *         budget: 50.0,
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
 */
router.get('/adgroup/get/', getAdGroup);

/**
 * Create Ad Group
 * POST /tiktok/v1.3/adgroup/create/
 *
 * Creates a new ad group under a campaign.
 *
 * Request Body:
 * {
 *   advertiser_id: string (required) - TikTok advertiser account ID
 *   campaign_id: string (required) - Parent campaign ID
 *   adgroup_name: string (required) - Name of the ad group
 *   placement_type: string (required) - PLACEMENT_TYPE_AUTOMATIC or PLACEMENT_TYPE_NORMAL
 *   placements: array (optional) - Array of placement types
 *   budget_mode: string (optional) - Budget type (BUDGET_MODE_DAY, BUDGET_MODE_TOTAL, BUDGET_MODE_INFINITE)
 *   budget: number (optional) - Budget amount
 * }
 *
 * Response 200 (Success):
 * {
 *   code: 0,
 *   message: "OK",
 *   data: {
 *     adgroup_id: "9876543210987654321"
 *   }
 * }
 */
router.post('/adgroup/create/', createAdGroup);

/**
 * Update Ad Group
 * POST /tiktok/v1.3/adgroup/update/
 *
 * Updates an existing ad group's properties.
 *
 * Request Body:
 * {
 *   advertiser_id: string (required) - TikTok advertiser account ID
 *   adgroup_id: string (required) - ID of ad group to update
 *   operation_status: string (optional) - ENABLE, DISABLE, or DELETE
 *   adgroup_name: string (optional) - New ad group name
 *   budget: number (optional) - New budget amount
 * }
 *
 * Response 200 (Success):
 * {
 *   code: 0,
 *   message: "OK",
 *   data: {
 *     adgroup_id: "9876543210987654321",
 *     operation_status: "ENABLE"
 *   }
 * }
 */
router.post('/adgroup/update/', updateAdGroup);

/**
 * Get Ads
 * GET /tiktok/v1.3/ad/get/
 *
 * Retrieves ad details for an advertiser account.
 *
 * Query Parameters:
 * - advertiser_id: string (required) - TikTok advertiser account ID
 * - ad_ids: string (optional) - JSON array of ad IDs to retrieve
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
 *         ad_id: "5555555555555555555",
 *         advertiser_id: "123456",
 *         adgroup_id: "9876543210987654321",
 *         display_name: "Test Ad",
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
 */
router.get('/ad/get/', getAd);

/**
 * Create Ad
 * POST /tiktok/v1.3/ad/create/
 *
 * Creates a new ad under an ad group.
 *
 * Request Body:
 * {
 *   advertiser_id: string (required) - TikTok advertiser account ID
 *   adgroup_id: string (required) - Parent ad group ID
 *   display_name: string (required) - Display name of the ad
 *   creatives: object (optional) - Creative assets for the ad
 * }
 *
 * Response 200 (Success):
 * {
 *   code: 0,
 *   message: "OK",
 *   data: {
 *     ad_id: "5555555555555555555"
 *   }
 * }
 */
router.post('/ad/create/', createAd);

/**
 * Update Ad
 * POST /tiktok/v1.3/ad/update/
 *
 * Updates an existing ad's properties.
 *
 * Request Body:
 * {
 *   advertiser_id: string (required) - TikTok advertiser account ID
 *   ad_id: string (required) - ID of ad to update
 *   operation_status: string (optional) - ENABLE, DISABLE, or DELETE
 *   display_name: string (optional) - New display name
 * }
 *
 * Response 200 (Success):
 * {
 *   code: 0,
 *   message: "OK",
 *   data: {
 *     ad_id: "5555555555555555555",
 *     operation_status: "ENABLE"
 *   }
 * }
 */
router.post('/ad/update/', updateAd);

/**
 * Get Integrated Reports
 * GET /tiktok/v1.3/reports/integrated/get/
 *
 * Retrieves integrated reporting data with customizable dimensions and metrics.
 * Note: This endpoint accepts both GET with query params and POST with body.
 *
 * Query Parameters / Request Body:
 * {
 *   advertiser_id: string (required) - TikTok advertiser account ID
 *   data_level: string (required) - AUCTION_CAMPAIGN, AUCTION_ADGROUP, or AUCTION_AD
 *   dimensions: array (required) - Dimension fields (e.g., ["campaign_id", "stat_time_day"])
 *   metrics: array (required) - Metric fields (e.g., ["spend", "impressions", "clicks"])
 *   start_date: string (required) - Start date in YYYY-MM-DD format
 *   end_date: string (required) - End date in YYYY-MM-DD format
 *   page: number (optional, default: 1) - Page number
 *   page_size: number (optional, default: 10, max: 100) - Results per page
 * }
 *
 * Response 200 (Success):
 * {
 *   code: 0,
 *   message: "OK",
 *   data: {
 *     list: [
 *       {
 *         campaign_id: "1234567890123456789",
 *         stat_time_day: "2025-01-15",
 *         spend: 150.25,
 *         impressions: 10000,
 *         clicks: 500,
 *         cpc: 0.30,
 *         cpm: 15.03,
 *         ctr: 5.0,
 *         conversions: 25
 *       }
 *     ],
 *     page_info: {
 *       page: 1,
 *       page_size: 10,
 *       total_number: 1
 *     }
 *   }
 * }
 */
router.get('/reports/integrated/get/', getIntegratedReport);
router.post('/reports/integrated/get/', getIntegratedReport); // Support POST as well

export default router;
