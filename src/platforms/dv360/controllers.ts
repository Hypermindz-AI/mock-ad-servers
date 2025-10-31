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
  sampleInsertionOrder,
  sampleLineItem,
  sampleCampaignMetrics,
  DV360Campaign,
  DV360InsertionOrder,
  DV360LineItem,
  CampaignMetrics,
  CampaignListResponse,
  InsertionOrderListResponse,
  LineItemListResponse,
  CampaignQueryResponse,
} from './mockData';

// In-memory storage for campaigns, insertion orders, and line items (for demo purposes)
const campaignStore: Map<string, DV360Campaign> = new Map();
const insertionOrderStore: Map<string, DV360InsertionOrder> = new Map();
const lineItemStore: Map<string, DV360LineItem> = new Map();

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

// ============================================
// Campaign List & Query
// ============================================

/**
 * List campaigns with pagination and filtering
 * GET /v4/advertisers/:advertiserId/campaigns
 */
export const listCampaigns = (req: Request, res: Response): void => {
  try {
    const { advertiserId } = req.params;
    const { pageSize = '10', pageToken, filter } = req.query;

    // Convert all campaigns to array
    const allCampaigns = Array.from(campaignStore.values());

    // If no campaigns in store, return sample campaigns
    if (allCampaigns.length === 0) {
      const samples: DV360Campaign[] = [
        { ...sampleCampaign },
        {
          ...sampleCampaign,
          name: `advertisers/${advertiserId}/campaigns/222333444`,
          campaignId: '222333444',
          displayName: 'Sample Performance Campaign',
          entityStatus: 'ENTITY_STATUS_PAUSED',
        },
      ];

      const response: CampaignListResponse = {
        campaigns: samples,
      };

      res.status(200).json(response);
      return;
    }

    // Apply filtering if provided
    let filteredCampaigns = allCampaigns.filter(c => c.name.includes(`advertisers/${advertiserId}/`));

    // Apply simple filter (example: filter=entityStatus="ENTITY_STATUS_ACTIVE")
    if (filter && typeof filter === 'string') {
      if (filter.includes('ENTITY_STATUS_ACTIVE')) {
        filteredCampaigns = filteredCampaigns.filter(c => c.entityStatus === 'ENTITY_STATUS_ACTIVE');
      } else if (filter.includes('ENTITY_STATUS_PAUSED')) {
        filteredCampaigns = filteredCampaigns.filter(c => c.entityStatus === 'ENTITY_STATUS_PAUSED');
      }
    }

    // Apply ordering (orderBy not used in mock implementation)
    // Default sort by displayName
    filteredCampaigns.sort((a, b) => a.displayName.localeCompare(b.displayName));

    // Pagination
    const size = parseInt(pageSize as string, 10);
    const startIndex = pageToken ? parseInt(pageToken as string, 10) : 0;
    const endIndex = startIndex + size;
    const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

    const response: CampaignListResponse = {
      campaigns: paginatedCampaigns,
    };

    // Add nextPageToken if there are more results
    if (endIndex < filteredCampaigns.length) {
      response.nextPageToken = endIndex.toString();
    }

    res.status(200).json(response);
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
 * Query campaign metrics
 * POST /v4/advertisers/:advertiserId/campaigns:query
 */
export const queryCampaigns = (req: Request, res: Response): void => {
  try {
    const { advertiserId } = req.params;
    const { metrics = [], dateRanges = [] } = req.body;

    // Validate metrics array
    const validMetrics = ['METRIC_IMPRESSIONS', 'METRIC_CLICKS', 'METRIC_TOTAL_COST', 'METRIC_CTR', 'METRIC_AVERAGE_CPM'];
    const hasInvalidMetric = metrics.some((m: string) => !validMetrics.includes(m));

    if (hasInvalidMetric) {
      res.status(400).json({
        error: {
          code: 400,
          message: 'Invalid metric requested',
          status: 'INVALID_ARGUMENT',
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.BadRequest',
              fieldViolations: [
                {
                  field: 'metrics',
                  description: 'Metric must be one of: METRIC_IMPRESSIONS, METRIC_CLICKS, METRIC_TOTAL_COST, METRIC_CTR, METRIC_AVERAGE_CPM',
                },
              ],
            },
          ],
        },
      });
      return;
    }

    // Get all campaigns for this advertiser
    const allCampaigns = Array.from(campaignStore.values()).filter(c =>
      c.name.includes(`advertisers/${advertiserId}/`)
    );

    // Generate campaign metrics for each campaign
    const campaignMetrics: CampaignMetrics[] = allCampaigns.length > 0
      ? allCampaigns.map(campaign => ({
          campaignId: campaign.campaignId,
          metrics: {
            impressions: '1500000',
            clicks: '25000',
            totalCostMicros: '75000000000',
            ctr: 1.67,
            averageCpmMicros: '50000000',
          },
          dateRange: dateRanges[0] || {
            startDate: { year: 2025, month: 11, day: 1 },
            endDate: { year: 2025, month: 11, day: 30 },
          },
        }))
      : [{ ...sampleCampaignMetrics }];

    const response: CampaignQueryResponse = {
      campaignMetrics,
    };

    res.status(200).json(response);
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

// ============================================
// Insertion Order Operations
// ============================================

/**
 * List insertion orders
 * GET /v4/advertisers/:advertiserId/insertionOrders
 */
export const listInsertionOrders = (req: Request, res: Response): void => {
  try {
    const { advertiserId } = req.params;
    const { pageSize = '10', pageToken, filter } = req.query; // orderBy not used in mock

    const allOrders = Array.from(insertionOrderStore.values());

    // If no orders in store, return sample
    if (allOrders.length === 0) {
      const sample: DV360InsertionOrder = {
        ...sampleInsertionOrder,
        name: `advertisers/${advertiserId}/insertionOrders/${sampleInsertionOrder.insertionOrderId}`,
      };

      const response: InsertionOrderListResponse = {
        insertionOrders: [sample],
      };

      res.status(200).json(response);
      return;
    }

    // Filter by advertiser
    let filteredOrders = allOrders.filter(o => o.name.includes(`advertisers/${advertiserId}/`));

    // Apply filtering
    if (filter && typeof filter === 'string') {
      if (filter.includes('campaignId')) {
        const campaignIdMatch = filter.match(/campaignId="([^"]+)"/);
        if (campaignIdMatch) {
          filteredOrders = filteredOrders.filter(o => o.campaignId === campaignIdMatch[1]);
        }
      }
    }

    // Pagination
    const size = parseInt(pageSize as string, 10);
    const startIndex = pageToken ? parseInt(pageToken as string, 10) : 0;
    const endIndex = startIndex + size;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    const response: InsertionOrderListResponse = {
      insertionOrders: paginatedOrders,
    };

    if (endIndex < filteredOrders.length) {
      response.nextPageToken = endIndex.toString();
    }

    res.status(200).json(response);
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
 * Create insertion order
 * POST /v4/advertisers/:advertiserId/insertionOrders
 */
export const createInsertionOrder = (req: Request, res: Response): void => {
  try {
    const { advertiserId } = req.params;
    const { displayName, campaignId, insertionOrderType, pacing, budget, frequencyCap, entityStatus } = req.body;

    // Validate required fields
    if (!displayName || displayName.trim() === '') {
      res.status(400).json({
        error: {
          code: 400,
          message: 'Invalid insertion order data provided',
          status: 'INVALID_ARGUMENT',
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.BadRequest',
              fieldViolations: [
                {
                  field: 'displayName',
                  description: 'Display name is required and cannot be empty',
                },
              ],
            },
          ],
        },
      });
      return;
    }

    if (!campaignId) {
      res.status(400).json({
        error: {
          code: 400,
          message: 'Invalid insertion order data provided',
          status: 'INVALID_ARGUMENT',
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.BadRequest',
              fieldViolations: [
                {
                  field: 'campaignId',
                  description: 'Campaign ID is required',
                },
              ],
            },
          ],
        },
      });
      return;
    }

    // Validate entity status if provided
    const validStatuses = ['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED', 'ENTITY_STATUS_ARCHIVED', 'ENTITY_STATUS_DRAFT'];
    if (entityStatus && !validStatuses.includes(entityStatus)) {
      res.status(400).json(invalidEntityStatusError);
      return;
    }

    // Generate insertion order ID
    const insertionOrderId = Math.floor(Math.random() * 1000000000).toString();
    const resourceName = `advertisers/${advertiserId}/insertionOrders/${insertionOrderId}`;

    // Create insertion order object
    const newOrder: DV360InsertionOrder = {
      name: resourceName,
      insertionOrderId,
      displayName,
      campaignId,
      entityStatus: entityStatus || 'ENTITY_STATUS_DRAFT',
      insertionOrderType: insertionOrderType || 'RTB',
      pacing,
      budget,
      frequencyCap,
    };

    // Store insertion order
    insertionOrderStore.set(insertionOrderId, newOrder);

    res.status(200).json(newOrder);
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
 * Get insertion order by ID
 * GET /v4/advertisers/:advertiserId/insertionOrders/:insertionOrderId
 */
export const getInsertionOrder = (req: Request, res: Response): void => {
  try {
    const { advertiserId, insertionOrderId } = req.params;

    let order = insertionOrderStore.get(insertionOrderId);

    if (!order) {
      // Return sample for testing
      order = { ...sampleInsertionOrder };
      order.insertionOrderId = insertionOrderId;
      order.name = `advertisers/${advertiserId}/insertionOrders/${insertionOrderId}`;
    }

    res.status(200).json(order);
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
 * Update insertion order
 * PATCH /v4/advertisers/:advertiserId/insertionOrders/:insertionOrderId
 */
export const updateInsertionOrder = (req: Request, res: Response): void => {
  try {
    const { advertiserId, insertionOrderId } = req.params;
    const { updateMask } = req.query;
    const updates = req.body;

    // Check if insertion order exists
    let order = insertionOrderStore.get(insertionOrderId);
    if (!order) {
      order = { ...sampleInsertionOrder };
      order.insertionOrderId = insertionOrderId;
      order.name = `advertisers/${advertiserId}/insertionOrders/${insertionOrderId}`;
    }

    // Validate entity status if provided
    const validStatuses = ['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED', 'ENTITY_STATUS_ARCHIVED', 'ENTITY_STATUS_DRAFT'];
    if (updates.entityStatus && !validStatuses.includes(updates.entityStatus)) {
      res.status(400).json(invalidEntityStatusError);
      return;
    }

    // Apply updateMask if provided
    if (updateMask && typeof updateMask === 'string') {
      const fieldsToUpdate = updateMask.split(',').map(f => f.trim());
      const filteredUpdates: any = {};

      fieldsToUpdate.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      const updatedOrder: DV360InsertionOrder = {
        ...order,
        ...filteredUpdates,
        name: order.name,
        insertionOrderId: order.insertionOrderId,
      };

      insertionOrderStore.set(insertionOrderId, updatedOrder);
      res.status(200).json(updatedOrder);
    } else {
      // Update all provided fields
      const updatedOrder: DV360InsertionOrder = {
        ...order,
        ...updates,
        name: order.name,
        insertionOrderId: order.insertionOrderId,
      };

      insertionOrderStore.set(insertionOrderId, updatedOrder);
      res.status(200).json(updatedOrder);
    }
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

// ============================================
// Line Item Operations
// ============================================

/**
 * List line items
 * GET /v4/advertisers/:advertiserId/lineItems
 */
export const listLineItems = (req: Request, res: Response): void => {
  try {
    const { advertiserId } = req.params;
    const { pageSize = '10', pageToken, filter } = req.query; // orderBy not used in mock

    const allLineItems = Array.from(lineItemStore.values());

    // If no line items in store, return sample
    if (allLineItems.length === 0) {
      const sample: DV360LineItem = {
        ...sampleLineItem,
        name: `advertisers/${advertiserId}/lineItems/${sampleLineItem.lineItemId}`,
      };

      const response: LineItemListResponse = {
        lineItems: [sample],
      };

      res.status(200).json(response);
      return;
    }

    // Filter by advertiser
    let filteredItems = allLineItems.filter(li => li.name.includes(`advertisers/${advertiserId}/`));

    // Apply filtering
    if (filter && typeof filter === 'string') {
      if (filter.includes('insertionOrderId')) {
        const ioIdMatch = filter.match(/insertionOrderId="([^"]+)"/);
        if (ioIdMatch) {
          filteredItems = filteredItems.filter(li => li.insertionOrderId === ioIdMatch[1]);
        }
      }
    }

    // Pagination
    const size = parseInt(pageSize as string, 10);
    const startIndex = pageToken ? parseInt(pageToken as string, 10) : 0;
    const endIndex = startIndex + size;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    const response: LineItemListResponse = {
      lineItems: paginatedItems,
    };

    if (endIndex < filteredItems.length) {
      response.nextPageToken = endIndex.toString();
    }

    res.status(200).json(response);
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
 * Create line item
 * POST /v4/advertisers/:advertiserId/lineItems
 */
export const createLineItem = (req: Request, res: Response): void => {
  try {
    const { advertiserId } = req.params;
    const { displayName, insertionOrderId, lineItemType, flight, budget, pacing, bidStrategy, entityStatus } = req.body;

    // Validate required fields
    if (!displayName || displayName.trim() === '') {
      res.status(400).json({
        error: {
          code: 400,
          message: 'Invalid line item data provided',
          status: 'INVALID_ARGUMENT',
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.BadRequest',
              fieldViolations: [
                {
                  field: 'displayName',
                  description: 'Display name is required and cannot be empty',
                },
              ],
            },
          ],
        },
      });
      return;
    }

    if (!insertionOrderId) {
      res.status(400).json({
        error: {
          code: 400,
          message: 'Invalid line item data provided',
          status: 'INVALID_ARGUMENT',
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.BadRequest',
              fieldViolations: [
                {
                  field: 'insertionOrderId',
                  description: 'Insertion order ID is required',
                },
              ],
            },
          ],
        },
      });
      return;
    }

    // Validate entity status if provided
    const validStatuses = ['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED', 'ENTITY_STATUS_ARCHIVED', 'ENTITY_STATUS_DRAFT'];
    if (entityStatus && !validStatuses.includes(entityStatus)) {
      res.status(400).json(invalidEntityStatusError);
      return;
    }

    // Generate line item ID
    const lineItemId = Math.floor(Math.random() * 1000000000).toString();
    const resourceName = `advertisers/${advertiserId}/lineItems/${lineItemId}`;

    // Create line item object
    const newLineItem: DV360LineItem = {
      name: resourceName,
      lineItemId,
      displayName,
      insertionOrderId,
      entityStatus: entityStatus || 'ENTITY_STATUS_DRAFT',
      lineItemType: lineItemType || 'LINE_ITEM_TYPE_DISPLAY_DEFAULT',
      flight,
      budget,
      pacing,
      bidStrategy,
    };

    // Store line item
    lineItemStore.set(lineItemId, newLineItem);

    res.status(200).json(newLineItem);
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
 * Get line item by ID
 * GET /v4/advertisers/:advertiserId/lineItems/:lineItemId
 */
export const getLineItem = (req: Request, res: Response): void => {
  try {
    const { advertiserId, lineItemId } = req.params;

    let lineItem = lineItemStore.get(lineItemId);

    if (!lineItem) {
      // Return sample for testing
      lineItem = { ...sampleLineItem };
      lineItem.lineItemId = lineItemId;
      lineItem.name = `advertisers/${advertiserId}/lineItems/${lineItemId}`;
    }

    res.status(200).json(lineItem);
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
 * Update line item
 * PATCH /v4/advertisers/:advertiserId/lineItems/:lineItemId
 */
export const updateLineItem = (req: Request, res: Response): void => {
  try {
    const { advertiserId, lineItemId } = req.params;
    const { updateMask } = req.query;
    const updates = req.body;

    // Check if line item exists
    let lineItem = lineItemStore.get(lineItemId);
    if (!lineItem) {
      lineItem = { ...sampleLineItem };
      lineItem.lineItemId = lineItemId;
      lineItem.name = `advertisers/${advertiserId}/lineItems/${lineItemId}`;
    }

    // Validate entity status if provided
    const validStatuses = ['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED', 'ENTITY_STATUS_ARCHIVED', 'ENTITY_STATUS_DRAFT'];
    if (updates.entityStatus && !validStatuses.includes(updates.entityStatus)) {
      res.status(400).json(invalidEntityStatusError);
      return;
    }

    // Apply updateMask if provided
    if (updateMask && typeof updateMask === 'string') {
      const fieldsToUpdate = updateMask.split(',').map(f => f.trim());
      const filteredUpdates: any = {};

      fieldsToUpdate.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      const updatedLineItem: DV360LineItem = {
        ...lineItem,
        ...filteredUpdates,
        name: lineItem.name,
        lineItemId: lineItem.lineItemId,
      };

      lineItemStore.set(lineItemId, updatedLineItem);
      res.status(200).json(updatedLineItem);
    } else {
      // Update all provided fields
      const updatedLineItem: DV360LineItem = {
        ...lineItem,
        ...updates,
        name: lineItem.name,
        lineItemId: lineItem.lineItemId,
      };

      lineItemStore.set(lineItemId, updatedLineItem);
      res.status(200).json(updatedLineItem);
    }
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
