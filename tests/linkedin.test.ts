import request from 'supertest';
import app from '../src/index';
import { campaignStore } from '../src/platforms/linkedin/mockData';

/**
 * LinkedIn Marketing API 202510 Test Suite
 *
 * Tests OAuth flow, Campaign CRUD operations, and authentication/headers validation
 * Valid token: mock_linkedin_access_token_ghijkl
 * Required header: Linkedin-Version: 202510
 */

const VALID_TOKEN = 'mock_linkedin_access_token_ghijkl';
const LINKEDIN_VERSION = '202510';
const VALID_CLIENT_ID = 'mock_linkedin_client_id_345678';
const VALID_CLIENT_SECRET = 'mock_linkedin_client_secret_901234';

describe('LinkedIn Marketing API 202510', () => {

  // Clear campaign store before each test to ensure clean state
  beforeEach(() => {
    campaignStore.clear();
  });

  // ============================================
  // OAuth Flow Tests
  // ============================================

  describe('OAuth Flow', () => {

    describe('GET /linkedin/oauth/v2/authorization', () => {

      it('should successfully authorize with valid parameters', async () => {
        const response = await request(app)
          .get('/linkedin/oauth/v2/authorization')
          .query({
            response_type: 'code',
            client_id: VALID_CLIENT_ID,
            redirect_uri: 'https://example.com/callback',
            scope: 'r_ads,rw_ads',
            state: 'random_state_123'
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('mock_linkedin_auth_code_123456');
        expect(response.body.state).toBe('random_state_123');
      });

      it('should authorize with rw_ads scope', async () => {
        const response = await request(app)
          .get('/linkedin/oauth/v2/authorization')
          .query({
            response_type: 'code',
            client_id: VALID_CLIENT_ID,
            redirect_uri: 'https://example.com/callback',
            scope: 'rw_ads,w_organization_social'
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('code');
      });

      it('should fail when response_type is missing', async () => {
        const response = await request(app)
          .get('/linkedin/oauth/v2/authorization')
          .query({
            client_id: VALID_CLIENT_ID,
            redirect_uri: 'https://example.com/callback',
            scope: 'r_ads'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('response_type');
      });

      it('should fail when response_type is not "code"', async () => {
        const response = await request(app)
          .get('/linkedin/oauth/v2/authorization')
          .query({
            response_type: 'token',
            client_id: VALID_CLIENT_ID,
            redirect_uri: 'https://example.com/callback',
            scope: 'r_ads'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('response_type must be "code"');
      });

      it('should fail when client_id is missing', async () => {
        const response = await request(app)
          .get('/linkedin/oauth/v2/authorization')
          .query({
            response_type: 'code',
            redirect_uri: 'https://example.com/callback',
            scope: 'r_ads'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('client_id');
      });

      it('should fail when redirect_uri is missing', async () => {
        const response = await request(app)
          .get('/linkedin/oauth/v2/authorization')
          .query({
            response_type: 'code',
            client_id: VALID_CLIENT_ID,
            scope: 'r_ads'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('redirect_uri');
      });

      it('should fail when scope is missing', async () => {
        const response = await request(app)
          .get('/linkedin/oauth/v2/authorization')
          .query({
            response_type: 'code',
            client_id: VALID_CLIENT_ID,
            redirect_uri: 'https://example.com/callback'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('scope');
      });

      it('should fail when client_id is invalid', async () => {
        const response = await request(app)
          .get('/linkedin/oauth/v2/authorization')
          .query({
            response_type: 'code',
            client_id: 'invalid_client_id',
            redirect_uri: 'https://example.com/callback',
            scope: 'r_ads'
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'invalid_client');
        expect(response.body.error_description).toContain('Invalid client_id');
      });

      it('should fail when scope does not include required permissions', async () => {
        const response = await request(app)
          .get('/linkedin/oauth/v2/authorization')
          .query({
            response_type: 'code',
            client_id: VALID_CLIENT_ID,
            redirect_uri: 'https://example.com/callback',
            scope: 'r_basicprofile,w_member_social'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_scope');
        expect(response.body.error_description).toContain('r_ads or rw_ads');
      });
    });

    describe('POST /oauth/v2/accessToken', () => {

      it('should exchange authorization code for access token', async () => {
        const response = await request(app)
          .post('/linkedin/oauth/v2/accessToken')
          .type('form')
          .send({
            grant_type: 'authorization_code',
            code: 'mock_linkedin_auth_code_123456',
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            redirect_uri: 'https://example.com/callback'
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('access_token', VALID_TOKEN);
        expect(response.body).toHaveProperty('expires_in', 5184000);
        expect(response.body).toHaveProperty('scope');
        expect(response.body.scope).toContain('r_ads');
      });

      it('should fail with invalid Content-Type', async () => {
        const response = await request(app)
          .post('/linkedin/oauth/v2/accessToken')
          .set('Content-Type', 'application/json')
          .send({
            grant_type: 'authorization_code',
            code: 'mock_linkedin_auth_code_123456',
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            redirect_uri: 'https://example.com/callback'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('Content-Type');
      });

      it('should fail when grant_type is missing', async () => {
        const response = await request(app)
          .post('/linkedin/oauth/v2/accessToken')
          .type('form')
          .send({
            code: 'mock_linkedin_auth_code_123456',
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            redirect_uri: 'https://example.com/callback'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'unsupported_grant_type');
      });

      it('should fail when grant_type is not "authorization_code"', async () => {
        const response = await request(app)
          .post('/linkedin/oauth/v2/accessToken')
          .type('form')
          .send({
            grant_type: 'client_credentials',
            code: 'mock_linkedin_auth_code_123456',
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            redirect_uri: 'https://example.com/callback'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'unsupported_grant_type');
      });

      it('should fail when code is missing', async () => {
        const response = await request(app)
          .post('/linkedin/oauth/v2/accessToken')
          .type('form')
          .send({
            grant_type: 'authorization_code',
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            redirect_uri: 'https://example.com/callback'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('code');
      });

      it('should fail when client_id is missing', async () => {
        const response = await request(app)
          .post('/linkedin/oauth/v2/accessToken')
          .type('form')
          .send({
            grant_type: 'authorization_code',
            code: 'mock_linkedin_auth_code_123456',
            client_secret: VALID_CLIENT_SECRET,
            redirect_uri: 'https://example.com/callback'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('client_id');
      });

      it('should fail when client_secret is missing', async () => {
        const response = await request(app)
          .post('/linkedin/oauth/v2/accessToken')
          .type('form')
          .send({
            grant_type: 'authorization_code',
            code: 'mock_linkedin_auth_code_123456',
            client_id: VALID_CLIENT_ID,
            redirect_uri: 'https://example.com/callback'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('client_secret');
      });

      it('should fail when redirect_uri is missing', async () => {
        const response = await request(app)
          .post('/linkedin/oauth/v2/accessToken')
          .type('form')
          .send({
            grant_type: 'authorization_code',
            code: 'mock_linkedin_auth_code_123456',
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('redirect_uri');
      });

      it('should fail with invalid client_id', async () => {
        const response = await request(app)
          .post('/linkedin/oauth/v2/accessToken')
          .type('form')
          .send({
            grant_type: 'authorization_code',
            code: 'mock_linkedin_auth_code_123456',
            client_id: 'invalid_client_id',
            client_secret: VALID_CLIENT_SECRET,
            redirect_uri: 'https://example.com/callback'
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'invalid_client');
        expect(response.body.error_description).toContain('Invalid client_id');
      });

      it('should fail with invalid client_secret', async () => {
        const response = await request(app)
          .post('/linkedin/oauth/v2/accessToken')
          .type('form')
          .send({
            grant_type: 'authorization_code',
            code: 'mock_linkedin_auth_code_123456',
            client_id: VALID_CLIENT_ID,
            client_secret: 'invalid_secret',
            redirect_uri: 'https://example.com/callback'
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'invalid_client');
        expect(response.body.error_description).toContain('Invalid client_secret');
      });

      it('should fail with invalid authorization code', async () => {
        const response = await request(app)
          .post('/linkedin/oauth/v2/accessToken')
          .type('form')
          .send({
            grant_type: 'authorization_code',
            code: 'invalid_code_12345',
            client_id: VALID_CLIENT_ID,
            client_secret: VALID_CLIENT_SECRET,
            redirect_uri: 'https://example.com/callback'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_grant');
        expect(response.body.error_description).toContain('Invalid authorization code');
      });
    });
  });

  // ============================================
  // Authentication & Headers Tests
  // ============================================

  describe('Authentication & Headers', () => {

    describe('Authorization Header Validation', () => {

      it('should return 401 when Authorization header is missing', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('status', 401);
        expect(response.body).toHaveProperty('serviceErrorCode', 401);
        expect(response.body.message).toContain('Missing Authorization header');
      });

      it('should return 401 when Authorization header format is invalid', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', 'InvalidFormat token123')
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('status', 401);
        expect(response.body.message).toContain('Invalid Authorization header format');
      });

      it('should return 401 when Bearer token is missing', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', 'Bearer ')
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('status', 401);
        expect(response.body).toHaveProperty('serviceErrorCode', 401);
      });

      it('should return 401 when Bearer token is invalid', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', 'Bearer invalid_token_12345')
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('status', 401);
        expect(response.body).toHaveProperty('serviceErrorCode', 401);
        expect(response.body).toHaveProperty('message', 'Invalid access token');
      });

      it('should accept valid Bearer token', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        // Should not get 401, should get 201 or other validation error
        expect(response.status).not.toBe(401);
      });
    });

    describe('Linkedin-Version Header Validation', () => {

      it('should return 400 when Linkedin-Version header is missing', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('status', 400);
        expect(response.body).toHaveProperty('serviceErrorCode', 400);
        expect(response.body.message).toContain('Missing required header: Linkedin-Version');
      });

      it('should return 400 when Linkedin-Version header is invalid', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', '202409')
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('status', 400);
        expect(response.body).toHaveProperty('serviceErrorCode', 400);
        expect(response.body.message).toContain('Invalid Linkedin-Version header. Expected: 202510');
      });

      it('should accept valid Linkedin-Version header', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        // Should not get 400 for version error
        expect(response.status).not.toBe(400);
        if (response.body.message) {
          expect(response.body.message).not.toContain('Linkedin-Version');
        }
      });
    });
  });

  // ============================================
  // Campaign CRUD Tests
  // ============================================

  describe('Campaign CRUD Operations', () => {

    describe('POST /rest/adCampaigns - Create Campaign', () => {

      it('should create campaign successfully with valid URN format', async () => {
        const campaignData = {
          account: 'urn:li:sponsoredAccount:123456',
          name: 'Test Campaign',
          type: 'TEXT_AD',
          status: 'ACTIVE',
          dailyBudget: {
            amount: '50',
            currencyCode: 'USD'
          }
        };

        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send(campaignData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.id).toMatch(/^urn:li:sponsoredCampaign:\d+$/);
        expect(response.body).toHaveProperty('account', campaignData.account);
        expect(response.body).toHaveProperty('name', campaignData.name);
        expect(response.body).toHaveProperty('type', campaignData.type);
        expect(response.body).toHaveProperty('status', campaignData.status);
        expect(response.body).toHaveProperty('dailyBudget');
        expect(response.body.dailyBudget).toEqual(campaignData.dailyBudget);
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('lastModifiedAt');
      });

      it('should create campaign with total budget', async () => {
        const campaignData = {
          account: 'urn:li:sponsoredAccount:789',
          name: 'Campaign with Total Budget',
          type: 'SPONSORED_UPDATES',
          status: 'ACTIVE',
          totalBudget: {
            amount: '10000',
            currencyCode: 'USD'
          }
        };

        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send(campaignData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('totalBudget');
        expect(response.body.totalBudget).toEqual(campaignData.totalBudget);
      });

      it('should create campaign with both daily and total budget', async () => {
        const campaignData = {
          account: 'urn:li:sponsoredAccount:111',
          name: 'Full Budget Campaign',
          type: 'DYNAMIC',
          status: 'PAUSED',
          dailyBudget: {
            amount: '100',
            currencyCode: 'USD'
          },
          totalBudget: {
            amount: '5000',
            currencyCode: 'USD'
          }
        };

        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send(campaignData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('dailyBudget');
        expect(response.body).toHaveProperty('totalBudget');
      });

      it('should fail when account field is missing', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('status', 400);
        expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
        expect(response.body.message).toContain('Missing required field');
        expect(response.body.details[0].field).toBe('account');
      });

      it('should fail when name field is missing', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(400);
        expect(response.body.details[0].field).toBe('name');
      });

      it('should fail when type field is missing', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(400);
        expect(response.body.details[0].field).toBe('type');
      });

      it('should fail when status field is missing', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD'
          });

        expect(response.status).toBe(400);
        expect(response.body.details[0].field).toBe('status');
      });

      it('should fail with invalid account URN format - missing prefix', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: '123456',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
        expect(response.body.message).toContain('Invalid account URN format');
        expect(response.body.details[0].field).toBe('account');
        expect(response.body.details[0].message).toContain('urn:li:sponsoredAccount:');
      });

      it('should fail with invalid account URN format - wrong entity type', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:organization:123456',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid account URN format');
      });

      it('should fail with invalid account URN format - non-numeric ID', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:abc123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid account URN format');
      });

      it('should fail with invalid campaign type', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'INVALID_TYPE',
            status: 'ACTIVE'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
        expect(response.body.message).toContain('Invalid campaign type');
        expect(response.body.details[0].field).toBe('type');
        expect(response.body.details[0].message).toContain('TEXT_AD');
        expect(response.body.details[0].message).toContain('SPONSORED_UPDATES');
        expect(response.body.details[0].message).toContain('SPONSORED_INMAILS');
        expect(response.body.details[0].message).toContain('DYNAMIC');
      });

      it('should fail with invalid campaign status', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'RUNNING'
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid campaign status');
        expect(response.body.details[0].message).toContain('ACTIVE');
        expect(response.body.details[0].message).toContain('PAUSED');
        expect(response.body.details[0].message).toContain('ARCHIVED');
      });

      it('should fail when daily budget is missing amount', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE',
            dailyBudget: {
              currencyCode: 'USD'
            }
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid budget format');
        expect(response.body.details[0].field).toBe('dailyBudget');
      });

      it('should fail when daily budget is missing currencyCode', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE',
            dailyBudget: {
              amount: '50'
            }
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid budget format');
      });

      it('should fail when daily budget amount is not a number', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE',
            dailyBudget: {
              amount: 'invalid',
              currencyCode: 'USD'
            }
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid budget amount');
      });

      it('should fail when daily budget amount is zero', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE',
            dailyBudget: {
              amount: '0',
              currencyCode: 'USD'
            }
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid budget amount');
      });

      it('should fail when daily budget amount is negative', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Test Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE',
            dailyBudget: {
              amount: '-10',
              currencyCode: 'USD'
            }
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid budget amount');
      });

      it('should create campaign with all valid campaign types', async () => {
        const types = ['TEXT_AD', 'SPONSORED_UPDATES', 'SPONSORED_INMAILS', 'DYNAMIC'];

        for (const type of types) {
          const response = await request(app)
            .post('/linkedin/rest/adCampaigns')
            .set('Authorization', `Bearer ${VALID_TOKEN}`)
            .set('Linkedin-Version', LINKEDIN_VERSION)
            .send({
              account: 'urn:li:sponsoredAccount:123',
              name: `${type} Campaign`,
              type: type,
              status: 'ACTIVE'
            });

          expect(response.status).toBe(201);
          expect(response.body.type).toBe(type);
        }
      });

      it('should create campaign with all valid statuses', async () => {
        const statuses = ['ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED', 'CANCELED'];

        for (const status of statuses) {
          const response = await request(app)
            .post('/linkedin/rest/adCampaigns')
            .set('Authorization', `Bearer ${VALID_TOKEN}`)
            .set('Linkedin-Version', LINKEDIN_VERSION)
            .send({
              account: 'urn:li:sponsoredAccount:123',
              name: `${status} Campaign`,
              type: 'TEXT_AD',
              status: status
            });

          expect(response.status).toBe(201);
          expect(response.body.status).toBe(status);
        }
      });
    });

    describe('GET /rest/adCampaigns/:id - Get Campaign', () => {

      it('should retrieve campaign by valid URN', async () => {
        // First create a campaign
        const createResponse = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Retrievable Campaign',
            type: 'TEXT_AD',
            status: 'ACTIVE',
            dailyBudget: {
              amount: '75',
              currencyCode: 'USD'
            }
          });

        const campaignId = createResponse.body.id;

        // Now retrieve it
        const response = await request(app)
          .get(`/linkedin/rest/adCampaigns/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', campaignId);
        expect(response.body).toHaveProperty('name', 'Retrievable Campaign');
        expect(response.body).toHaveProperty('type', 'TEXT_AD');
        expect(response.body).toHaveProperty('status', 'ACTIVE');
        expect(response.body.dailyBudget.amount).toBe('75');
      });

      it('should return 404 for non-existent campaign', async () => {
        const response = await request(app)
          .get('/linkedin/rest/adCampaigns/urn:li:sponsoredCampaign:999999')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('status', 404);
        expect(response.body).toHaveProperty('serviceErrorCode', 404);
        expect(response.body.message).toContain('Campaign not found');
      });

      it('should fail with invalid campaign URN format', async () => {
        const response = await request(app)
          .get('/linkedin/rest/adCampaigns/invalid_urn')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid campaign URN format');
        expect(response.body.details[0].message).toContain('urn:li:sponsoredCampaign:');
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .get('/linkedin/rest/adCampaigns/urn:li:sponsoredCampaign:123')
          .set('Linkedin-Version', LINKEDIN_VERSION);

        expect(response.status).toBe(401);
      });

      it('should require version header', async () => {
        const response = await request(app)
          .get('/linkedin/rest/adCampaigns/urn:li:sponsoredCampaign:123')
          .set('Authorization', `Bearer ${VALID_TOKEN}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Linkedin-Version');
      });
    });

    describe('POST /rest/adCampaigns/:id - Update Campaign', () => {

      let campaignId: string;

      beforeEach(async () => {
        // Create a campaign to update
        const createResponse = await request(app)
          .post('/linkedin/rest/adCampaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:123',
            name: 'Original Campaign Name',
            type: 'TEXT_AD',
            status: 'ACTIVE',
            dailyBudget: {
              amount: '50',
              currencyCode: 'USD'
            }
          });

        campaignId = createResponse.body.id;
      });

      it('should update campaign name', async () => {
        const response = await request(app)
          .post(`/linkedin/rest/adCampaigns/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            name: 'Updated Campaign Name'
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', campaignId);
        expect(response.body).toHaveProperty('name', 'Updated Campaign Name');
        expect(response.body.lastModifiedAt).toBeGreaterThan(response.body.createdAt);
      });

      it('should update campaign status', async () => {
        const response = await request(app)
          .post(`/linkedin/rest/adCampaigns/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            status: 'PAUSED'
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'PAUSED');
      });

      it('should update daily budget', async () => {
        const response = await request(app)
          .post(`/linkedin/rest/adCampaigns/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            dailyBudget: {
              amount: '100',
              currencyCode: 'USD'
            }
          });

        expect(response.status).toBe(200);
        expect(response.body.dailyBudget.amount).toBe('100');
      });

      it('should update multiple fields at once', async () => {
        const response = await request(app)
          .post(`/linkedin/rest/adCampaigns/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            name: 'Multi-Update Campaign',
            status: 'ARCHIVED',
            dailyBudget: {
              amount: '150',
              currencyCode: 'USD'
            }
          });

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Multi-Update Campaign');
        expect(response.body.status).toBe('ARCHIVED');
        expect(response.body.dailyBudget.amount).toBe('150');
      });

      it('should not change campaign ID during update', async () => {
        const response = await request(app)
          .post(`/linkedin/rest/adCampaigns/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            id: 'urn:li:sponsoredCampaign:999999',
            name: 'Attempt ID Change'
          });

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(campaignId); // ID should not change
      });

      it('should not change account during update', async () => {
        const response = await request(app)
          .post(`/linkedin/rest/adCampaigns/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            account: 'urn:li:sponsoredAccount:999',
            name: 'Attempt Account Change'
          });

        expect(response.status).toBe(200);
        expect(response.body.account).toBe('urn:li:sponsoredAccount:123'); // Account should not change
      });

      it('should return 404 for non-existent campaign', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns/urn:li:sponsoredCampaign:999999')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            name: 'Update Non-Existent'
          });

        expect(response.status).toBe(404);
        expect(response.body.message).toContain('Campaign not found');
      });

      it('should fail with invalid campaign URN format', async () => {
        const response = await request(app)
          .post('/linkedin/rest/adCampaigns/invalid_urn')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            name: 'Update with Invalid URN'
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid campaign URN format');
      });

      it('should fail when updating with invalid campaign type', async () => {
        const response = await request(app)
          .post(`/linkedin/rest/adCampaigns/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            type: 'INVALID_TYPE'
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid campaign type');
      });

      it('should fail when updating with invalid status', async () => {
        const response = await request(app)
          .post(`/linkedin/rest/adCampaigns/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            status: 'INVALID_STATUS'
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid campaign status');
      });

      it('should fail when updating with invalid budget format', async () => {
        const response = await request(app)
          .post(`/linkedin/rest/adCampaigns/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            dailyBudget: {
              amount: '0',
              currencyCode: 'USD'
            }
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid budget amount');
      });

      it('should require authentication for update', async () => {
        const response = await request(app)
          .post(`/linkedin/rest/adCampaigns/${campaignId}`)
          .set('Linkedin-Version', LINKEDIN_VERSION)
          .send({
            name: 'Unauthorized Update'
          });

        expect(response.status).toBe(401);
      });

      it('should require version header for update', async () => {
        const response = await request(app)
          .post(`/linkedin/rest/adCampaigns/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            name: 'No Version Header Update'
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Linkedin-Version');
      });
    });
  });
});
