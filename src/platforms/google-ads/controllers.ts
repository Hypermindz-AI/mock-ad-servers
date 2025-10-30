import { Request, Response } from 'express';
import { authConfigs } from '../../config/auth.config.js';
import {
  validationErrorResponse,
  missingFieldErrorResponse,
  authErrorResponse,
  devTokenErrorResponse,
  permissionErrorResponse,
  notFoundErrorResponse,
  invalidStatusErrorResponse,
  sampleCampaign,
  GoogleAdsCampaign,
} from './mockData.js';

// In-memory storage for created campaigns
const campaigns = new Map<string, GoogleAdsCampaign>();

// Initialize with a sample campaign
campaigns.set('9876543210', sampleCampaign);

/**
 * Validates Bearer token from Authorization header
 */
function validateBearerToken(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return false;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return false;
  }

  const token = parts[1];
  return token === authConfigs.google.validToken;
}

/**
 * Validates developer-token header
 */
function validateDeveloperToken(req: Request): boolean {
  const devToken = req.headers['developer-token'] as string;
  if (!devToken) {
    return false;
  }

  return devToken === authConfigs.google.additionalConfig?.devToken;
}

/**
 * Create a new campaign
 * POST /googleads/v21/customers/:customerId/campaigns:mutate
 */
export const createCampaign = (req: Request, res: Response): void => {
  // Validate Bearer token
  if (!validateBearerToken(req)) {
    res.status(401).json(authErrorResponse);
    return;
  }

  // Validate developer-token header
  if (!validateDeveloperToken(req)) {
    res.status(401).json(devTokenErrorResponse);
    return;
  }

  const { customerId } = req.params;
  const { operations } = req.body;

  // Validate request body
  if (!operations || !Array.isArray(operations) || operations.length === 0) {
    res.status(400).json(validationErrorResponse);
    return;
  }

  const operation = operations[0];

  // Check if it's a create operation
  if (!operation.create) {
    res.status(400).json(validationErrorResponse);
    return;
  }

  const createData = operation.create;

  // Validate required fields
  if (!createData.name) {
    res.status(400).json(missingFieldErrorResponse);
    return;
  }

  if (!createData.budget) {
    res.status(400).json({
      error: {
        code: 400,
        message: 'Request contains an invalid argument.',
        status: 'INVALID_ARGUMENT',
        details: [
          {
            '@type': 'type.googleapis.com/google.ads.googleads.v21.errors.GoogleAdsFailure',
            errors: [
              {
                errorCode: {
                  campaignError: 'INVALID_BUDGET',
                },
                message: 'Campaign budget is required.',
              },
            ],
          },
        ],
      },
    });
    return;
  }

  // Validate status if provided
  const validStatuses = ['ENABLED', 'PAUSED', 'REMOVED'];
  if (createData.status && !validStatuses.includes(createData.status)) {
    res.status(400).json(invalidStatusErrorResponse);
    return;
  }

  // Validate advertising channel type if provided
  const validChannelTypes = ['SEARCH', 'DISPLAY', 'SHOPPING', 'VIDEO', 'MULTI_CHANNEL'];
  if (createData.advertisingChannelType && !validChannelTypes.includes(createData.advertisingChannelType)) {
    res.status(400).json({
      error: {
        code: 400,
        message: 'Request contains an invalid argument.',
        status: 'INVALID_ARGUMENT',
        details: [
          {
            '@type': 'type.googleapis.com/google.ads.googleads.v21.errors.GoogleAdsFailure',
            errors: [
              {
                errorCode: {
                  campaignError: 'INVALID_CHANNEL_TYPE',
                },
                message: 'Invalid advertising channel type.',
              },
            ],
          },
        ],
      },
    });
    return;
  }

  // Generate campaign ID
  const campaignId = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
  const resourceName = `customers/${customerId}/campaigns/${campaignId}`;

  // Create campaign object
  const newCampaign: GoogleAdsCampaign = {
    resourceName,
    id: campaignId,
    name: createData.name,
    status: createData.status || 'PAUSED',
    advertisingChannelType: createData.advertisingChannelType || 'SEARCH',
    budget: createData.budget,
    targetSpend: createData.targetSpend,
  };

  // Store campaign
  campaigns.set(campaignId, newCampaign);

  // Return success response
  res.status(200).json({
    results: [
      {
        resourceName,
        campaign: newCampaign,
      },
    ],
  });
};

/**
 * Get campaign details
 * GET /googleads/v21/customers/:customerId/campaigns/:campaignId
 */
export const getCampaign = (req: Request, res: Response): void => {
  // Validate Bearer token
  if (!validateBearerToken(req)) {
    res.status(401).json(authErrorResponse);
    return;
  }

  // Validate developer-token header
  if (!validateDeveloperToken(req)) {
    res.status(401).json(devTokenErrorResponse);
    return;
  }

  const { customerId: _customerId, campaignId } = req.params;

  // Check if campaign exists
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    res.status(404).json(notFoundErrorResponse);
    return;
  }

  // Return campaign details
  res.status(200).json(campaign);
};

/**
 * Update campaign (including status changes)
 * POST /googleads/v21/customers/:customerId/campaigns:mutate
 */
export const updateCampaignStatus = (req: Request, res: Response): void => {
  // Validate Bearer token
  if (!validateBearerToken(req)) {
    res.status(401).json(authErrorResponse);
    return;
  }

  // Validate developer-token header
  if (!validateDeveloperToken(req)) {
    res.status(401).json(devTokenErrorResponse);
    return;
  }

  const { customerId: _customerId } = req.params;
  const { operations } = req.body;

  // Validate request body
  if (!operations || !Array.isArray(operations) || operations.length === 0) {
    res.status(400).json(validationErrorResponse);
    return;
  }

  const operation = operations[0];

  // Check if it's an update operation
  if (!operation.update) {
    res.status(400).json(validationErrorResponse);
    return;
  }

  const updateData = operation.update;

  // Extract campaign ID from resource name
  if (!updateData.resourceName && !operation.update_mask) {
    res.status(400).json(validationErrorResponse);
    return;
  }

  // Extract campaign ID from resource name (format: customers/123/campaigns/456)
  let campaignId: string | undefined;
  if (updateData.resourceName) {
    const match = updateData.resourceName.match(/campaigns\/(\d+)/);
    if (match) {
      campaignId = match[1];
    }
  }

  if (!campaignId) {
    res.status(400).json(validationErrorResponse);
    return;
  }

  // Check if campaign exists
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    res.status(404).json(notFoundErrorResponse);
    return;
  }

  // Validate status if provided
  const validStatuses = ['ENABLED', 'PAUSED', 'REMOVED'];
  if (updateData.status && !validStatuses.includes(updateData.status)) {
    res.status(400).json(invalidStatusErrorResponse);
    return;
  }

  // Update campaign
  if (updateData.status) {
    campaign.status = updateData.status;
  }
  if (updateData.name) {
    campaign.name = updateData.name;
  }
  if (updateData.budget) {
    campaign.budget = updateData.budget;
  }
  if (updateData.targetSpend) {
    campaign.targetSpend = updateData.targetSpend;
  }

  // Update stored campaign
  campaigns.set(campaignId, campaign);

  // Return success response
  res.status(200).json({
    results: [
      {
        resourceName: campaign.resourceName,
      },
    ],
  });
};

/**
 * Handle invalid customer ID (403 Permission Denied)
 */
export const handleInvalidCustomer = (_req: Request, res: Response): void => {
  res.status(403).json(permissionErrorResponse);
};
