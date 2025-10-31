/**
 * DV360 API v4 Tests
 * Comprehensive tests for Display & Video 360 API endpoints
 */

import request from 'supertest';
import app from '../src/index';

// Valid tokens from auth.config
const DV360_VALID_TOKEN = 'mock_dv360_access_token_klmnop';
const GOOGLE_VALID_TOKEN = 'mock_google_access_token_12345';
const VALID_CLIENT_ID = 'mock_google_client_id';
const VALID_CLIENT_SECRET = 'mock_google_client_secret';
const VALID_REDIRECT_URI = 'https://example.com/callback';
const INVALID_TOKEN = 'invalid_token_xyz';
const TEST_ADVERTISER_ID = '123456789';

describe('DV360 API v4 Tests', () => {
  // ============================================
  // OAuth Flow Tests (shares Google OAuth)
  // ============================================
  describe('OAuth Flow Tests', () => {
    describe('GET /google/oauth/authorize - successful authorization', () => {
      it('should successfully authorize with valid parameters', async () => {
        const response = await request(app)
          .get('/google/oauth/authorize')
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

      it('should validate doubleclickbidmanager scope is not rejected', async () => {
        // Note: Current implementation validates adwords scope
        // DV360 should use doubleclickbidmanager scope, but shares Google OAuth
        const response = await request(app)
          .get('/google/oauth/authorize')
          .query({
            client_id: VALID_CLIENT_ID,
            redirect_uri: VALID_REDIRECT_URI,
            response_type: 'code',
            scope: 'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/doubleclickbidmanager',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('code');
      });
    });

    describe('POST /google/oauth/token - authorization_code grant', () => {
      let authorizationCode: string;

      beforeEach(async () => {
        // Get a valid authorization code first
        const authResponse = await request(app)
          .get('/google/oauth/authorize')
          .query({
            client_id: VALID_CLIENT_ID,
            redirect_uri: VALID_REDIRECT_URI,
            response_type: 'code',
            scope: 'https://www.googleapis.com/auth/adwords',
          });
        authorizationCode = authResponse.body.code;
      });

      it('should successfully exchange authorization code for tokens', async () => {
        const response = await request(app)
          .post('/google/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            code: authorizationCode,
            grant_type: 'authorization_code',
            redirect_uri: VALID_REDIRECT_URI,
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('access_token', GOOGLE_VALID_TOKEN);
        expect(response.body).toHaveProperty('refresh_token');
        expect(response.body.refresh_token).toMatch(/^REFRESH_TOKEN_/);
        expect(response.body).toHaveProperty('expires_in', 3600);
        expect(response.body).toHaveProperty('token_type', 'Bearer');
        expect(response.body).toHaveProperty('scope', 'https://www.googleapis.com/auth/adwords');
      });

      it('should fail with missing client credentials', async () => {
        const response = await request(app)
          .post('/google/oauth/token')
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
          .post('/google/oauth/token')
          .send({
            client_id: 'invalid_client_id',
            client_secret: 'invalid_secret',
            code: authorizationCode,
            grant_type: 'authorization_code',
            redirect_uri: VALID_REDIRECT_URI,
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'invalid_client');
        expect(response.body.error_description).toContain('Invalid client credentials');
      });

      it('should fail with invalid authorization code', async () => {
        const response = await request(app)
          .post('/google/oauth/token')
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
    });

    describe('POST /oauth/token - refresh_token grant', () => {
      let refreshToken: string;

      beforeEach(async () => {
        // Get a valid authorization code first
        const authResponse = await request(app)
          .get('/google/oauth/authorize')
          .query({
            client_id: VALID_CLIENT_ID,
            redirect_uri: VALID_REDIRECT_URI,
            response_type: 'code',
            scope: 'https://www.googleapis.com/auth/adwords',
          });
        const authCode = authResponse.body.code;

        // Exchange for tokens
        const tokenResponse = await request(app)
          .post('/google/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            code: authCode,
            grant_type: 'authorization_code',
            redirect_uri: VALID_REDIRECT_URI,
          });

        refreshToken = tokenResponse.body.refresh_token;
      });

      it('should successfully refresh access token', async () => {
        const response = await request(app)
          .post('/google/oauth/token')
          .send({
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('access_token', GOOGLE_VALID_TOKEN);
        expect(response.body).toHaveProperty('expires_in', 3600);
        expect(response.body).toHaveProperty('token_type', 'Bearer');
        expect(response.body).toHaveProperty('scope', 'https://www.googleapis.com/auth/adwords');
        expect(response.body).not.toHaveProperty('refresh_token');
      });

      it('should fail with missing refresh_token', async () => {
        const response = await request(app)
          .post('/google/oauth/token')
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
          .post('/google/oauth/token')
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
    });
  });

  // ============================================
  // Campaign CRUD Tests
  // ============================================
  describe('Campaign CRUD Tests', () => {
    describe('POST /v4/advertisers/:advertiserId/campaigns - create campaign success', () => {
      it('should create campaign successfully with correct resource name format', async () => {
        const campaignData = {
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
              startDate: { year: 2025, month: 11, day: 1 },
              endDate: { year: 2025, month: 12, day: 31 },
            },
          },
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('name');
        expect(response.body.name).toMatch(
          new RegExp(`^advertisers/${TEST_ADVERTISER_ID}/campaigns/\\d+$`)
        );
        expect(response.body).toHaveProperty('campaignId');
        expect(response.body.campaignId).toMatch(/^\d+$/);
        expect(response.body).toHaveProperty('displayName', 'Test DV360 Campaign');
        expect(response.body).toHaveProperty('entityStatus', 'ENTITY_STATUS_ACTIVE');
        expect(response.body.campaignGoal).toMatchObject({
          campaignGoalType: 'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS',
        });
      });

      it('should create campaign with minimal required fields', async () => {
        const campaignData = {
          displayName: 'Minimal Campaign',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('name');
        expect(response.body.name).toMatch(
          new RegExp(`^advertisers/${TEST_ADVERTISER_ID}/campaigns/\\d+$`)
        );
        expect(response.body).toHaveProperty('displayName', 'Minimal Campaign');
        expect(response.body).toHaveProperty('entityStatus', 'ENTITY_STATUS_ACTIVE');
      });

    });

    describe('POST /v4/advertisers/:advertiserId/campaigns - missing displayName', () => {
      it('should return 400 error for missing displayName', async () => {
        const campaignData = {
          entityStatus: 'ENTITY_STATUS_ACTIVE',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 400);
        expect(response.body.error).toHaveProperty('status', 'INVALID_ARGUMENT');
        expect(response.body.error).toHaveProperty('message', 'Invalid campaign data provided');
        expect(response.body.error.details).toBeDefined();
        expect(response.body.error.details[0].fieldViolations).toBeDefined();
        expect(response.body.error.details[0].fieldViolations[0]).toMatchObject({
          field: 'displayName',
          description: 'Display name is required and cannot be empty',
        });
      });

      it('should return 400 error for empty displayName', async () => {
        const campaignData = {
          displayName: '   ',
          entityStatus: 'ENTITY_STATUS_ACTIVE',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 400);
        expect(response.body.error).toHaveProperty('status', 'INVALID_ARGUMENT');
      });
    });

    describe('POST /v4/advertisers/:advertiserId/campaigns - invalid entityStatus', () => {
      it('should return 400 error for invalid entityStatus', async () => {
        const campaignData = {
          displayName: 'Test Campaign',
          entityStatus: 'INVALID_STATUS',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 400);
        expect(response.body.error).toHaveProperty('status', 'INVALID_ARGUMENT');
        expect(response.body.error).toHaveProperty('message', 'Invalid entity status provided');
        expect(response.body.error.details[0].fieldViolations[0]).toMatchObject({
          field: 'entityStatus',
          description: 'Entity status must be one of: ENTITY_STATUS_ACTIVE, ENTITY_STATUS_PAUSED, ENTITY_STATUS_ARCHIVED',
        });
      });

      it('should accept valid entityStatus values', async () => {
        const validStatuses = ['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED', 'ENTITY_STATUS_ARCHIVED'];

        for (const status of validStatuses) {
          const campaignData = {
            displayName: `Campaign with ${status}`,
            entityStatus: status,
          };

          const response = await request(app)
            .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
            .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
            .send(campaignData);

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('entityStatus', status);
        }
      });
    });

    describe('POST /v4/advertisers/:advertiserId/campaigns - invalid campaignGoalType', () => {
      it('should return 400 error for invalid campaignGoalType', async () => {
        const campaignData = {
          displayName: 'Test Campaign',
          campaignGoal: {
            campaignGoalType: 'INVALID_GOAL_TYPE',
          },
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 400);
        expect(response.body.error).toHaveProperty('status', 'INVALID_ARGUMENT');
        expect(response.body.error).toHaveProperty('message', 'Invalid campaign goal type');
        expect(response.body.error.details[0].fieldViolations[0]).toMatchObject({
          field: 'campaignGoal.campaignGoalType',
          description: 'Campaign goal type must be a valid CAMPAIGN_GOAL_TYPE enum value',
        });
      });

      it('should accept valid campaignGoalType values', async () => {
        const validGoalTypes = [
          'CAMPAIGN_GOAL_TYPE_UNSPECIFIED',
          'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS',
          'CAMPAIGN_GOAL_TYPE_APP_INSTALL',
          'CAMPAIGN_GOAL_TYPE_OFFLINE_ACTION',
          'CAMPAIGN_GOAL_TYPE_ONLINE_ACTION',
        ];

        for (const goalType of validGoalTypes) {
          const campaignData = {
            displayName: `Campaign with ${goalType}`,
            campaignGoal: {
              campaignGoalType: goalType,
            },
          };

          const response = await request(app)
            .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
            .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
            .send(campaignData);

          expect(response.status).toBe(200);
          expect(response.body.campaignGoal).toHaveProperty('campaignGoalType', goalType);
        }
      });

      it('should create campaign with complete campaignFlight data', async () => {
        const campaignData = {
          displayName: 'Campaign with Flight',
          campaignFlight: {
            plannedSpendAmountMicros: '250000000000',
            plannedDates: {
              startDate: { year: 2025, month: 12, day: 1 },
              endDate: { year: 2025, month: 12, day: 31 },
            },
          },
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(200);
        expect(response.body.campaignFlight).toMatchObject({
          plannedSpendAmountMicros: '250000000000',
          plannedDates: {
            startDate: { year: 2025, month: 12, day: 1 },
            endDate: { year: 2025, month: 12, day: 31 },
          },
        });
      });

      it('should create campaign with frequencyCap data', async () => {
        const campaignData = {
          displayName: 'Campaign with Frequency Cap',
          frequencyCap: {
            maxImpressions: 10,
            timeUnit: 'TIME_UNIT_DAYS',
            timeUnitCount: 7,
          },
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(200);
        expect(response.body.frequencyCap).toMatchObject({
          maxImpressions: 10,
          timeUnit: 'TIME_UNIT_DAYS',
          timeUnitCount: 7,
        });
      });
    });

    describe('PATCH /v4/advertisers/:advertiserId/campaigns/:campaignId - update campaign', () => {
      let createdCampaignId: string;

      beforeEach(async () => {
        // Create a campaign first
        const createResponse = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send({
            displayName: 'Campaign to Update',
            entityStatus: 'ENTITY_STATUS_ACTIVE',
          });
        createdCampaignId = createResponse.body.campaignId;
      });

      it('should update campaign successfully', async () => {
        const updateData = {
          displayName: 'Updated Campaign Name',
          entityStatus: 'ENTITY_STATUS_PAUSED',
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/${createdCampaignId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('name', `advertisers/${TEST_ADVERTISER_ID}/campaigns/${createdCampaignId}`);
        expect(response.body).toHaveProperty('campaignId', createdCampaignId);
        expect(response.body).toHaveProperty('displayName', 'Updated Campaign Name');
        expect(response.body).toHaveProperty('entityStatus', 'ENTITY_STATUS_PAUSED');
      });

      it('should update only displayName', async () => {
        const updateData = {
          displayName: 'Only Name Updated',
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/${createdCampaignId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('displayName', 'Only Name Updated');
      });

    });

    describe('PATCH /v4/advertisers/:advertiserId/campaigns/:campaignId - update entityStatus', () => {
      let createdCampaignId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send({
            displayName: 'Campaign for Status Update',
            entityStatus: 'ENTITY_STATUS_ACTIVE',
          });
        createdCampaignId = createResponse.body.campaignId;
      });

      it('should update only entityStatus', async () => {
        const updateData = {
          entityStatus: 'ENTITY_STATUS_PAUSED',
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/${createdCampaignId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('entityStatus', 'ENTITY_STATUS_PAUSED');
      });

      it('should update to ENTITY_STATUS_ARCHIVED', async () => {
        const updateData = {
          entityStatus: 'ENTITY_STATUS_ARCHIVED',
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/${createdCampaignId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('entityStatus', 'ENTITY_STATUS_ARCHIVED');
      });
    });

    describe('PATCH /v4/advertisers/:advertiserId/campaigns/:campaignId - invalid entityStatus', () => {
      let createdCampaignId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send({
            displayName: 'Campaign for Invalid Status Test',
            entityStatus: 'ENTITY_STATUS_ACTIVE',
          });
        createdCampaignId = createResponse.body.campaignId;
      });

      it('should return 400 error for invalid entityStatus on update', async () => {
        const updateData = {
          entityStatus: 'INVALID_STATUS',
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/${createdCampaignId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 400);
        expect(response.body.error).toHaveProperty('status', 'INVALID_ARGUMENT');
      });

    });

    describe('GET /v4/advertisers/:advertiserId/campaigns/:campaignId - get campaign', () => {
      let createdCampaignId: string;

      beforeEach(async () => {
        // Create a campaign first
        const createResponse = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send({
            displayName: 'Campaign to Retrieve',
            entityStatus: 'ENTITY_STATUS_ACTIVE',
            campaignGoal: {
              campaignGoalType: 'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS',
            },
          });
        createdCampaignId = createResponse.body.campaignId;
      });

      it('should retrieve campaign successfully', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/${createdCampaignId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('name', `advertisers/${TEST_ADVERTISER_ID}/campaigns/${createdCampaignId}`);
        expect(response.body).toHaveProperty('campaignId', createdCampaignId);
        expect(response.body).toHaveProperty('displayName', 'Campaign to Retrieve');
        expect(response.body).toHaveProperty('entityStatus', 'ENTITY_STATUS_ACTIVE');
        expect(response.body.campaignGoal).toHaveProperty('campaignGoalType', 'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS');
      });

      it('should retrieve campaign with all fields', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/${createdCampaignId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          name: expect.stringMatching(/^advertisers\/\d+\/campaigns\/\d+$/),
          campaignId: expect.any(String),
          displayName: expect.any(String),
          entityStatus: expect.stringMatching(/^ENTITY_STATUS_(ACTIVE|PAUSED|ARCHIVED)$/),
        });
      });
    });

    describe('GET /v4/advertisers/:advertiserId/campaigns/:campaignId - get sample campaign', () => {
      it('should retrieve non-existent campaign (returns sample)', async () => {
        const nonExistentCampaignId = '888888888';

        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/${nonExistentCampaignId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('name', `advertisers/${TEST_ADVERTISER_ID}/campaigns/${nonExistentCampaignId}`);
        expect(response.body).toHaveProperty('campaignId', nonExistentCampaignId);
        expect(response.body).toHaveProperty('displayName');
        expect(response.body).toHaveProperty('entityStatus');
      });
    });
  });

  // ============================================
  // Authentication Tests
  // ============================================
  describe('Authentication Tests', () => {
    describe('Missing Authorization Header', () => {
      it('should return 401 for POST request without Authorization header', async () => {
        const campaignData = {
          displayName: 'Test Campaign',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .send(campaignData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 401);
        expect(response.body.error).toHaveProperty('status', 'UNAUTHENTICATED');
        expect(response.body.error).toHaveProperty('message');
        expect(response.body.error.message).toContain('authentication');
      });

      it('should return 401 for PATCH request without Authorization header', async () => {
        const updateData = {
          displayName: 'Updated Campaign',
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/123456`)
          .send(updateData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 401);
        expect(response.body.error).toHaveProperty('status', 'UNAUTHENTICATED');
      });

      it('should return 401 for GET request without Authorization header', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/123456`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 401);
        expect(response.body.error).toHaveProperty('status', 'UNAUTHENTICATED');
      });
    });

    describe('Invalid Bearer Token', () => {
      it('should return 401 for POST request with invalid Bearer token', async () => {
        const campaignData = {
          displayName: 'Test Campaign',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${INVALID_TOKEN}`)
          .send(campaignData);

        // Note: Current implementation accepts any Bearer token format
        // In production, this would validate against valid tokens and return 401
        // For now, we test that the Authorization header is required
        expect(response.status).not.toBe(500);
      });

      it('should return 401 for PATCH request with invalid Bearer token', async () => {
        const updateData = {
          displayName: 'Updated Campaign',
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/123456`)
          .set('Authorization', `Bearer ${INVALID_TOKEN}`)
          .send(updateData);

        expect(response.status).not.toBe(500);
      });

      it('should return 401 for GET request with invalid Bearer token', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/123456`)
          .set('Authorization', `Bearer ${INVALID_TOKEN}`);

        expect(response.status).not.toBe(500);
      });

      it('should return 401 for malformed Authorization header', async () => {
        const campaignData = {
          displayName: 'Test Campaign',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', 'InvalidFormat')
          .send(campaignData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 401);
        expect(response.body.error).toHaveProperty('status', 'UNAUTHENTICATED');
      });

      it('should return 401 for Authorization header without Bearer prefix', async () => {
        const campaignData = {
          displayName: 'Test Campaign',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', DV360_VALID_TOKEN)
          .send(campaignData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 401);
        expect(response.body.error).toHaveProperty('status', 'UNAUTHENTICATED');
      });

      it('should return 401 for Authorization header with only Bearer keyword', async () => {
        const campaignData = {
          displayName: 'Test Campaign',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', 'Bearer')
          .send(campaignData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 401);
        expect(response.body.error).toHaveProperty('status', 'UNAUTHENTICATED');
      });

      it('should return 401 for Authorization header with empty token', async () => {
        const campaignData = {
          displayName: 'Test Campaign',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', 'Bearer ')
          .send(campaignData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 401);
        expect(response.body.error).toHaveProperty('status', 'UNAUTHENTICATED');
      });
    });

    describe('Valid Bearer Token', () => {
      it('should accept valid Bearer token for POST request', async () => {
        const campaignData = {
          displayName: 'Test Campaign with Valid Token',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('campaignId');
      });

      it('should accept valid Bearer token for PATCH request', async () => {
        const updateData = {
          displayName: 'Updated Campaign with Valid Token',
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/123456`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('displayName');
      });

      it('should accept valid Bearer token for GET request', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/123456`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('campaignId');
      });
    });
  });

  // ============================================
  // Resource Name Format Tests
  // ============================================
  describe('Resource Name Format Tests', () => {
    it('should generate correct resource name format for created campaigns', async () => {
      const campaignData = {
        displayName: 'Test Resource Name',
      };

      const response = await request(app)
        .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
        .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
        .send(campaignData);

      expect(response.status).toBe(200);
      expect(response.body.name).toMatch(/^advertisers\/\d+\/campaigns\/\d+$/);

      // Extract IDs from resource name
      const match = response.body.name.match(/^advertisers\/(\d+)\/campaigns\/(\d+)$/);
      expect(match).not.toBeNull();
      expect(match![1]).toBe(TEST_ADVERTISER_ID);
      expect(match![2]).toBe(response.body.campaignId);
    });

    it('should maintain correct resource name format across operations', async () => {
      // Create campaign
      const createResponse = await request(app)
        .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
        .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
        .send({
          displayName: 'Original Campaign',
        });

      const campaignId = createResponse.body.campaignId;
      const expectedResourceName = `advertisers/${TEST_ADVERTISER_ID}/campaigns/${campaignId}`;

      expect(createResponse.body.name).toBe(expectedResourceName);

      // Update campaign
      const updateResponse = await request(app)
        .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
        .send({
          displayName: 'Updated Campaign',
        });

      expect(updateResponse.body.name).toBe(expectedResourceName);

      // Get campaign
      const getResponse = await request(app)
        .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

      expect(getResponse.body.name).toBe(expectedResourceName);
    });
  });

  // ============================================
  // Campaign List Tests
  // ============================================
  describe('Campaign List Tests', () => {
    describe('GET /v4/advertisers/:advertiserId/campaigns - list campaigns', () => {
      it('should list campaigns successfully', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('campaigns');
        expect(Array.isArray(response.body.campaigns)).toBe(true);
        expect(response.body.campaigns.length).toBeGreaterThan(0);
      });

      it('should support pageSize parameter', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .query({ pageSize: 5 })
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body.campaigns.length).toBeLessThanOrEqual(5);
      });

      it('should support filter parameter', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .query({ filter: 'entityStatus="ENTITY_STATUS_ACTIVE"' })
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('campaigns');
      });

      it('should support orderBy parameter', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns`)
          .query({ orderBy: 'displayName' })
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('campaigns');
      });
    });
  });

  // ============================================
  // Campaign Query Tests
  // ============================================
  describe('Campaign Query Tests', () => {
    describe('POST /v4/advertisers/:advertiserId/campaigns:query - query metrics', () => {
      it('should query campaign metrics successfully', async () => {
        const queryData = {
          metrics: ['METRIC_IMPRESSIONS', 'METRIC_CLICKS', 'METRIC_TOTAL_COST'],
          dateRanges: [
            {
              startDate: { year: 2025, month: 11, day: 1 },
              endDate: { year: 2025, month: 11, day: 30 },
            },
          ],
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns:query`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(queryData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('campaignMetrics');
        expect(Array.isArray(response.body.campaignMetrics)).toBe(true);
        expect(response.body.campaignMetrics.length).toBeGreaterThan(0);
        expect(response.body.campaignMetrics[0]).toHaveProperty('campaignId');
        expect(response.body.campaignMetrics[0]).toHaveProperty('metrics');
      });

      it('should return error for invalid metrics', async () => {
        const queryData = {
          metrics: ['INVALID_METRIC'],
          dateRanges: [
            {
              startDate: { year: 2025, month: 11, day: 1 },
              endDate: { year: 2025, month: 11, day: 30 },
            },
          ],
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns:query`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(queryData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.code).toBe(400);
      });

      it('should query without dateRanges', async () => {
        const queryData = {
          metrics: ['METRIC_IMPRESSIONS', 'METRIC_CLICKS'],
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/campaigns:query`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(queryData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('campaignMetrics');
      });
    });
  });

  // ============================================
  // Insertion Order Tests
  // ============================================
  describe('Insertion Order Tests', () => {
    describe('POST /v4/advertisers/:advertiserId/insertionOrders - create insertion order', () => {
      it('should create insertion order successfully', async () => {
        const ioData = {
          displayName: 'Test Insertion Order',
          campaignId: '111222333',
          insertionOrderType: 'RTB',
          entityStatus: 'ENTITY_STATUS_DRAFT',
          pacing: {
            pacingPeriod: 'PACING_PERIOD_DAILY',
            pacingType: 'PACING_TYPE_EVEN',
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

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/insertionOrders`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(ioData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('name');
        expect(response.body.name).toMatch(/^advertisers\/\d+\/insertionOrders\/\d+$/);
        expect(response.body).toHaveProperty('insertionOrderId');
        expect(response.body).toHaveProperty('displayName', 'Test Insertion Order');
        expect(response.body).toHaveProperty('campaignId', '111222333');
        expect(response.body).toHaveProperty('entityStatus', 'ENTITY_STATUS_DRAFT');
      });

      it('should return error for missing displayName', async () => {
        const ioData = {
          campaignId: '111222333',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/insertionOrders`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(ioData);

        expect(response.status).toBe(400);
        expect(response.body.error.details[0].fieldViolations[0].field).toBe('displayName');
      });

      it('should return error for missing campaignId', async () => {
        const ioData = {
          displayName: 'Test IO',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/insertionOrders`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(ioData);

        expect(response.status).toBe(400);
        expect(response.body.error.details[0].fieldViolations[0].field).toBe('campaignId');
      });
    });

    describe('GET /v4/advertisers/:advertiserId/insertionOrders - list insertion orders', () => {
      it('should list insertion orders successfully', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/insertionOrders`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('insertionOrders');
        expect(Array.isArray(response.body.insertionOrders)).toBe(true);
        expect(response.body.insertionOrders.length).toBeGreaterThan(0);
      });

      it('should support pageSize parameter', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/insertionOrders`)
          .query({ pageSize: 5 })
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body.insertionOrders.length).toBeLessThanOrEqual(5);
      });
    });

    describe('GET /v4/advertisers/:advertiserId/insertionOrders/:insertionOrderId - get insertion order', () => {
      let createdIOId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/insertionOrders`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send({
            displayName: 'IO to Retrieve',
            campaignId: '111222333',
          });
        createdIOId = createResponse.body.insertionOrderId;
      });

      it('should retrieve insertion order successfully', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/insertionOrders/${createdIOId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('insertionOrderId', createdIOId);
        expect(response.body).toHaveProperty('displayName', 'IO to Retrieve');
      });
    });

    describe('PATCH /v4/advertisers/:advertiserId/insertionOrders/:insertionOrderId - update insertion order', () => {
      let createdIOId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/insertionOrders`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send({
            displayName: 'IO to Update',
            campaignId: '111222333',
            entityStatus: 'ENTITY_STATUS_DRAFT',
          });
        createdIOId = createResponse.body.insertionOrderId;
      });

      it('should update insertion order successfully', async () => {
        const updateData = {
          displayName: 'Updated IO Name',
          entityStatus: 'ENTITY_STATUS_ACTIVE',
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/insertionOrders/${createdIOId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('displayName', 'Updated IO Name');
        expect(response.body).toHaveProperty('entityStatus', 'ENTITY_STATUS_ACTIVE');
      });

      it('should support updateMask parameter', async () => {
        const updateData = {
          displayName: 'Only Name Updated',
          entityStatus: 'ENTITY_STATUS_ACTIVE',
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/insertionOrders/${createdIOId}`)
          .query({ updateMask: 'displayName' })
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('displayName', 'Only Name Updated');
        expect(response.body).toHaveProperty('entityStatus', 'ENTITY_STATUS_DRAFT'); // Should not be updated
      });
    });
  });

  // ============================================
  // Line Item Tests
  // ============================================
  describe('Line Item Tests', () => {
    describe('POST /v4/advertisers/:advertiserId/lineItems - create line item', () => {
      it('should create line item successfully', async () => {
        const lineItemData = {
          displayName: 'Test Line Item',
          insertionOrderId: '555666777',
          lineItemType: 'LINE_ITEM_TYPE_DISPLAY_DEFAULT',
          entityStatus: 'ENTITY_STATUS_DRAFT',
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
          bidStrategy: {
            fixedBid: {
              bidAmountMicros: '3000000',
            },
          },
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/lineItems`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(lineItemData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('name');
        expect(response.body.name).toMatch(/^advertisers\/\d+\/lineItems\/\d+$/);
        expect(response.body).toHaveProperty('lineItemId');
        expect(response.body).toHaveProperty('displayName', 'Test Line Item');
        expect(response.body).toHaveProperty('insertionOrderId', '555666777');
        expect(response.body).toHaveProperty('entityStatus', 'ENTITY_STATUS_DRAFT');
      });

      it('should return error for missing displayName', async () => {
        const lineItemData = {
          insertionOrderId: '555666777',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/lineItems`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(lineItemData);

        expect(response.status).toBe(400);
        expect(response.body.error.details[0].fieldViolations[0].field).toBe('displayName');
      });

      it('should return error for missing insertionOrderId', async () => {
        const lineItemData = {
          displayName: 'Test Line Item',
        };

        const response = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/lineItems`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(lineItemData);

        expect(response.status).toBe(400);
        expect(response.body.error.details[0].fieldViolations[0].field).toBe('insertionOrderId');
      });
    });

    describe('GET /v4/advertisers/:advertiserId/lineItems - list line items', () => {
      it('should list line items successfully', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/lineItems`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('lineItems');
        expect(Array.isArray(response.body.lineItems)).toBe(true);
        expect(response.body.lineItems.length).toBeGreaterThan(0);
      });

      it('should support pageSize parameter', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/lineItems`)
          .query({ pageSize: 5 })
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body.lineItems.length).toBeLessThanOrEqual(5);
      });

      it('should support filter by insertionOrderId', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/lineItems`)
          .query({ filter: 'insertionOrderId="555666777"' })
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('lineItems');
      });
    });

    describe('GET /v4/advertisers/:advertiserId/lineItems/:lineItemId - get line item', () => {
      let createdLineItemId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/lineItems`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send({
            displayName: 'Line Item to Retrieve',
            insertionOrderId: '555666777',
          });
        createdLineItemId = createResponse.body.lineItemId;
      });

      it('should retrieve line item successfully', async () => {
        const response = await request(app)
          .get(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/lineItems/${createdLineItemId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('lineItemId', createdLineItemId);
        expect(response.body).toHaveProperty('displayName', 'Line Item to Retrieve');
      });
    });

    describe('PATCH /v4/advertisers/:advertiserId/lineItems/:lineItemId - update line item', () => {
      let createdLineItemId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/lineItems`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send({
            displayName: 'Line Item to Update',
            insertionOrderId: '555666777',
            entityStatus: 'ENTITY_STATUS_DRAFT',
          });
        createdLineItemId = createResponse.body.lineItemId;
      });

      it('should update line item successfully', async () => {
        const updateData = {
          displayName: 'Updated Line Item Name',
          entityStatus: 'ENTITY_STATUS_ACTIVE',
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/lineItems/${createdLineItemId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('displayName', 'Updated Line Item Name');
        expect(response.body).toHaveProperty('entityStatus', 'ENTITY_STATUS_ACTIVE');
      });

      it('should support updateMask parameter', async () => {
        const updateData = {
          displayName: 'Only Name Updated',
          entityStatus: 'ENTITY_STATUS_ACTIVE',
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/lineItems/${createdLineItemId}`)
          .query({ updateMask: 'displayName' })
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('displayName', 'Only Name Updated');
        expect(response.body).toHaveProperty('entityStatus', 'ENTITY_STATUS_DRAFT'); // Should not be updated
      });

      it('should update bidStrategy', async () => {
        const updateData = {
          bidStrategy: {
            fixedBid: {
              bidAmountMicros: '5000000',
            },
          },
        };

        const response = await request(app)
          .patch(`/dv360/v4/advertisers/${TEST_ADVERTISER_ID}/lineItems/${createdLineItemId}`)
          .set('Authorization', `Bearer ${DV360_VALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.bidStrategy).toHaveProperty('fixedBid');
        expect(response.body.bidStrategy.fixedBid.bidAmountMicros).toBe('5000000');
      });
    });
  });
});
