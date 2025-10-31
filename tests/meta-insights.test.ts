import request from 'supertest';
import app from '../src/index';

describe('Meta Marketing API v23.0 - Campaign Insights', () => {
  const VALID_TOKEN = 'mock_meta_access_token_abcdef';
  const EXISTING_CAMPAIGN_ID = '120210000000000000';

  describe('GET /v23.0/:campaignId/insights', () => {
    it('should get insights for existing campaign', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/${EXISTING_CAMPAIGN_ID}/insights`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const insights = response.body.data[0];
      expect(insights).toHaveProperty('impressions');
      expect(insights).toHaveProperty('clicks');
      expect(insights).toHaveProperty('spend');
      expect(insights).toHaveProperty('cpc');
      expect(insights).toHaveProperty('cpm');
      expect(insights).toHaveProperty('ctr');
      expect(insights).toHaveProperty('date_start');
      expect(insights).toHaveProperty('date_stop');
    });

    it('should get insights with date_preset=last_7d', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/${EXISTING_CAMPAIGN_ID}/insights`)
        .query({ date_preset: 'last_7d' })
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThan(0);

      const insights = response.body.data[0];
      expect(insights).toHaveProperty('date_start');
      expect(insights).toHaveProperty('date_stop');

      // Verify dates are within last 7 days
      const dateStart = new Date(insights.date_start);
      const dateStop = new Date(insights.date_stop);
      const daysDiff = Math.ceil((dateStop.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeLessThanOrEqual(7);
    });

    it('should get insights with date_preset=last_30d', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/${EXISTING_CAMPAIGN_ID}/insights`)
        .query({ date_preset: 'last_30d' })
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThan(0);

      const insights = response.body.data[0];
      expect(insights).toHaveProperty('date_start');
      expect(insights).toHaveProperty('date_stop');

      // Verify dates are within last 30 days
      const dateStart = new Date(insights.date_start);
      const dateStop = new Date(insights.date_stop);
      const daysDiff = Math.ceil((dateStop.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeLessThanOrEqual(30);
    });

    it('should get insights with custom time_range', async () => {
      const timeRange = {
        since: '2025-10-01',
        until: '2025-10-31',
      };

      const response = await request(app)
        .get(`/meta/v23.0/${EXISTING_CAMPAIGN_ID}/insights`)
        .query({ time_range: JSON.stringify(timeRange) })
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThan(0);

      const insights = response.body.data[0];
      expect(insights.date_start).toBe(timeRange.since);
      expect(insights.date_stop).toBe(timeRange.until);
    });

    it('should fail for non-existent campaign', async () => {
      const nonExistentCampaignId = '999999999999999999';

      const response = await request(app)
        .get(`/meta/v23.0/${nonExistentCampaignId}/insights`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('not found');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
      expect(response.body.error).toHaveProperty('fbtrace_id');
    });

    it('should fail with invalid time_range format', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/${EXISTING_CAMPAIGN_ID}/insights`)
        .query({ time_range: 'invalid_json' })
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Invalid time_range format');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(100);
      expect(response.body.error).toHaveProperty('fbtrace_id');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/${EXISTING_CAMPAIGN_ID}/insights`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(190);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get(`/meta/v23.0/${EXISTING_CAMPAIGN_ID}/insights`)
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Invalid OAuth access token');
      expect(response.body.error.type).toBe('OAuthException');
      expect(response.body.error.code).toBe(190);
    });
  });
});
