import { Request, Response } from 'express';
import {
  sampleCampaign,
  updatedCampaignResponse,
  TTDCampaign,
  TTDAdGroup,
  sampleAdGroup,
  TTDCreative,
  sampleCreative,
  sampleCampaigns,
  sampleCampaignReports,
  TTDCampaignQueryRequest,
  TTDCampaignQueryResponse,
  TTDCampaignReportingResponse,
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

/**
 * POST /v3/campaign/query/facets
 * Query campaigns with filters (facets)
 *
 * Request Body:
 * {
 *   "AdvertiserIds": ["advertiser-1"],
 *   "PageStartIndex": 0,
 *   "PageSize": 100
 * }
 *
 * Response 200:
 * {
 *   "Result": [...campaigns...],
 *   "ResultCount": 10
 * }
 */
export const queryCampaignsFacets = (req: Request, res: Response): void => {
  const queryData = req.body as TTDCampaignQueryRequest;

  // Validate required fields
  if (!queryData.AdvertiserIds || !Array.isArray(queryData.AdvertiserIds)) {
    res.status(400).json({
      Message: 'Invalid request: AdvertiserIds is required and must be an array',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  if (queryData.AdvertiserIds.length === 0) {
    res.status(400).json({
      Message: 'Invalid request: AdvertiserIds array cannot be empty',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Apply pagination defaults
  const pageStartIndex = queryData.PageStartIndex ?? 0;
  const pageSize = queryData.PageSize ?? 100;

  // Validate pagination parameters
  if (pageStartIndex < 0) {
    res.status(400).json({
      Message: 'Invalid request: PageStartIndex must be non-negative',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  if (pageSize <= 0 || pageSize > 1000) {
    res.status(400).json({
      Message: 'Invalid request: PageSize must be between 1 and 1000',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Filter campaigns by advertiser IDs
  const filteredCampaigns = sampleCampaigns.filter(campaign =>
    queryData.AdvertiserIds.includes(campaign.AdvertiserId)
  );

  // Apply pagination
  const paginatedCampaigns = filteredCampaigns.slice(
    pageStartIndex,
    pageStartIndex + pageSize
  );

  const response: TTDCampaignQueryResponse = {
    Result: paginatedCampaigns,
    ResultCount: filteredCampaigns.length,
  };

  res.status(200).json(response);
};

/**
 * GET /v3/myreports/reportexecution/query/campaign
 * Get campaign reporting data
 *
 * Query Parameters:
 * - AdvertiserIds: comma-separated list of advertiser IDs
 * - StartDateInclusive: ISO 8601 date
 * - EndDateExclusive: ISO 8601 date
 * - PageStartIndex: number (optional)
 * - PageSize: number (optional)
 *
 * Response 200:
 * {
 *   "Result": [
 *     {
 *       "CampaignId": "...",
 *       "Impressions": 1000,
 *       "Clicks": 50,
 *       "TotalCost": 100.00,
 *       "Conversions": 5
 *     }
 *   ],
 *   "ResultCount": 1
 * }
 */
export const getCampaignReporting = (req: Request, res: Response): void => {
  const {
    AdvertiserIds,
    StartDateInclusive,
    EndDateExclusive,
    PageStartIndex,
    PageSize,
  } = req.query;

  // Validate required fields
  if (!AdvertiserIds) {
    res.status(400).json({
      Message: 'Invalid request: AdvertiserIds query parameter is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  if (!StartDateInclusive) {
    res.status(400).json({
      Message: 'Invalid request: StartDateInclusive query parameter is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  if (!EndDateExclusive) {
    res.status(400).json({
      Message: 'Invalid request: EndDateExclusive query parameter is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Parse AdvertiserIds (comma-separated string)
  const advertiserIdArray = (AdvertiserIds as string).split(',').map(id => id.trim());

  // Validate date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?)?$/;
  if (!dateRegex.test(StartDateInclusive as string)) {
    res.status(400).json({
      Message: 'Invalid request: StartDateInclusive must be in ISO 8601 format',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  if (!dateRegex.test(EndDateExclusive as string)) {
    res.status(400).json({
      Message: 'Invalid request: EndDateExclusive must be in ISO 8601 format',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Apply pagination defaults
  const pageStartIndex = PageStartIndex ? parseInt(PageStartIndex as string, 10) : 0;
  const pageSize = PageSize ? parseInt(PageSize as string, 10) : 100;

  // Validate pagination parameters
  if (isNaN(pageStartIndex) || pageStartIndex < 0) {
    res.status(400).json({
      Message: 'Invalid request: PageStartIndex must be a non-negative number',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  if (isNaN(pageSize) || pageSize <= 0 || pageSize > 1000) {
    res.status(400).json({
      Message: 'Invalid request: PageSize must be between 1 and 1000',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Filter reports by advertiser IDs
  const filteredReports = sampleCampaignReports.filter(report =>
    advertiserIdArray.includes(report.AdvertiserId)
  );

  // Apply pagination
  const paginatedReports = filteredReports.slice(
    pageStartIndex,
    pageStartIndex + pageSize
  );

  const response: TTDCampaignReportingResponse = {
    Result: paginatedReports,
    ResultCount: filteredReports.length,
  };

  res.status(200).json(response);
};

/**
 * GET /v3/adgroup/:id
 * Retrieves ad group details
 *
 * Response 200:
 * {
 *   "AdGroupId": "xyz789",
 *   "AdGroupName": "Ad Group Name",
 *   "CampaignId": "abc123",
 *   "Budget": {...},
 *   "Availability": "Active"
 * }
 */
export const getAdGroup = (req: Request, res: Response): void => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      Message: 'Invalid request: Ad Group ID is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Return sample ad group with the requested ID
  const response: TTDAdGroup = {
    ...sampleAdGroup,
    AdGroupId: id,
  };

  res.status(200).json(response);
};

/**
 * POST /v3/adgroup
 * Creates a new ad group
 *
 * Request Body:
 * {
 *   "AdGroupName": "...",
 *   "CampaignId": "...",
 *   "Budget": {...}
 * }
 *
 * Response 200:
 * {
 *   "AdGroupId": "xyz789",
 *   "AdGroupName": "Ad Group Name"
 * }
 */
export const createAdGroup = (req: Request, res: Response): void => {
  const adGroupData = req.body as Partial<TTDAdGroup>;

  // Validate required fields
  if (!adGroupData.AdGroupName) {
    res.status(400).json({
      Message: 'Invalid request: AdGroupName is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  if (!adGroupData.CampaignId) {
    res.status(400).json({
      Message: 'Invalid request: CampaignId is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Validate Budget if provided
  if (adGroupData.Budget) {
    if (!adGroupData.Budget.Amount || adGroupData.Budget.Amount <= 0) {
      res.status(400).json({
        Message: 'Invalid request: Budget.Amount must be greater than 0',
        ErrorCode: 'VALIDATION_ERROR',
      });
      return;
    }

    if (!adGroupData.Budget.CurrencyCode) {
      res.status(400).json({
        Message: 'Invalid request: Budget.CurrencyCode is required when Budget is provided',
        ErrorCode: 'VALIDATION_ERROR',
      });
      return;
    }
  }

  // Return success response with ad group ID and name
  res.status(200).json({
    AdGroupId: `ttd_adgroup_${Date.now()}`,
    AdGroupName: adGroupData.AdGroupName,
  });
};

/**
 * PUT /v3/adgroup/:id
 * Updates an existing ad group
 *
 * Request Body:
 * {
 *   "AdGroupName": "Updated Name",
 *   "Availability": "Paused"
 * }
 *
 * Response 200:
 * {
 *   "AdGroupId": "xyz789",
 *   "AdGroupName": "Updated Name",
 *   ...
 * }
 */
export const updateAdGroup = (req: Request, res: Response): void => {
  const { id } = req.params;
  const updateData = req.body as Partial<TTDAdGroup>;

  if (!id) {
    res.status(400).json({
      Message: 'Invalid request: Ad Group ID is required',
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

  // Validate Budget if provided
  if (updateData.Budget?.Amount !== undefined && updateData.Budget.Amount <= 0) {
    res.status(400).json({
      Message: 'Invalid request: Budget.Amount must be greater than 0',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Validate MaxBid if provided
  if (updateData.MaxBid?.Amount !== undefined && updateData.MaxBid.Amount <= 0) {
    res.status(400).json({
      Message: 'Invalid request: MaxBid.Amount must be greater than 0',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Return updated ad group response
  const response: TTDAdGroup = {
    ...sampleAdGroup,
    AdGroupId: id,
    ...(updateData.AdGroupName && { AdGroupName: updateData.AdGroupName }),
    ...(updateData.Availability && { Availability: updateData.Availability }),
    ...(updateData.Budget && { Budget: updateData.Budget }),
    ...(updateData.MaxBid && { MaxBid: updateData.MaxBid }),
    ...(updateData.BaseBidCPM && { BaseBidCPM: updateData.BaseBidCPM }),
    ...(updateData.PacingMode && { PacingMode: updateData.PacingMode }),
  };

  res.status(200).json(response);
};

/**
 * GET /v3/creative/:id
 * Retrieves creative details
 *
 * Response 200:
 * {
 *   "CreativeId": "xyz789",
 *   "CreativeName": "Creative Name",
 *   "AdvertiserId": "abc123",
 *   "CreativeType": "ThirdPartyTag",
 *   ...
 * }
 */
export const getCreative = (req: Request, res: Response): void => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      Message: 'Invalid request: Creative ID is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Return sample creative with the requested ID
  const response: TTDCreative = {
    ...sampleCreative,
    CreativeId: id,
  };

  res.status(200).json(response);
};

/**
 * POST /v3/creative
 * Creates a new creative
 *
 * Request Body:
 * {
 *   "CreativeName": "...",
 *   "AdvertiserId": "...",
 *   "CreativeType": "ThirdPartyTag"
 * }
 *
 * Response 200:
 * {
 *   "CreativeId": "xyz789",
 *   "CreativeName": "Creative Name"
 * }
 */
export const createCreative = (req: Request, res: Response): void => {
  const creativeData = req.body as Partial<TTDCreative>;

  // Validate required fields
  if (!creativeData.CreativeName) {
    res.status(400).json({
      Message: 'Invalid request: CreativeName is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  if (!creativeData.AdvertiserId) {
    res.status(400).json({
      Message: 'Invalid request: AdvertiserId is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  if (!creativeData.CreativeType) {
    res.status(400).json({
      Message: 'Invalid request: CreativeType is required',
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Validate CreativeType enum
  const validCreativeTypes = [
    'ThirdPartyTag',
    'Html5',
    'Native',
    'Video',
    'Audio',
    'Display',
  ];
  if (!validCreativeTypes.includes(creativeData.CreativeType)) {
    res.status(400).json({
      Message: `Invalid request: CreativeType must be one of: ${validCreativeTypes.join(', ')}`,
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Return success response with creative ID and name
  res.status(200).json({
    CreativeId: `ttd_creative_${Date.now()}`,
    CreativeName: creativeData.CreativeName,
  });
};

/**
 * PUT /v3/creative/:id
 * Updates an existing creative
 *
 * Request Body:
 * {
 *   "CreativeName": "Updated Name",
 *   "Availability": "Paused"
 * }
 *
 * Response 200:
 * {
 *   "CreativeId": "xyz789",
 *   "CreativeName": "Updated Name",
 *   ...
 * }
 */
export const updateCreative = (req: Request, res: Response): void => {
  const { id } = req.params;
  const updateData = req.body as Partial<TTDCreative>;

  if (!id) {
    res.status(400).json({
      Message: 'Invalid request: Creative ID is required',
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

  // Validate CreativeType if provided
  const validCreativeTypes = [
    'ThirdPartyTag',
    'Html5',
    'Native',
    'Video',
    'Audio',
    'Display',
  ];
  if (updateData.CreativeType && !validCreativeTypes.includes(updateData.CreativeType)) {
    res.status(400).json({
      Message: `Invalid request: CreativeType must be one of: ${validCreativeTypes.join(', ')}`,
      ErrorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Return updated creative response
  const response: TTDCreative = {
    ...sampleCreative,
    CreativeId: id,
    ...(updateData.CreativeName && { CreativeName: updateData.CreativeName }),
    ...(updateData.Availability && { Availability: updateData.Availability }),
    ...(updateData.CreativeType && { CreativeType: updateData.CreativeType }),
    ...(updateData.ThirdPartyTag && { ThirdPartyTag: updateData.ThirdPartyTag }),
    ...(updateData.ClickthroughUrl && { ClickthroughUrl: updateData.ClickthroughUrl }),
    ...(updateData.LandingPageUrl && { LandingPageUrl: updateData.LandingPageUrl }),
  };

  res.status(200).json(response);
};
