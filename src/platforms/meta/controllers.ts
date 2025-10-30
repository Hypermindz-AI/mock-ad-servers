import { Request, Response } from 'express';
import {
  campaignStorage,
  generateCampaignId,
  generateFbTraceId,
  validObjectives,
  validStatuses,
  MetaCampaign,
} from './mockData';

/**
 * Create Campaign
 * POST /v23.0/act_{ad_account_id}/campaigns
 *
 * Creates a new campaign in Meta Ads
 * Required fields: name, objective, status
 * Optional fields: daily_budget, lifetime_budget, special_ad_categories
 */
export const createCampaign = (req: Request, res: Response): void => {
  const {
    name,
    objective,
    status,
    daily_budget,
    lifetime_budget,
    special_ad_categories,
  } = req.body;

  // Validate required fields
  if (!name) {
    return void res.status(400).json({
      error: {
        message: 'Missing required field: name',
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  if (!objective) {
    return void res.status(400).json({
      error: {
        message: 'Missing required field: objective',
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  if (!status) {
    return void res.status(400).json({
      error: {
        message: 'Missing required field: status',
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Validate objective
  if (!validObjectives.includes(objective)) {
    return void res.status(400).json({
      error: {
        message: `Invalid objective. Must be one of: ${validObjectives.join(', ')}`,
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Validate status
  if (!validStatuses.includes(status)) {
    return void res.status(400).json({
      error: {
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Validate budget (at least one must be provided and positive)
  if (!daily_budget && !lifetime_budget) {
    return void res.status(400).json({
      error: {
        message: 'Either daily_budget or lifetime_budget must be provided',
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  if (daily_budget && (typeof daily_budget !== 'number' || daily_budget <= 0)) {
    return void res.status(400).json({
      error: {
        message: 'Invalid daily_budget. Must be a positive number',
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  if (lifetime_budget && (typeof lifetime_budget !== 'number' || lifetime_budget <= 0)) {
    return void res.status(400).json({
      error: {
        message: 'Invalid lifetime_budget. Must be a positive number',
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Generate campaign ID
  const campaignId = generateCampaignId();
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '+0000');

  // Create campaign object
  const campaign: MetaCampaign = {
    id: campaignId,
    name,
    objective,
    status,
    ...(daily_budget && { daily_budget }),
    ...(lifetime_budget && { lifetime_budget }),
    special_ad_categories: special_ad_categories || [],
    created_time: timestamp,
    updated_time: timestamp,
  };

  // Store campaign
  campaignStorage.set(campaignId, campaign);

  // Return success response
  res.status(200).json({
    id: campaignId,
    name,
    status,
    objective,
    ...(daily_budget && { daily_budget }),
    ...(lifetime_budget && { lifetime_budget }),
  });
};

/**
 * Get Campaign
 * GET /v23.0/{campaign_id}
 *
 * Retrieves campaign details by ID
 */
export const getCampaign = (req: Request, res: Response): void => {
  const { campaignId } = req.params;

  // Retrieve campaign from storage
  const campaign = campaignStorage.get(campaignId);

  if (!campaign) {
    return void res.status(404).json({
      error: {
        message: `Campaign with ID ${campaignId} not found`,
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Return campaign details
  res.status(200).json(campaign);
};

/**
 * Update Campaign
 * POST /v23.0/{campaign_id}
 *
 * Updates an existing campaign
 * Supports updating: name, status, daily_budget, lifetime_budget
 */
export const updateCampaign = (req: Request, res: Response): void => {
  const { campaignId } = req.params;
  const updates = req.body;

  // Retrieve existing campaign
  const campaign = campaignStorage.get(campaignId);

  if (!campaign) {
    return void res.status(404).json({
      error: {
        message: `Campaign with ID ${campaignId} not found`,
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Validate status if provided
  if (updates.status && !validStatuses.includes(updates.status)) {
    return void res.status(400).json({
      error: {
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Validate objective if provided
  if (updates.objective && !validObjectives.includes(updates.objective)) {
    return void res.status(400).json({
      error: {
        message: `Invalid objective. Must be one of: ${validObjectives.join(', ')}`,
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Validate daily_budget if provided
  if (updates.daily_budget && (typeof updates.daily_budget !== 'number' || updates.daily_budget <= 0)) {
    return void res.status(400).json({
      error: {
        message: 'Invalid daily_budget. Must be a positive number',
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Validate lifetime_budget if provided
  if (updates.lifetime_budget && (typeof updates.lifetime_budget !== 'number' || updates.lifetime_budget <= 0)) {
    return void res.status(400).json({
      error: {
        message: 'Invalid lifetime_budget. Must be a positive number',
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Update campaign
  const updatedCampaign: MetaCampaign = {
    ...campaign,
    ...updates,
    id: campaign.id, // Preserve ID
    created_time: campaign.created_time, // Preserve creation time
    updated_time: new Date().toISOString().replace(/\.\d{3}Z$/, '+0000'),
  };

  // Store updated campaign
  campaignStorage.set(campaignId, updatedCampaign);

  // Return success response
  res.status(200).json({
    success: true,
    id: campaignId,
    ...updates,
  });
};
