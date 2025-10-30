/**
 * DV360 API v4 Controllers
 * Handle campaign operations for Display & Video 360
 */

import { Request, Response } from 'express';
import {
  validationErrorResponse,
  authErrorResponse,
  invalidEntityStatusError,
  invalidCampaignGoalError,
  sampleCampaign,
  DV360Campaign,
} from './mockData';

// In-memory storage for campaigns (for demo purposes)
const campaignStore: Map<string, DV360Campaign> = new Map();

/**
 * Create a new DV360 campaign
 * POST /v4/advertisers/:advertiserId/campaigns
 */
export const createCampaign = (req: Request, res: Response): void => {
  try {
    const { advertiserId } = req.params;
    const { displayName, entityStatus, campaignGoal, campaignFlight, frequencyCap } = req.body;

    // Validate required fields
    if (!displayName || displayName.trim() === '') {
      res.status(400).json(validationErrorResponse);
      return;
    }

    // Validate entity status if provided
    const validStatuses = ['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED', 'ENTITY_STATUS_ARCHIVED'];
    if (entityStatus && !validStatuses.includes(entityStatus)) {
      res.status(400).json(invalidEntityStatusError);
      return;
    }

    // Validate campaign goal type if provided
    const validGoalTypes = [
      'CAMPAIGN_GOAL_TYPE_UNSPECIFIED',
      'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS',
      'CAMPAIGN_GOAL_TYPE_APP_INSTALL',
      'CAMPAIGN_GOAL_TYPE_OFFLINE_ACTION',
      'CAMPAIGN_GOAL_TYPE_ONLINE_ACTION',
    ];
    if (campaignGoal?.campaignGoalType && !validGoalTypes.includes(campaignGoal.campaignGoalType)) {
      res.status(400).json(invalidCampaignGoalError);
      return;
    }

    // Generate campaign ID
    const campaignId = Math.floor(Math.random() * 1000000000).toString();
    const resourceName = `advertisers/${advertiserId}/campaigns/${campaignId}`;

    // Create campaign object
    const newCampaign: DV360Campaign = {
      name: resourceName,
      campaignId,
      displayName,
      entityStatus: entityStatus || 'ENTITY_STATUS_ACTIVE',
      campaignGoal: campaignGoal || {
        campaignGoalType: 'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS',
      },
      campaignFlight,
      frequencyCap,
    };

    // Store campaign
    campaignStore.set(campaignId, newCampaign);

    // Return success response
    res.status(200).json(newCampaign);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: 'Internal server error',
        status: 'INTERNAL',
      },
    });
  }
};

/**
 * Update an existing DV360 campaign
 * PATCH /v4/advertisers/:advertiserId/campaigns/:campaignId
 */
export const updateCampaign = (req: Request, res: Response): void => {
  try {
    const { advertiserId, campaignId } = req.params;
    const updates = req.body;

    // Check if campaign exists
    let campaign = campaignStore.get(campaignId);
    if (!campaign) {
      // Return sample campaign for testing
      campaign = { ...sampleCampaign };
      campaign.campaignId = campaignId;
      campaign.name = `advertisers/${advertiserId}/campaigns/${campaignId}`;
    }

    // Validate entity status if provided
    const validStatuses = ['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED', 'ENTITY_STATUS_ARCHIVED'];
    if (updates.entityStatus && !validStatuses.includes(updates.entityStatus)) {
      res.status(400).json(invalidEntityStatusError);
      return;
    }

    // Validate campaign goal type if provided
    const validGoalTypes = [
      'CAMPAIGN_GOAL_TYPE_UNSPECIFIED',
      'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS',
      'CAMPAIGN_GOAL_TYPE_APP_INSTALL',
      'CAMPAIGN_GOAL_TYPE_OFFLINE_ACTION',
      'CAMPAIGN_GOAL_TYPE_ONLINE_ACTION',
    ];
    if (updates.campaignGoal?.campaignGoalType && !validGoalTypes.includes(updates.campaignGoal.campaignGoalType)) {
      res.status(400).json(invalidCampaignGoalError);
      return;
    }

    // Validate display name if provided
    if (updates.displayName !== undefined && updates.displayName.trim() === '') {
      res.status(400).json(validationErrorResponse);
      return;
    }

    // Update campaign
    const updatedCampaign: DV360Campaign = {
      ...campaign,
      ...updates,
      name: campaign.name, // Keep the resource name immutable
      campaignId: campaign.campaignId, // Keep the campaign ID immutable
    };

    // Store updated campaign
    campaignStore.set(campaignId, updatedCampaign);

    // Return updated campaign
    res.status(200).json(updatedCampaign);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: 'Internal server error',
        status: 'INTERNAL',
      },
    });
  }
};

/**
 * Get a DV360 campaign by ID
 * GET /v4/advertisers/:advertiserId/campaigns/:campaignId
 */
export const getCampaign = (req: Request, res: Response): void => {
  try {
    const { advertiserId, campaignId } = req.params;

    // Check if campaign exists in store
    let campaign = campaignStore.get(campaignId);

    if (!campaign) {
      // Return sample campaign for testing
      campaign = { ...sampleCampaign };
      campaign.campaignId = campaignId;
      campaign.name = `advertisers/${advertiserId}/campaigns/${campaignId}`;
    }

    // Return campaign
    res.status(200).json(campaign);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: 'Internal server error',
        status: 'INTERNAL',
      },
    });
  }
};

/**
 * Validate Authorization header format
 * Expected: "Bearer {token}"
 */
export const validateAuthHeader = (req: Request): boolean => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return false;
  }

  // Check format: "Bearer {token}"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return false;
  }

  return true;
};

/**
 * Middleware to validate DV360 authentication
 */
export const validateDV360Auth = (req: Request, res: Response, next: Function): void => {
  // Validate Authorization header format
  if (!validateAuthHeader(req)) {
    res.status(401).json(authErrorResponse);
    return;
  }

  // Extract token
  const token = req.headers.authorization?.split(' ')[1];

  // Import auth config to validate token
  // Note: Token validation is done against authConfigs.dv360.validToken
  // Scope should be "doubleclickbidmanager" but we don't implement scope checking in Phase 1

  // For now, accept any Bearer token format (actual validation would be done by google-oauth.ts)
  if (!token) {
    res.status(401).json(authErrorResponse);
    return;
  }

  next();
};
