/**
 * Mock data for Google Ads API v21
 * Contains success responses, error responses, and sample campaign objects
 */

export interface GoogleAdsCampaign {
  resourceName: string;
  name: string;
  status: string;
  advertisingChannelType: string;
  budget: string;
  targetSpend?: {
    targetSpendMicros: string;
  };
  id?: string;
}

export interface GoogleAdsOperationResult {
  resourceName: string;
  campaign?: GoogleAdsCampaign;
}

export interface GoogleAdsSuccessResponse {
  results: GoogleAdsOperationResult[];
}

export interface GoogleAdsErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
    details?: Array<{
      '@type': string;
      errors?: Array<{
        errorCode: {
          [key: string]: string;
        };
        message: string;
        location?: {
          fieldPathElements: Array<{
            fieldName: string;
            index?: number;
          }>;
        };
      }>;
    }>;
  };
}

// Sample campaign object
export const sampleCampaign: GoogleAdsCampaign = {
  resourceName: 'customers/1234567890/campaigns/9876543210',
  name: 'Sample Search Campaign',
  status: 'ENABLED',
  advertisingChannelType: 'SEARCH',
  budget: 'customers/1234567890/campaignBudgets/1111111111',
  targetSpend: {
    targetSpendMicros: '10000000', // $10 in micros
  },
  id: '9876543210',
};

// Success response for campaign creation
export const successCampaignResponse: GoogleAdsSuccessResponse = {
  results: [
    {
      resourceName: 'customers/1234567890/campaigns/9876543210',
      campaign: sampleCampaign,
    },
  ],
};

// Success response for campaign update
export const successUpdateResponse: GoogleAdsSuccessResponse = {
  results: [
    {
      resourceName: 'customers/1234567890/campaigns/9876543210',
    },
  ],
};

// Validation error response - Invalid budget
export const validationErrorResponse: GoogleAdsErrorResponse = {
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
            message: 'The budget amount is invalid or missing.',
            location: {
              fieldPathElements: [
                {
                  fieldName: 'operations',
                  index: 0,
                },
                {
                  fieldName: 'create',
                },
                {
                  fieldName: 'budget',
                },
              ],
            },
          },
        ],
      },
    ],
  },
};

// Validation error response - Missing required field
export const missingFieldErrorResponse: GoogleAdsErrorResponse = {
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
            message: 'Required field was not set.',
            location: {
              fieldPathElements: [
                {
                  fieldName: 'operations',
                  index: 0,
                },
                {
                  fieldName: 'create',
                },
                {
                  fieldName: 'name',
                },
              ],
            },
          },
        ],
      },
    ],
  },
};

// Authentication error response - Missing or invalid token
export const authErrorResponse: GoogleAdsErrorResponse = {
  error: {
    code: 401,
    message: 'Request is missing required authentication credential. Expected OAuth 2 access token, login cookie or other valid authentication credential.',
    status: 'UNAUTHENTICATED',
  },
};

// Authentication error response - Invalid developer token
export const devTokenErrorResponse: GoogleAdsErrorResponse = {
  error: {
    code: 401,
    message: 'Developer token is invalid or missing.',
    status: 'UNAUTHENTICATED',
    details: [
      {
        '@type': 'type.googleapis.com/google.ads.googleads.v21.errors.GoogleAdsFailure',
        errors: [
          {
            errorCode: {
              authenticationError: 'DEVELOPER_TOKEN_NOT_APPROVED',
            },
            message: 'The developer token is not approved.',
          },
        ],
      },
    ],
  },
};

// Permission error response - Insufficient permissions
export const permissionErrorResponse: GoogleAdsErrorResponse = {
  error: {
    code: 403,
    message: 'The caller does not have permission to access the customer.',
    status: 'PERMISSION_DENIED',
    details: [
      {
        '@type': 'type.googleapis.com/google.ads.googleads.v21.errors.GoogleAdsFailure',
        errors: [
          {
            errorCode: {
              authorizationError: 'USER_PERMISSION_DENIED',
            },
            message: 'User does not have permission to access the customer account.',
          },
        ],
      },
    ],
  },
};

// Rate limit error response
export const rateLimitErrorResponse: GoogleAdsErrorResponse = {
  error: {
    code: 429,
    message: 'Quota exceeded for quota metric.',
    status: 'RESOURCE_EXHAUSTED',
    details: [
      {
        '@type': 'type.googleapis.com/google.ads.googleads.v21.errors.GoogleAdsFailure',
        errors: [
          {
            errorCode: {
              quotaError: 'RESOURCE_EXHAUSTED',
            },
            message: 'The API rate limit has been exceeded.',
          },
        ],
      },
    ],
  },
};

// Campaign not found error
export const notFoundErrorResponse: GoogleAdsErrorResponse = {
  error: {
    code: 404,
    message: 'The requested resource was not found.',
    status: 'NOT_FOUND',
    details: [
      {
        '@type': 'type.googleapis.com/google.ads.googleads.v21.errors.GoogleAdsFailure',
        errors: [
          {
            errorCode: {
              campaignError: 'CAMPAIGN_NOT_FOUND',
            },
            message: 'Campaign with the specified ID does not exist.',
          },
        ],
      },
    ],
  },
};

// Invalid status error
export const invalidStatusErrorResponse: GoogleAdsErrorResponse = {
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
              campaignError: 'INVALID_STATUS',
            },
            message: 'The campaign status is invalid.',
            location: {
              fieldPathElements: [
                {
                  fieldName: 'operations',
                  index: 0,
                },
                {
                  fieldName: 'update',
                },
                {
                  fieldName: 'status',
                },
              ],
            },
          },
        ],
      },
    ],
  },
};
