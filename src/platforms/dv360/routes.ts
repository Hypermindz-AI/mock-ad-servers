/**
 * DV360 API v4 Routes
 * Display & Video 360 campaign management endpoints
 */

import { Router } from 'express';
import {
  createCampaign,
  updateCampaign,
  getCampaign,
  validateDV360Auth,
} from './controllers';

const router = Router();

/**
 * DV360 API v4 Routes
 * Base URL: /v4
 *
 * Authentication:
 * - Uses Google OAuth 2.0 (shared with Google Ads)
 * - Authorization header: "Bearer {access_token}"
 * - Required scope: https://www.googleapis.com/auth/doubleclickbidmanager
 * - Service account support available for enterprise use
 *
 * Note: DV360 shares Google OAuth infrastructure via google-oauth.ts
 */

/**
 * Create a new campaign
 * POST /v4/advertisers/:advertiserId/campaigns
 *
 * Request body:
 * {
 *   "displayName": "Campaign Name",
 *   "entityStatus": "ENTITY_STATUS_ACTIVE",
 *   "campaignGoal": {
 *     "campaignGoalType": "CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS",
 *     "performanceGoal": {
 *       "performanceGoalType": "PERFORMANCE_GOAL_TYPE_CPM",
 *       "performanceGoalAmountMicros": "5000000"
 *     }
 *   },
 *   "campaignFlight": {
 *     "plannedSpendAmountMicros": "100000000000",
 *     "plannedDates": {
 *       "startDate": { "year": 2025, "month": 11, "day": 1 },
 *       "endDate": { "year": 2025, "month": 12, "day": 31 }
 *     }
 *   }
 * }
 *
 * Response 200:
 * {
 *   "name": "advertisers/123/campaigns/456",
 *   "campaignId": "456",
 *   "displayName": "Campaign Name",
 *   "entityStatus": "ENTITY_STATUS_ACTIVE",
 *   "campaignGoal": { ... }
 * }
 */
router.post('/advertisers/:advertiserId/campaigns', validateDV360Auth, createCampaign);

/**
 * Update an existing campaign
 * PATCH /v4/advertisers/:advertiserId/campaigns/:campaignId
 *
 * Request body:
 * {
 *   "entityStatus": "ENTITY_STATUS_PAUSED",
 *   "displayName": "Updated Campaign Name"
 * }
 *
 * Response 200:
 * {
 *   "name": "advertisers/123/campaigns/456",
 *   "campaignId": "456",
 *   "displayName": "Updated Campaign Name",
 *   "entityStatus": "ENTITY_STATUS_PAUSED",
 *   ...
 * }
 */
router.patch('/advertisers/:advertiserId/campaigns/:campaignId', validateDV360Auth, updateCampaign);

/**
 * Get a campaign by ID
 * GET /v4/advertisers/:advertiserId/campaigns/:campaignId
 *
 * Response 200:
 * {
 *   "name": "advertisers/123/campaigns/456",
 *   "campaignId": "456",
 *   "displayName": "Campaign Name",
 *   "entityStatus": "ENTITY_STATUS_ACTIVE",
 *   ...
 * }
 */
router.get('/advertisers/:advertiserId/campaigns/:campaignId', validateDV360Auth, getCampaign);

export default router;
