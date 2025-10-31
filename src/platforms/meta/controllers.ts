import { Request, Response } from 'express';
import {
  campaignStorage,
  generateCampaignId,
  generateFbTraceId,
  validObjectives,
  validStatuses,
  MetaCampaign,
  adSetStorage,
  adStorage,
  MetaAdSet,
  MetaAd,
  generateAdSetId,
  generateAdId,
  generateCursor,
  validBillingEvents,
  validOptimizationGoals,
  generateInsightsData,
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

/**
 * List Campaigns
 * GET /v23.0/act_{ad_account_id}/campaigns
 *
 * Lists all campaigns for an ad account with optional pagination
 */
export const listCampaigns = (req: Request, res: Response): void => {
  const { fields, limit, after } = req.query;

  // Get all campaigns
  const allCampaigns = Array.from(campaignStorage.values());

  // Parse limit
  const limitNum = limit ? parseInt(limit as string, 10) : 25;
  const startIndex = after ? parseInt(after as string, 10) || 0 : 0;

  // Paginate
  const endIndex = startIndex + limitNum;
  const paginatedCampaigns = allCampaigns.slice(startIndex, endIndex);

  // Filter fields if specified
  let responseData = paginatedCampaigns;
  if (fields) {
    const fieldArray = (fields as string).split(',');
    responseData = paginatedCampaigns.map((campaign) => {
      const filtered: any = { id: campaign.id }; // Always include ID
      fieldArray.forEach((field) => {
        if (field in campaign) {
          filtered[field] = campaign[field as keyof MetaCampaign];
        }
      });
      return filtered;
    });
  }

  // Build pagination response
  const response: any = {
    data: responseData,
  };

  if (allCampaigns.length > endIndex) {
    response.paging = {
      cursors: {
        before: generateCursor(),
        after: endIndex.toString(),
      },
    };
  }

  res.status(200).json(response);
};

/**
 * Get Campaign Insights
 * GET /v23.0/{campaign_id}/insights
 *
 * Retrieves performance insights for a campaign
 */
export const getCampaignInsights = (req: Request, res: Response): void => {
  const { campaignId } = req.params;
  const { date_preset, time_range } = req.query;

  // Check if campaign exists
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

  // Parse time range if provided
  let timeRangeObj: { since: string; until: string } | undefined;
  if (time_range) {
    try {
      timeRangeObj = JSON.parse(time_range as string);
    } catch (e) {
      return void res.status(400).json({
        error: {
          message: 'Invalid time_range format. Expected JSON with "since" and "until" fields',
          type: 'OAuthException',
          code: 100,
          fbtrace_id: generateFbTraceId(),
        },
      });
    }
  }

  // Generate insights data
  const insights = generateInsightsData(date_preset as string, timeRangeObj);

  res.status(200).json({
    data: [insights],
  });
};

/**
 * List Ad Sets
 * GET /v23.0/act_{ad_account_id}/adsets
 *
 * Lists all ad sets for an ad account
 */
export const listAdSets = (req: Request, res: Response): void => {
  const { fields, limit, after } = req.query;

  // Get all ad sets
  const allAdSets = Array.from(adSetStorage.values());

  // Parse limit
  const limitNum = limit ? parseInt(limit as string, 10) : 25;
  const startIndex = after ? parseInt(after as string, 10) || 0 : 0;

  // Paginate
  const endIndex = startIndex + limitNum;
  const paginatedAdSets = allAdSets.slice(startIndex, endIndex);

  // Filter fields if specified
  let responseData = paginatedAdSets;
  if (fields) {
    const fieldArray = (fields as string).split(',');
    responseData = paginatedAdSets.map((adset) => {
      const filtered: any = { id: adset.id };
      fieldArray.forEach((field) => {
        if (field in adset) {
          filtered[field] = adset[field as keyof MetaAdSet];
        }
      });
      return filtered;
    });
  }

  // Build pagination response
  const response: any = {
    data: responseData,
  };

  if (allAdSets.length > endIndex) {
    response.paging = {
      cursors: {
        before: generateCursor(),
        after: endIndex.toString(),
      },
    };
  }

  res.status(200).json(response);
};

/**
 * Create Ad Set
 * POST /v23.0/act_{ad_account_id}/adsets
 *
 * Creates a new ad set
 */
export const createAdSet = (req: Request, res: Response): void => {
  const {
    name,
    campaign_id,
    status,
    billing_event,
    optimization_goal,
    bid_amount,
    daily_budget,
    lifetime_budget,
    targeting,
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

  if (!campaign_id) {
    return void res.status(400).json({
      error: {
        message: 'Missing required field: campaign_id',
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

  // Validate campaign exists
  if (!campaignStorage.has(campaign_id)) {
    return void res.status(400).json({
      error: {
        message: `Campaign with ID ${campaign_id} does not exist`,
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

  // Validate billing_event if provided
  if (billing_event && !validBillingEvents.includes(billing_event)) {
    return void res.status(400).json({
      error: {
        message: `Invalid billing_event. Must be one of: ${validBillingEvents.join(', ')}`,
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Validate optimization_goal if provided
  if (optimization_goal && !validOptimizationGoals.includes(optimization_goal)) {
    return void res.status(400).json({
      error: {
        message: `Invalid optimization_goal. Must be one of: ${validOptimizationGoals.join(', ')}`,
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Generate ad set ID
  const adSetId = generateAdSetId();
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '+0000');

  // Create ad set object
  const adSet: MetaAdSet = {
    id: adSetId,
    name,
    campaign_id,
    status,
    ...(billing_event && { billing_event }),
    ...(optimization_goal && { optimization_goal }),
    ...(bid_amount && { bid_amount }),
    ...(daily_budget && { daily_budget }),
    ...(lifetime_budget && { lifetime_budget }),
    ...(targeting && { targeting }),
    created_time: timestamp,
    updated_time: timestamp,
  };

  // Store ad set
  adSetStorage.set(adSetId, adSet);

  // Return success response
  res.status(200).json({
    id: adSetId,
  });
};

/**
 * Get Ad Set
 * GET /v23.0/{adset_id}
 *
 * Retrieves ad set details by ID
 */
export const getAdSet = (req: Request, res: Response): void => {
  const { adSetId } = req.params;

  // Retrieve ad set from storage
  const adSet = adSetStorage.get(adSetId);

  if (!adSet) {
    return void res.status(404).json({
      error: {
        message: `Ad Set with ID ${adSetId} not found`,
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Return ad set details
  res.status(200).json(adSet);
};

/**
 * Update Ad Set
 * POST /v23.0/{adset_id}
 *
 * Updates an existing ad set
 */
export const updateAdSet = (req: Request, res: Response): void => {
  const { adSetId } = req.params;
  const updates = req.body;

  // Retrieve existing ad set
  const adSet = adSetStorage.get(adSetId);

  if (!adSet) {
    return void res.status(404).json({
      error: {
        message: `Ad Set with ID ${adSetId} not found`,
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

  // Update ad set
  const updatedAdSet: MetaAdSet = {
    ...adSet,
    ...updates,
    id: adSet.id,
    created_time: adSet.created_time,
    updated_time: new Date().toISOString().replace(/\.\d{3}Z$/, '+0000'),
  };

  // Store updated ad set
  adSetStorage.set(adSetId, updatedAdSet);

  // Return success response
  res.status(200).json({
    success: true,
    id: adSetId,
  });
};

/**
 * List Ads
 * GET /v23.0/act_{ad_account_id}/ads
 *
 * Lists all ads for an ad account
 */
export const listAds = (req: Request, res: Response): void => {
  const { fields, limit, after } = req.query;

  // Get all ads
  const allAds = Array.from(adStorage.values());

  // Parse limit
  const limitNum = limit ? parseInt(limit as string, 10) : 25;
  const startIndex = after ? parseInt(after as string, 10) || 0 : 0;

  // Paginate
  const endIndex = startIndex + limitNum;
  const paginatedAds = allAds.slice(startIndex, endIndex);

  // Filter fields if specified
  let responseData = paginatedAds;
  if (fields) {
    const fieldArray = (fields as string).split(',');
    responseData = paginatedAds.map((ad) => {
      const filtered: any = { id: ad.id };
      fieldArray.forEach((field) => {
        if (field in ad) {
          filtered[field] = ad[field as keyof MetaAd];
        }
      });
      return filtered;
    });
  }

  // Build pagination response
  const response: any = {
    data: responseData,
  };

  if (allAds.length > endIndex) {
    response.paging = {
      cursors: {
        before: generateCursor(),
        after: endIndex.toString(),
      },
    };
  }

  res.status(200).json(response);
};

/**
 * Create Ad
 * POST /v23.0/act_{ad_account_id}/ads
 *
 * Creates a new ad
 */
export const createAd = (req: Request, res: Response): void => {
  const { name, adset_id, status, creative } = req.body;

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

  if (!adset_id) {
    return void res.status(400).json({
      error: {
        message: 'Missing required field: adset_id',
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

  // Validate ad set exists
  const adSet = adSetStorage.get(adset_id);
  if (!adSet) {
    return void res.status(400).json({
      error: {
        message: `Ad Set with ID ${adset_id} does not exist`,
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

  // Generate ad ID
  const adId = generateAdId();
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '+0000');

  // Create ad object
  const ad: MetaAd = {
    id: adId,
    name,
    adset_id,
    campaign_id: adSet.campaign_id,
    status,
    ...(creative && { creative }),
    created_time: timestamp,
    updated_time: timestamp,
  };

  // Store ad
  adStorage.set(adId, ad);

  // Return success response
  res.status(200).json({
    id: adId,
  });
};

/**
 * Get Ad
 * GET /v23.0/{ad_id}
 *
 * Retrieves ad details by ID
 */
export const getAd = (req: Request, res: Response): void => {
  const { adId } = req.params;

  // Retrieve ad from storage
  const ad = adStorage.get(adId);

  if (!ad) {
    return void res.status(404).json({
      error: {
        message: `Ad with ID ${adId} not found`,
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Return ad details
  res.status(200).json(ad);
};

/**
 * Update Ad
 * POST /v23.0/{ad_id}
 *
 * Updates an existing ad
 */
export const updateAd = (req: Request, res: Response): void => {
  const { adId } = req.params;
  const updates = req.body;

  // Retrieve existing ad
  const ad = adStorage.get(adId);

  if (!ad) {
    return void res.status(404).json({
      error: {
        message: `Ad with ID ${adId} not found`,
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

  // Update ad
  const updatedAd: MetaAd = {
    ...ad,
    ...updates,
    id: ad.id,
    created_time: ad.created_time,
    updated_time: new Date().toISOString().replace(/\.\d{3}Z$/, '+0000'),
  };

  // Store updated ad
  adStorage.set(adId, updatedAd);

  // Return success response
  res.status(200).json({
    success: true,
    id: adId,
  });
};
