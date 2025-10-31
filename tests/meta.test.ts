import request from 'supertest';
import app from '../src/index';

describe('Meta Marketing API v23.0', () => {
  const VALID_TOKEN = 'mock_meta_access_token_abcdef';
  const INVALID_TOKEN = 'invalid_token_xyz';
  const CLIENT_ID = 'mock_meta_app_id_123456';
  const CLIENT_SECRET = 'mock_meta_app_secret_789012';
  const REDIRECT_URI = 'https://example.com/callback';

  // ============================================
  // OAuth Flow Tests
  // ============================================
  describe('OAuth Flow', () => {
    describe('GET /meta/v23.0/dialog/oauth', () => {
      it('should successfully authorize with valid parameters', async () => {
        const response = await request(app)
          .get('/meta/v23.0/dialog/oauth')
          .query({
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            response_type: 'code',
            scope: 'ads_management',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('authorization_code');
        expect(response.body).toHaveProperty('redirect_url');
        expect(response.body).toHaveProperty('message');
        expect(response.body.authorization_code).toMatch(/^mock_auth_code_\d+$/);
        expect(response.body.redirect_url).toContain(REDIRECT_URI);
        expect(response.body.redirect_url).toContain('code=');
      });

      it('should fail when missing client_id', async () => {
        const response = await request(app)
          .get('/meta/v23.0/dialog/oauth')
          .query({
            redirect_uri: REDIRECT_URI,
            response_type: 'code',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Missing required parameters');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
      });

      it('should fail when missing redirect_uri', async () => {
        const response = await request(app)
          .get('/meta/v23.0/dialog/oauth')
          .query({
            client_id: CLIENT_ID,
            response_type: 'code',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Missing required parameters');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
      });

      it('should fail when missing response_type', async () => {
        const response = await request(app)
          .get('/meta/v23.0/dialog/oauth')
          .query({
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Missing required parameters');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
      });

      it('should fail with invalid response_type', async () => {
        const response = await request(app)
          .get('/meta/v23.0/dialog/oauth')
          .query({
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            response_type: 'token',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid response_type');
        expect(response.body.error.message).toContain('Must be "code"');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
      });

      it('should fail with invalid client_id', async () => {
        const response = await request(app)
          .get('/meta/v23.0/dialog/oauth')
          .query({
            client_id: 'invalid_client_id',
            redirect_uri: REDIRECT_URI,
            response_type: 'code',
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toBe('Invalid client_id');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(190);
      });
    });

    describe('GET /v23.0/oauth/access_token', () => {
      it('should exchange authorization code for access token', async () => {
        const response = await request(app)
          .get('/meta/v23.0/oauth/access_token')
          .query({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: 'mock_auth_code_1234567890',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('token_type', 'bearer');
        expect(response.body).toHaveProperty('expires_in', 5184000);
        expect(response.body.access_token).toBe(VALID_TOKEN);
      });

      it('should generate app access token with client_credentials grant', async () => {
        const response = await request(app)
          .get('/meta/v23.0/oauth/access_token')
          .query({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('token_type', 'bearer');
        expect(response.body.access_token).toBe(VALID_TOKEN);
      });

      it('should fail when missing client_id', async () => {
        const response = await request(app)
          .get('/meta/v23.0/oauth/access_token')
          .query({
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: 'mock_auth_code_1234567890',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Missing required parameters');
        expect(response.body.error.message).toContain('client_id');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
      });

      it('should fail when missing client_secret', async () => {
        const response = await request(app)
          .get('/meta/v23.0/oauth/access_token')
          .query({
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            code: 'mock_auth_code_1234567890',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Missing required parameters');
        expect(response.body.error.message).toContain('client_secret');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
      });

      it('should fail with invalid client_id', async () => {
        const response = await request(app)
          .get('/meta/v23.0/oauth/access_token')
          .query({
            client_id: 'invalid_client_id',
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: 'mock_auth_code_1234567890',
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid client_id or client_secret');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(190);
      });

      it('should fail with invalid client_secret', async () => {
        const response = await request(app)
          .get('/meta/v23.0/oauth/access_token')
          .query({
            client_id: CLIENT_ID,
            client_secret: 'invalid_secret',
            redirect_uri: REDIRECT_URI,
            code: 'mock_auth_code_1234567890',
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid client_id or client_secret');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(190);
      });

      it('should fail when missing code for authorization code flow', async () => {
        const response = await request(app)
          .get('/meta/v23.0/oauth/access_token')
          .query({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Missing required parameters');
        expect(response.body.error.message).toContain('code');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
      });

      it('should fail with invalid authorization code format', async () => {
        const response = await request(app)
          .get('/meta/v23.0/oauth/access_token')
          .query({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: 'invalid_code_format',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid authorization code');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
      });
    });
  });

  // ============================================
  // Campaign CRUD Tests
  // ============================================
  describe('Campaign CRUD Operations', () => {
    describe('POST /v23.0/act_:adAccountId/campaigns', () => {
      const adAccountId = '123456789';

      it('should create campaign successfully with daily_budget', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(campaignData.name);
        expect(response.body.status).toBe(campaignData.status);
        expect(response.body.objective).toBe(campaignData.objective);
        expect(response.body.daily_budget).toBe(campaignData.daily_budget);
        expect(response.body.id).toMatch(/^1202100000\d{8}$/);
      });

      it('should create campaign successfully with lifetime_budget', async () => {
        const campaignData = {
          name: 'Lifetime Budget Campaign',
          objective: 'OUTCOME_SALES',
          status: 'ACTIVE',
          lifetime_budget: 100000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(campaignData.name);
        expect(response.body.status).toBe(campaignData.status);
        expect(response.body.objective).toBe(campaignData.objective);
        expect(response.body.lifetime_budget).toBe(campaignData.lifetime_budget);
      });

      it('should create campaign with special_ad_categories', async () => {
        const campaignData = {
          name: 'Special Ad Campaign',
          objective: 'OUTCOME_LEADS',
          status: 'PAUSED',
          daily_budget: 10000,
          special_ad_categories: ['HOUSING', 'EMPLOYMENT'],
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(campaignData.name);
      });

      it('should fail when missing name field', async () => {
        const campaignData = {
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toBe('Missing required field: name');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail when missing objective field', async () => {
        const campaignData = {
          name: 'Test Campaign',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toBe('Missing required field: objective');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail when missing status field', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          daily_budget: 5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toBe('Missing required field: status');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail with invalid objective', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'INVALID_OBJECTIVE',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid objective');
        expect(response.body.error.message).toContain('OUTCOME_AWARENESS');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail with invalid status', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'INVALID_STATUS',
          daily_budget: 5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid status');
        expect(response.body.error.message).toContain('ACTIVE');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail when missing both daily_budget and lifetime_budget', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Either daily_budget or lifetime_budget must be provided');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail with negative daily_budget', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: -5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid daily_budget');
        expect(response.body.error.message).toContain('positive number');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail with zero daily_budget', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 0,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        // When daily_budget is 0 (falsy), it's caught by the "must provide budget" check first
        expect(response.body.error.message).toContain('Either daily_budget or lifetime_budget must be provided');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail with negative lifetime_budget', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          lifetime_budget: -10000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid lifetime_budget');
        expect(response.body.error.message).toContain('positive number');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail with non-numeric daily_budget', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 'not_a_number',
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid daily_budget');
        expect(response.body.error.message).toContain('positive number');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });
    });

    describe('GET /v23.0/:campaignId', () => {
      it('should get existing campaign details', async () => {
        const campaignId = '120210000000000000';

        const response = await request(app)
          .get(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', campaignId);
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('objective');
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('created_time');
        expect(response.body).toHaveProperty('updated_time');
      });

      it('should get newly created campaign', async () => {
        // First create a campaign
        const campaignData = {
          name: 'Campaign to Retrieve',
          objective: 'OUTCOME_AWARENESS',
          status: 'ACTIVE',
          daily_budget: 7500,
        };

        const createResponse = await request(app)
          .post('/meta/v23.0/act_123456789/campaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        expect(createResponse.status).toBe(200);
        const campaignId = createResponse.body.id;

        // Then retrieve it
        const getResponse = await request(app)
          .get(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.id).toBe(campaignId);
        expect(getResponse.body.name).toBe(campaignData.name);
        expect(getResponse.body.objective).toBe(campaignData.objective);
        expect(getResponse.body.status).toBe(campaignData.status);
        expect(getResponse.body.daily_budget).toBe(campaignData.daily_budget);
      });

      it('should fail when campaign does not exist', async () => {
        const nonExistentCampaignId = '999999999999999999';

        const response = await request(app)
          .get(`/meta/v23.0/${nonExistentCampaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('not found');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });
    });

    describe('POST /v23.0/:campaignId', () => {
      it('should update campaign name', async () => {
        // First create a campaign
        const campaignData = {
          name: 'Original Name',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const createResponse = await request(app)
          .post('/meta/v23.0/act_123456789/campaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        const campaignId = createResponse.body.id;

        // Update the campaign
        const updateData = {
          name: 'Updated Name',
        };

        const updateResponse = await request(app)
          .post(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(updateData);

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body).toHaveProperty('success', true);
        expect(updateResponse.body).toHaveProperty('id', campaignId);
        expect(updateResponse.body.name).toBe(updateData.name);

        // Verify the update persisted
        const getResponse = await request(app)
          .get(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`);

        expect(getResponse.body.name).toBe(updateData.name);
      });

      it('should update campaign status', async () => {
        // First create a campaign
        const campaignData = {
          name: 'Status Update Test',
          objective: 'OUTCOME_SALES',
          status: 'PAUSED',
          lifetime_budget: 50000,
        };

        const createResponse = await request(app)
          .post('/meta/v23.0/act_123456789/campaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        const campaignId = createResponse.body.id;

        // Update status
        const updateData = {
          status: 'ACTIVE',
        };

        const updateResponse = await request(app)
          .post(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(updateData);

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body).toHaveProperty('success', true);
        expect(updateResponse.body.status).toBe('ACTIVE');
      });

      it('should update campaign daily_budget', async () => {
        // First create a campaign
        const campaignData = {
          name: 'Budget Update Test',
          objective: 'OUTCOME_ENGAGEMENT',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const createResponse = await request(app)
          .post('/meta/v23.0/act_123456789/campaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        const campaignId = createResponse.body.id;

        // Update budget
        const updateData = {
          daily_budget: 10000,
        };

        const updateResponse = await request(app)
          .post(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(updateData);

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body).toHaveProperty('success', true);
        expect(updateResponse.body.daily_budget).toBe(10000);
      });

      it('should update multiple fields at once', async () => {
        // First create a campaign
        const campaignData = {
          name: 'Multi Update Test',
          objective: 'OUTCOME_LEADS',
          status: 'PAUSED',
          daily_budget: 3000,
        };

        const createResponse = await request(app)
          .post('/meta/v23.0/act_123456789/campaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        const campaignId = createResponse.body.id;

        // Update multiple fields
        const updateData = {
          name: 'Multi Updated Name',
          status: 'ACTIVE',
          daily_budget: 8000,
        };

        const updateResponse = await request(app)
          .post(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(updateData);

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body).toHaveProperty('success', true);
        expect(updateResponse.body.name).toBe(updateData.name);
        expect(updateResponse.body.status).toBe(updateData.status);
        expect(updateResponse.body.daily_budget).toBe(updateData.daily_budget);
      });

      it('should fail updating non-existent campaign', async () => {
        const nonExistentCampaignId = '888888888888888888';
        const updateData = {
          name: 'Updated Name',
        };

        const response = await request(app)
          .post(`/meta/v23.0/${nonExistentCampaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('not found');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(100);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail with invalid status in update', async () => {
        // First create a campaign
        const campaignData = {
          name: 'Invalid Status Update Test',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const createResponse = await request(app)
          .post('/meta/v23.0/act_123456789/campaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        const campaignId = createResponse.body.id;

        // Try to update with invalid status
        const updateData = {
          status: 'INVALID_STATUS',
        };

        const updateResponse = await request(app)
          .post(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(updateData);

        expect(updateResponse.status).toBe(400);
        expect(updateResponse.body).toHaveProperty('error');
        expect(updateResponse.body.error.message).toContain('Invalid status');
        expect(updateResponse.body.error.type).toBe('OAuthException');
        expect(updateResponse.body.error.code).toBe(100);
        expect(updateResponse.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail with invalid objective in update', async () => {
        // First create a campaign
        const campaignData = {
          name: 'Invalid Objective Update Test',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const createResponse = await request(app)
          .post('/meta/v23.0/act_123456789/campaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        const campaignId = createResponse.body.id;

        // Try to update with invalid objective
        const updateData = {
          objective: 'INVALID_OBJECTIVE',
        };

        const updateResponse = await request(app)
          .post(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(updateData);

        expect(updateResponse.status).toBe(400);
        expect(updateResponse.body).toHaveProperty('error');
        expect(updateResponse.body.error.message).toContain('Invalid objective');
        expect(updateResponse.body.error.type).toBe('OAuthException');
        expect(updateResponse.body.error.code).toBe(100);
        expect(updateResponse.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail with negative daily_budget in update', async () => {
        // First create a campaign
        const campaignData = {
          name: 'Invalid Budget Update Test',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const createResponse = await request(app)
          .post('/meta/v23.0/act_123456789/campaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        const campaignId = createResponse.body.id;

        // Try to update with negative budget
        const updateData = {
          daily_budget: -1000,
        };

        const updateResponse = await request(app)
          .post(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(updateData);

        expect(updateResponse.status).toBe(400);
        expect(updateResponse.body).toHaveProperty('error');
        expect(updateResponse.body.error.message).toContain('Invalid daily_budget');
        expect(updateResponse.body.error.type).toBe('OAuthException');
        expect(updateResponse.body.error.code).toBe(100);
        expect(updateResponse.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail with invalid lifetime_budget in update', async () => {
        // First create a campaign
        const campaignData = {
          name: 'Invalid Lifetime Budget Update Test',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          lifetime_budget: 50000,
        };

        const createResponse = await request(app)
          .post('/meta/v23.0/act_123456789/campaigns')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaignData);

        const campaignId = createResponse.body.id;

        // Try to update with negative lifetime_budget
        const updateData = {
          lifetime_budget: -5000,
        };

        const updateResponse = await request(app)
          .post(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(updateData);

        expect(updateResponse.status).toBe(400);
        expect(updateResponse.body).toHaveProperty('error');
        expect(updateResponse.body.error.message).toContain('Invalid lifetime_budget');
        expect(updateResponse.body.error.type).toBe('OAuthException');
        expect(updateResponse.body.error.code).toBe(100);
        expect(updateResponse.body.error).toHaveProperty('fbtrace_id');
      });
    });
  });

  // ============================================
  // Authentication Tests
  // ============================================
  describe('Authentication', () => {
    const adAccountId = '123456789';

    describe('Missing Authorization', () => {
      it('should fail POST /v23.0/act_:adAccountId/campaigns without Authorization header', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .send(campaignData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Missing access token');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(190);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail GET /v23.0/:campaignId without Authorization header', async () => {
        const campaignId = '120210000000000000';

        const response = await request(app)
          .get(`/meta/v23.0/${campaignId}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Missing access token');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(190);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail POST /v23.0/:campaignId without Authorization header', async () => {
        const campaignId = '120210000000000000';
        const updateData = {
          name: 'Updated Name',
        };

        const response = await request(app)
          .post(`/meta/v23.0/${campaignId}`)
          .send(updateData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Missing access token');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(190);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });
    });

    describe('Invalid Bearer Token', () => {
      it('should fail POST /v23.0/act_:adAccountId/campaigns with invalid token', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${INVALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid OAuth access token');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(190);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail GET /v23.0/:campaignId with invalid token', async () => {
        const campaignId = '120210000000000000';

        const response = await request(app)
          .get(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${INVALID_TOKEN}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid OAuth access token');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(190);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail POST /v23.0/:campaignId with invalid token', async () => {
        const campaignId = '120210000000000000';
        const updateData = {
          name: 'Updated Name',
        };

        const response = await request(app)
          .post(`/meta/v23.0/${campaignId}`)
          .set('Authorization', `Bearer ${INVALID_TOKEN}`)
          .send(updateData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid OAuth access token');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(190);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail with malformed Authorization header (missing Bearer)', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', VALID_TOKEN)
          .send(campaignData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid Authorization header format');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(190);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should fail with wrong Authorization scheme', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Basic ${VALID_TOKEN}`)
          .send(campaignData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid Authorization header scheme');
        expect(response.body.error.message).toContain('Expected: Bearer');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(190);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });
    });

    describe('Query Parameter Authentication', () => {
      it('should authenticate with access_token query parameter for POST', async () => {
        const campaignData = {
          name: 'Query Auth Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .query({ access_token: VALID_TOKEN })
          .send(campaignData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(campaignData.name);
      });

      it('should authenticate with access_token query parameter for GET', async () => {
        const campaignId = '120210000000000000';

        const response = await request(app)
          .get(`/meta/v23.0/${campaignId}`)
          .query({ access_token: VALID_TOKEN });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', campaignId);
      });

      it('should authenticate with access_token query parameter for update', async () => {
        // First create a campaign
        const campaignData = {
          name: 'Query Auth Update Test',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const createResponse = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .query({ access_token: VALID_TOKEN })
          .send(campaignData);

        const campaignId = createResponse.body.id;

        // Update with query parameter auth
        const updateData = {
          name: 'Updated via Query Auth',
        };

        const updateResponse = await request(app)
          .post(`/meta/v23.0/${campaignId}`)
          .query({ access_token: VALID_TOKEN })
          .send(updateData);

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body).toHaveProperty('success', true);
        expect(updateResponse.body.name).toBe(updateData.name);
      });

      it('should fail with invalid access_token query parameter', async () => {
        const campaignData = {
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .query({ access_token: INVALID_TOKEN })
          .send(campaignData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain('Invalid OAuth access token');
        expect(response.body.error.type).toBe('OAuthException');
        expect(response.body.error.code).toBe(190);
        expect(response.body.error).toHaveProperty('fbtrace_id');
      });

      it('should prefer Authorization header over query parameter when both present', async () => {
        const campaignData = {
          name: 'Auth Precedence Test',
          objective: 'OUTCOME_TRAFFIC',
          status: 'PAUSED',
          daily_budget: 5000,
        };

        // Valid token in header, invalid in query - should succeed
        const response = await request(app)
          .post(`/meta/v23.0/act_${adAccountId}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .query({ access_token: INVALID_TOKEN })
          .send(campaignData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
      });
    });
  });
});
