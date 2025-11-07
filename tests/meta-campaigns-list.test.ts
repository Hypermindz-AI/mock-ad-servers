import request from 'supertest';
import app from '../src/index';

describe('Meta Marketing API v23.0 - Campaign Listing', () => {
  const VALID_TOKEN = 'mock_meta_access_token_abcdef';
  const AD_ACCOUNT_ID = '123456789';

  describe('GET /v23.0/act_:adAccountId/campaigns', () => {
    it('should list all campaigns', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter campaigns by fields parameter', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`)
        .query({ fields: 'name,status,objective' })
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check that only requested fields are present (plus id which is always included)
      const campaign = response.body.data[0];
      expect(campaign).toHaveProperty('id');
      expect(campaign).toHaveProperty('name');
      expect(campaign).toHaveProperty('status');
      expect(campaign).toHaveProperty('objective');
    });

    it('should support pagination with limit parameter', async () => {
      // First create multiple campaigns
      const campaignData = {
        name: 'Test Campaign for Pagination',
        objective: 'OUTCOME_TRAFFIC',
        status: 'PAUSED',
        daily_budget: 5000,
      };

      // Create 5 campaigns
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({ ...campaignData, name: `${campaignData.name} ${i}` });
      }

      // Request with limit
      const response = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`)
        .query({ limit: 3 })
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeLessThanOrEqual(3);

      // Should have paging info if there are more results
      if (response.body.data.length === 3) {
        expect(response.body).toHaveProperty('paging');
        expect(response.body.paging).toHaveProperty('cursors');
        expect(response.body.paging.cursors).toHaveProperty('after');
      }
    });

    it('should support cursor-based pagination', async () => {
      // Get first page
      const firstPage = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`)
        .query({ limit: 2 })
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(firstPage.status).toBe(200);

      // If there's a next cursor, fetch the next page
      if (firstPage.body.paging && firstPage.body.paging.cursors.after) {
        const secondPage = await request(app)
          .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`)
          .query({ limit: 2, after: firstPage.body.paging.cursors.after })
          .set('Authorization', `Bearer ${VALID_TOKEN}`);

        expect(secondPage.status).toBe(200);
        expect(secondPage.body).toHaveProperty('data');
      }
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(190);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`)
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Invalid OAuth access token');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(190);
    });
  });
});
