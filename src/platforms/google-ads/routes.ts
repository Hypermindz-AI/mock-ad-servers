import { Router } from 'express';
import { createCampaign, getCampaign, updateCampaignStatus } from './controllers.js';

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

export default router;
