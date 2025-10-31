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
        get: {
          tags: ['Meta'],
          summary: 'List campaigns',
          description: 'Get all campaigns for a Meta ad account',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'adAccountId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Ad account ID',
            },
            {
              name: 'fields',
              in: 'query',
              schema: { type: 'string', example: 'id,name,status,objective' },
              description: 'Comma-separated list of fields to return',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'number', default: 25 },
              description: 'Number of results to return',
            },
          ],
          responses: {
            '200': {
              description: 'Campaigns retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            status: { type: 'string' },
                            objective: { type: 'string' },
                          },
                        },
                      },
                      paging: {
                        type: 'object',
                        properties: {
                          cursors: {
                            type: 'object',
                            properties: {
                              before: { type: 'string' },
                              after: { type: 'string' },
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
      '/meta/v23.0/{campaignId}/insights': {
        get: {
          tags: ['Meta'],
          summary: 'Get campaign insights',
          description: 'Get performance insights and metrics for a Meta campaign',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'campaignId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '120210000000000000' },
              description: 'Campaign ID',
            },
            {
              name: 'fields',
              in: 'query',
              schema: { type: 'string', example: 'impressions,clicks,spend,cpc,ctr' },
              description: 'Comma-separated list of metric fields',
            },
            {
              name: 'date_preset',
              in: 'query',
              schema: { type: 'string', enum: ['today', 'yesterday', 'last_7d', 'last_30d'], example: 'last_7d' },
              description: 'Date preset for the reporting period',
            },
          ],
          responses: {
            '200': {
              description: 'Campaign insights retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            impressions: { type: 'string' },
                            clicks: { type: 'string' },
                            spend: { type: 'string' },
                            cpc: { type: 'string' },
                            ctr: { type: 'string' },
                            date_start: { type: 'string' },
                            date_stop: { type: 'string' },
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
      '/meta/v23.0/act_{adAccountId}/adsets': {
        get: {
          tags: ['Meta'],
          summary: 'List ad sets',
          description: 'Get all ad sets for a Meta ad account',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'adAccountId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Ad account ID',
            },
            {
              name: 'fields',
              in: 'query',
              schema: { type: 'string', example: 'id,name,status,campaign_id' },
              description: 'Comma-separated list of fields to return',
            },
          ],
          responses: {
            '200': {
              description: 'Ad sets retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            status: { type: 'string' },
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
        post: {
          tags: ['Meta'],
          summary: 'Create ad set',
          description: 'Create a new Meta ad set',
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
                  required: ['name', 'campaign_id', 'status', 'billing_event', 'optimization_goal'],
                  properties: {
                    name: { type: 'string', example: 'Test Ad Set' },
                    campaign_id: { type: 'string', example: '120210000000000000' },
                    status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], example: 'PAUSED' },
                    billing_event: { type: 'string', enum: ['IMPRESSIONS', 'CLICKS', 'LINK_CLICKS'], example: 'IMPRESSIONS' },
                    optimization_goal: { type: 'string', enum: ['REACH', 'IMPRESSIONS', 'LINK_CLICKS'], example: 'LINK_CLICKS' },
                    daily_budget: { type: 'number', example: 1000 },
                    targeting: {
                      type: 'object',
                      properties: {
                        geo_locations: {
                          type: 'object',
                          properties: {
                            countries: { type: 'array', items: { type: 'string' }, example: ['US'] },
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  name: 'Test Ad Set',
                  campaign_id: '120210000000000000',
                  status: 'PAUSED',
                  billing_event: 'IMPRESSIONS',
                  optimization_goal: 'LINK_CLICKS',
                  daily_budget: 1000,
                  targeting: {
                    geo_locations: {
                      countries: ['US'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ad set created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/meta/v23.0/{adSetId}': {
        get: {
          tags: ['Meta'],
          summary: 'Get ad set',
          description: 'Get details of a specific Meta ad set',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'adSetId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '120210000000000001' },
              description: 'Ad set ID',
            },
            {
              name: 'fields',
              in: 'query',
              schema: { type: 'string', example: 'id,name,status,campaign_id,targeting' },
              description: 'Comma-separated list of fields to return',
            },
          ],
          responses: {
            '200': {
              description: 'Ad set retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      status: { type: 'string' },
                      campaign_id: { type: 'string' },
                      targeting: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Meta'],
          summary: 'Update ad set',
          description: 'Update an existing Meta ad set',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'adSetId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '120210000000000001' },
              description: 'Ad set ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Updated Ad Set Name' },
                    status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], example: 'ACTIVE' },
                    daily_budget: { type: 'number', example: 2000 },
                  },
                },
                example: {
                  name: 'Updated Ad Set Name',
                  status: 'ACTIVE',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ad set updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/meta/v23.0/act_{adAccountId}/ads': {
        get: {
          tags: ['Meta'],
          summary: 'List ads',
          description: 'Get all ads for a Meta ad account',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'adAccountId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Ad account ID',
            },
            {
              name: 'fields',
              in: 'query',
              schema: { type: 'string', example: 'id,name,status,adset_id' },
              description: 'Comma-separated list of fields to return',
            },
          ],
          responses: {
            '200': {
              description: 'Ads retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            status: { type: 'string' },
                            adset_id: { type: 'string' },
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
        post: {
          tags: ['Meta'],
          summary: 'Create ad',
          description: 'Create a new Meta ad',
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
                  required: ['name', 'adset_id', 'status', 'creative'],
                  properties: {
                    name: { type: 'string', example: 'Test Ad' },
                    adset_id: { type: 'string', example: '120210000000000001' },
                    status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], example: 'PAUSED' },
                    creative: {
                      type: 'object',
                      properties: {
                        creative_id: { type: 'string', example: '120210000000000002' },
                      },
                    },
                  },
                },
                example: {
                  name: 'Test Ad',
                  adset_id: '120210000000000001',
                  status: 'PAUSED',
                  creative: {
                    creative_id: '120210000000000002',
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ad created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/meta/v23.0/{adId}': {
        get: {
          tags: ['Meta'],
          summary: 'Get ad',
          description: 'Get details of a specific Meta ad',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'adId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '120210000000000003' },
              description: 'Ad ID',
            },
            {
              name: 'fields',
              in: 'query',
              schema: { type: 'string', example: 'id,name,status,adset_id,creative' },
              description: 'Comma-separated list of fields to return',
            },
          ],
          responses: {
            '200': {
              description: 'Ad retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      status: { type: 'string' },
                      adset_id: { type: 'string' },
                      creative: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Meta'],
          summary: 'Update ad',
          description: 'Update an existing Meta ad',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'adId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '120210000000000003' },
              description: 'Ad ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Updated Ad Name' },
                    status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], example: 'ACTIVE' },
                  },
                },
                example: {
                  name: 'Updated Ad Name',
                  status: 'ACTIVE',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ad updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
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
      '/ttd/v3/campaign/query/facets': {
        post: {
          tags: ['The Trade Desk'],
          summary: 'Query campaigns',
          description: 'Query campaigns with faceted search',
          security: [{ TTDAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['AdvertiserId'],
                  properties: {
                    AdvertiserId: { type: 'string', example: 'test-advertiser' },
                    SearchTerms: { type: 'string', example: 'Test' },
                    PageStartIndex: { type: 'number', example: 0 },
                    PageSize: { type: 'number', example: 100 },
                  },
                },
                example: {
                  AdvertiserId: 'test-advertiser',
                  PageStartIndex: 0,
                  PageSize: 100,
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Campaigns retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      Result: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            CampaignId: { type: 'string' },
                            CampaignName: { type: 'string' },
                            AdvertiserId: { type: 'string' },
                            Availability: { type: 'string' },
                          },
                        },
                      },
                      ResultCount: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/ttd/v3/myreports/reportexecution/query/campaign': {
        get: {
          tags: ['The Trade Desk'],
          summary: 'Get campaign reporting',
          description: 'Get campaign performance reports',
          security: [{ TTDAuth: [] }],
          parameters: [
            {
              name: 'AdvertiserId',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'test-advertiser' },
              description: 'Advertiser ID',
            },
            {
              name: 'StartDate',
              in: 'query',
              required: true,
              schema: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00Z' },
              description: 'Start date',
            },
            {
              name: 'EndDate',
              in: 'query',
              required: true,
              schema: { type: 'string', format: 'date-time', example: '2025-01-31T23:59:59Z' },
              description: 'End date',
            },
            {
              name: 'CampaignIds',
              in: 'query',
              schema: { type: 'string', example: 'campaign1,campaign2' },
              description: 'Comma-separated list of campaign IDs',
            },
          ],
          responses: {
            '200': {
              description: 'Report data retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      Result: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            CampaignId: { type: 'string' },
                            CampaignName: { type: 'string' },
                            Impressions: { type: 'number' },
                            Clicks: { type: 'number' },
                            TotalCost: { type: 'number' },
                            CTR: { type: 'number' },
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
      '/ttd/v3/adgroup': {
        post: {
          tags: ['The Trade Desk'],
          summary: 'Create ad group',
          description: 'Create a new Trade Desk ad group',
          security: [{ TTDAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['AdGroupName', 'CampaignId', 'BudgetSettings'],
                  properties: {
                    AdGroupName: { type: 'string', example: 'Test Ad Group' },
                    CampaignId: { type: 'string', example: 'campaign123' },
                    BudgetSettings: {
                      type: 'object',
                      properties: {
                        Budget: { type: 'number', example: 500 },
                        CurrencyCode: { type: 'string', example: 'USD' },
                        DailyTargetInAdvertiserCurrency: { type: 'number', example: 50 },
                      },
                    },
                    RTBAttributes: {
                      type: 'object',
                      properties: {
                        BaseRate: { type: 'number', example: 1.5 },
                        MaxRate: { type: 'number', example: 5.0 },
                      },
                    },
                  },
                },
                example: {
                  AdGroupName: 'Test Ad Group',
                  CampaignId: 'campaign123',
                  BudgetSettings: {
                    Budget: 500,
                    CurrencyCode: 'USD',
                    DailyTargetInAdvertiserCurrency: 50,
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ad group created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      AdGroupId: { type: 'string' },
                      AdGroupName: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/ttd/v3/adgroup/{adGroupId}': {
        get: {
          tags: ['The Trade Desk'],
          summary: 'Get ad group',
          description: 'Get details of a specific Trade Desk ad group',
          security: [{ TTDAuth: [] }],
          parameters: [
            {
              name: 'adGroupId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: 'adgroup123' },
              description: 'Ad group ID',
            },
          ],
          responses: {
            '200': {
              description: 'Ad group retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      AdGroupId: { type: 'string' },
                      AdGroupName: { type: 'string' },
                      CampaignId: { type: 'string' },
                      Availability: { type: 'string' },
                      BudgetSettings: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
        put: {
          tags: ['The Trade Desk'],
          summary: 'Update ad group',
          description: 'Update an existing Trade Desk ad group',
          security: [{ TTDAuth: [] }],
          parameters: [
            {
              name: 'adGroupId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: 'adgroup123' },
              description: 'Ad group ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    AdGroupName: { type: 'string', example: 'Updated Ad Group' },
                    BudgetSettings: {
                      type: 'object',
                      properties: {
                        Budget: { type: 'number', example: 1000 },
                        DailyTargetInAdvertiserCurrency: { type: 'number', example: 100 },
                      },
                    },
                    Availability: { type: 'string', enum: ['Available', 'PausedByUser'], example: 'Available' },
                  },
                },
                example: {
                  AdGroupName: 'Updated Ad Group',
                  Availability: 'Available',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ad group updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      AdGroupId: { type: 'string' },
                      AdGroupName: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/ttd/v3/creative': {
        post: {
          tags: ['The Trade Desk'],
          summary: 'Create creative',
          description: 'Create a new Trade Desk creative',
          security: [{ TTDAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['CreativeName', 'AdvertiserId', 'HostName', 'ThirdPartyTagUnmodified'],
                  properties: {
                    CreativeName: { type: 'string', example: 'Test Creative' },
                    AdvertiserId: { type: 'string', example: 'test-advertiser' },
                    HostName: { type: 'string', example: 'creative-host.com' },
                    ThirdPartyTagUnmodified: { type: 'string', example: '<script>...</script>' },
                    CreativeType: { type: 'string', example: 'ThirdPartyTag' },
                  },
                },
                example: {
                  CreativeName: 'Test Creative',
                  AdvertiserId: 'test-advertiser',
                  HostName: 'creative-host.com',
                  ThirdPartyTagUnmodified: '<script>console.log("creative");</script>',
                  CreativeType: 'ThirdPartyTag',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Creative created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      CreativeId: { type: 'string' },
                      CreativeName: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/ttd/v3/creative/{creativeId}': {
        get: {
          tags: ['The Trade Desk'],
          summary: 'Get creative',
          description: 'Get details of a specific Trade Desk creative',
          security: [{ TTDAuth: [] }],
          parameters: [
            {
              name: 'creativeId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: 'creative123' },
              description: 'Creative ID',
            },
          ],
          responses: {
            '200': {
              description: 'Creative retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      CreativeId: { type: 'string' },
                      CreativeName: { type: 'string' },
                      AdvertiserId: { type: 'string' },
                      CreativeType: { type: 'string' },
                      Availability: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        put: {
          tags: ['The Trade Desk'],
          summary: 'Update creative',
          description: 'Update an existing Trade Desk creative',
          security: [{ TTDAuth: [] }],
          parameters: [
            {
              name: 'creativeId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: 'creative123' },
              description: 'Creative ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    CreativeName: { type: 'string', example: 'Updated Creative' },
                    Availability: { type: 'string', enum: ['Available', 'PausedByUser'], example: 'Available' },
                  },
                },
                example: {
                  CreativeName: 'Updated Creative',
                  Availability: 'Available',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Creative updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      CreativeId: { type: 'string' },
                      CreativeName: { type: 'string' },
                    },
                  },
                },
              },
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
      '/tiktok/v1.3/reports/integrated/get/': {
        post: {
          tags: ['TikTok'],
          summary: 'Get integrated reporting',
          description: 'Get integrated performance reports for TikTok campaigns',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['advertiser_id', 'report_type', 'data_level', 'dimensions', 'metrics', 'start_date', 'end_date'],
                  properties: {
                    advertiser_id: { type: 'string', example: '1234567890' },
                    report_type: { type: 'string', enum: ['BASIC', 'AUDIENCE'], example: 'BASIC' },
                    data_level: { type: 'string', enum: ['AUCTION_CAMPAIGN', 'AUCTION_ADGROUP', 'AUCTION_AD'], example: 'AUCTION_CAMPAIGN' },
                    dimensions: { type: 'array', items: { type: 'string' }, example: ['campaign_id'] },
                    metrics: { type: 'array', items: { type: 'string' }, example: ['impressions', 'clicks', 'spend', 'cpc', 'ctr'] },
                    start_date: { type: 'string', format: 'date', example: '2025-01-01' },
                    end_date: { type: 'string', format: 'date', example: '2025-01-31' },
                    filtering: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field_name: { type: 'string', example: 'campaign_ids' },
                          filter_type: { type: 'string', example: 'IN' },
                          filter_value: { type: 'array', items: { type: 'string' }, example: ['1234567890'] },
                        },
                      },
                    },
                  },
                },
                example: {
                  advertiser_id: '1234567890',
                  report_type: 'BASIC',
                  data_level: 'AUCTION_CAMPAIGN',
                  dimensions: ['campaign_id'],
                  metrics: ['impressions', 'clicks', 'spend', 'cpc', 'ctr'],
                  start_date: '2025-01-01',
                  end_date: '2025-01-31',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Report data retrieved successfully',
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
                          list: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                dimensions: { type: 'object' },
                                metrics: { type: 'object' },
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
        },
      },
      '/tiktok/v1.3/adgroup/get/': {
        get: {
          tags: ['TikTok'],
          summary: 'Get ad groups',
          description: 'Get TikTok ad groups',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'advertiser_id',
              in: 'query',
              required: true,
              schema: { type: 'string', example: '1234567890' },
              description: 'Advertiser ID',
            },
            {
              name: 'campaign_ids',
              in: 'query',
              schema: { type: 'string', example: '["1234567890"]' },
              description: 'JSON array of campaign IDs',
            },
            {
              name: 'adgroup_ids',
              in: 'query',
              schema: { type: 'string', example: '["1234567890"]' },
              description: 'JSON array of ad group IDs',
            },
          ],
          responses: {
            '200': {
              description: 'Ad groups retrieved successfully',
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
                          list: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                adgroup_id: { type: 'string' },
                                adgroup_name: { type: 'string' },
                                campaign_id: { type: 'string' },
                                opt_status: { type: 'string' },
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
        },
      },
      '/tiktok/v1.3/adgroup/create/': {
        post: {
          tags: ['TikTok'],
          summary: 'Create ad group',
          description: 'Create a new TikTok ad group',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['advertiser_id', 'campaign_id', 'adgroup_name', 'placement_type', 'budget', 'schedule_type'],
                  properties: {
                    advertiser_id: { type: 'string', example: '1234567890' },
                    campaign_id: { type: 'string', example: '1234567890' },
                    adgroup_name: { type: 'string', example: 'Test Ad Group' },
                    placement_type: { type: 'string', enum: ['PLACEMENT_TYPE_AUTOMATIC', 'PLACEMENT_TYPE_NORMAL'], example: 'PLACEMENT_TYPE_AUTOMATIC' },
                    budget: { type: 'number', example: 100 },
                    schedule_type: { type: 'string', enum: ['SCHEDULE_START_END', 'SCHEDULE_FROM_NOW'], example: 'SCHEDULE_FROM_NOW' },
                    opt_status: { type: 'string', enum: ['ENABLE', 'DISABLE'], example: 'ENABLE' },
                  },
                },
                example: {
                  advertiser_id: '1234567890',
                  campaign_id: '1234567890',
                  adgroup_name: 'Test Ad Group',
                  placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
                  budget: 100,
                  schedule_type: 'SCHEDULE_FROM_NOW',
                  opt_status: 'ENABLE',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ad group created successfully',
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
                          adgroup_id: { type: 'string' },
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
      '/tiktok/v1.3/adgroup/update/': {
        post: {
          tags: ['TikTok'],
          summary: 'Update ad group',
          description: 'Update an existing TikTok ad group',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['advertiser_id', 'adgroup_id'],
                  properties: {
                    advertiser_id: { type: 'string', example: '1234567890' },
                    adgroup_id: { type: 'string', example: '1234567890' },
                    adgroup_name: { type: 'string', example: 'Updated Ad Group' },
                    budget: { type: 'number', example: 200 },
                    opt_status: { type: 'string', enum: ['ENABLE', 'DISABLE'], example: 'ENABLE' },
                  },
                },
                example: {
                  advertiser_id: '1234567890',
                  adgroup_id: '1234567890',
                  adgroup_name: 'Updated Ad Group',
                  opt_status: 'ENABLE',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ad group updated successfully',
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
                          adgroup_id: { type: 'string' },
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
      '/tiktok/v1.3/ad/get/': {
        get: {
          tags: ['TikTok'],
          summary: 'Get ads',
          description: 'Get TikTok ads',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'advertiser_id',
              in: 'query',
              required: true,
              schema: { type: 'string', example: '1234567890' },
              description: 'Advertiser ID',
            },
            {
              name: 'campaign_ids',
              in: 'query',
              schema: { type: 'string', example: '["1234567890"]' },
              description: 'JSON array of campaign IDs',
            },
            {
              name: 'adgroup_ids',
              in: 'query',
              schema: { type: 'string', example: '["1234567890"]' },
              description: 'JSON array of ad group IDs',
            },
            {
              name: 'ad_ids',
              in: 'query',
              schema: { type: 'string', example: '["1234567890"]' },
              description: 'JSON array of ad IDs',
            },
          ],
          responses: {
            '200': {
              description: 'Ads retrieved successfully',
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
                          list: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                ad_id: { type: 'string' },
                                ad_name: { type: 'string' },
                                adgroup_id: { type: 'string' },
                                campaign_id: { type: 'string' },
                                opt_status: { type: 'string' },
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
        },
      },
      '/tiktok/v1.3/ad/create/': {
        post: {
          tags: ['TikTok'],
          summary: 'Create ad',
          description: 'Create a new TikTok ad',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['advertiser_id', 'adgroup_id', 'ad_name', 'ad_format'],
                  properties: {
                    advertiser_id: { type: 'string', example: '1234567890' },
                    adgroup_id: { type: 'string', example: '1234567890' },
                    ad_name: { type: 'string', example: 'Test Ad' },
                    ad_format: { type: 'string', enum: ['SINGLE_IMAGE', 'SINGLE_VIDEO'], example: 'SINGLE_VIDEO' },
                    ad_text: { type: 'string', example: 'Ad text here' },
                    opt_status: { type: 'string', enum: ['ENABLE', 'DISABLE'], example: 'ENABLE' },
                  },
                },
                example: {
                  advertiser_id: '1234567890',
                  adgroup_id: '1234567890',
                  ad_name: 'Test Ad',
                  ad_format: 'SINGLE_VIDEO',
                  ad_text: 'Ad text here',
                  opt_status: 'ENABLE',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ad created successfully',
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
                          ad_id: { type: 'string' },
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
      '/tiktok/v1.3/ad/update/': {
        post: {
          tags: ['TikTok'],
          summary: 'Update ad',
          description: 'Update an existing TikTok ad',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['advertiser_id', 'ad_id'],
                  properties: {
                    advertiser_id: { type: 'string', example: '1234567890' },
                    ad_id: { type: 'string', example: '1234567890' },
                    ad_name: { type: 'string', example: 'Updated Ad' },
                    ad_text: { type: 'string', example: 'Updated ad text' },
                    opt_status: { type: 'string', enum: ['ENABLE', 'DISABLE'], example: 'ENABLE' },
                  },
                },
                example: {
                  advertiser_id: '1234567890',
                  ad_id: '1234567890',
                  ad_name: 'Updated Ad',
                  opt_status: 'ENABLE',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ad updated successfully',
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
                          ad_id: { type: 'string' },
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
        get: {
          tags: ['LinkedIn'],
          summary: 'Search campaigns',
          description: 'Search and list LinkedIn advertising campaigns',
          security: [{ BearerAuth: [], LinkedInVersion: [] }],
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string', enum: ['search'], default: 'search' },
              description: 'Query type',
            },
            {
              name: 'search.account.values[0]',
              in: 'query',
              schema: { type: 'string', example: 'urn:li:sponsoredAccount:123456789' },
              description: 'Account URN to filter campaigns',
            },
            {
              name: 'search.status.values[0]',
              in: 'query',
              schema: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED'] },
              description: 'Campaign status filter',
            },
            {
              name: 'start',
              in: 'query',
              schema: { type: 'number', default: 0 },
              description: 'Pagination start',
            },
            {
              name: 'count',
              in: 'query',
              schema: { type: 'number', default: 10 },
              description: 'Number of results to return',
            },
          ],
          responses: {
            '200': {
              description: 'Campaigns retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      paging: {
                        type: 'object',
                        properties: {
                          start: { type: 'number' },
                          count: { type: 'number' },
                          total: { type: 'number' },
                        },
                      },
                      elements: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            status: { type: 'string' },
                            account: { type: 'string' },
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
      '/linkedin/rest/adAnalytics': {
        get: {
          tags: ['LinkedIn'],
          summary: 'Get analytics',
          description: 'Get analytics and performance metrics for LinkedIn campaigns',
          security: [{ BearerAuth: [], LinkedInVersion: [] }],
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string', enum: ['analytics'], default: 'analytics' },
              description: 'Query type',
            },
            {
              name: 'pivot',
              in: 'query',
              required: true,
              schema: { type: 'string', enum: ['CAMPAIGN', 'CREATIVE'], example: 'CAMPAIGN' },
              description: 'Pivot dimension',
            },
            {
              name: 'campaigns[0]',
              in: 'query',
              schema: { type: 'string', example: 'urn:li:sponsoredCampaign:123456789' },
              description: 'Campaign URN',
            },
            {
              name: 'dateRange.start.day',
              in: 'query',
              schema: { type: 'number', example: 1 },
              description: 'Start date day',
            },
            {
              name: 'dateRange.start.month',
              in: 'query',
              schema: { type: 'number', example: 1 },
              description: 'Start date month',
            },
            {
              name: 'dateRange.start.year',
              in: 'query',
              schema: { type: 'number', example: 2025 },
              description: 'Start date year',
            },
            {
              name: 'dateRange.end.day',
              in: 'query',
              schema: { type: 'number', example: 31 },
              description: 'End date day',
            },
            {
              name: 'dateRange.end.month',
              in: 'query',
              schema: { type: 'number', example: 1 },
              description: 'End date month',
            },
            {
              name: 'dateRange.end.year',
              in: 'query',
              schema: { type: 'number', example: 2025 },
              description: 'End date year',
            },
          ],
          responses: {
            '200': {
              description: 'Analytics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      elements: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            pivotValue: { type: 'string' },
                            impressions: { type: 'number' },
                            clicks: { type: 'number' },
                            costInLocalCurrency: { type: 'number' },
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
      '/linkedin/rest/adCampaignGroups': {
        get: {
          tags: ['LinkedIn'],
          summary: 'Search campaign groups',
          description: 'Search and list LinkedIn campaign groups',
          security: [{ BearerAuth: [], LinkedInVersion: [] }],
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string', enum: ['search'], default: 'search' },
              description: 'Query type',
            },
            {
              name: 'search.account.values[0]',
              in: 'query',
              schema: { type: 'string', example: 'urn:li:sponsoredAccount:123456789' },
              description: 'Account URN to filter campaign groups',
            },
            {
              name: 'start',
              in: 'query',
              schema: { type: 'number', default: 0 },
              description: 'Pagination start',
            },
            {
              name: 'count',
              in: 'query',
              schema: { type: 'number', default: 10 },
              description: 'Number of results to return',
            },
          ],
          responses: {
            '200': {
              description: 'Campaign groups retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      paging: {
                        type: 'object',
                        properties: {
                          start: { type: 'number' },
                          count: { type: 'number' },
                          total: { type: 'number' },
                        },
                      },
                      elements: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            status: { type: 'string' },
                            account: { type: 'string' },
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
        post: {
          tags: ['LinkedIn'],
          summary: 'Create campaign group',
          description: 'Create a new LinkedIn campaign group',
          security: [{ BearerAuth: [], LinkedInVersion: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['account', 'name', 'status'],
                  properties: {
                    account: { type: 'string', example: 'urn:li:sponsoredAccount:123456789' },
                    name: { type: 'string', example: 'Test Campaign Group' },
                    status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'], example: 'ACTIVE' },
                    totalBudget: {
                      type: 'object',
                      properties: {
                        amount: { type: 'string', example: '10000' },
                        currencyCode: { type: 'string', example: 'USD' },
                      },
                    },
                  },
                },
                example: {
                  account: 'urn:li:sponsoredAccount:123456789',
                  name: 'Test Campaign Group',
                  status: 'ACTIVE',
                  totalBudget: {
                    amount: '10000',
                    currencyCode: 'USD',
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Campaign group created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/linkedin/rest/adCampaignGroups/{id}': {
        get: {
          tags: ['LinkedIn'],
          summary: 'Get campaign group',
          description: 'Get details of a specific LinkedIn campaign group',
          security: [{ BearerAuth: [], LinkedInVersion: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Campaign group ID',
            },
          ],
          responses: {
            '200': {
              description: 'Campaign group retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      status: { type: 'string' },
                      account: { type: 'string' },
                      totalBudget: {
                        type: 'object',
                        properties: {
                          amount: { type: 'string' },
                          currencyCode: { type: 'string' },
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
      '/linkedin/rest/adAccounts/{adAccountId}/creatives': {
        get: {
          tags: ['LinkedIn'],
          summary: 'Search creatives',
          description: 'Search and list LinkedIn ad creatives for an account',
          security: [{ BearerAuth: [], LinkedInVersion: [] }],
          parameters: [
            {
              name: 'adAccountId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Ad account ID',
            },
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string', enum: ['search'], default: 'search' },
              description: 'Query type',
            },
            {
              name: 'search.campaign.values[0]',
              in: 'query',
              schema: { type: 'string', example: 'urn:li:sponsoredCampaign:123456789' },
              description: 'Campaign URN to filter creatives',
            },
            {
              name: 'start',
              in: 'query',
              schema: { type: 'number', default: 0 },
              description: 'Pagination start',
            },
            {
              name: 'count',
              in: 'query',
              schema: { type: 'number', default: 10 },
              description: 'Number of results to return',
            },
          ],
          responses: {
            '200': {
              description: 'Creatives retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      paging: {
                        type: 'object',
                        properties: {
                          start: { type: 'number' },
                          count: { type: 'number' },
                          total: { type: 'number' },
                        },
                      },
                      elements: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            campaign: { type: 'string' },
                            status: { type: 'string' },
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
        post: {
          tags: ['LinkedIn'],
          summary: 'Create creative',
          description: 'Create a new LinkedIn ad creative',
          security: [{ BearerAuth: [], LinkedInVersion: [] }],
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
                  required: ['campaign', 'status'],
                  properties: {
                    campaign: { type: 'string', example: 'urn:li:sponsoredCampaign:123456789' },
                    status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'], example: 'ACTIVE' },
                    variables: {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            'com.linkedin.ads.SponsoredUpdateCreativeVariables': {
                              type: 'object',
                              properties: {
                                activity: { type: 'string', example: 'urn:li:activity:123456789' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  campaign: 'urn:li:sponsoredCampaign:123456789',
                  status: 'ACTIVE',
                  variables: {
                    data: {
                      'com.linkedin.ads.SponsoredUpdateCreativeVariables': {
                        activity: 'urn:li:activity:123456789',
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Creative created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/linkedin/rest/creatives/{creativeId}': {
        get: {
          tags: ['LinkedIn'],
          summary: 'Get creative',
          description: 'Get details of a specific LinkedIn ad creative',
          security: [{ BearerAuth: [], LinkedInVersion: [] }],
          parameters: [
            {
              name: 'creativeId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Creative ID',
            },
          ],
          responses: {
            '200': {
              description: 'Creative retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      campaign: { type: 'string' },
                      status: { type: 'string' },
                      variables: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/dv360/v4/advertisers/{advertiserId}/campaigns': {
        get: {
          tags: ['DV360'],
          summary: 'List campaigns',
          description: 'List all campaigns for a DV360 advertiser',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'advertiserId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Advertiser ID',
            },
            {
              name: 'pageSize',
              in: 'query',
              schema: { type: 'number', default: 100 },
              description: 'Number of results per page',
            },
            {
              name: 'pageToken',
              in: 'query',
              schema: { type: 'string' },
              description: 'Page token for pagination',
            },
          ],
          responses: {
            '200': {
              description: 'Campaigns retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      campaigns: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            campaignId: { type: 'string' },
                            displayName: { type: 'string' },
                            entityStatus: { type: 'string' },
                          },
                        },
                      },
                      nextPageToken: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
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
      '/dv360/v4/advertisers/{advertiserId}/campaigns:query': {
        post: {
          tags: ['DV360'],
          summary: 'Query campaign metrics',
          description: 'Query performance metrics for DV360 campaigns',
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
                  required: ['metrics', 'dateRange'],
                  properties: {
                    metrics: { type: 'array', items: { type: 'string' }, example: ['METRIC_IMPRESSIONS', 'METRIC_CLICKS', 'METRIC_REVENUE_ADVERTISER'] },
                    dimensions: { type: 'array', items: { type: 'string' }, example: ['DIMENSION_CAMPAIGN'] },
                    dateRange: {
                      type: 'object',
                      properties: {
                        startDate: {
                          type: 'object',
                          properties: {
                            year: { type: 'number', example: 2025 },
                            month: { type: 'number', example: 1 },
                            day: { type: 'number', example: 1 },
                          },
                        },
                        endDate: {
                          type: 'object',
                          properties: {
                            year: { type: 'number', example: 2025 },
                            month: { type: 'number', example: 1 },
                            day: { type: 'number', example: 31 },
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  metrics: ['METRIC_IMPRESSIONS', 'METRIC_CLICKS'],
                  dimensions: ['DIMENSION_CAMPAIGN'],
                  dateRange: {
                    startDate: { year: 2025, month: 1, day: 1 },
                    endDate: { year: 2025, month: 1, day: 31 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Campaign metrics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      metadata: { type: 'object' },
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            dimensions: { type: 'object' },
                            metrics: { type: 'object' },
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
      '/dv360/v4/advertisers/{advertiserId}/insertionOrders': {
        get: {
          tags: ['DV360'],
          summary: 'List insertion orders',
          description: 'List all insertion orders for a DV360 advertiser',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'advertiserId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Advertiser ID',
            },
            {
              name: 'pageSize',
              in: 'query',
              schema: { type: 'number', default: 100 },
              description: 'Number of results per page',
            },
            {
              name: 'pageToken',
              in: 'query',
              schema: { type: 'string' },
              description: 'Page token for pagination',
            },
          ],
          responses: {
            '200': {
              description: 'Insertion orders retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      insertionOrders: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            insertionOrderId: { type: 'string' },
                            displayName: { type: 'string' },
                            entityStatus: { type: 'string' },
                          },
                        },
                      },
                      nextPageToken: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['DV360'],
          summary: 'Create insertion order',
          description: 'Create a new DV360 insertion order',
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
                  required: ['displayName', 'campaignId'],
                  properties: {
                    displayName: { type: 'string', example: 'Test Insertion Order' },
                    campaignId: { type: 'string', example: '987654321' },
                    entityStatus: {
                      type: 'string',
                      enum: ['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED'],
                      example: 'ENTITY_STATUS_ACTIVE'
                    },
                    budget: {
                      type: 'object',
                      properties: {
                        budgetUnit: { type: 'string', enum: ['BUDGET_UNIT_CURRENCY', 'BUDGET_UNIT_IMPRESSIONS'], example: 'BUDGET_UNIT_CURRENCY' },
                        automationType: { type: 'string', enum: ['INSERTION_ORDER_AUTOMATION_TYPE_NONE', 'INSERTION_ORDER_AUTOMATION_TYPE_BUDGET'], example: 'INSERTION_ORDER_AUTOMATION_TYPE_BUDGET' },
                        budgetSegments: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              budgetAmountMicros: { type: 'string', example: '10000000000' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  displayName: 'Test Insertion Order',
                  campaignId: '987654321',
                  entityStatus: 'ENTITY_STATUS_ACTIVE',
                  budget: {
                    budgetUnit: 'BUDGET_UNIT_CURRENCY',
                    automationType: 'INSERTION_ORDER_AUTOMATION_TYPE_BUDGET',
                    budgetSegments: [
                      { budgetAmountMicros: '10000000000' },
                    ],
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Insertion order created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      insertionOrderId: { type: 'string' },
                      displayName: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/dv360/v4/advertisers/{advertiserId}/insertionOrders/{insertionOrderId}': {
        get: {
          tags: ['DV360'],
          summary: 'Get insertion order',
          description: 'Get details of a specific DV360 insertion order',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'advertiserId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Advertiser ID',
            },
            {
              name: 'insertionOrderId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '987654321' },
              description: 'Insertion order ID',
            },
          ],
          responses: {
            '200': {
              description: 'Insertion order retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      insertionOrderId: { type: 'string' },
                      displayName: { type: 'string' },
                      campaignId: { type: 'string' },
                      entityStatus: { type: 'string' },
                      budget: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
        patch: {
          tags: ['DV360'],
          summary: 'Update insertion order',
          description: 'Update an existing DV360 insertion order',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'advertiserId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Advertiser ID',
            },
            {
              name: 'insertionOrderId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '987654321' },
              description: 'Insertion order ID',
            },
            {
              name: 'updateMask',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'displayName,entityStatus' },
              description: 'Field mask for update',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    displayName: { type: 'string', example: 'Updated Insertion Order' },
                    entityStatus: { type: 'string', enum: ['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED'], example: 'ENTITY_STATUS_ACTIVE' },
                  },
                },
                example: {
                  displayName: 'Updated Insertion Order',
                  entityStatus: 'ENTITY_STATUS_ACTIVE',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Insertion order updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      insertionOrderId: { type: 'string' },
                      displayName: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/dv360/v4/advertisers/{advertiserId}/lineItems': {
        get: {
          tags: ['DV360'],
          summary: 'List line items',
          description: 'List all line items for a DV360 advertiser',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'advertiserId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Advertiser ID',
            },
            {
              name: 'pageSize',
              in: 'query',
              schema: { type: 'number', default: 100 },
              description: 'Number of results per page',
            },
            {
              name: 'pageToken',
              in: 'query',
              schema: { type: 'string' },
              description: 'Page token for pagination',
            },
          ],
          responses: {
            '200': {
              description: 'Line items retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      lineItems: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            lineItemId: { type: 'string' },
                            displayName: { type: 'string' },
                            entityStatus: { type: 'string' },
                          },
                        },
                      },
                      nextPageToken: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['DV360'],
          summary: 'Create line item',
          description: 'Create a new DV360 line item',
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
                  required: ['displayName', 'insertionOrderId', 'lineItemType'],
                  properties: {
                    displayName: { type: 'string', example: 'Test Line Item' },
                    insertionOrderId: { type: 'string', example: '987654321' },
                    lineItemType: { type: 'string', enum: ['LINE_ITEM_TYPE_DISPLAY_DEFAULT', 'LINE_ITEM_TYPE_VIDEO_DEFAULT'], example: 'LINE_ITEM_TYPE_DISPLAY_DEFAULT' },
                    entityStatus: {
                      type: 'string',
                      enum: ['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED'],
                      example: 'ENTITY_STATUS_ACTIVE'
                    },
                    flight: {
                      type: 'object',
                      properties: {
                        flightDateType: { type: 'string', example: 'LINE_ITEM_FLIGHT_DATE_TYPE_INHERITED' },
                      },
                    },
                  },
                },
                example: {
                  displayName: 'Test Line Item',
                  insertionOrderId: '987654321',
                  lineItemType: 'LINE_ITEM_TYPE_DISPLAY_DEFAULT',
                  entityStatus: 'ENTITY_STATUS_ACTIVE',
                  flight: {
                    flightDateType: 'LINE_ITEM_FLIGHT_DATE_TYPE_INHERITED',
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Line item created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      lineItemId: { type: 'string' },
                      displayName: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/dv360/v4/advertisers/{advertiserId}/lineItems/{lineItemId}': {
        get: {
          tags: ['DV360'],
          summary: 'Get line item',
          description: 'Get details of a specific DV360 line item',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'advertiserId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Advertiser ID',
            },
            {
              name: 'lineItemId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '555555555' },
              description: 'Line item ID',
            },
          ],
          responses: {
            '200': {
              description: 'Line item retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      lineItemId: { type: 'string' },
                      displayName: { type: 'string' },
                      insertionOrderId: { type: 'string' },
                      entityStatus: { type: 'string' },
                      lineItemType: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        patch: {
          tags: ['DV360'],
          summary: 'Update line item',
          description: 'Update an existing DV360 line item',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'advertiserId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '123456789' },
              description: 'Advertiser ID',
            },
            {
              name: 'lineItemId',
              in: 'path',
              required: true,
              schema: { type: 'string', default: '555555555' },
              description: 'Line item ID',
            },
            {
              name: 'updateMask',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'displayName,entityStatus' },
              description: 'Field mask for update',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    displayName: { type: 'string', example: 'Updated Line Item' },
                    entityStatus: { type: 'string', enum: ['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED'], example: 'ENTITY_STATUS_ACTIVE' },
                  },
                },
                example: {
                  displayName: 'Updated Line Item',
                  entityStatus: 'ENTITY_STATUS_ACTIVE',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Line item updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      lineItemId: { type: 'string' },
                      displayName: { type: 'string' },
                    },
                  },
                },
              },
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
      '/googleads/v21/customers/{customerId}/googleAds:search': {
        post: {
          tags: ['Google Ads'],
          summary: 'Search campaigns, ad groups, and ads',
          description: 'Search for campaigns, ad groups, and ads using Google Ads Query Language (GAQL)',
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
                  required: ['query'],
                  properties: {
                    query: {
                      type: 'string',
                      example: 'SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status = "ENABLED"',
                      description: 'GAQL query string',
                    },
                    pageSize: { type: 'number', example: 100, description: 'Number of results per page' },
                    pageToken: { type: 'string', description: 'Token for pagination' },
                  },
                },
                example: {
                  query: 'SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status = "ENABLED"',
                  pageSize: 100,
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Search results retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            campaign: {
                              type: 'object',
                              properties: {
                                resourceName: { type: 'string' },
                                id: { type: 'string' },
                                name: { type: 'string' },
                                status: { type: 'string' },
                              },
                            },
                          },
                        },
                      },
                      nextPageToken: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/googleads/v21/customers/{customerId}/adGroups:mutate': {
        post: {
          tags: ['Google Ads'],
          summary: 'Create or update ad groups',
          description: 'Create or update Google Ads ad groups',
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
                              name: { type: 'string', example: 'Test Ad Group' },
                              campaign: { type: 'string', example: 'customers/1234567890/campaigns/999999' },
                              status: { type: 'string', enum: ['ENABLED', 'PAUSED', 'REMOVED'], example: 'PAUSED' },
                              type: { type: 'string', enum: ['SEARCH_STANDARD', 'DISPLAY_STANDARD', 'VIDEO_TRUE_VIEW_IN_STREAM'], example: 'SEARCH_STANDARD' },
                              cpcBidMicros: { type: 'string', example: '1000000' },
                            },
                          },
                          update: {
                            type: 'object',
                            properties: {
                              resourceName: { type: 'string', example: 'customers/1234567890/adGroups/888888' },
                              name: { type: 'string', example: 'Updated Ad Group' },
                              status: { type: 'string', enum: ['ENABLED', 'PAUSED', 'REMOVED'], example: 'ENABLED' },
                            },
                          },
                          updateMask: { type: 'string', example: 'name,status' },
                        },
                      },
                    },
                  },
                },
                example: {
                  operations: [
                    {
                      create: {
                        name: 'Test Ad Group',
                        campaign: 'customers/1234567890/campaigns/999999',
                        status: 'PAUSED',
                        type: 'SEARCH_STANDARD',
                        cpcBidMicros: '1000000',
                      },
                    },
                  ],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ad groups mutated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            resourceName: { type: 'string' },
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
      '/googleads/v21/customers/{customerId}/adGroupAds:mutate': {
        post: {
          tags: ['Google Ads'],
          summary: 'Create or update ads',
          description: 'Create or update Google Ads ads',
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
                              adGroup: { type: 'string', example: 'customers/1234567890/adGroups/888888' },
                              status: { type: 'string', enum: ['ENABLED', 'PAUSED', 'REMOVED'], example: 'PAUSED' },
                              ad: {
                                type: 'object',
                                properties: {
                                  responsiveSearchAd: {
                                    type: 'object',
                                    properties: {
                                      headlines: {
                                        type: 'array',
                                        items: {
                                          type: 'object',
                                          properties: {
                                            text: { type: 'string', example: 'Headline Text' },
                                          },
                                        },
                                      },
                                      descriptions: {
                                        type: 'array',
                                        items: {
                                          type: 'object',
                                          properties: {
                                            text: { type: 'string', example: 'Description Text' },
                                          },
                                        },
                                      },
                                    },
                                  },
                                  finalUrls: { type: 'array', items: { type: 'string' }, example: ['https://www.example.com'] },
                                },
                              },
                            },
                          },
                          update: {
                            type: 'object',
                            properties: {
                              resourceName: { type: 'string', example: 'customers/1234567890/adGroupAds/888888~777777' },
                              status: { type: 'string', enum: ['ENABLED', 'PAUSED', 'REMOVED'], example: 'ENABLED' },
                            },
                          },
                          updateMask: { type: 'string', example: 'status' },
                        },
                      },
                    },
                  },
                },
                example: {
                  operations: [
                    {
                      create: {
                        adGroup: 'customers/1234567890/adGroups/888888',
                        status: 'PAUSED',
                        ad: {
                          responsiveSearchAd: {
                            headlines: [
                              { text: 'Headline 1' },
                              { text: 'Headline 2' },
                            ],
                            descriptions: [
                              { text: 'Description 1' },
                            ],
                          },
                          finalUrls: ['https://www.example.com'],
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ads mutated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            resourceName: { type: 'string' },
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
    },
  },
  apis: [], // We're defining paths inline in the definition
};
