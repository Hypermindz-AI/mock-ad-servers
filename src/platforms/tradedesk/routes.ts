import express, { Router } from 'express';
import { authenticate, validateTTDAuth } from '../../auth/tradedesk-token';
import { createCampaign, updateCampaign, getCampaign } from './controllers';

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

export default router;
