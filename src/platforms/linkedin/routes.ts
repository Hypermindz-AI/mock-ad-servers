import { Router } from 'express';
import {
  createCampaign,
  getCampaign,
  updateCampaign,
  validateBearerToken,
  validateLinkedInVersion
} from './controllers';

const router = Router();

/**
 * LinkedIn Marketing API 202510 Routes
 * Base path: /rest
 *
 * All routes require:
 * - Authorization: Bearer {token}
 * - Linkedin-Version: 202510
 */

// Apply middleware to all routes
router.use(validateBearerToken);
router.use(validateLinkedInVersion);

/**
 * Create Campaign
 * POST /rest/adCampaigns
 *
 * Body:
 * {
 *   "account": "urn:li:sponsoredAccount:123",
 *   "name": "Campaign Name",
 *   "type": "TEXT_AD",
 *   "status": "ACTIVE",
 *   "dailyBudget": {
 *     "amount": "50",
 *     "currencyCode": "USD"
 *   }
 * }
 *
 * Response 201: Campaign object with URN ID
 */
router.post('/adCampaigns', createCampaign);

/**
 * Get Campaign
 * GET /rest/adCampaigns/:id
 *
 * Params:
 * - id: Campaign URN (e.g., urn:li:sponsoredCampaign:456)
 *
 * Response 200: Campaign object
 * Response 404: Campaign not found
 */
router.get('/adCampaigns/:id', getCampaign);

/**
 * Update Campaign
 * POST /rest/adCampaigns/:id
 *
 * Params:
 * - id: Campaign URN (e.g., urn:li:sponsoredCampaign:456)
 *
 * Body: Partial campaign object with fields to update
 * {
 *   "name": "Updated Name",
 *   "status": "PAUSED"
 * }
 *
 * Response 200: Updated campaign object
 * Response 404: Campaign not found
 */
router.post('/adCampaigns/:id', updateCampaign);

export default router;
