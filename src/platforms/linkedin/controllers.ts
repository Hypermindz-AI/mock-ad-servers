import { Request, Response } from 'express';
import {
  LinkedInCampaign,
  campaignStore,
  generateCampaignUrn,
  isValidAccountUrn,
  isValidCampaignUrn,
  VALID_CAMPAIGN_TYPES,
  VALID_CAMPAIGN_STATUSES,
  authErrorResponse,
  versionHeaderMissingError,
  invalidVersionHeaderError,
  campaignNotFoundError,
  missingFieldError,
  invalidBudgetError,
  invalidCampaignTypeError,
  invalidStatusError
} from './mockData';
import { authConfigs } from '../../config/auth.config';

/**
 * Middleware to validate LinkedIn-Version header
 * Must be "202510"
 */
export const validateLinkedInVersion = (req: Request, res: Response, next: Function): void => {
  const version = req.headers['linkedin-version'];

  if (!version) {
    res.status(400).json(versionHeaderMissingError);
    return;
  }

  if (version !== '202510') {
    res.status(400).json(invalidVersionHeaderError);
    return;
  }

  next();
};

/**
 * Middleware to validate Bearer token
 */
export const validateBearerToken = (req: Request, res: Response, next: Function): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      ...authErrorResponse,
      message: 'Missing Authorization header'
    });
    return;
  }

  // Validate Bearer format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      ...authErrorResponse,
      message: 'Invalid Authorization header format. Expected: Bearer {token}'
    });
    return;
  }

  const token = parts[1];

  // Validate token against configured valid token
  if (token !== authConfigs.linkedin.validToken) {
    res.status(401).json(authErrorResponse);
    return;
  }

  next();
};

/**
 * Create Campaign Controller
 * POST /rest/adCampaigns
 *
 * Request body:
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
 * Response 201:
 * {
 *   "id": "urn:li:sponsoredCampaign:456",
 *   "status": "ACTIVE",
 *   ...
 * }
 */
export const createCampaign = (req: Request, res: Response) => {
  const { account, name, type, status, dailyBudget, totalBudget } = req.body;

  // Validate required fields
  if (!account) {
    return res.status(400).json(missingFieldError('account'));
  }

  if (!name) {
    return res.status(400).json(missingFieldError('name'));
  }

  if (!type) {
    return res.status(400).json(missingFieldError('type'));
  }

  if (!status) {
    return res.status(400).json(missingFieldError('status'));
  }

  // Validate account URN format
  if (!isValidAccountUrn(account)) {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Invalid account URN format',
      details: [
        {
          field: 'account',
          message: 'Account URN must be in format: urn:li:sponsoredAccount:{id}'
        }
      ]
    });
  }

  // Validate campaign type
  if (!VALID_CAMPAIGN_TYPES.includes(type)) {
    return res.status(400).json(invalidCampaignTypeError);
  }

  // Validate campaign status
  if (!VALID_CAMPAIGN_STATUSES.includes(status)) {
    return res.status(400).json(invalidStatusError);
  }

  // Validate daily budget if provided
  if (dailyBudget) {
    if (!dailyBudget.amount || !dailyBudget.currencyCode) {
      return res.status(400).json({
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Invalid budget format',
        details: [
          {
            field: 'dailyBudget',
            message: 'Budget must include both amount and currencyCode'
          }
        ]
      });
    }

    const budgetAmount = parseFloat(dailyBudget.amount);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      return res.status(400).json(invalidBudgetError);
    }
  }

  // Validate total budget if provided
  if (totalBudget) {
    if (!totalBudget.amount || !totalBudget.currencyCode) {
      return res.status(400).json({
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Invalid budget format',
        details: [
          {
            field: 'totalBudget',
            message: 'Budget must include both amount and currencyCode'
          }
        ]
      });
    }

    const budgetAmount = parseFloat(totalBudget.amount);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      return res.status(400).json({
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Invalid total budget amount',
        details: [
          {
            field: 'totalBudget.amount',
            message: 'Budget amount must be a positive number'
          }
        ]
      });
    }
  }

  // Create campaign
  const campaignId = generateCampaignUrn();
  const now = Date.now();

  const campaign: LinkedInCampaign = {
    id: campaignId,
    account,
    name,
    type,
    status,
    dailyBudget,
    totalBudget,
    createdAt: now,
    lastModifiedAt: now
  };

  // Store campaign
  campaignStore.set(campaignId, campaign);

  // Return 201 Created
  return res.status(201).json(campaign);
};

