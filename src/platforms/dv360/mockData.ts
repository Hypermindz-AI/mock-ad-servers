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
