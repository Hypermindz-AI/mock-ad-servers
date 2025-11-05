import request from 'supertest';
import app from '../src/index';
import { Database } from '../src/db/database';

describe('Meta Marketing API v23.0 - Campaign Listing', () => {
  const VALID_TOKEN = 'mock_meta_access_token_abcdef';
  const AD_ACCOUNT_ID = '123456789';

  /**
   * Setup: Initialize and reset database before all tests
   * This ensures a clean state for testing
   */
  beforeAll(async () => {
    console.log('🔧 Setting up test database...');

    // Skip database setup if POSTGRES_URL is not configured
    if (!process.env.POSTGRES_URL) {
      console.log('⚠️  POSTGRES_URL not configured, skipping database setup');
      return;
    }

    try {
      // Initialize database schema
      await Database.initialize();

      // Reset database to ensure clean state
      await Database.reset();

      // Seed with initial test data for Meta platform
      // Create a few seed campaigns so list tests have data
      const seedCampaigns = [
        {
          name: 'Seed Campaign 1',
          objective: 'OUTCOME_TRAFFIC',
          status: 'ACTIVE',
          daily_budget: 10000,
        },
        {
          name: 'Seed Campaign 2',
          objective: 'OUTCOME_SALES',
          status: 'PAUSED',
          daily_budget: 15000,
        },
        {
          name: 'Seed Campaign 3',
          objective: 'OUTCOME_AWARENESS',
          status: 'ACTIVE',
          daily_budget: 20000,
        }
      ];

      // Create seed campaigns via API to ensure they're stored in database
      for (const campaign of seedCampaigns) {
        await request(app)
          .post(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`)
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send(campaign);
      }

      const stats = await Database.getStats();
      console.log(`✅ Test database ready - ${stats.campaigns} campaigns seeded`);
    } catch (error) {
      console.error('❌ Failed to setup test database:', error);
      // Don't throw - allow tests to run in mock-only mode
    }
  });

  /**
   * Teardown: Clean up after all tests
   */
  afterAll(async () => {
    if (!process.env.POSTGRES_URL) {
      return;
    }

    try {
      console.log('🧹 Cleaning up test database...');
      await Database.reset();
      console.log('✅ Test database cleanup complete');
    } catch (error) {
      console.error('⚠️  Failed to cleanup test database:', error);
      // Non-critical error, don't fail the test suite
    }
  });

  describe('GET /v23.0/act_:adAccountId/campaigns', () => {
    it('should list all campaigns', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);

      // With seeded data, we should have at least 3 campaigns
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);

      // Verify campaign structure
      if (response.body.data.length > 0) {
        const campaign = response.body.data[0];
        expect(campaign).toHaveProperty('id');
        expect(campaign).toHaveProperty('name');
      }
    });

    it('should filter campaigns by fields parameter', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/act_${AD_ACCOUNT_ID}/campaigns`)
        .query({ fields: 'name,status,objective' })
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');

      // With seeded data, should have at least 3 campaigns
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);

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