/**
 * Get Campaign Controller
 * GET /rest/adCampaigns/:id
 *
 * Response 200:
 * {
 *   "id": "urn:li:sponsoredCampaign:456",
 *   "status": "ACTIVE",
 *   ...
 * }
 */
export const getCampaign = (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate campaign URN format
  if (!isValidCampaignUrn(id)) {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Invalid campaign URN format',
      details: [
        {
          field: 'id',
          message: 'Campaign URN must be in format: urn:li:sponsoredCampaign:{id}'
        }
      ]
    });
  }

  // Get campaign from store
  const campaign = campaignStore.get(id);

  if (!campaign) {
    return res.status(404).json(campaignNotFoundError);
  }

  return res.status(200).json(campaign);
};

/**
 * Update Campaign Controller
 * POST /rest/adCampaigns/:id
 *
 * Request body can include any of:
 * {
 *   "name": "Updated Campaign Name",
 *   "status": "PAUSED",
 *   "dailyBudget": {
 *     "amount": "100",
 *     "currencyCode": "USD"
 *   }
 * }
 *
 * Response 200:
 * {
 *   "id": "urn:li:sponsoredCampaign:456",
 *   "status": "PAUSED",
 *   ...
 * }
 */
export const updateCampaign = (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // Validate campaign URN format
  if (!isValidCampaignUrn(id)) {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Invalid campaign URN format',
      details: [
        {
          field: 'id',
          message: 'Campaign URN must be in format: urn:li:sponsoredCampaign:{id}'
        }
      ]
    });
  }

  // Get campaign from store
  const campaign = campaignStore.get(id);

  if (!campaign) {
    return res.status(404).json(campaignNotFoundError);
  }

  // Validate updates
  if (updates.type && !VALID_CAMPAIGN_TYPES.includes(updates.type)) {
    return res.status(400).json(invalidCampaignTypeError);
  }

  if (updates.status && !VALID_CAMPAIGN_STATUSES.includes(updates.status)) {
    return res.status(400).json(invalidStatusError);
  }

  if (updates.dailyBudget) {
    if (!updates.dailyBudget.amount || !updates.dailyBudget.currencyCode) {
      return res.status(400).json({
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Invalid budget format',
        details: [
          {
            field: 'dailyBudget',
            message: 'Budget must include both amount and currencyCode'
          }
        ]
      });
    }

    const budgetAmount = parseFloat(updates.dailyBudget.amount);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      return res.status(400).json(invalidBudgetError);
    }
  }

  if (updates.totalBudget) {
    if (!updates.totalBudget.amount || !updates.totalBudget.currencyCode) {
      return res.status(400).json({
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Invalid budget format',
        details: [
          {
            field: 'totalBudget',
            message: 'Budget must include both amount and currencyCode'
          }
        ]
      });
    }

    const budgetAmount = parseFloat(updates.totalBudget.amount);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      return res.status(400).json({
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Invalid total budget amount',
        details: [
          {
            field: 'totalBudget.amount',
            message: 'Budget amount must be a positive number'
          }
        ]
      });
    }
  }

  // Apply updates
  const updatedCampaign: LinkedInCampaign = {
    ...campaign,
    ...updates,
    id: campaign.id, // Ensure ID doesn't change
    account: campaign.account, // Ensure account doesn't change
    lastModifiedAt: Date.now()
  };

  // Store updated campaign
  campaignStore.set(id, updatedCampaign);

  return res.status(200).json(updatedCampaign);
};

// ============================================
// Campaign Search Controller (LinkedIn 202510)
// ============================================

/**
 * Search Campaigns Controller
 * GET /rest/adCampaigns?q=search
 *
 * Query params:
 * - search.account: Account URN filter
 * - search.status: Status filter
 * - search.name: Name filter (partial match)
 * - start: Pagination start (default: 0)
 * - count: Pagination count (default: 10)
 *
 * Response 200:
 * {
 *   "elements": [...],
 *   "paging": { "start": 0, "count": 10, "total": 100 }
 * }
 */
