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
  sampleAdGroup,
  sampleAdGroupAd,
  GoogleAdsCampaign,
  GoogleAdsAdGroup,
  GoogleAdsAdGroupAd,
  GoogleAdsSearchResult,
  GoogleAdsMetrics,
  GoogleAdsCustomer,
  sampleCustomer,
} from './mockData.js';
import { parseGAQL, calculateDateRange, applyWhereConditions, selectFields } from './gaql-parser.js';
// Database imports - reserved for future Postgres integration
// import { CampaignRepository } from '../../db/repositories/CampaignRepository';
// import { MetricsRepository } from '../../db/repositories/MetricsRepository';
// import { MetricsGenerator } from "../../db/generators/metricsGenerator";

// In-memory storage for created campaigns
const campaigns = new Map<string, GoogleAdsCampaign>();

// In-memory storage for ad groups
const adGroups = new Map<string, GoogleAdsAdGroup>();

// In-memory storage for ad group ads
const adGroupAds = new Map<string, GoogleAdsAdGroupAd>();

// In-memory storage for customers (accounts)
const customers = new Map<string, GoogleAdsCustomer>();

// Initialize with sample data
campaigns.set(sampleCampaign.id!, sampleCampaign); // Use the actual ID from sampleCampaign
adGroups.set('1111111111', sampleAdGroup);
adGroupAds.set('1111111111~2222222222', sampleAdGroupAd);
customers.set(sampleCustomer.id, sampleCustomer);

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

/**
 * Generate realistic metrics based on date range
 */
function generateMetrics(daysInRange: number): GoogleAdsMetrics {
  const baseImpressions = Math.floor(Math.random() * 10000) + 5000;
  const clicks = Math.floor(baseImpressions * (Math.random() * 0.05 + 0.01));
  const ctr = ((clicks / baseImpressions) * 100).toFixed(2);
  const avgCpc = (Math.random() * 2 + 0.5).toFixed(2);
  const costMicros = String(Math.floor(clicks * parseFloat(avgCpc) * 1000000));
  const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.02));
  const conversionValue = (conversions * (Math.random() * 50 + 20)).toFixed(2);

  return {
    impressions: String(baseImpressions * daysInRange),
    clicks: String(clicks * daysInRange),
    costMicros: String(parseInt(costMicros) * daysInRange),
    ctr,
    averageCpc: String(parseFloat(avgCpc) * 1000000),
    conversions: String(conversions * daysInRange),
    conversionValue: String(parseFloat(conversionValue) * daysInRange),
  };
}

/**
 * Search endpoint - handles GAQL queries
 * POST /googleads/v21/customers/:customerId/googleAds:search
 */
export const searchGoogleAds = (req: Request, res: Response): void => {
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

  // const { customerId } = req.params; // Not used in mock implementation
  const { query, pageSize = 10, pageToken } = req.body;

  if (!query) {
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
                  queryError: 'MISSING_QUERY',
                },
                message: 'Query is required.',
              },
            ],
          },
        ],
      },
    });
    return;
  }

  try {
    // Parse GAQL query
    const parsed = parseGAQL(query);
    const { startDate, endDate } = calculateDateRange(parsed.dateRange);
    const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Build results based on FROM clause
    let rawResults: GoogleAdsSearchResult[] = [];

    if (parsed.from === 'campaign') {
      // Get all campaigns and convert to search results
      rawResults = Array.from(campaigns.values()).map(campaign => ({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          resourceName: campaign.resourceName,
        },
        metrics: generateMetrics(daysInRange),
      }));
    } else if (parsed.from === 'ad_group') {
      // Get all ad groups
      rawResults = Array.from(adGroups.values()).map(adGroup => ({
        adGroup: {
          id: adGroup.id,
          name: adGroup.name,
          status: adGroup.status,
          resourceName: adGroup.resourceName,
          campaign: adGroup.campaign,
        },
        metrics: generateMetrics(daysInRange),
      }));
    } else if (parsed.from === 'ad_group_ad') {
      // Get all ad group ads
      rawResults = Array.from(adGroupAds.values()).map(adGroupAd => ({
        adGroupAd: {
          resourceName: adGroupAd.resourceName,
          status: adGroupAd.status,
          ad: {
            id: adGroupAd.ad.id,
            finalUrls: adGroupAd.ad.finalUrls,
            type: adGroupAd.ad.type,
          },
        },
        metrics: generateMetrics(daysInRange),
      }));
    } else {
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
                    queryError: 'INVALID_FROM_CLAUSE',
                  },
                  message: `Invalid FROM clause: ${parsed.from}`,
                },
              ],
            },
          ],
        },
      });
      return;
    }

    // Apply WHERE conditions
    rawResults = applyWhereConditions(rawResults, parsed.whereConditions);

    // Apply field selection
    const selectedResults = selectFields(rawResults, parsed.selectFields);

    // Handle pagination
    const startIndex = pageToken ? parseInt(pageToken) : 0;
    const endIndex = startIndex + pageSize;
    const paginatedResults = selectedResults.slice(startIndex, endIndex);
    const hasMore = endIndex < selectedResults.length;

    // Build response
    const response: any = {
      results: paginatedResults,
      fieldMask: parsed.selectFields.join(','),
    };

    if (hasMore) {
      response.nextPageToken = String(endIndex);
    }

    response.totalResultsCount = String(selectedResults.length);

    res.status(200).json(response);
  } catch (error) {
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
                  queryError: 'INVALID_QUERY',
                },
                message: error instanceof Error ? error.message : 'Invalid GAQL query.',
              },
            ],
          },
        ],
      },
    });
  }
};

