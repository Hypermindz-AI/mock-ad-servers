import { Request, Response } from 'express';
import {
  sampleCampaign,
  updatedCampaignResponse,
  TTDCampaign,
} from './mockData';

/**
 * The Trade Desk API v3 Campaign Controllers
 */

/**
 * POST /v3/campaign
 * Creates a new campaign
 *
 * Request Body:
 * {
 *   "CampaignName": "Campaign Name",
 *   "AdvertiserId": "abc123",
 *   "Budget": {
 *     "Amount": 10000,
 *     "CurrencyCode": "USD"
 *   },
 *   "StartDate": "2025-11-01T00:00:00Z"
 * }
 *
 * Response 200:
 * {
 *   "CampaignId": "xyz789",
 *   "CampaignName": "Campaign Name"
 * }
 *
 * Error 400:
 * {
 *   "Message": "Invalid request: Missing required field",
 *   "ErrorCode": "VALIDATION_ERROR"
 * }
 */
export const createCampaign = (req: Request, res: Response): void => {
  const campaignData = req.body as Partial<TTDCampaign>;

  // Validate required fields
  if (!campaignData.CampaignName) {
    res.status(400).json({
      Message: 'Invalid request: CampaignName is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  if (!campaignData.AdvertiserId) {
    res.status(400).json({
      Message: 'Invalid request: AdvertiserId is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  if (!campaignData.Budget || !campaignData.Budget.Amount) {
    res.status(400).json({
      Message: 'Invalid request: Budget.Amount is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Validate budget amount
  if (campaignData.Budget.Amount <= 0) {
    res.status(400).json({
      Message: 'Invalid request: Budget amount must be greater than 0',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  if (!campaignData.StartDate) {
    res.status(400).json({
      Message: 'Invalid request: StartDate is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Validate date format (basic ISO 8601 check)
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
  if (!dateRegex.test(campaignData.StartDate)) {
    res.status(400).json({
      Message: 'Invalid request: StartDate must be in ISO 8601 format',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Return success response with campaign ID and name
  res.status(200).json({
    CampaignId: `ttd_campaign_${Date.now()}`,
    CampaignName: campaignData.CampaignName,
  });
};

/**
 * PUT /v3/campaign/:id
 * Updates an existing campaign
 *
 * Request Body:
 * {
 *   "Availability": "Paused",
 *   "CampaignName": "Updated Name"
 * }
 *
 * Response 200:
 * {
 *   "CampaignId": "xyz789",
 *   "CampaignName": "Updated Name",
 *   "Availability": "Paused",
 *   ...
 * }
 *
 * Error 400:
 * {
 *   "Message": "Invalid Availability value",
 *   "ErrorCode": "VALIDATION_ERROR"
 * }
 *
 * Error 404:
 * {
 *   "Message": "Campaign not found",
 *   "ErrorCode": "NOT_FOUND"
 * }
 */
export const updateCampaign = (req: Request, res: Response): void => {
  const { id } = req.params;
  const updateData = req.body as Partial<TTDCampaign>;

  // Validate campaign ID
  if (!id) {
    res.status(400).json({
      Message: 'Invalid request: Campaign ID is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Validate Availability enum if provided
  const validAvailability = ['Active', 'Paused', 'Archived'];
  if (updateData.Availability && !validAvailability.includes(updateData.Availability)) {
    res.status(400).json({
      Message: `Invalid request: Availability must be one of: ${validAvailability.join(', ')}`,
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Validate budget if provided
  if (updateData.Budget?.Amount !== undefined && updateData.Budget.Amount <= 0) {
    res.status(400).json({
      Message: 'Invalid request: Budget amount must be greater than 0',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Return updated campaign response
  const response: TTDCampaign = {
    ...updatedCampaignResponse,
    CampaignId: id,
    ...(updateData.CampaignName && { CampaignName: updateData.CampaignName }),
    ...(updateData.Availability && { Availability: updateData.Availability }),
    ...(updateData.Budget && { Budget: updateData.Budget }),
  };

  res.status(200).json(response);
};

/**
 * GET /v3/campaign/:id
 * Retrieves campaign details
 *
 * Response 200:
 * {
 *   "CampaignId": "xyz789",
 *   "CampaignName": "Campaign Name",
 *   "AdvertiserId": "abc123",
 *   "Budget": {...},
 *   "StartDate": "2025-11-01T00:00:00Z",
 *   "Availability": "Active"
 * }
 *
 * Error 404:
 * {
 *   "Message": "Campaign not found",
 *   "ErrorCode": "NOT_FOUND"
 * }
 */
export const getCampaign = (req: Request, res: Response): void => {
  const { id } = req.params;

  // Validate campaign ID
  if (!id) {
    res.status(400).json({
      Message: 'Invalid request: Campaign ID is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Return sample campaign with the requested ID
  const response: TTDCampaign = {
    ...sampleCampaign,
    CampaignId: id,
  };

  res.status(200).json(response);
};