export const searchCampaigns = (req: Request, res: Response) => {
  const { q } = req.query;

  if (q !== 'search') {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Query parameter "q" must be "search"'
    });
  }

  // Extract search filters
  const accountFilter = req.query['search.account'] as string;
  const statusFilter = req.query['search.status'] as string;
  const nameFilter = req.query['search.name'] as string;

  // Extract pagination params
  const start = parseInt(req.query.start as string) || 0;
  const count = parseInt(req.query.count as string) || 10;

  // Get all campaigns
  let campaigns = Array.from(campaignStore.values());

  // Apply filters
  if (accountFilter) {
    campaigns = campaigns.filter(c => c.account === accountFilter);
  }

  if (statusFilter) {
    campaigns = campaigns.filter(c => c.status === statusFilter);
  }

  if (nameFilter) {
    campaigns = campaigns.filter(c =>
      c.name.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }

  // Paginate results
  const { paginateResults } = require('./mockData');
  const result = paginateResults(campaigns, { start, count });

  return res.status(200).json(result);
};

// ============================================
// Analytics Controller (LinkedIn 202510)
// ============================================

/**
 * Get Analytics Controller
 * GET /rest/adAnalytics?q=analytics
 *
 * Query params:
 * - dateRange.start: Start date (YYYY-MM-DD)
 * - dateRange.end: End date (YYYY-MM-DD)
 * - campaigns: Comma-separated campaign URNs
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
export const getAnalytics = (req: Request, res: Response) => {
  const { q } = req.query;

  if (q !== 'analytics') {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Query parameter "q" must be "analytics"'
    });
  }

  const startDate = req.query['dateRange.start'] as string;
  const endDate = req.query['dateRange.end'] as string;
  const campaignsParam = req.query.campaigns as string;

  // Validate required params
  if (!startDate || !endDate) {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Missing required parameters: dateRange.start and dateRange.end'
    });
  }

  if (!campaignsParam) {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Missing required parameter: campaigns'
    });
  }

  // Validate date range
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Invalid date format. Expected: YYYY-MM-DD'
    });
  }

  if (start > end) {
    const { invalidDateRangeError } = require('./mockData');
    return res.status(400).json(invalidDateRangeError);
  }

  // Parse campaign URNs
  const campaignIds = campaignsParam.split(',').map(id => id.trim());

  // Generate analytics data for each campaign
  const { generateAnalyticsData } = require('./mockData');
  const elements = campaignIds.map(campaignId => {
    return generateAnalyticsData(campaignId, {
      start: startDate,
      end: endDate
    });
  });

  return res.status(200).json({ elements });
};

// ============================================
// Campaign Groups Controllers (LinkedIn 202510)
// ============================================

/**
 * Search Campaign Groups Controller
 * GET /rest/adCampaignGroups?q=search
 */
export const searchCampaignGroups = (req: Request, res: Response) => {
  const { q } = req.query;

  if (q !== 'search') {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Query parameter "q" must be "search"'
    });
  }

  const accountFilter = req.query['search.account'] as string;
  const statusFilter = req.query['search.status'] as string;

  const start = parseInt(req.query.start as string) || 0;
  const count = parseInt(req.query.count as string) || 10;

  const { campaignGroupStore, paginateResults } = require('./mockData');
  let groups = Array.from(campaignGroupStore.values()) as any[];

  if (accountFilter) {
    groups = groups.filter((g: any) => g.account === accountFilter);
  }

  if (statusFilter) {
    groups = groups.filter((g: any) => g.status === statusFilter);
  }

  const result = paginateResults(groups, { start, count });

  return res.status(200).json(result);
};

/**
 * Create Campaign Group Controller
 * POST /rest/adCampaignGroups
 */
export const createCampaignGroup = (req: Request, res: Response) => {
  const { account, name, status, runSchedule, totalBudget } = req.body;

  // Validate required fields
  if (!account) {
    return res.status(400).json(missingFieldError('account'));
  }

  if (!name) {
    return res.status(400).json(missingFieldError('name'));
  }

  if (!status) {
    return res.status(400).json(missingFieldError('status'));
  }

  // Validate account URN
  if (!isValidAccountUrn(account)) {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Invalid account URN format',
      details: [
        {
          field: 'account',
          message: 'Account URN must be in format: urn:li:sponsoredAccount:{id}'
        }
      ]
    });
  }

  // Validate status
  if (!VALID_CAMPAIGN_STATUSES.includes(status)) {
    return res.status(400).json(invalidStatusError);
  }

  const { generateCampaignGroupUrn, campaignGroupStore } = require('./mockData');
  const groupId = generateCampaignGroupUrn();
  const now = Date.now();

  const campaignGroup = {
    id: groupId,
    account,
    name,
    status,
    runSchedule,
    totalBudget,
    createdAt: now,
    lastModifiedAt: now
  };

  campaignGroupStore.set(groupId, campaignGroup);

  return res.status(201).json(campaignGroup);
};

