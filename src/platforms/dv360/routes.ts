/**
 * DV360 API v4 Routes
 * Display & Video 360 campaign management endpoints
 */

import { Router } from 'express';
import {
  createCampaign,
  updateCampaign,
  getCampaign,
  listCampaigns,
  queryCampaigns,
  validateDV360Auth,
  listInsertionOrders,
  createInsertionOrder,
  getInsertionOrder,
  updateInsertionOrder,
  listLineItems,
  createLineItem,
  getLineItem,
  updateLineItem,
} from './controllers';

const router = Router();

/**
 * DV360 API v4 Routes
 * Base URL: /dv360/v4
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
 * POST /dv360/v4/advertisers/:advertiserId/campaigns
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
 * List campaigns with pagination and filtering
 * GET /dv360/v4/advertisers/:advertiserId/campaigns
 *
 * Query parameters:
 * - pageSize: Number of results per page (default: 10)
 * - pageToken: Token for the next page
 * - orderBy: Sort order (e.g., "displayName", "entityStatus", "updateTime")
 * - filter: Filter expression (e.g., 'entityStatus="ENTITY_STATUS_ACTIVE"')
 *
 * Response 200:
 * {
 *   "campaigns": [...],
 *   "nextPageToken": "..." (optional)
 * }
 */
router.get('/advertisers/:advertiserId/campaigns', validateDV360Auth, listCampaigns);

/**
 * Get a campaign by ID
 * GET /dv360/v4/advertisers/:advertiserId/campaigns/:campaignId
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

/**
 * Update an existing campaign
 * PATCH /dv360/v4/advertisers/:advertiserId/campaigns/:campaignId
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
 * Query campaign metrics
 * POST /dv360/v4/advertisers/:advertiserId/campaigns:query
 *
 * Request body:
 * {
 *   "metrics": ["METRIC_IMPRESSIONS", "METRIC_CLICKS", "METRIC_TOTAL_COST"],
 *   "dateRanges": [
 *     {
 *       "startDate": { "year": 2025, "month": 11, "day": 1 },
 *       "endDate": { "year": 2025, "month": 11, "day": 30 }
 *     }
 *   ]
 * }
 *
 * Response 200:
 * {
 *   "campaignMetrics": [
 *     {
 *       "campaignId": "123",
 *       "metrics": {
 *         "impressions": "1500000",
 *         "clicks": "25000",
 *         "totalCostMicros": "75000000000"
 *       }
 *     }
 *   ]
 * }
 */
router.post('/advertisers/:advertiserId/campaigns:query', validateDV360Auth, queryCampaigns);

// ============================================
// Insertion Order Routes
// ============================================

/**
 * List insertion orders
 * GET /dv360/v4/advertisers/:advertiserId/insertionOrders
 *
 * Query parameters:
 * - pageSize: Number of results per page (default: 10)
 * - pageToken: Token for the next page
 * - orderBy: Sort order
 * - filter: Filter expression (e.g., 'campaignId="123"')
 *
 * Response 200:
 * {
 *   "insertionOrders": [...],
 *   "nextPageToken": "..." (optional)
 * }
 */
router.get('/advertisers/:advertiserId/insertionOrders', validateDV360Auth, listInsertionOrders);

/**
 * Create an insertion order
 * POST /dv360/v4/advertisers/:advertiserId/insertionOrders
 *
 * Request body:
 * {
 *   "displayName": "Insertion Order Name",
 *   "campaignId": "123",
 *   "insertionOrderType": "RTB",
 *   "entityStatus": "ENTITY_STATUS_DRAFT",
 *   "pacing": {
 *     "pacingPeriod": "PACING_PERIOD_DAILY",
 *     "pacingType": "PACING_TYPE_EVEN"
 *   },
 *   "budget": {
 *     "budgetUnit": "BUDGET_UNIT_CURRENCY",
 *     "budgetSegments": [...]
 *   }
 * }
 *
 * Response 200:
 * {
 *   "name": "advertisers/123/insertionOrders/456",
 *   "insertionOrderId": "456",
 *   "displayName": "Insertion Order Name",
 *   "campaignId": "123",
 *   ...
 * }
 */
router.post('/advertisers/:advertiserId/insertionOrders', validateDV360Auth, createInsertionOrder);

