/**
 * DV360 API v4 Mock Data
 * Mock responses for Display & Video 360 API endpoints
 */

export interface DV360Campaign {
  name: string;
  campaignId: string;
  displayName: string;
  entityStatus: string;
  campaignGoal?: {
    campaignGoalType: string;
    performanceGoal?: {
      performanceGoalType: string;
      performanceGoalAmountMicros?: string;
    };
  };
  campaignFlight?: {
    plannedSpendAmountMicros?: string;
    plannedDates?: {
      startDate: {
        year: number;
        month: number;
        day: number;
      };
      endDate?: {
        year: number;
        month: number;
        day: number;
      };
    };
  };
  frequencyCap?: {
    maxImpressions?: number;
    timeUnit?: string;
    timeUnitCount?: number;
  };
}

export interface DV360ErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
    details?: Array<{
      '@type': string;
      fieldViolations?: Array<{
        field: string;
        description: string;
      }>;
    }>;
  };
}

// Success response for campaign creation
export const successCampaignResponse: DV360Campaign = {
  name: 'advertisers/123456789/campaigns/987654321',
  campaignId: '987654321',
  displayName: 'Test DV360 Campaign',
  entityStatus: 'ENTITY_STATUS_ACTIVE',
  campaignGoal: {
    campaignGoalType: 'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS',
    performanceGoal: {
      performanceGoalType: 'PERFORMANCE_GOAL_TYPE_CPM',
      performanceGoalAmountMicros: '5000000',
    },
  },
  campaignFlight: {
    plannedSpendAmountMicros: '100000000000',
    plannedDates: {
      startDate: {
        year: 2025,
        month: 11,
        day: 1,
      },
      endDate: {
        year: 2025,
        month: 12,
        day: 31,
      },
    },
  },
  frequencyCap: {
    maxImpressions: 5,
    timeUnit: 'TIME_UNIT_DAYS',
    timeUnitCount: 1,
  },
};

// Updated campaign response
export const updatedCampaignResponse: DV360Campaign = {
  name: 'advertisers/123456789/campaigns/987654321',
  campaignId: '987654321',
  displayName: 'Updated DV360 Campaign',
  entityStatus: 'ENTITY_STATUS_PAUSED',
  campaignGoal: {
    campaignGoalType: 'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS',
    performanceGoal: {
      performanceGoalType: 'PERFORMANCE_GOAL_TYPE_CPM',
      performanceGoalAmountMicros: '5000000',
    },
  },
  campaignFlight: {
    plannedSpendAmountMicros: '100000000000',
    plannedDates: {
      startDate: {
        year: 2025,
        month: 11,
        day: 1,
      },
      endDate: {
        year: 2025,
        month: 12,
        day: 31,
      },
    },
  },
};

// Validation error response (Google API format)
export const validationErrorResponse: DV360ErrorResponse = {
  error: {
    code: 400,
    message: 'Invalid campaign data provided',
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
};

// Authentication error response
export const authErrorResponse: DV360ErrorResponse = {
  error: {
    code: 401,
    message: 'Request is missing required authentication credential. Expected OAuth 2 access token, login cookie or other valid authentication credential.',
    status: 'UNAUTHENTICATED',
  },
};

// Permission denied error response
export const permissionDeniedResponse: DV360ErrorResponse = {
  error: {
    code: 403,
    message: 'The caller does not have permission to execute the specified operation.',
    status: 'PERMISSION_DENIED',
  },
};

// Invalid entity status error
export const invalidEntityStatusError: DV360ErrorResponse = {
  error: {
    code: 400,
    message: 'Invalid entity status provided',
    status: 'INVALID_ARGUMENT',
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.BadRequest',
        fieldViolations: [
          {
            field: 'entityStatus',
            description: 'Entity status must be one of: ENTITY_STATUS_ACTIVE, ENTITY_STATUS_PAUSED, ENTITY_STATUS_ARCHIVED',
          },
        ],
      },
    ],
  },
};

// Campaign not found error
export const campaignNotFoundError: DV360ErrorResponse = {
  error: {
    code: 404,
    message: 'Campaign not found',
    status: 'NOT_FOUND',
  },
};

// Invalid campaign goal type error
export const invalidCampaignGoalError: DV360ErrorResponse = {
  error: {
    code: 400,
    message: 'Invalid campaign goal type',
    status: 'INVALID_ARGUMENT',
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.BadRequest',
        fieldViolations: [
          {
            field: 'campaignGoal.campaignGoalType',
            description: 'Campaign goal type must be a valid CAMPAIGN_GOAL_TYPE enum value',
          },
        ],
      },
    ],
  },
};

// Sample campaign for GET requests
export const sampleCampaign: DV360Campaign = {
  name: 'advertisers/123456789/campaigns/111222333',
  campaignId: '111222333',
  displayName: 'Sample Brand Awareness Campaign',
  entityStatus: 'ENTITY_STATUS_ACTIVE',
  campaignGoal: {
    campaignGoalType: 'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS',
    performanceGoal: {
      performanceGoalType: 'PERFORMANCE_GOAL_TYPE_CPC',
      performanceGoalAmountMicros: '2500000',
    },
  },
  campaignFlight: {
    plannedSpendAmountMicros: '50000000000',
    plannedDates: {
      startDate: {
        year: 2025,
        month: 10,
        day: 15,
      },
    },
  },
  frequencyCap: {
    maxImpressions: 3,
    timeUnit: 'TIME_UNIT_DAYS',
    timeUnitCount: 7,
  },
};

