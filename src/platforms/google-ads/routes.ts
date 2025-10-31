import { Router } from 'express';
import {
  createCampaign,
  getCampaign,
  updateCampaignStatus,
  searchGoogleAds,
  mutateAdGroups,
  mutateAdGroupAds,
} from './controllers.js';

const router = Router();

/**
 * Google Ads API v21 Routes
 * Base path: /googleads/v21
 */

/**
 * Campaign Mutate Endpoint (Create/Update)
 * POST /googleads/v21/customers/:customerId/campaigns:mutate
 *
 * Required Headers:
 * - Authorization: Bearer {token}
 * - developer-token: {dev_token}
 *
 * Body for Create:
 * {
 *   "operations": [{
 *     "create": {
 *       "name": "Campaign Name",
 *       "status": "ENABLED",
 *       "advertisingChannelType": "SEARCH",
 *       "budget": "customers/{customerId}/campaignBudgets/{budgetId}",
 *       "targetSpend": { "targetSpendMicros": "10000000" }
 *     }
 *   }]
 * }
 *
 * Body for Update:
 * {
 *   "operations": [{
 *     "update": {
 *       "resourceName": "customers/{customerId}/campaigns/{campaignId}",
 *       "status": "PAUSED"
 *     },
 *     "update_mask": "status"
 *   }]
 * }
 */
router.post('/customers/:customerId/campaigns:mutate', (req, res) => {
  const { operations } = req.body;

  // Determine if this is a create or update operation
  if (operations && operations.length > 0) {
    const operation = operations[0];

    if (operation.create) {
      createCampaign(req, res);
    } else if (operation.update) {
      updateCampaignStatus(req, res);
    } else {
      res.status(400).json({
        error: {
          code: 400,
          message: 'Operation must contain either create or update field.',
          status: 'INVALID_ARGUMENT',
        },
      });
    }
  } else {
    res.status(400).json({
      error: {
        code: 400,
        message: 'Operations array is required and must not be empty.',
        status: 'INVALID_ARGUMENT',
      },
    });
  }
});

/**
 * Get Campaign Endpoint
 * GET /googleads/v21/customers/:customerId/campaigns/:campaignId
 *
 * Required Headers:
 * - Authorization: Bearer {token}
 * - developer-token: {dev_token}
 *
 * Response:
 * {
 *   "resourceName": "customers/123/campaigns/456",
 *   "id": "456",
 *   "name": "Campaign Name",
 *   "status": "ENABLED",
 *   "advertisingChannelType": "SEARCH",
 *   "budget": "customers/123/campaignBudgets/789"
 * }
 */
router.get('/customers/:customerId/campaigns/:campaignId', getCampaign);

/**
 * Search Endpoint - GAQL Query Support
 * POST /googleads/v21/customers/:customerId/googleAds:search
 *
 * Required Headers:
 * - Authorization: Bearer {token}
 * - developer-token: {dev_token}
 *
 * Body:
 * {
 *   "query": "SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks FROM campaign WHERE segments.date DURING LAST_30_DAYS",
 *   "pageSize": 10,
 *   "pageToken": "optional_page_token"
 * }
 *
 * Response:
 * {
 *   "results": [
 *     {
 *       "campaign": {
 *         "id": "123",
 *         "name": "Campaign Name",
 *         "status": "ENABLED"
 *       },
 *       "metrics": {
 *         "impressions": "10000",
 *         "clicks": "250"
 *       }
 *     }
 *   ],
 *   "nextPageToken": "10",
 *   "totalResultsCount": "25",
 *   "fieldMask": "campaign.id,campaign.name,campaign.status,metrics.impressions,metrics.clicks"
 * }
 */
router.post('/customers/:customerId/googleAds:search', searchGoogleAds);

/**
 * Ad Groups Mutate Endpoint (Create/Update)
 * POST /googleads/v21/customers/:customerId/adGroups:mutate
 *
 * Required Headers:
 * - Authorization: Bearer {token}
 * - developer-token: {dev_token}
 *
 * Body for Create:
 * {
 *   "operations": [{
 *     "create": {
 *       "name": "Ad Group Name",
 *       "campaign": "customers/{customerId}/campaigns/{campaignId}",
 *       "status": "ENABLED",
 *       "type": "SEARCH_STANDARD",
 *       "cpcBidMicros": "1000000"
 *     }
 *   }]
 * }
 *
 * Body for Update:
 * {
 *   "operations": [{
 *     "update": {
 *       "resourceName": "customers/{customerId}/adGroups/{adGroupId}",
 *       "status": "PAUSED"
 *     },
 *     "update_mask": "status"
 *   }]
 * }
 *
 * Response:
 * {
 *   "results": [{
 *     "resourceName": "customers/{customerId}/adGroups/{adGroupId}",
 *     "adGroup": { ... }
 *   }]
 * }
 */
router.post('/customers/:customerId/adGroups:mutate', mutateAdGroups);

/**
 * Ad Group Ads Mutate Endpoint (Create/Update)
 * POST /googleads/v21/customers/:customerId/adGroupAds:mutate
 *
 * Required Headers:
 * - Authorization: Bearer {token}
 * - developer-token: {dev_token}
 *
 * Body for Create (Responsive Search Ad):
 * {
 *   "operations": [{
 *     "create": {
 *       "adGroup": "customers/{customerId}/adGroups/{adGroupId}",
 *       "status": "ENABLED",
 *       "ad": {
 *         "finalUrls": ["https://example.com"],
 *         "responsiveSearchAd": {
 *           "headlines": [
 *             { "text": "Headline 1" },
 *             { "text": "Headline 2" },
 *             { "text": "Headline 3" }
 *           ],
 *           "descriptions": [
 *             { "text": "Description 1" },
 *             { "text": "Description 2" }
 *           ],
 *           "path1": "products",
 *           "path2": "sale"
 *         }
 *       }
 *     }
 *   }]
 * }
 *
 * Body for Create (Expanded Text Ad):
 * {
 *   "operations": [{
 *     "create": {
 *       "adGroup": "customers/{customerId}/adGroups/{adGroupId}",
 *       "status": "ENABLED",
 *       "ad": {
 *         "finalUrls": ["https://example.com"],
 *         "expandedTextAd": {
 *           "headlinePart1": "Headline 1",
 *           "headlinePart2": "Headline 2",
 *           "description": "Ad description text",
 *           "path1": "products",
 *           "path2": "sale"
 *         }
 *       }
 *     }
 *   }]
 * }
 *
 * Body for Update:
 * {
 *   "operations": [{
 *     "update": {
 *       "resourceName": "customers/{customerId}/adGroupAds/{adGroupId}~{adId}",
 *       "status": "PAUSED"
 *     },
 *     "update_mask": "status"
 *   }]
 * }
 *
 * Response:
 * {
 *   "results": [{
 *     "resourceName": "customers/{customerId}/adGroupAds/{adGroupId}~{adId}",
 *     "adGroupAd": { ... }
 *   }]
 * }
 */
router.post('/customers/:customerId/adGroupAds:mutate', mutateAdGroupAds);

export default router;
