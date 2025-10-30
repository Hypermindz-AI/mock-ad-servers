import request from 'supertest';
import app from '../src/index';

/**
 * TikTok Marketing API Tests
 *
 * Tests cover:
 * 1. OAuth Flow (authorization, token exchange, refresh token)
 * 2. Campaign CRUD operations (create, update, get)
 * 3. Authentication (Bearer token validation)
 *
 * All responses follow TikTok's standard format:
 * {
 *   code: number,      // 0 for success, error codes otherwise
 *   message: string,   // "OK" for success, error description otherwise
 *   data: object       // Response payload
 * }
 */

describe('TikTok Marketing API', () => {
  const VALID_TOKEN = 'mock_tiktok_access_token_mnopqr';
  const VALID_CLIENT_KEY = 'mock_tiktok_client_key_567890';
  const VALID_CLIENT_SECRET = 'mock_tiktok_client_secret_123456';
  const VALID_REDIRECT_URI = 'https://example.com/callback';

  // ============================================
  // OAuth Flow Tests
  // ============================================

  describe('OAuth Flow', () => {
    describe('GET /tiktok/oauth/authorize', () => {
      it('should successfully authorize with valid parameters', async () => {
        const response = await request(app)
          .get('/tiktok/oauth/authorize')
          .query({
            client_key: VALID_CLIENT_KEY,
            response_type: 'code',
            scope: 'ad_management,campaign.create',
            redirect_uri: VALID_REDIRECT_URI,
            state: 'random_state_12345'
          });

        expect(response.status).toBe(302); // Redirect
        expect(response.headers.location).toBeDefined();

        // Parse the redirect URL
        const redirectUrl = new URL(response.headers.location);

        // Check that authorization code is present
        expect(redirectUrl.searchParams.get('code')).toBeDefined();
        expect(redirectUrl.searchParams.get('code')).toMatch(/^tiktok_auth_code_/);

        // Check that state is preserved
        expect(redirectUrl.searchParams.get('state')).toBe('random_state_12345');

        // Check that it redirects to the correct URI
        expect(redirectUrl.origin + redirectUrl.pathname).toBe(VALID_REDIRECT_URI);
      });

      it('should fail when missing required parameters', async () => {
        const response = await request(app)
          .get('/tiktok/oauth/authorize')
          .query({
            client_key: VALID_CLIENT_KEY,
            response_type: 'code'
            // Missing scope and redirect_uri
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'invalid_request',
          error_description: 'Missing required parameters: client_key, response_type, scope, or redirect_uri'
        });
      });

      it('should fail with invalid response_type', async () => {
        const response = await request(app)
          .get('/tiktok/oauth/authorize')
          .query({
            client_key: VALID_CLIENT_KEY,
            response_type: 'token', // Invalid, should be 'code'
            scope: 'ad_management',
            redirect_uri: VALID_REDIRECT_URI
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'unsupported_response_type',
          error_description: 'response_type must be "code"'
        });
      });

      it('should fail with invalid client_key', async () => {
        const response = await request(app)
          .get('/tiktok/oauth/authorize')
          .query({
            client_key: 'invalid_client_key',
            response_type: 'code',
            scope: 'ad_management',
            redirect_uri: VALID_REDIRECT_URI
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'invalid_client',
          error_description: 'Invalid client_key'
        });
      });
    });

    describe('POST /tiktok/v2/oauth/token/', () => {
      it('should exchange authorization code for access token', async () => {
        const authCode = 'tiktok_auth_code_1234567890_abc123';

        const response = await request(app)
          .post('/tiktok/v2/oauth/token/')
          .send({
            client_key: VALID_CLIENT_KEY,
            client_secret: VALID_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: VALID_REDIRECT_URI
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          access_token: VALID_TOKEN,
          expires_in: 86400,
          refresh_expires_in: 31536000,
          token_type: 'Bearer',
          scope: 'ad_management,campaign.create,campaign.update'
        });
        expect(response.body.refresh_token).toBeDefined();
        expect(response.body.refresh_token).toMatch(/^tiktok_refresh_token_/);
        expect(response.body.open_id).toBeDefined();
        expect(response.body.open_id).toMatch(/^tiktok_open_id_/);
      });

      it('should refresh access token with valid refresh_token', async () => {
        const refreshToken = 'tiktok_refresh_token_1234567890_xyz789';

        const response = await request(app)
          .post('/tiktok/v2/oauth/token/')
          .send({
            client_key: VALID_CLIENT_KEY,
            client_secret: VALID_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          access_token: VALID_TOKEN,
          expires_in: 86400,
          refresh_expires_in: 31536000,
          token_type: 'Bearer',
          scope: 'ad_management,campaign.create,campaign.update'
        });
        expect(response.body.refresh_token).toBeDefined();
        expect(response.body.refresh_token).toMatch(/^tiktok_refresh_token_/);
        expect(response.body.open_id).toBeDefined();
      });

      it('should fail when missing required parameters', async () => {
        const response = await request(app)
          .post('/tiktok/v2/oauth/token/')
          .send({
            client_key: VALID_CLIENT_KEY
            // Missing client_secret and grant_type
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'invalid_request',
          error_description: 'Missing required parameters: client_key, client_secret, or grant_type'
        });
      });

      it('should fail with invalid client credentials', async () => {
        const response = await request(app)
          .post('/tiktok/v2/oauth/token/')
          .send({
            client_key: 'invalid_key',
            client_secret: 'invalid_secret',
            grant_type: 'authorization_code',
            code: 'tiktok_auth_code_123',
            redirect_uri: VALID_REDIRECT_URI
          });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          error: 'invalid_client',
          error_description: 'Invalid client credentials'
        });
      });

      it('should fail when missing required parameters for authorization_code grant', async () => {
        const response = await request(app)
          .post('/tiktok/v2/oauth/token/')
          .send({
            client_key: VALID_CLIENT_KEY,
            client_secret: VALID_CLIENT_SECRET,
            grant_type: 'authorization_code'
            // Missing code and redirect_uri
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'invalid_request',
          error_description: 'Missing required parameters: code or redirect_uri'
        });
      });

      it('should fail with invalid authorization code', async () => {
        const response = await request(app)
          .post('/tiktok/v2/oauth/token/')
          .send({
            client_key: VALID_CLIENT_KEY,
            client_secret: VALID_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: 'invalid_code_format',
            redirect_uri: VALID_REDIRECT_URI
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code'
        });
      });

      it('should fail when missing refresh_token parameter', async () => {
        const response = await request(app)
          .post('/tiktok/v2/oauth/token/')
          .send({
            client_key: VALID_CLIENT_KEY,
            client_secret: VALID_CLIENT_SECRET,
            grant_type: 'refresh_token'
            // Missing refresh_token
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'invalid_request',
          error_description: 'Missing required parameter: refresh_token'
        });
      });

      it('should fail with invalid refresh_token format', async () => {
        const response = await request(app)
          .post('/tiktok/v2/oauth/token/')
          .send({
            client_key: VALID_CLIENT_KEY,
            client_secret: VALID_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: 'invalid_refresh_token_format'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'invalid_grant',
          error_description: 'Invalid refresh token'
        });
      });

      it('should fail with unsupported grant type', async () => {
        const response = await request(app)
          .post('/tiktok/v2/oauth/token/')
          .send({
            client_key: VALID_CLIENT_KEY,
            client_secret: VALID_CLIENT_SECRET,
            grant_type: 'client_credentials' // Unsupported
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'unsupported_grant_type',
          error_description: 'Grant type "client_credentials" is not supported. Use "authorization_code" or "refresh_token".'
        });
      });
    });
  });

  // ============================================
  // Campaign CRUD Tests
  // ============================================

  describe('Campaign CRUD Operations', () => {
    describe('POST /open_api/v1.3/campaign/create/', () => {
      it('should create campaign successfully with valid data', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_name: 'Test Campaign',
            objective_type: 'TRAFFIC',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: 100.0
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          code: 0,
          message: 'OK',
          data: {
            campaign_id: expect.any(String)
          }
        });
        expect(response.body.data.campaign_id).toMatch(/^\d+$/);
      });

      it('should fail when missing advertiser_id', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            campaign_name: 'Test Campaign',
            objective_type: 'TRAFFIC',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: 100.0
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: advertiser_id',
          data: {}
        });
      });

      it('should fail when missing campaign_name', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            objective_type: 'TRAFFIC',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: 100.0
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: campaign_name',
          data: {}
        });
      });

      it('should fail with invalid objective_type', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_name: 'Test Campaign',
            objective_type: 'INVALID_OBJECTIVE',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: 100.0
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Invalid objective_type. Supported values: TRAFFIC, CONVERSIONS, APP_PROMOTION, REACH, VIDEO_VIEWS',
          data: {}
        });
      });

      it('should fail with invalid budget_mode', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_name: 'Test Campaign',
            objective_type: 'TRAFFIC',
            budget_mode: 'INVALID_BUDGET_MODE',
            budget: 100.0
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Invalid budget_mode. Supported values: BUDGET_MODE_DAY, BUDGET_MODE_TOTAL, BUDGET_MODE_INFINITE',
          data: {}
        });
      });

      it('should fail when budget is missing for BUDGET_MODE_DAY', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_name: 'Test Campaign',
            objective_type: 'TRAFFIC',
            budget_mode: 'BUDGET_MODE_DAY'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: budget (required for BUDGET_MODE_DAY and BUDGET_MODE_TOTAL)',
          data: {}
        });
      });

      it('should fail with negative budget', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_name: 'Test Campaign',
            objective_type: 'TRAFFIC',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: -50.0
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Invalid budget: must be a positive number',
          data: {}
        });
      });

      it('should fail with zero budget', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_name: 'Test Campaign',
            objective_type: 'TRAFFIC',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: 0
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Invalid budget: must be a positive number',
          data: {}
        });
      });

      it('should create campaign with BUDGET_MODE_TOTAL', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_name: 'Total Budget Campaign',
            objective_type: 'CONVERSIONS',
            budget_mode: 'BUDGET_MODE_TOTAL',
            budget: 5000.0
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          code: 0,
          message: 'OK',
          data: {
            campaign_id: expect.any(String)
          }
        });
      });

      it('should create campaign with BUDGET_MODE_INFINITE without budget', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_name: 'Infinite Budget Campaign',
            objective_type: 'APP_PROMOTION',
            budget_mode: 'BUDGET_MODE_INFINITE'
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          code: 0,
          message: 'OK',
          data: {
            campaign_id: expect.any(String)
          }
        });
      });

      it('should fail when budget is missing for BUDGET_MODE_TOTAL', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_name: 'Test Campaign',
            objective_type: 'CONVERSIONS',
            budget_mode: 'BUDGET_MODE_TOTAL'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: budget (required for BUDGET_MODE_DAY and BUDGET_MODE_TOTAL)',
          data: {}
        });
      });
    });

    describe('POST /open_api/v1.3/campaign/update/', () => {
      it('should update campaign successfully', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            operation_status: 'ENABLE',
            campaign_name: 'Updated Campaign Name',
            budget: 200.0
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          code: 0,
          message: 'OK',
          data: {
            campaign_id: '1234567890123456789',
            operation_status: 'ENABLE'
          }
        });
      });

      it('should fail with invalid operation_status', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            operation_status: 'INVALID_STATUS'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Invalid operation_status. Supported values: ENABLE, DISABLE, DELETE',
          data: {}
        });
      });

      it('should update campaign with only operation_status', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            operation_status: 'DISABLE'
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          code: 0,
          message: 'OK',
          data: {
            campaign_id: '1234567890123456789',
            operation_status: 'DISABLE'
          }
        });
      });

      it('should update campaign without operation_status', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            campaign_name: 'New Name',
            budget: 150.0
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          code: 0,
          message: 'OK',
          data: {
            campaign_id: '1234567890123456789'
          }
        });
      });

      it('should fail when missing advertiser_id', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            campaign_id: '1234567890123456789',
            operation_status: 'ENABLE'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: advertiser_id',
          data: {}
        });
      });

      it('should fail when missing campaign_id', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            operation_status: 'ENABLE'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: campaign_id',
          data: {}
        });
      });

      it('should fail with invalid budget', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            budget: -100.0
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Invalid budget: must be a positive number',
          data: {}
        });
      });
    });

    describe('GET /open_api/v1.3/campaign/get/', () => {
      it('should get campaign successfully', async () => {
        const response = await request(app)
          .get('/tiktok/v1.3/campaign/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .query({
            advertiser_id: '123456'
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          code: 0,
          message: 'OK',
          data: {
            list: expect.arrayContaining([
              expect.objectContaining({
                campaign_id: expect.any(String),
                advertiser_id: '123456',
                campaign_name: expect.any(String),
                objective_type: expect.any(String),
                budget_mode: expect.any(String),
                budget: expect.any(Number),
                operation_status: expect.any(String),
                create_time: expect.any(String),
                modify_time: expect.any(String)
              })
            ]),
            page_info: {
              total_number: expect.any(Number),
              page: 1,
              page_size: expect.any(Number)
            }
          }
        });
      });

      it('should fail when missing advertiser_id', async () => {
        const response = await request(app)
          .get('/tiktok/v1.3/campaign/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: advertiser_id',
          data: {}
        });
      });

      it('should get specific campaigns by IDs', async () => {
        const campaignIds = ['1111111111111111111', '2222222222222222222'];

        const response = await request(app)
          .get('/tiktok/v1.3/campaign/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .query({
            advertiser_id: '123456',
            campaign_ids: JSON.stringify(campaignIds)
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          code: 0,
          message: 'OK',
          data: {
            list: expect.arrayContaining([
              expect.objectContaining({
                campaign_id: '1111111111111111111',
                advertiser_id: '123456'
              }),
              expect.objectContaining({
                campaign_id: '2222222222222222222',
                advertiser_id: '123456'
              })
            ]),
            page_info: {
              total_number: 2,
              page: 1,
              page_size: 2
            }
          }
        });
      });

      it('should fail with invalid campaign_ids format', async () => {
        const response = await request(app)
          .get('/tiktok/v1.3/campaign/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .query({
            advertiser_id: '123456',
            campaign_ids: 'not-a-json-array'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Invalid campaign_ids format: must be a JSON array',
          data: {}
        });
      });
    });
  });

  // ============================================
  // Authentication Tests
  // ============================================

  describe('Authentication', () => {
    describe('Missing Authorization Header', () => {
      it('should return 401 for campaign creation without Authorization header', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .send({
            advertiser_id: '123456',
            campaign_name: 'Test Campaign',
            objective_type: 'TRAFFIC',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: 100.0
          });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          code: 40100,
          message: 'Authentication failed: Invalid or missing access token',
          data: {}
        });
      });

      it('should return 401 for campaign update without Authorization header', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/update/')
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            operation_status: 'ENABLE'
          });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          code: 40100,
          message: 'Authentication failed: Invalid or missing access token',
          data: {}
        });
      });

      it('should return 401 for campaign get without Authorization header', async () => {
        const response = await request(app)
          .get('/tiktok/v1.3/campaign/get/')
          .query({
            advertiser_id: '123456'
          });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          code: 40100,
          message: 'Authentication failed: Invalid or missing access token',
          data: {}
        });
      });
    });

    describe('Invalid Bearer Token', () => {
      it('should return 401 for campaign creation with invalid token', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', 'Bearer invalid_token_12345')
          .send({
            advertiser_id: '123456',
            campaign_name: 'Test Campaign',
            objective_type: 'TRAFFIC',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: 100.0
          });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          code: 40100,
          message: 'Authentication failed: Invalid or missing access token',
          data: {}
        });
      });

      it('should return 401 for campaign update with invalid token', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/update/')
          .set('Authorization', 'Bearer invalid_token_12345')
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            operation_status: 'ENABLE'
          });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          code: 40100,
          message: 'Authentication failed: Invalid or missing access token',
          data: {}
        });
      });

      it('should return 401 for campaign get with invalid token', async () => {
        const response = await request(app)
          .get('/tiktok/v1.3/campaign/get/')
          .set('Authorization', 'Bearer invalid_token_12345')
          .query({
            advertiser_id: '123456'
          });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          code: 40100,
          message: 'Authentication failed: Invalid or missing access token',
          data: {}
        });
      });

      it('should return 401 with malformed Authorization header (no Bearer prefix)', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', VALID_TOKEN) // Missing "Bearer " prefix
          .send({
            advertiser_id: '123456',
            campaign_name: 'Test Campaign',
            objective_type: 'TRAFFIC',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: 100.0
          });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          code: 40100,
          message: 'Authentication failed: Invalid or missing access token',
          data: {}
        });
      });

      it('should return 401 with empty Bearer token', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', 'Bearer ')
          .send({
            advertiser_id: '123456',
            campaign_name: 'Test Campaign',
            objective_type: 'TRAFFIC',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: 100.0
          });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          code: 40100,
          message: 'Authentication failed: Invalid or missing access token',
          data: {}
        });
      });
    });
  });

  // ============================================
  // Edge Cases and Additional Scenarios
  // ============================================

  describe('Edge Cases', () => {
    it('should handle all valid objective types', async () => {
      const objectiveTypes = [
        'TRAFFIC',
        'CONVERSIONS',
        'APP_PROMOTION',
        'REACH',
        'VIDEO_VIEWS',
        'LEAD_GENERATION',
        'PRODUCT_SALES'
      ];

      for (const objectiveType of objectiveTypes) {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_name: `${objectiveType} Campaign`,
            objective_type: objectiveType,
            budget_mode: 'BUDGET_MODE_DAY',
            budget: 100.0
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          code: 0,
          message: 'OK',
          data: {
            campaign_id: expect.any(String)
          }
        });
      }
    });

    it('should handle all valid operation statuses', async () => {
      const operationStatuses = ['ENABLE', 'DISABLE', 'DELETE'];

      for (const operationStatus of operationStatuses) {
        const response = await request(app)
          .post('/tiktok/v1.3/campaign/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            operation_status: operationStatus
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          code: 0,
          message: 'OK',
          data: {
            campaign_id: '1234567890123456789',
            operation_status: operationStatus
          }
        });
      }
    });

    it('should handle campaign with very large budget', async () => {
      const response = await request(app)
        .post('/open_api/v1.3/campaign/create/')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({
          advertiser_id: '123456',
          campaign_name: 'High Budget Campaign',
          objective_type: 'CONVERSIONS',
          budget_mode: 'BUDGET_MODE_TOTAL',
          budget: 999999999.99
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        code: 0,
        message: 'OK',
        data: {
          campaign_id: expect.any(String)
        }
      });
    });

    it('should handle campaign with minimum budget', async () => {
      const response = await request(app)
        .post('/open_api/v1.3/campaign/create/')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({
          advertiser_id: '123456',
          campaign_name: 'Low Budget Campaign',
          objective_type: 'TRAFFIC',
          budget_mode: 'BUDGET_MODE_DAY',
          budget: 0.01
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        code: 0,
        message: 'OK',
        data: {
          campaign_id: expect.any(String)
        }
      });
    });

    it('should preserve state parameter in OAuth flow', async () => {
      const customState = 'my_custom_state_value_with_special_chars_!@#$%';

      const response = await request(app)
        .get('/tiktok/oauth/authorize')
        .query({
          client_key: VALID_CLIENT_KEY,
          response_type: 'code',
          scope: 'ad_management',
          redirect_uri: VALID_REDIRECT_URI,
          state: customState
        });

      expect(response.status).toBe(302);
      const redirectUrl = new URL(response.headers.location);
      expect(redirectUrl.searchParams.get('state')).toBe(customState);
    });

    it('should work without state parameter in OAuth flow', async () => {
      const response = await request(app)
        .get('/tiktok/oauth/authorize')
        .query({
          client_key: VALID_CLIENT_KEY,
          response_type: 'code',
          scope: 'ad_management',
          redirect_uri: VALID_REDIRECT_URI
          // No state parameter
        });

      expect(response.status).toBe(302);
      const redirectUrl = new URL(response.headers.location);
      expect(redirectUrl.searchParams.get('code')).toBeDefined();
      expect(redirectUrl.searchParams.get('state')).toBeNull();
    });
  });
});
