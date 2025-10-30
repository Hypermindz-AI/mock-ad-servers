import request from 'supertest';
import app from '../src/index';

// Valid tokens from .env.example
const VALID_ACCESS_TOKEN = 'mock_google_access_token_12345';
const VALID_DEV_TOKEN = 'mock_google_dev_token_67890';
const VALID_CLIENT_ID = 'mock_google_client_id';
const VALID_CLIENT_SECRET = 'mock_google_client_secret';
const VALID_REDIRECT_URI = 'https://example.com/callback';

// Test data
const TEST_CUSTOMER_ID = '1234567890';
const TEST_CAMPAIGN_NAME = 'Test Campaign';
const TEST_BUDGET_RESOURCE = `customers/${TEST_CUSTOMER_ID}/campaignBudgets/9876543210`;

describe('Google Ads API v21 - OAuth Flow Tests', () => {
  describe('GET /oauth/authorize', () => {
    it('should successfully authorize with valid parameters', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: VALID_CLIENT_ID,
          redirect_uri: VALID_REDIRECT_URI,
          response_type: 'code',
          scope: 'https://www.googleapis.com/auth/adwords',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toMatch(/^AUTH_CODE_/);
      expect(response.body).toHaveProperty('state');
    });

    it('should return authorization code with state parameter', async () => {
      const testState = 'test_state_12345';
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: VALID_CLIENT_ID,
          redirect_uri: VALID_REDIRECT_URI,
          response_type: 'code',
          scope: 'https://www.googleapis.com/auth/adwords',
          state: testState,
        });

      expect(response.status).toBe(200);
      expect(response.body.state).toBe(testState);
    });

    it('should fail with missing client_id', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          redirect_uri: VALID_REDIRECT_URI,
          response_type: 'code',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid_request');
      expect(response.body.error_description).toContain('Missing or invalid required parameters');
    });

    it('should fail with missing redirect_uri', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: VALID_CLIENT_ID,
          response_type: 'code',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid_request');
    });

    it('should fail with invalid response_type', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: VALID_CLIENT_ID,
          redirect_uri: VALID_REDIRECT_URI,
          response_type: 'token',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid_request');
    });

    it('should fail with invalid client_id', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: 'invalid_client_id',
          redirect_uri: VALID_REDIRECT_URI,
          response_type: 'code',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid_client');
      expect(response.body.error_description).toContain('Invalid client_id');
    });

    it('should fail with invalid scope', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: VALID_CLIENT_ID,
          redirect_uri: VALID_REDIRECT_URI,
          response_type: 'code',
          scope: 'invalid_scope',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid_scope');
      expect(response.body.error_description).toContain('Required scope');
    });
  });

  describe('POST /oauth/token', () => {
    let authorizationCode: string;

    beforeEach(async () => {
      // Get a valid authorization code for tests
      const authResponse = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: VALID_CLIENT_ID,
          redirect_uri: VALID_REDIRECT_URI,
          response_type: 'code',
          scope: 'https://www.googleapis.com/auth/adwords',
        });

      authorizationCode = authResponse.body.code;
    });

    describe('authorization_code grant type', () => {
      it('should successfully exchange authorization code for tokens', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            code: authorizationCode,
            grant_type: 'authorization_code',
            redirect_uri: VALID_REDIRECT_URI,
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('access_token', VALID_ACCESS_TOKEN);
        expect(response.body).toHaveProperty('refresh_token');
        expect(response.body.refresh_token).toMatch(/^REFRESH_TOKEN_/);
        expect(response.body).toHaveProperty('expires_in', 3600);
        expect(response.body).toHaveProperty('token_type', 'Bearer');
        expect(response.body).toHaveProperty('scope', 'https://www.googleapis.com/auth/adwords');
      });

      it('should fail with missing client credentials', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .send({
            code: authorizationCode,
            grant_type: 'authorization_code',
            redirect_uri: VALID_REDIRECT_URI,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('Missing client credentials');
      });

      it('should fail with invalid client credentials', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .send({
            client_id: 'invalid_id',
            client_secret: 'invalid_secret',
            code: authorizationCode,
            grant_type: 'authorization_code',
            redirect_uri: VALID_REDIRECT_URI,
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'invalid_client');
        expect(response.body.error_description).toContain('Invalid client credentials');
      });

      it('should fail with missing authorization code', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: VALID_REDIRECT_URI,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('Missing code or redirect_uri');
      });

      it('should fail with invalid authorization code', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            code: 'invalid_code',
            grant_type: 'authorization_code',
            redirect_uri: VALID_REDIRECT_URI,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_grant');
        expect(response.body.error_description).toContain('Invalid or expired authorization code');
      });

      it('should fail with mismatched redirect_uri', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            code: authorizationCode,
            grant_type: 'authorization_code',
            redirect_uri: 'https://different-uri.com/callback',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_grant');
        expect(response.body.error_description).toContain('redirect_uri mismatch');
      });

      it('should invalidate authorization code after use', async () => {
        // Use the code once
        await request(app)
          .post('/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            code: authorizationCode,
            grant_type: 'authorization_code',
            redirect_uri: VALID_REDIRECT_URI,
          });

        // Try to use it again
        const response = await request(app)
          .post('/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            code: authorizationCode,
            grant_type: 'authorization_code',
            redirect_uri: VALID_REDIRECT_URI,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_grant');
      });
    });

    describe('refresh_token grant type', () => {
      let refreshToken: string;

      beforeEach(async () => {
        // Get a refresh token
        const tokenResponse = await request(app)
          .post('/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            code: authorizationCode,
            grant_type: 'authorization_code',
            redirect_uri: VALID_REDIRECT_URI,
          });

        refreshToken = tokenResponse.body.refresh_token;
      });

      it('should successfully refresh access token', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('access_token', VALID_ACCESS_TOKEN);
        expect(response.body).toHaveProperty('expires_in', 3600);
        expect(response.body).toHaveProperty('token_type', 'Bearer');
        expect(response.body).toHaveProperty('scope', 'https://www.googleapis.com/auth/adwords');
        expect(response.body).not.toHaveProperty('refresh_token');
      });

      it('should fail with missing refresh_token', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            grant_type: 'refresh_token',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('Missing refresh_token');
      });

      it('should fail with invalid refresh_token', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            refresh_token: 'invalid_refresh_token',
            grant_type: 'refresh_token',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_grant');
        expect(response.body.error_description).toContain('Invalid refresh token');
      });

      it('should fail with invalid client credentials', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .send({
            client_id: 'invalid_id',
            client_secret: 'invalid_secret',
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'invalid_client');
      });
    });

    describe('unsupported grant types', () => {
      it('should fail with unsupported grant type', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            grant_type: 'client_credentials',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'unsupported_grant_type');
        expect(response.body.error_description).toContain('Only authorization_code and refresh_token grant types are supported');
      });
    });
  });
});

