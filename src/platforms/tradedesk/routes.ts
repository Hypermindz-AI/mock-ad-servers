import express, { Router } from 'express';
import { authenticate, validateTTDAuth } from '../../auth/tradedesk-token';
import {
  createCampaign,
  updateCampaign,
  getCampaign,
  queryCampaignsFacets,
  getCampaignReporting,
  getAdGroup,
  createAdGroup,
  updateAdGroup,
  getCreative,
  createCreative,
  updateCreative,
} from './controllers';

/**
 * The Trade Desk API v3 Routes
 *
 * Base URL: /ttd/v3
 *
 * Authentication:
 * - POST /ttd/v3/authentication - Get token (no auth required)
 * - All other routes require TTD-Auth header
 */

const router: Router = express.Router();

/**
 * Authentication endpoint (no auth required)
 * POST /ttd/v3/authentication
 */
router.post('/authentication', authenticate);

/**
 * Campaign endpoints (require TTD-Auth header)
 */

/**
 * POST /ttd/v3/campaign
 * Create a new campaign
 *
 * Headers:
 * - TTD-Auth: {token}
 *
 * Body:
 * {
 *   "CampaignName": "Campaign Name",
 *   "AdvertiserId": "abc123",
 *   "Budget": {
 *     "Amount": 10000,
 *     "CurrencyCode": "USD"
 *   },
 *   "StartDate": "2025-11-01T00:00:00Z"
 * }
 */
router.post('/campaign', validateTTDAuth, createCampaign);

/**
 * PUT /ttd/v3/campaign/:id
 * Update an existing campaign
 *
 * Headers:
 * - TTD-Auth: {token}
 *
 * Body:
 * {
 *   "Availability": "Paused",
 *   "CampaignName": "Updated Name"
 * }
 */
router.put('/campaign/:id', validateTTDAuth, updateCampaign);

/**
 * GET /ttd/v3/campaign/:id
 * Get campaign details
 *
 * Headers:
 * - TTD-Auth: {token}
 */
router.get('/campaign/:id', validateTTDAuth, getCampaign);

/**
 * POST /ttd/v3/campaign/query/facets
 * Query campaigns with facets (filters)
 *
 * Headers:
 * - TTD-Auth: {token}
 *
 * Body:
 * {
 *   "AdvertiserIds": ["advertiser-1"],
 *   "PageStartIndex": 0,
 *   "PageSize": 100
 * }
 */
router.post('/campaign/query/facets', validateTTDAuth, queryCampaignsFacets);

/**
 * GET /ttd/v3/myreports/reportexecution/query/campaign
 * Get campaign reporting data
 *
 * Headers:
 * - TTD-Auth: {token}
 *
 * Query Parameters:
 * - AdvertiserIds: comma-separated list
 * - StartDateInclusive: ISO 8601 date
 * - EndDateExclusive: ISO 8601 date
 * - PageStartIndex: number (optional)
 * - PageSize: number (optional)
 */
router.get('/myreports/reportexecution/query/campaign', validateTTDAuth, getCampaignReporting);

/**
 * Ad Group endpoints (require TTD-Auth header)
 */

/**
 * GET /ttd/v3/adgroup/:id
 * Get ad group details
 *
 * Headers:
 * - TTD-Auth: {token}
 */
router.get('/adgroup/:id', validateTTDAuth, getAdGroup);

/**
 * POST /ttd/v3/adgroup
 * Create a new ad group
 *
 * Headers:
 * - TTD-Auth: {token}
 *
 * Body:
 * {
 *   "AdGroupName": "Ad Group Name",
 *   "CampaignId": "campaign_123",
 *   "Budget": {
 *     "Amount": 5000,
 *     "CurrencyCode": "USD"
 *   }
 * }
 */
router.post('/adgroup', validateTTDAuth, createAdGroup);

/**
 * PUT /ttd/v3/adgroup/:id
 * Update an existing ad group
 *
 * Headers:
 * - TTD-Auth: {token}
 *
 * Body:
 * {
 *   "AdGroupName": "Updated Name",
 *   "Availability": "Paused"
 * }
 */
router.put('/adgroup/:id', validateTTDAuth, updateAdGroup);

/**
 * Creative endpoints (require TTD-Auth header)
 */

/**
 * GET /ttd/v3/creative/:id
 * Get creative details
 *
 * Headers:
 * - TTD-Auth: {token}
 */
router.get('/creative/:id', validateTTDAuth, getCreative);

/**
 * POST /ttd/v3/creative
 * Create a new creative
 *
 * Headers:
 * - TTD-Auth: {token}
 *
 * Body:
 * {
 *   "CreativeName": "Creative Name",
 *   "AdvertiserId": "advertiser_123",
 *   "CreativeType": "ThirdPartyTag"
 * }
 */
router.post('/creative', validateTTDAuth, createCreative);

/**
 * PUT /ttd/v3/creative/:id
 * Update an existing creative
 *
 * Headers:
 * - TTD-Auth: {token}
 *
 * Body:
 * {
 *   "CreativeName": "Updated Name",
 *   "Availability": "Paused"
 * }
 */
router.put('/creative/:id', validateTTDAuth, updateCreative);

export default router;