/**
 * Get customer (account) details including status
 * GET /googleads/v21/customers/:customerId
 */
export const getCustomer = (req: Request, res: Response): void => {
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

  // Look up customer; default to ENABLED if not present
  let customer = customers.get(customerId);
  if (!customer) {
    customer = {
      resourceName: `customers/${customerId}`,
      id: customerId,
      descriptiveName: `Customer ${customerId}`,
      currencyCode: 'USD',
      timeZone: 'America/Los_Angeles',
      status: 'ENABLED',
    };
    customers.set(customerId, customer);
  }

  res.status(200).json(customer);
};

/**
 * Create or update ad groups
 * POST /googleads/v21/customers/:customerId/adGroups:mutate
 */
export const mutateAdGroups = (req: Request, res: Response): void => {
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
    res.status(400).json({
      error: {
        code: 400,
        message: 'Operations array is required and must not be empty.',
        status: 'INVALID_ARGUMENT',
      },
    });
    return;
  }

  const results: any[] = [];

  for (const operation of operations) {
    if (operation.create) {
      const createData = operation.create;

      // Validate required fields
      if (!createData.name) {
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
                      fieldError: 'REQUIRED',
                    },
                    message: 'Ad group name is required.',
                  },
                ],
              },
            ],
          },
        });
        return;
      }

      if (!createData.campaign) {
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
                      adGroupError: 'INVALID_CAMPAIGN',
                    },
                    message: 'Campaign is required for ad group.',
                  },
                ],
              },
            ],
          },
        });
        return;
      }

      // Validate status
      const validStatuses = ['ENABLED', 'PAUSED', 'REMOVED'];
      if (createData.status && !validStatuses.includes(createData.status)) {
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
                      adGroupError: 'INVALID_STATUS',
                    },
                    message: 'Invalid ad group status.',
                  },
                ],
              },
            ],
          },
        });
        return;
      }

      // Validate type
      const validTypes = ['SEARCH_STANDARD', 'DISPLAY_STANDARD', 'SHOPPING_PRODUCT_ADS', 'VIDEO_TRUE_VIEW_IN_STREAM'];
      if (createData.type && !validTypes.includes(createData.type)) {
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
                      adGroupError: 'INVALID_TYPE',
                    },
                    message: 'Invalid ad group type.',
                  },
                ],
              },
            ],
          },
        });
        return;
      }

      // Generate ad group ID
      const adGroupId = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
      const resourceName = `customers/${customerId}/adGroups/${adGroupId}`;

      // Create ad group object
      const newAdGroup: GoogleAdsAdGroup = {
        resourceName,
        id: adGroupId,
        name: createData.name,
        campaign: createData.campaign,
        status: createData.status || 'PAUSED',
        type: createData.type || 'SEARCH_STANDARD',
        cpcBidMicros: createData.cpcBidMicros,
      };

      // Store ad group
      adGroups.set(adGroupId, newAdGroup);

      results.push({
        resourceName,
        adGroup: newAdGroup,
      });
    } else if (operation.update) {
      // Handle update operation
      const updateData = operation.update;

      if (!updateData.resourceName) {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Resource name is required for update operation.',
            status: 'INVALID_ARGUMENT',
          },
        });
        return;
      }

      // Extract ad group ID from resource name
      const match = updateData.resourceName.match(/adGroups\/(\d+)/);
      if (!match) {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Invalid resource name format.',
            status: 'INVALID_ARGUMENT',
          },
        });
        return;
      }

      const adGroupId = match[1];
      const adGroup = adGroups.get(adGroupId);

      if (!adGroup) {
        res.status(404).json({
          error: {
            code: 404,
            message: 'The requested resource was not found.',
            status: 'NOT_FOUND',
          },
        });
        return;
      }

      // Update fields
      if (updateData.status) {
        adGroup.status = updateData.status;
      }
      if (updateData.name) {
        adGroup.name = updateData.name;
      }
      if (updateData.cpcBidMicros) {
        adGroup.cpcBidMicros = updateData.cpcBidMicros;
      }

      adGroups.set(adGroupId, adGroup);

      results.push({
        resourceName: adGroup.resourceName,
      });
    } else {
      res.status(400).json({
        error: {
          code: 400,
          message: 'Operation must contain either create or update field.',
          status: 'INVALID_ARGUMENT',
        },
      });
      return;
    }
  }

  res.status(200).json({ results });
};

