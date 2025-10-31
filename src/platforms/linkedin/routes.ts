import { Router } from 'express';
import {
  createCampaign,
  getCampaign,
  updateCampaign,
  searchCampaigns,
  getAnalytics,
  searchCampaignGroups,
  createCampaignGroup,
  getCampaignGroup,
  searchCreatives,
  createCreative,
  getCreative,
  validateBearerToken,
  validateLinkedInVersion
} from './controllers';

const router = Router();

/**
 * LinkedIn Marketing API 202510 Routes
 * Base path: /linkedin/rest
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
 * POST /linkedin/rest/adCampaigns
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
 * GET /linkedin/rest/adCampaigns/:id
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
 * POST /linkedin/rest/adCampaigns/:id
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

/**
 * Search Campaigns (LinkedIn 202510)
 * GET /linkedin/rest/adCampaigns?q=search
 *
 * Query params:
 * - q=search (required)
 * - search.account: Account URN filter (optional)
 * - search.status: Status filter (optional)
 * - search.name: Name filter (optional, partial match)
 * - start: Pagination start (optional, default: 0)
 * - count: Pagination count (optional, default: 10)
 *
 * Response 200:
 * {
 *   "elements": [...],
 *   "paging": { "start": 0, "count": 10, "total": 100 }
 * }
 */
router.get('/adCampaigns', searchCampaigns);

/**
 * Get Analytics (LinkedIn 202510)
 * GET /linkedin/rest/adAnalytics?q=analytics
 *
 * Query params:
 * - q=analytics (required)
 * - dateRange.start: Start date YYYY-MM-DD (required)
 * - dateRange.end: End date YYYY-MM-DD (required)
 * - campaigns: Comma-separated campaign URNs (required)
 * - fields: Comma-separated field names (optional)
 *
 * Response 200:
 * {
 *   "elements": [
 *     {
 *       "campaignId": "urn:li:sponsoredCampaign:...",
 *       "impressions": 1000,
 *       "clicks": 50,
 *       "costInLocalCurrency": "100.00",
 *       "conversions": 5
 *     }
 *   ]
 * }
 */
router.get('/adAnalytics', getAnalytics);

/**
 * Search Campaign Groups (LinkedIn 202510)
 * GET /linkedin/rest/adCampaignGroups?q=search
 *
 * Query params:
 * - q=search (required)
 * - search.account: Account URN filter (optional)
 * - search.status: Status filter (optional)
 * - start: Pagination start (optional, default: 0)
 * - count: Pagination count (optional, default: 10)
 *
 * Response 200: Paginated list of campaign groups
 */
router.get('/adCampaignGroups', searchCampaignGroups);

/**
 * Create Campaign Group (LinkedIn 202510)
 * POST /linkedin/rest/adCampaignGroups
 *
 * Body:
 * {
 *   "account": "urn:li:sponsoredAccount:123",
 *   "name": "Campaign Group Name",
 *   "status": "ACTIVE",
 *   "runSchedule": {
 *     "start": 1234567890000,
 *     "end": 1234567890000
 *   },
 *   "totalBudget": {
 *     "amount": "50000",
 *     "currencyCode": "USD"
 *   }
 * }
 *
 * Response 201: Campaign group object with URN ID
 */
router.post('/adCampaignGroups', createCampaignGroup);

/**
 * Get Campaign Group (LinkedIn 202510)
 * GET /linkedin/rest/adCampaignGroups/:id
 *
 * Params:
 * - id: Campaign group URN (e.g., urn:li:sponsoredCampaignGroup:123)
 *
 * Response 200: Campaign group object
 * Response 404: Campaign group not found
 */
router.get('/adCampaignGroups/:id', getCampaignGroup);

/**
 * Search Creatives (LinkedIn 202510)
 * GET /linkedin/rest/adAccounts/:adAccountId/creatives?q=search
 *
 * Params:
 * - adAccountId: Ad account identifier
 *
 * Query params:
 * - q=search (required)
 * - search.campaign: Campaign URN filter (optional)
 * - search.status: Status filter (optional)
 * - start: Pagination start (optional, default: 0)
 * - count: Pagination count (optional, default: 10)
 *
 * Response 200: Paginated list of creatives
 */
router.get('/adAccounts/:adAccountId/creatives', searchCreatives);

/**
 * Create Creative (LinkedIn 202510)
 * POST /linkedin/rest/adAccounts/:adAccountId/creatives
 *
 * Params:
 * - adAccountId: Ad account identifier
 *
 * Body:
 * {
 *   "campaign": "urn:li:sponsoredCampaign:456",
 *   "status": "ACTIVE",
 *   "type": "SINGLE_IMAGE",
 *   "content": {
 *     "title": "Ad Title",
 *     "description": "Ad Description",
 *     "landingPageUrl": "https://example.com",
 *     "imageUrl": "https://example.com/image.jpg"
 *   }
 * }
 *
 * Response 201: Creative object with URN ID
 * Response header: x-restli-id with creative URN
 */
router.post('/adAccounts/:adAccountId/creatives', createCreative);

/**
 * Get Creative (LinkedIn 202510)
 * GET /linkedin/rest/creatives/:creativeId
 *
 * Params:
 * - creativeId: Creative URN (e.g., urn:li:sponsoredCreative:789)
 *
 * Response 200: Creative object
 * Response 404: Creative not found
 */
router.get('/creatives/:creativeId', getCreative);

export default router;