/**
 * Get Campaign Group Controller
 * GET /rest/adCampaignGroups/:id
 */
export const getCampaignGroup = (req: Request, res: Response) => {
  const { id } = req.params;

  const { isValidCampaignGroupUrn, campaignGroupStore, campaignGroupNotFoundError } = require('./mockData');

  if (!isValidCampaignGroupUrn(id)) {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Invalid campaign group URN format',
      details: [
        {
          field: 'id',
          message: 'Campaign group URN must be in format: urn:li:sponsoredCampaignGroup:{id}'
        }
      ]
    });
  }

  const group = campaignGroupStore.get(id);

  if (!group) {
    return res.status(404).json(campaignGroupNotFoundError);
  }

  return res.status(200).json(group);
};

// ============================================
// Creatives Controllers (LinkedIn 202510)
// ============================================

/**
 * Search Creatives Controller
 * GET /rest/adAccounts/:adAccountId/creatives?q=search
 */
export const searchCreatives = (req: Request, res: Response) => {
  // const { adAccountId } = req.params; // Not used in mock implementation
  const { q } = req.query;

  if (q !== 'search') {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Query parameter "q" must be "search"'
    });
  }

  const campaignFilter = req.query['search.campaign'] as string;
  const statusFilter = req.query['search.status'] as string;

  const start = parseInt(req.query.start as string) || 0;
  const count = parseInt(req.query.count as string) || 10;

  const { creativeStore, paginateResults } = require('./mockData');
  let creatives = Array.from(creativeStore.values()) as any[];

  if (campaignFilter) {
    creatives = creatives.filter((c: any) => c.campaign === campaignFilter);
  }

  if (statusFilter) {
    creatives = creatives.filter((c: any) => c.status === statusFilter);
  }

  const result = paginateResults(creatives, { start, count });

  return res.status(200).json(result);
};

/**
 * Create Creative Controller
 * POST /rest/adAccounts/:adAccountId/creatives
 */
export const createCreative = (req: Request, res: Response) => {
  // const { adAccountId } = req.params; // Not used in mock implementation
  const { campaign, status, type, content } = req.body;

  // Validate required fields
  if (!campaign) {
    return res.status(400).json(missingFieldError('campaign'));
  }

  if (!status) {
    return res.status(400).json(missingFieldError('status'));
  }

  if (!type) {
    return res.status(400).json(missingFieldError('type'));
  }

  // Validate campaign URN
  if (!isValidCampaignUrn(campaign)) {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Invalid campaign URN format',
      details: [
        {
          field: 'campaign',
          message: 'Campaign URN must be in format: urn:li:sponsoredCampaign:{id}'
        }
      ]
    });
  }

  // Validate status
  if (!VALID_CAMPAIGN_STATUSES.includes(status)) {
    return res.status(400).json(invalidStatusError);
  }

  // Validate creative type
  const { VALID_CREATIVE_TYPES, invalidCreativeTypeError } = require('./mockData');
  if (!VALID_CREATIVE_TYPES.includes(type)) {
    return res.status(400).json(invalidCreativeTypeError);
  }

  const { generateCreativeUrn, creativeStore } = require('./mockData');
  const creativeId = generateCreativeUrn();
  const now = Date.now();

  const creative = {
    id: creativeId,
    campaign,
    status,
    type,
    content,
    createdAt: now,
    lastModifiedAt: now
  };

  creativeStore.set(creativeId, creative);

  // Set x-restli-id header as per LinkedIn API spec
  res.setHeader('x-restli-id', creativeId);

  return res.status(201).json(creative);
};

/**
 * Get Creative Controller
 * GET /rest/creatives/:creativeId
 */
export const getCreative = (req: Request, res: Response) => {
  const { creativeId } = req.params;

  const { isValidCreativeUrn, creativeStore, creativeNotFoundError } = require('./mockData');

  if (!isValidCreativeUrn(creativeId)) {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Invalid creative URN format',
      details: [
        {
          field: 'creativeId',
          message: 'Creative URN must be in format: urn:li:sponsoredCreative:{id}'
        }
      ]
    });
  }

  const creative = creativeStore.get(creativeId);

  if (!creative) {
    return res.status(404).json(creativeNotFoundError);
  }

  return res.status(200).json(creative);
};