/**
 * Get an insertion order by ID
 * GET /dv360/v4/advertisers/:advertiserId/insertionOrders/:insertionOrderId
 *
 * Response 200:
 * {
 *   "name": "advertisers/123/insertionOrders/456",
 *   "insertionOrderId": "456",
 *   "displayName": "Insertion Order Name",
 *   ...
 * }
 */
router.get('/advertisers/:advertiserId/insertionOrders/:insertionOrderId', validateDV360Auth, getInsertionOrder);

/**
 * Update an insertion order
 * PATCH /dv360/v4/advertisers/:advertiserId/insertionOrders/:insertionOrderId
 *
 * Query parameters:
 * - updateMask: Comma-separated list of fields to update (e.g., "displayName,entityStatus")
 *
 * Request body:
 * {
 *   "displayName": "Updated Name",
 *   "entityStatus": "ENTITY_STATUS_ACTIVE"
 * }
 *
 * Response 200:
 * {
 *   "name": "advertisers/123/insertionOrders/456",
 *   "insertionOrderId": "456",
 *   "displayName": "Updated Name",
 *   ...
 * }
 */
router.patch('/advertisers/:advertiserId/insertionOrders/:insertionOrderId', validateDV360Auth, updateInsertionOrder);

// ============================================
// Line Item Routes
// ============================================

/**
 * List line items
 * GET /dv360/v4/advertisers/:advertiserId/lineItems
 *
 * Query parameters:
 * - pageSize: Number of results per page (default: 10)
 * - pageToken: Token for the next page
 * - orderBy: Sort order
 * - filter: Filter expression (e.g., 'insertionOrderId="123"')
 *
 * Response 200:
 * {
 *   "lineItems": [...],
 *   "nextPageToken": "..." (optional)
 * }
 */
router.get('/advertisers/:advertiserId/lineItems', validateDV360Auth, listLineItems);

/**
 * Create a line item
 * POST /dv360/v4/advertisers/:advertiserId/lineItems
 *
 * Request body:
 * {
 *   "displayName": "Line Item Name",
 *   "insertionOrderId": "123",
 *   "lineItemType": "LINE_ITEM_TYPE_DISPLAY_DEFAULT",
 *   "entityStatus": "ENTITY_STATUS_DRAFT",
 *   "flight": {
 *     "flightDateType": "LINE_ITEM_FLIGHT_DATE_TYPE_CUSTOM",
 *     "dateRange": {
 *       "startDate": { "year": 2025, "month": 11, "day": 1 },
 *       "endDate": { "year": 2025, "month": 12, "day": 31 }
 *     }
 *   },
 *   "budget": {
 *     "budgetAllocationType": "LINE_ITEM_BUDGET_ALLOCATION_TYPE_FIXED",
 *     "maxAmount": "50000000000"
 *   },
 *   "bidStrategy": {
 *     "fixedBid": {
 *       "bidAmountMicros": "3000000"
 *     }
 *   }
 * }
 *
 * Response 200:
 * {
 *   "name": "advertisers/123/lineItems/456",
 *   "lineItemId": "456",
 *   "displayName": "Line Item Name",
 *   ...
 * }
 */
router.post('/advertisers/:advertiserId/lineItems', validateDV360Auth, createLineItem);

/**
 * Get a line item by ID
 * GET /dv360/v4/advertisers/:advertiserId/lineItems/:lineItemId
 *
 * Response 200:
 * {
 *   "name": "advertisers/123/lineItems/456",
 *   "lineItemId": "456",
 *   "displayName": "Line Item Name",
 *   ...
 * }
 */
router.get('/advertisers/:advertiserId/lineItems/:lineItemId', validateDV360Auth, getLineItem);

/**
 * Update a line item
 * PATCH /dv360/v4/advertisers/:advertiserId/lineItems/:lineItemId
 *
 * Query parameters:
 * - updateMask: Comma-separated list of fields to update (e.g., "displayName,entityStatus")
 *
 * Request body:
 * {
 *   "displayName": "Updated Name",
 *   "entityStatus": "ENTITY_STATUS_ACTIVE"
 * }
 *
 * Response 200:
 * {
 *   "name": "advertisers/123/lineItems/456",
 *   "lineItemId": "456",
 *   "displayName": "Updated Name",
 *   ...
 * }
 */
router.patch('/advertisers/:advertiserId/lineItems/:lineItemId', validateDV360Auth, updateLineItem);

export default router;