/**
 * Create or update ad group ads
 * POST /googleads/v21/customers/:customerId/adGroupAds:mutate
 */
export const mutateAdGroupAds = (req: Request, res: Response): void => {
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
    res.status(400).json({
      error: {
        code: 400,
        message: 'Operations array is required and must not be empty.',
        status: 'INVALID_ARGUMENT',
      },
    });
    return;
  }

  const results: any[] = [];

  for (const operation of operations) {
    if (operation.create) {
      const createData = operation.create;

      // Validate required fields
      if (!createData.adGroup) {
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
                      adGroupAdError: 'INVALID_AD_GROUP',
                    },
                    message: 'Ad group is required.',
                  },
                ],
              },
            ],
          },
        });
        return;
      }

      if (!createData.ad) {
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
                      adGroupAdError: 'MISSING_AD',
                    },
                    message: 'Ad is required.',
                  },
                ],
              },
            ],
          },
        });
        return;
      }

      if (!createData.ad.finalUrls || createData.ad.finalUrls.length === 0) {
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
                      adError: 'MISSING_FINAL_URLS',
                    },
                    message: 'Final URLs are required.',
                  },
                ],
              },
            ],
          },
        });
        return;
      }

      // Validate status
      const validStatuses = ['ENABLED', 'PAUSED', 'REMOVED'];
      if (createData.status && !validStatuses.includes(createData.status)) {
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
                      adGroupAdError: 'INVALID_STATUS',
                    },
                    message: 'Invalid ad group ad status.',
                  },
                ],
              },
            ],
          },
        });
        return;
      }

      // Extract ad group ID from resource name
      const adGroupMatch = createData.adGroup.match(/adGroups\/(\d+)/);
      if (!adGroupMatch) {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Invalid ad group resource name format.',
            status: 'INVALID_ARGUMENT',
          },
        });
        return;
      }

      const adGroupId = adGroupMatch[1];
      const adId = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
      const adGroupAdKey = `${adGroupId}~${adId}`;
      const resourceName = `customers/${customerId}/adGroupAds/${adGroupAdKey}`;

      // Determine ad type
      let adType = 'RESPONSIVE_SEARCH_AD';
      if (createData.ad.expandedTextAd) {
        adType = 'EXPANDED_TEXT_AD';
      } else if (createData.ad.responsiveSearchAd) {
        adType = 'RESPONSIVE_SEARCH_AD';
      }

      // Create ad group ad object
      const newAdGroupAd: GoogleAdsAdGroupAd = {
        resourceName,
        id: adId,
        adGroup: createData.adGroup,
        status: createData.status || 'PAUSED',
        ad: {
          id: adId,
          type: adType,
          finalUrls: createData.ad.finalUrls,
          responsiveSearchAd: createData.ad.responsiveSearchAd,
          expandedTextAd: createData.ad.expandedTextAd,
        },
      };

      // Store ad group ad
      adGroupAds.set(adGroupAdKey, newAdGroupAd);

      results.push({
        resourceName,
        adGroupAd: newAdGroupAd,
      });
    } else if (operation.update) {
      // Handle update operation
      const updateData = operation.update;

      if (!updateData.resourceName) {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Resource name is required for update operation.',
            status: 'INVALID_ARGUMENT',
          },
        });
        return;
      }

      // Extract ad group ad key from resource name
      const match = updateData.resourceName.match(/adGroupAds\/(.+)/);
      if (!match) {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Invalid resource name format.',
            status: 'INVALID_ARGUMENT',
          },
        });
        return;
      }

      const adGroupAdKey = match[1];
      const adGroupAd = adGroupAds.get(adGroupAdKey);

      if (!adGroupAd) {
        res.status(404).json({
          error: {
            code: 404,
            message: 'The requested resource was not found.',
            status: 'NOT_FOUND',
          },
        });
        return;
      }

      // Update fields (only status is typically updatable for ads)
      if (updateData.status) {
        adGroupAd.status = updateData.status;
      }

      adGroupAds.set(adGroupAdKey, adGroupAd);

      results.push({
        resourceName: adGroupAd.resourceName,
      });
    } else {
      res.status(400).json({
        error: {
          code: 400,
          message: 'Operation must contain either create or update field.',
          status: 'INVALID_ARGUMENT',
        },
      });
      return;
    }
  }

  res.status(200).json({ results });
};