describe('Google Ads API v21 - Authentication Tests', () => {
  describe('Missing Authorization header', () => {
    it('should return 401 for campaign creation without Authorization header', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set('developer-token', VALID_DEV_TOKEN)
        .send({
          operations: [
            {
              create: {
                name: TEST_CAMPAIGN_NAME,
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should return 401 for campaign retrieval without Authorization header', async () => {
      const response = await request(app)
        .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/9876543210`)
        .set('developer-token', VALID_DEV_TOKEN);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Invalid Bearer token', () => {
    it('should return 401 with invalid Bearer token for campaign creation', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set('Authorization', 'Bearer invalid_token')
        .set('developer-token', VALID_DEV_TOKEN)
        .send({
          operations: [
            {
              create: {
                name: TEST_CAMPAIGN_NAME,
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with malformed Authorization header', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set('Authorization', 'InvalidFormat')
        .set('developer-token', VALID_DEV_TOKEN)
        .send({
          operations: [
            {
              create: {
                name: TEST_CAMPAIGN_NAME,
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Missing developer-token header', () => {
    it('should return 401 for campaign creation without developer-token header', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set('Authorization', `Bearer ${VALID_ACCESS_TOKEN}`)
        .send({
          operations: [
            {
              create: {
                name: TEST_CAMPAIGN_NAME,
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should return 401 for campaign retrieval without developer-token header', async () => {
      const response = await request(app)
        .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/9876543210`)
        .set('Authorization', `Bearer ${VALID_ACCESS_TOKEN}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Invalid developer-token', () => {
    it('should return 401 with invalid developer-token for campaign creation', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set('Authorization', `Bearer ${VALID_ACCESS_TOKEN}`)
        .set('developer-token', 'invalid_dev_token')
        .send({
          operations: [
            {
              create: {
                name: TEST_CAMPAIGN_NAME,
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with invalid developer-token for campaign retrieval', async () => {
      const response = await request(app)
        .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/9876543210`)
        .set('Authorization', `Bearer ${VALID_ACCESS_TOKEN}`)
        .set('developer-token', 'invalid_dev_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});

describe('Google Ads API v21 - Campaign CRUD Tests', () => {
  const validHeaders = {
    Authorization: `Bearer ${VALID_ACCESS_TOKEN}`,
    'developer-token': VALID_DEV_TOKEN,
  };

  describe('POST /googleads/v21/customers/:customerId/campaigns:mutate - Create Campaign', () => {
    it('should successfully create a campaign with all required fields', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              create: {
                name: TEST_CAMPAIGN_NAME,
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
                budget: TEST_BUDGET_RESOURCE,
                targetSpend: { targetSpendMicros: '10000000' },
              },
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toBeInstanceOf(Array);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0]).toHaveProperty('resourceName');
      expect(response.body.results[0].resourceName).toMatch(/^customers\/\d+\/campaigns\/\d+$/);
      expect(response.body.results[0]).toHaveProperty('campaign');
      expect(response.body.results[0].campaign).toMatchObject({
        name: TEST_CAMPAIGN_NAME,
        status: 'ENABLED',
        advertisingChannelType: 'SEARCH',
        budget: TEST_BUDGET_RESOURCE,
      });
      expect(response.body.results[0].campaign).toHaveProperty('id');
      expect(response.body.results[0].campaign.id).toMatch(/^\d+$/);
    });

    it('should successfully create a campaign with minimal required fields', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              create: {
                name: 'Minimal Campaign',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.results[0].campaign).toMatchObject({
        name: 'Minimal Campaign',
        status: 'PAUSED', // Default status
        advertisingChannelType: 'SEARCH', // Default channel type
        budget: TEST_BUDGET_RESOURCE,
      });
    });

    it('should successfully create a DISPLAY campaign', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              create: {
                name: 'Display Campaign',
                status: 'PAUSED',
                advertisingChannelType: 'DISPLAY',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.results[0].campaign).toMatchObject({
        name: 'Display Campaign',
        status: 'PAUSED',
        advertisingChannelType: 'DISPLAY',
      });
    });

    it('should successfully create a VIDEO campaign', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              create: {
                name: 'Video Campaign',
                status: 'ENABLED',
                advertisingChannelType: 'VIDEO',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.results[0].campaign.advertisingChannelType).toBe('VIDEO');
    });

    it('should fail when missing required name field', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              create: {
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 400);
      expect(response.body.error).toHaveProperty('status', 'INVALID_ARGUMENT');
    });

    it('should fail when missing required budget field', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              create: {
                name: TEST_CAMPAIGN_NAME,
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
              },
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 400);
      expect(response.body.error).toHaveProperty('status', 'INVALID_ARGUMENT');
      expect(response.body.error.details[0].errors[0]).toMatchObject({
        errorCode: { campaignError: 'INVALID_BUDGET' },
        message: 'Campaign budget is required.',
      });
    });

    it('should fail with invalid campaign status', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              create: {
                name: TEST_CAMPAIGN_NAME,
                status: 'INVALID_STATUS',
                advertisingChannelType: 'SEARCH',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('status', 'INVALID_ARGUMENT');
      expect(response.body.error.details[0].errors[0]).toMatchObject({
        errorCode: { campaignError: 'INVALID_STATUS' },
      });
    });

    it('should fail with invalid advertising channel type', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              create: {
                name: TEST_CAMPAIGN_NAME,
                status: 'ENABLED',
                advertisingChannelType: 'INVALID_TYPE',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.details[0].errors[0]).toMatchObject({
        errorCode: { campaignError: 'INVALID_CHANNEL_TYPE' },
        message: 'Invalid advertising channel type.',
      });
    });

    it('should fail when operations array is empty', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Operations array is required and must not be empty');
    });

    it('should fail when operations field is missing', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Operations array is required');
    });

    it('should fail when operation has neither create nor update', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              delete: 'customers/123/campaigns/456',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Operation must contain either create or update field');
    });
  });

  describe('GET /googleads/v21/customers/:customerId/campaigns/:campaignId', () => {
    let createdCampaignId: string;

    beforeEach(async () => {
      // Create a campaign to retrieve
      const createResponse = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              create: {
                name: 'Test Campaign for Get',
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      const resourceName = createResponse.body.results[0].resourceName;
      const match = resourceName.match(/campaigns\/(\d+)/);
      createdCampaignId = match ? match[1] : '';
    });

    it('should successfully retrieve a campaign by ID', async () => {
      const response = await request(app)
        .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/${createdCampaignId}`)
        .set(validHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('resourceName');
      expect(response.body.resourceName).toBe(`customers/${TEST_CUSTOMER_ID}/campaigns/${createdCampaignId}`);
      expect(response.body).toHaveProperty('id', createdCampaignId);
      expect(response.body).toHaveProperty('name', 'Test Campaign for Get');
      expect(response.body).toHaveProperty('status', 'ENABLED');
      expect(response.body).toHaveProperty('advertisingChannelType', 'SEARCH');
      expect(response.body).toHaveProperty('budget', TEST_BUDGET_RESOURCE);
    });

    it('should retrieve the pre-existing sample campaign', async () => {
      const sampleCampaignId = '9876543210';
      const response = await request(app)
        .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/${sampleCampaignId}`)
        .set(validHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', sampleCampaignId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent campaign', async () => {
      const response = await request(app)
        .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/9999999999`)
        .set(validHeaders);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 404);
      expect(response.body.error).toHaveProperty('status', 'NOT_FOUND');
    });

    it('should return 401 without valid authentication', async () => {
      const response = await request(app)
        .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/${createdCampaignId}`)
        .set('Authorization', 'Bearer invalid_token')
        .set('developer-token', VALID_DEV_TOKEN);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /googleads/v21/customers/:customerId/campaigns:mutate - Update Campaign', () => {
    let createdCampaignId: string;
    let createdResourceName: string;

    beforeEach(async () => {
      // Create a campaign to update
      const createResponse = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              create: {
                name: 'Test Campaign for Update',
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
                budget: TEST_BUDGET_RESOURCE,
              },
            },
          ],
        });

      createdResourceName = createResponse.body.results[0].resourceName;
      const match = createdResourceName.match(/campaigns\/(\d+)/);
      createdCampaignId = match ? match[1] : '';
    });

    it('should successfully update campaign status to PAUSED', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              update: {
                resourceName: createdResourceName,
                status: 'PAUSED',
              },
              update_mask: 'status',
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results[0]).toHaveProperty('resourceName', createdResourceName);

      // Verify the update
      const getResponse = await request(app)
        .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/${createdCampaignId}`)
        .set(validHeaders);

      expect(getResponse.body.status).toBe('PAUSED');
    });

    it('should successfully update campaign status to REMOVED', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              update: {
                resourceName: createdResourceName,
                status: 'REMOVED',
              },
              update_mask: 'status',
            },
          ],
        });

      expect(response.status).toBe(200);

      // Verify the update
      const getResponse = await request(app)
        .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/${createdCampaignId}`)
        .set(validHeaders);

      expect(getResponse.body.status).toBe('REMOVED');
    });

    it('should successfully update campaign name', async () => {
      const newName = 'Updated Campaign Name';
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              update: {
                resourceName: createdResourceName,
                name: newName,
              },
              update_mask: 'name',
            },
          ],
        });

      expect(response.status).toBe(200);

      // Verify the update
      const getResponse = await request(app)
        .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/${createdCampaignId}`)
        .set(validHeaders);

      expect(getResponse.body.name).toBe(newName);
    });

    it('should successfully update multiple fields', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              update: {
                resourceName: createdResourceName,
                name: 'Multi-field Update',
                status: 'PAUSED',
              },
              update_mask: 'name,status',
            },
          ],
        });

      expect(response.status).toBe(200);

      // Verify the update
      const getResponse = await request(app)
        .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/${createdCampaignId}`)
        .set(validHeaders);

      expect(getResponse.body.name).toBe('Multi-field Update');
      expect(getResponse.body.status).toBe('PAUSED');
    });

    it('should fail to update with invalid status', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              update: {
                resourceName: createdResourceName,
                status: 'INVALID_STATUS',
              },
              update_mask: 'status',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.details[0].errors[0]).toMatchObject({
        errorCode: { campaignError: 'INVALID_STATUS' },
      });
    });

    it('should fail to update non-existent campaign', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              update: {
                resourceName: `customers/${TEST_CUSTOMER_ID}/campaigns/9999999999`,
                status: 'PAUSED',
              },
              update_mask: 'status',
            },
          ],
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('status', 'NOT_FOUND');
    });

    it('should fail when resourceName is missing in update', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
        .set(validHeaders)
        .send({
          operations: [
            {
              update: {
                status: 'PAUSED',
              },
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});

describe('Google Ads API v21 - Integration Tests', () => {
  const validHeaders = {
    Authorization: `Bearer ${VALID_ACCESS_TOKEN}`,
    'developer-token': VALID_DEV_TOKEN,
  };

  it('should complete a full campaign lifecycle: create -> get -> update -> get', async () => {
    // Step 1: Create a campaign
    const createResponse = await request(app)
      .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
      .set(validHeaders)
      .send({
        operations: [
          {
            create: {
              name: 'Lifecycle Test Campaign',
              status: 'ENABLED',
              advertisingChannelType: 'SEARCH',
              budget: TEST_BUDGET_RESOURCE,
            },
          },
        ],
      });

    expect(createResponse.status).toBe(200);
    const resourceName = createResponse.body.results[0].resourceName;
    const campaignId = resourceName.match(/campaigns\/(\d+)/)[1];

    // Step 2: Get the created campaign
    const getResponse1 = await request(app)
      .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/${campaignId}`)
      .set(validHeaders);

    expect(getResponse1.status).toBe(200);
    expect(getResponse1.body.name).toBe('Lifecycle Test Campaign');
    expect(getResponse1.body.status).toBe('ENABLED');

    // Step 3: Update the campaign status
    const updateResponse = await request(app)
      .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
      .set(validHeaders)
      .send({
        operations: [
          {
            update: {
              resourceName,
              status: 'PAUSED',
            },
            update_mask: 'status',
          },
        ],
      });

    expect(updateResponse.status).toBe(200);

    // Step 4: Verify the update
    const getResponse2 = await request(app)
      .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/${campaignId}`)
      .set(validHeaders);

    expect(getResponse2.status).toBe(200);
    expect(getResponse2.body.status).toBe('PAUSED');
    expect(getResponse2.body.name).toBe('Lifecycle Test Campaign');
  });

  it('should handle multiple campaign creations independently', async () => {
    const campaign1Response = await request(app)
      .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
      .set(validHeaders)
      .send({
        operations: [
          {
            create: {
              name: 'Campaign 1',
              status: 'ENABLED',
              advertisingChannelType: 'SEARCH',
              budget: TEST_BUDGET_RESOURCE,
            },
          },
        ],
      });

    const campaign2Response = await request(app)
      .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
      .set(validHeaders)
      .send({
        operations: [
          {
            create: {
              name: 'Campaign 2',
              status: 'PAUSED',
              advertisingChannelType: 'DISPLAY',
              budget: TEST_BUDGET_RESOURCE,
            },
          },
        ],
      });

    expect(campaign1Response.status).toBe(200);
    expect(campaign2Response.status).toBe(200);

    const campaign1Id = campaign1Response.body.results[0].resourceName.match(/campaigns\/(\d+)/)[1];
    const campaign2Id = campaign2Response.body.results[0].resourceName.match(/campaigns\/(\d+)/)[1];

    expect(campaign1Id).not.toBe(campaign2Id);

    // Verify both campaigns exist independently
    const get1 = await request(app)
      .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/${campaign1Id}`)
      .set(validHeaders);

    const get2 = await request(app)
      .get(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns/${campaign2Id}`)
      .set(validHeaders);

    expect(get1.body.name).toBe('Campaign 1');
    expect(get1.body.status).toBe('ENABLED');
    expect(get1.body.advertisingChannelType).toBe('SEARCH');

    expect(get2.body.name).toBe('Campaign 2');
    expect(get2.body.status).toBe('PAUSED');
    expect(get2.body.advertisingChannelType).toBe('DISPLAY');
  });
});
