import request from 'supertest';
import app from '../src/index';

describe('Meta Marketing API v23.0 - Ad Sets', () => {
  const VALID_TOKEN = 'mock_meta_access_token_abcdef';
  const AD_ACCOUNT_ID = '123456789';
  let campaignId: string;

  // Create a campaign before running ad set tests
  beforeAll(async () => {
    const campaignData = {
      name: 'Test Campaign for Ad Sets',
      objective: 'OUTCOME_TRAFFIC',
      status: 'PAUSED',
      daily_budget: 5000,
    };

    const response = await request(app)
      .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send(campaignData);

    campaignId = response.body.id;
  });

  describe('POST /v23.0/act_:adAccountId/adsets', () => {
    it('should create ad set successfully', async () => {
      const adSetData = {
        name: 'Test Ad Set',
        campaign_id: campaignId,
        status: 'PAUSED',
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'REACH',
        daily_budget: 3000,
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adSetData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toMatch(/^2301100000\d{8}$/);
    });

    it('should create ad set with targeting', async () => {
      const adSetData = {
        name: 'Test Ad Set with Targeting',
        campaign_id: campaignId,
        status: 'PAUSED',
        optimization_goal: 'LINK_CLICKS',
        daily_budget: 2000,
        targeting: {
          age_min: 18,
          age_max: 65,
          genders: [1, 2],
          geo_locations: {
            countries: ['US', 'CA'],
          },
        },
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adSetData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });

    it('should fail when missing name field', async () => {
      const adSetData = {
        campaign_id: campaignId,
        status: 'PAUSED',
        daily_budget: 3000,
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adSetData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toBe('Missing required field: name');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
      expect(response.body.error).toHaveProperty('fbtrace_id');
    });

    it('should fail when missing campaign_id field', async () => {
      const adSetData = {
        name: 'Test Ad Set',
        status: 'PAUSED',
        daily_budget: 3000,
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adSetData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toBe('Missing required field: campaign_id');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });

    it('should fail when missing status field', async () => {
      const adSetData = {
        name: 'Test Ad Set',
        campaign_id: campaignId,
        daily_budget: 3000,
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adSetData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toBe('Missing required field: status');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });

    it('should fail with non-existent campaign_id', async () => {
      const adSetData = {
        name: 'Test Ad Set',
        campaign_id: '999999999999999999',
        status: 'PAUSED',
        daily_budget: 3000,
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adSetData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('does not exist');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });

    it('should fail with invalid status', async () => {
      const adSetData = {
        name: 'Test Ad Set',
        campaign_id: campaignId,
        status: 'INVALID_STATUS',
        daily_budget: 3000,
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adSetData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Invalid status');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });

    it('should fail with invalid billing_event', async () => {
      const adSetData = {
        name: 'Test Ad Set',
        campaign_id: campaignId,
        status: 'PAUSED',
        billing_event: 'INVALID_EVENT',
        daily_budget: 3000,
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adSetData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Invalid billing_event');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });

    it('should fail with invalid optimization_goal', async () => {
      const adSetData = {
        name: 'Test Ad Set',
        campaign_id: campaignId,
        status: 'PAUSED',
        optimization_goal: 'INVALID_GOAL',
        daily_budget: 3000,
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adSetData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Invalid optimization_goal');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });
  });

  describe('GET /v23.0/act_:adAccountId/adsets', () => {
    it('should list all ad sets', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter ad sets by fields parameter', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .query({ fields: 'name,status,campaign_id' })
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');

      if (response.body.data.length > 0) {
        const adSet = response.body.data[0];
        expect(adSet).toHaveProperty('id');
        expect(adSet).toHaveProperty('name');
        expect(adSet).toHaveProperty('status');
        expect(adSet).toHaveProperty('campaign_id');
      }
    });
  });

  describe('GET /v23.0/:adSetId', () => {
    let adSetId: string;

    beforeAll(async () => {
      const adSetData = {
        name: 'Test Ad Set for GET',
        campaign_id: campaignId,
        status: 'PAUSED',
        daily_budget: 3000,
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adSetData);

      adSetId = response.body.id;
    });

    it('should get ad set details', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/${adSetId}`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', adSetId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('campaign_id');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('created_time');
      expect(response.body).toHaveProperty('updated_time');
    });

    it('should fail when ad set does not exist', async () => {
      const nonExistentAdSetId = '888888888888888888';

      const response = await request(app)
        .get(`/meta/v23.0/${nonExistentAdSetId}`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('not found');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });
  });

  describe('POST /v23.0/:adSetId', () => {
    let adSetId: string;

    beforeAll(async () => {
      const adSetData = {
        name: 'Test Ad Set for Update',
        campaign_id: campaignId,
        status: 'PAUSED',
        daily_budget: 3000,
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adSetData);

      adSetId = response.body.id;
    });

    it('should update ad set name', async () => {
      const updateData = {
        name: 'Updated Ad Set Name',
      };

      const response = await request(app)
        .post(`/meta/v23.0/${adSetId}`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('id', adSetId);
    });

    it('should update ad set status', async () => {
      const updateData = {
        status: 'ACTIVE',
      };

      const response = await request(app)
        .post(`/meta/v23.0/${adSetId}`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should fail updating non-existent ad set', async () => {
      const nonExistentAdSetId = '777777777777777777';
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .post(`/meta/v23.0/${nonExistentAdSetId}`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('not found');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });

    it('should fail with invalid status in update', async () => {
      const updateData = {
        status: 'INVALID_STATUS',
      };

      const response = await request(app)
        .post(`/meta/v23.0/${adSetId}`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Invalid status');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });
  });
});
