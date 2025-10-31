import { Options } from 'swagger-jsdoc';

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mock Ad Servers API',
      version: '1.0.0',
      description: 'Mock implementations of major advertising platform APIs including Google Ads, Meta Marketing, LinkedIn, TikTok, The Trade Desk, and DV360.',
      contact: {
        name: 'API Support',
        url: 'https://github.com/Hypermindz-AI/mock-ad-servers',
      },
    },
    servers: [
      {
        url: 'https://mock-ad-servers.vercel.app',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Google Ads',
        description: 'Google Ads API v21 endpoints',
      },
      {
        name: 'Google OAuth',
        description: 'Google OAuth 2.0 endpoints (shared by Google Ads & DV360)',
      },
      {
        name: 'Meta',
        description: 'Meta Marketing API v23.0 endpoints',
      },
      {
        name: 'LinkedIn',
        description: 'LinkedIn Marketing API 202510 endpoints',
      },
      {
        name: 'TikTok',
        description: 'TikTok Marketing API v1.3 endpoints',
      },
      {
        name: 'The Trade Desk',
        description: 'The Trade Desk API v3 endpoints',
      },
      {
        name: 'DV360',
        description: 'Display & Video 360 API v4 endpoints',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Standard Bearer token authentication (used by most platforms)',
        },
        TTDAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'TTD-Auth',
          description: 'The Trade Desk custom authentication header',
        },
        GoogleDeveloperToken: {
          type: 'apiKey',
          in: 'header',
          name: 'developer-token',
          description: 'Google Ads developer token',
        },
        LinkedInVersion: {
          type: 'apiKey',
          in: 'header',
          name: 'Linkedin-Version',
          description: 'LinkedIn API version header (required)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                type: { type: 'string' },
                code: { type: 'number' },
              },
            },
          },
        },
      },
    },
    paths: {
      '/': {
        get: {
          summary: 'API Overview',
          description: 'Get information about available platforms and endpoints',
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      version: { type: 'string' },
                      platforms: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            version: { type: 'string' },
                            baseUrl: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/google/oauth/authorize': {
        get: {
          tags: ['Google OAuth'],
          summary: 'Authorize OAuth request',
          description: 'Initiate OAuth 2.0 authorization flow for Google services',
          parameters: [
            {
              name: 'client_id',
              in: 'query',
              required: true,
              schema: { type: 'string', default: 'mock_google_client_id' },
              description: 'OAuth client ID',
            },
            {
              name: 'redirect_uri',
              in: 'query',
              required: true,
              schema: { type: 'string', default: 'https://example.com/callback' },
              description: 'Redirect URI',
            },
            {
              name: 'response_type',
              in: 'query',
              required: true,
              schema: { type: 'string', default: 'code' },
              description: 'Response type (code)',
            },
            {
              name: 'scope',
              in: 'query',
              required: true,
              schema: { type: 'string', default: 'https://www.googleapis.com/auth/adwords' },
              description: 'OAuth scope',
            },
            {
              name: 'state',
              in: 'query',
              schema: { type: 'string' },
              description: 'Optional state parameter',
            },
          ],
          responses: {
            '200': {
              description: 'Authorization successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: { type: 'string' },
                      state: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/meta/v23.0/act_{adAccountId}/campaigns': {
        post: {
          tags: ['Meta'],
          summary: 'Create campaign',
          description: 'Create a new Meta advertising campaign',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'adAccountId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Ad account ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'objective', 'status'],
                  properties: {
                    name: { type: 'string', example: 'My Test Campaign' },
                    objective: {
                      type: 'string',
                      enum: ['OUTCOME_TRAFFIC', 'OUTCOME_LEADS', 'OUTCOME_SALES'],
                      example: 'OUTCOME_TRAFFIC'
                    },
                    status: {
                      type: 'string',
                      enum: ['ACTIVE', 'PAUSED'],
                      example: 'PAUSED'
                    },
                    daily_budget: { type: 'number', example: 1000 },
                    lifetime_budget: { type: 'number', example: 30000 },
                  },
                },
                example: {
                  name: 'Test Campaign',
                  objective: 'OUTCOME_TRAFFIC',
                  status: 'PAUSED',
                  daily_budget: 1000,
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Campaign created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      status: { type: 'string' },
                      objective: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/ttd/v3/authentication': {
        post: {
          tags: ['The Trade Desk'],
          summary: 'Authenticate',
          description: 'Authenticate with The Trade Desk and receive a token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['Login', 'Password'],
                  properties: {
                    Login: { type: 'string', example: 'mock_ttd_username' },
                    Password: { type: 'string', example: 'mock_ttd_password' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Authentication successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      Token: { type: 'string' },
                      Expiration: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/ttd/v3/campaign': {
        post: {
          tags: ['The Trade Desk'],
          summary: 'Create campaign',
          description: 'Create a new Trade Desk campaign',
          security: [{ TTDAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['CampaignName', 'AdvertiserId', 'Budget', 'StartDate'],
                  properties: {
                    CampaignName: { type: 'string', example: 'Test Campaign' },
                    AdvertiserId: { type: 'string', example: 'test-advertiser' },
                    Budget: {
                      type: 'object',
                      properties: {
                        Amount: { type: 'number', example: 1000 },
                        CurrencyCode: { type: 'string', example: 'USD' },
                      },
                    },
                    StartDate: { type: 'string', format: 'date-time', example: '2025-11-01T00:00:00Z' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Campaign created successfully',
            },
          },
        },
      },
      '/tiktok/v1.3/campaign/create/': {
        post: {
          tags: ['TikTok'],
          summary: 'Create campaign',
          description: 'Create a new TikTok advertising campaign',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['advertiser_id', 'campaign_name', 'objective_type', 'budget_mode'],
                  properties: {
                    advertiser_id: { type: 'string', example: '1234567890' },
                    campaign_name: { type: 'string', example: 'Test Campaign' },
                    objective_type: {
                      type: 'string',
                      enum: ['TRAFFIC', 'CONVERSIONS', 'APP_PROMOTION'],
                      example: 'TRAFFIC'
                    },
                    budget_mode: {
                      type: 'string',
                      enum: ['BUDGET_MODE_DAY', 'BUDGET_MODE_TOTAL', 'BUDGET_MODE_INFINITE'],
                      example: 'BUDGET_MODE_DAY'
                    },
                    budget: { type: 'number', example: 100 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Campaign created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: { type: 'number' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          campaign_id: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/linkedin/rest/adCampaigns': {
        post: {
          tags: ['LinkedIn'],
          summary: 'Create campaign',
          description: 'Create a new LinkedIn advertising campaign',
          security: [{ BearerAuth: [], LinkedInVersion: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['account', 'name', 'type', 'status'],
                  properties: {
                    account: { type: 'string', example: 'urn:li:sponsoredAccount:123456789' },
                    name: { type: 'string', example: 'Test Campaign' },
                    type: {
                      type: 'string',
                      enum: ['TEXT_AD', 'SPONSORED_UPDATES', 'SPONSORED_INMAILS'],
                      example: 'TEXT_AD'
                    },
                    status: {
                      type: 'string',
                      enum: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED'],
                      example: 'ACTIVE'
                    },
                    dailyBudget: {
                      type: 'object',
                      properties: {
                        amount: { type: 'string', example: '100' },
                        currencyCode: { type: 'string', example: 'USD' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Campaign created successfully',
            },
          },
        },
      },
      '/dv360/v4/advertisers/{advertiserId}/campaigns': {
        post: {
          tags: ['DV360'],
          summary: 'Create campaign',
          description: 'Create a new DV360 campaign',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'advertiserId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Advertiser ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['displayName'],
                  properties: {
                    displayName: { type: 'string', example: 'Test Campaign' },
                    entityStatus: {
                      type: 'string',
                      enum: ['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED'],
                      example: 'ENTITY_STATUS_ACTIVE'
                    },
                    campaignGoal: {
                      type: 'object',
                      properties: {
                        campaignGoalType: {
                          type: 'string',
                          enum: ['CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS', 'CAMPAIGN_GOAL_TYPE_APP_INSTALL'],
                          example: 'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS'
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Campaign created successfully',
            },
          },
        },
      },
      '/googleads/v21/customers/{customerId}/campaigns:mutate': {
        post: {
          tags: ['Google Ads'],
          summary: 'Create or update campaign',
          description: 'Create or update a Google Ads campaign',
          security: [{ BearerAuth: [], GoogleDeveloperToken: [] }],
          parameters: [
            {
              name: 'customerId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '1234567890' },
              description: 'Customer ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['operations'],
                  properties: {
                    operations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          create: {
                            type: 'object',
                            properties: {
                              name: { type: 'string', example: 'Test Campaign' },
                              advertisingChannelType: {
                                type: 'string',
                                enum: ['SEARCH', 'DISPLAY', 'VIDEO'],
                                example: 'SEARCH'
                              },
                              status: {
                                type: 'string',
                                enum: ['ENABLED', 'PAUSED', 'REMOVED'],
                                example: 'PAUSED'
                              },
                              campaignBudget: { type: 'string', example: 'customers/1234567890/campaignBudgets/999999' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  operations: [
                    {
                      create: {
                        name: 'Test Campaign',
                        advertisingChannelType: 'SEARCH',
                        status: 'PAUSED',
                        campaignBudget: 'customers/1234567890/campaignBudgets/999999',
                      },
                    },
                  ],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Campaign mutated successfully',
            },
          },
        },
      },
    },
  },
  apis: [], // We're defining paths inline in the definition
};