// ============================================
// Insertion Order Interfaces and Mock Data
// ============================================

export interface DV360InsertionOrder {
  name: string;
  insertionOrderId: string;
  displayName: string;
  campaignId: string;
  entityStatus: string;
  insertionOrderType: string;
  pacing?: {
    pacingPeriod: string;
    pacingType: string;
    dailyMaxMicros?: string;
  };
  frequencyCap?: {
    maxImpressions?: number;
    timeUnit?: string;
    timeUnitCount?: number;
  };
  budget?: {
    budgetUnit: string;
    budgetSegments?: Array<{
      budgetAmountMicros: string;
      dateRange?: {
        startDate: { year: number; month: number; day: number };
        endDate?: { year: number; month: number; day: number };
      };
    }>;
  };
}

export const sampleInsertionOrder: DV360InsertionOrder = {
  name: 'advertisers/123456789/insertionOrders/555666777',
  insertionOrderId: '555666777',
  displayName: 'Sample Insertion Order',
  campaignId: '111222333',
  entityStatus: 'ENTITY_STATUS_ACTIVE',
  insertionOrderType: 'RTB',
  pacing: {
    pacingPeriod: 'PACING_PERIOD_DAILY',
    pacingType: 'PACING_TYPE_EVEN',
    dailyMaxMicros: '10000000000',
  },
  budget: {
    budgetUnit: 'BUDGET_UNIT_CURRENCY',
    budgetSegments: [
      {
        budgetAmountMicros: '100000000000',
        dateRange: {
          startDate: { year: 2025, month: 11, day: 1 },
          endDate: { year: 2025, month: 12, day: 31 },
        },
      },
    ],
  },
};

// ============================================
// Line Item Interfaces and Mock Data
// ============================================

export interface DV360LineItem {
  name: string;
  lineItemId: string;
  displayName: string;
  insertionOrderId: string;
  entityStatus: string;
  lineItemType: string;
  flight?: {
    flightDateType: string;
    dateRange?: {
      startDate: { year: number; month: number; day: number };
      endDate?: { year: number; month: number; day: number };
    };
  };
  budget?: {
    budgetAllocationType: string;
    maxAmount?: string;
  };
  pacing?: {
    pacingPeriod: string;
    pacingType: string;
    dailyMaxMicros?: string;
  };
  bidStrategy?: {
    fixedBid?: {
      bidAmountMicros: string;
    };
    maximizeSpendAutoBid?: {
      performanceGoalType: string;
      performanceGoalAmountMicros?: string;
    };
  };
}

export const sampleLineItem: DV360LineItem = {
  name: 'advertisers/123456789/lineItems/888999000',
  lineItemId: '888999000',
  displayName: 'Sample Line Item',
  insertionOrderId: '555666777',
  entityStatus: 'ENTITY_STATUS_ACTIVE',
  lineItemType: 'LINE_ITEM_TYPE_DISPLAY_DEFAULT',
  flight: {
    flightDateType: 'LINE_ITEM_FLIGHT_DATE_TYPE_CUSTOM',
    dateRange: {
      startDate: { year: 2025, month: 11, day: 1 },
      endDate: { year: 2025, month: 12, day: 31 },
    },
  },
  budget: {
    budgetAllocationType: 'LINE_ITEM_BUDGET_ALLOCATION_TYPE_FIXED',
    maxAmount: '50000000000',
  },
  pacing: {
    pacingPeriod: 'PACING_PERIOD_DAILY',
    pacingType: 'PACING_TYPE_EVEN',
    dailyMaxMicros: '2000000000',
  },
  bidStrategy: {
    fixedBid: {
      bidAmountMicros: '3000000',
    },
  },
};

// ============================================
// Campaign Metrics Interfaces
// ============================================

export interface CampaignMetrics {
  campaignId: string;
  metrics: {
    impressions?: string;
    clicks?: string;
    totalCostMicros?: string;
    ctr?: number;
    averageCpmMicros?: string;
  };
  dateRange?: {
    startDate: { year: number; month: number; day: number };
    endDate: { year: number; month: number; day: number };
  };
}

export const sampleCampaignMetrics: CampaignMetrics = {
  campaignId: '111222333',
  metrics: {
    impressions: '1500000',
    clicks: '25000',
    totalCostMicros: '75000000000',
    ctr: 1.67,
    averageCpmMicros: '50000000',
  },
  dateRange: {
    startDate: { year: 2025, month: 11, day: 1 },
    endDate: { year: 2025, month: 11, day: 30 },
  },
};

// ============================================
// List Response Interfaces
// ============================================

export interface CampaignListResponse {
  campaigns: DV360Campaign[];
  nextPageToken?: string;
}

export interface InsertionOrderListResponse {
  insertionOrders: DV360InsertionOrder[];
  nextPageToken?: string;
}

export interface LineItemListResponse {
  lineItems: DV360LineItem[];
  nextPageToken?: string;
}

export interface CampaignQueryResponse {
  campaignMetrics: CampaignMetrics[];
}
