import request from 'supertest';
import app from '../src/index';

describe('Meta Marketing API v23.0 - Ads', () => {
  const VALID_TOKEN = 'mock_meta_access_token_abcdef';
  const AD_ACCOUNT_ID = '123456789';
  let campaignId: string;
  let adSetId: string;

  // Create a campaign and ad set before running ad tests
  beforeAll(async () => {
    // Create campaign
    const campaignData = {
      name: 'Test Campaign for Ads',
      objective: 'OUTCOME_TRAFFIC',
      status: 'PAUSED',
      daily_budget: 5000,
    };

    const campaignResponse = await request(app)
      .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send(campaignData);

    campaignId = campaignResponse.body.id;

    // Create ad set
    const adSetData = {
      name: 'Test Ad Set for Ads',
      campaign_id: campaignId,
      status: 'PAUSED',
      optimization_goal: 'REACH',
      daily_budget: 3000,
    };

    const adSetResponse = await request(app)
      .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/adsets`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send(adSetData);

    adSetId = adSetResponse.body.id;
  });

  describe('POST /v23.0/act_:adAccountId/ads', () => {
    it('should create ad successfully', async () => {
      const adData = {
        name: 'Test Ad',
        adset_id: adSetId,
        status: 'PAUSED',
        creative: {
          creative_id: '12345678',
        },
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/ads`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toMatch(/^2302100000\d{8}$/);
    });

    it('should create ad without creative', async () => {
      const adData = {
        name: 'Test Ad without Creative',
        adset_id: adSetId,
        status: 'PAUSED',
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/ads`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });

    it('should fail when missing name field', async () => {
      const adData = {
        adset_id: adSetId,
        status: 'PAUSED',
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/ads`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toBe('Missing required field: name');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
      expect(response.body.error).toHaveProperty('fbtrace_id');
    });

    it('should fail when missing adset_id field', async () => {
      const adData = {
        name: 'Test Ad',
        status: 'PAUSED',
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/ads`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toBe('Missing required field: adset_id');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });

    it('should fail when missing status field', async () => {
      const adData = {
        name: 'Test Ad',
        adset_id: adSetId,
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/ads`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toBe('Missing required field: status');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });

    it('should fail with non-existent adset_id', async () => {
      const adData = {
        name: 'Test Ad',
        adset_id: '999999999999999999',
        status: 'PAUSED',
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/ads`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('does not exist');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });

    it('should fail with invalid status', async () => {
      const adData = {
        name: 'Test Ad',
        adset_id: adSetId,
        status: 'INVALID_STATUS',
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/ads`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Invalid status');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });
  });

  describe('GET /v23.0/act_:adAccountId/ads', () => {
    it('should list all ads', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/ads`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter ads by fields parameter', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/ads`)
        .query({ fields: 'name,status,adset_id' })
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');

      if (response.body.data.length > 0) {
        const ad = response.body.data[0];
        expect(ad).toHaveProperty('id');
        expect(ad).toHaveProperty('name');
        expect(ad).toHaveProperty('status');
        expect(ad).toHaveProperty('adset_id');
      }
    });

    it('should support pagination with limit parameter', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/ads`)
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /v23.0/:adId', () => {
    let adId: string;

    beforeAll(async () => {
      const adData = {
        name: 'Test Ad for GET',
        adset_id: adSetId,
        status: 'PAUSED',
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/ads`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adData);

      adId = response.body.id;
    });

    it('should get ad details', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/${adId}`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', adId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('adset_id');
      expect(response.body).toHaveProperty('campaign_id');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('created_time');
      expect(response.body).toHaveProperty('updated_time');
    });

    it('should fail when ad does not exist', async () => {
      const nonExistentAdId = '888888888888888888';

      const response = await request(app)
        .get(`/meta/v23.0/${nonExistentAdId}`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('not found');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
    });
  });

  describe('POST /v23.0/:adId', () => {
    let adId: string;

    beforeAll(async () => {
      const adData = {
        name: 'Test Ad for Update',
        adset_id: adSetId,
        status: 'PAUSED',
      };

      const response = await request(app)
        .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/ads`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(adData);

      adId = response.body.id;
    });

    it('should update ad name', async () => {
      const updateData = {
        name: 'Updated Ad Name',
      };

      const response = await request(app)
        .post(`/meta/v23.0/${adId}`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('id', adId);
    });

    it('should update ad status', async () => {
      const updateData = {
        status: 'ACTIVE',
      };

      const response = await request(app)
        .post(`/meta/v23.0/${adId}`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should update ad creative', async () => {
      const updateData = {
        creative: {
          creative_id: '87654321',
        },
      };

      const response = await request(app)
        .post(`/meta/v23.0/${adId}`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should fail updating non-existent ad', async () => {
      const nonExistentAdId = '777777777777777777';
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .post(`/meta/v23.0/${nonExistentAdId}`)
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
        .post(`/meta/v23.0/${adId}`)
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
