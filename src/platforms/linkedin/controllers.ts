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
