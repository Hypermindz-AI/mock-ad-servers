import request from 'supertest';
import app from '../src/index';

/**
 * TikTok Marketing API v1.3 New Endpoints Tests
 *
 * Tests cover:
 * 1. Integrated Reporting (GET/POST /reports/integrated/get/)
 * 2. Ad Groups (get, create, update)
 * 3. Ads (get, create, update)
 *
 * All responses follow TikTok's standard format:
 * {
 *   code: number,      // 0 for success, error codes otherwise
 *   message: string,   // "OK" for success, error description otherwise
 *   data: object       // Response payload
 * }
 */

describe('TikTok Marketing API v1.3 - New Endpoints', () => {
  const VALID_TOKEN = 'mock_tiktok_access_token_mnopqr';

  // ============================================
  // Integrated Reporting Tests
  // ============================================

  describe('Integrated Reporting', () => {
    describe('POST /tiktok/v1.3/reports/integrated/get/', () => {
      it('should get campaign-level report successfully', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            data_level: 'AUCTION_CAMPAIGN',
            dimensions: ['campaign_id', 'stat_time_day'],
            metrics: ['spend', 'impressions', 'clicks', 'cpc', 'cpm', 'ctr', 'conversions'],
            start_date: '2025-01-01',
            end_date: '2025-01-31',
            page: 1,
            page_size: 10
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          code: 0,
          message: 'OK',
          data: {
            list: expect.arrayContaining([
              expect.objectContaining({
                campaign_id: expect.any(String),
                stat_time_day: expect.any(String),
                spend: expect.any(Number),
                impressions: expect.any(Number),
                clicks: expect.any(Number),
                cpc: expect.any(Number),
                cpm: expect.any(Number),
                ctr: expect.any(Number),
                conversions: expect.any(Number)
              })
            ]),
            page_info: {
              page: 1,
              page_size: 10,
              total_number: expect.any(Number)
            }
          }
        });
      });

      it('should get adgroup-level report successfully', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            data_level: 'AUCTION_ADGROUP',
            dimensions: ['campaign_id', 'adgroup_id', 'stat_time_day'],
            metrics: ['spend', 'impressions', 'clicks'],
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.list[0]).toHaveProperty('campaign_id');
        expect(response.body.data.list[0]).toHaveProperty('adgroup_id');
      });

      it('should get ad-level report successfully', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            data_level: 'AUCTION_AD',
            dimensions: ['campaign_id', 'adgroup_id', 'ad_id', 'stat_time_day'],
            metrics: ['spend', 'clicks', 'conversions'],
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.list[0]).toHaveProperty('campaign_id');
        expect(response.body.data.list[0]).toHaveProperty('adgroup_id');
        expect(response.body.data.list[0]).toHaveProperty('ad_id');
      });

      it('should fail when missing advertiser_id', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            data_level: 'AUCTION_CAMPAIGN',
            dimensions: ['campaign_id'],
            metrics: ['spend'],
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: advertiser_id',
          data: {}
        });
      });

      it('should fail when missing data_level', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            dimensions: ['campaign_id'],
            metrics: ['spend'],
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: data_level',
          data: {}
        });
      });

      it('should fail when missing dimensions', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            data_level: 'AUCTION_CAMPAIGN',
            metrics: ['spend'],
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: dimensions',
          data: {}
        });
      });

      it('should fail when missing metrics', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            data_level: 'AUCTION_CAMPAIGN',
            dimensions: ['campaign_id'],
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: metrics',
          data: {}
        });
      });

      it('should fail when missing start_date', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            data_level: 'AUCTION_CAMPAIGN',
            dimensions: ['campaign_id'],
            metrics: ['spend'],
            end_date: '2025-01-31'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: start_date',
          data: {}
        });
      });

      it('should fail when missing end_date', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            data_level: 'AUCTION_CAMPAIGN',
            dimensions: ['campaign_id'],
            metrics: ['spend'],
            start_date: '2025-01-01'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: end_date',
          data: {}
        });
      });

      it('should fail with invalid data_level', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            data_level: 'INVALID_LEVEL',
            dimensions: ['campaign_id'],
            metrics: ['spend'],
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Invalid data_level. Supported values: AUCTION_CAMPAIGN, AUCTION_ADGROUP, AUCTION_AD',
          data: {}
        });
      });

      it('should fail with invalid dimensions', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            data_level: 'AUCTION_CAMPAIGN',
            dimensions: ['invalid_dimension'],
            metrics: ['spend'],
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(40001);
        expect(response.body.message).toContain('Invalid dimensions');
      });

      it('should fail with invalid metrics', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            data_level: 'AUCTION_CAMPAIGN',
            dimensions: ['campaign_id'],
            metrics: ['invalid_metric'],
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(40001);
        expect(response.body.message).toContain('Invalid metrics');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/reports/integrated/get/')
          .send({
            advertiser_id: '123456',
            data_level: 'AUCTION_CAMPAIGN',
            dimensions: ['campaign_id'],
            metrics: ['spend'],
            start_date: '2025-01-01',
            end_date: '2025-01-31'
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
  // Ad Group Tests
  // ============================================

  describe('Ad Groups', () => {
    describe('POST /tiktok/v1.3/adgroup/create/', () => {
      it('should create ad group successfully', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/adgroup/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            adgroup_name: 'Test Ad Group',
            placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
            placements: ['PLACEMENT_TIKTOK', 'PLACEMENT_PANGLE'],
            budget_mode: 'BUDGET_MODE_DAY',
            budget: 50.0
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          code: 0,
          message: 'OK',
          data: {
            adgroup_id: expect.any(String)
          }
        });
        expect(response.body.data.adgroup_id).toMatch(/^\d+$/);
      });

      it('should fail when missing advertiser_id', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/adgroup/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            campaign_id: '1234567890123456789',
            adgroup_name: 'Test Ad Group',
            placement_type: 'PLACEMENT_TYPE_AUTOMATIC'
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
          .post('/tiktok/v1.3/adgroup/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            adgroup_name: 'Test Ad Group',
            placement_type: 'PLACEMENT_TYPE_AUTOMATIC'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: campaign_id',
          data: {}
        });
      });

      it('should fail when missing adgroup_name', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/adgroup/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            placement_type: 'PLACEMENT_TYPE_AUTOMATIC'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: adgroup_name',
          data: {}
        });
      });

      it('should fail when missing placement_type', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/adgroup/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            adgroup_name: 'Test Ad Group'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: placement_type',
          data: {}
        });
      });

      it('should fail with invalid placement_type', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/adgroup/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            adgroup_name: 'Test Ad Group',
            placement_type: 'INVALID_PLACEMENT'
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(40001);
        expect(response.body.message).toContain('Invalid placement_type');
      });

      it('should fail with invalid placements', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/adgroup/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            adgroup_name: 'Test Ad Group',
            placement_type: 'PLACEMENT_TYPE_NORMAL',
            placements: ['INVALID_PLACEMENT']
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(40001);
        expect(response.body.message).toContain('Invalid placements');
      });

      it('should create ad group with budget_mode and budget', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/adgroup/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            adgroup_name: 'Test Ad Group with Budget',
            placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
            budget_mode: 'BUDGET_MODE_TOTAL',
            budget: 1000.0
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
      });

      it('should fail when budget is missing for BUDGET_MODE_DAY', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/adgroup/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            campaign_id: '1234567890123456789',
            adgroup_name: 'Test Ad Group',
            placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
            budget_mode: 'BUDGET_MODE_DAY'
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Missing required parameter: budget');
      });
    });

    describe('POST /tiktok/v1.3/adgroup/update/', () => {
      it('should update ad group successfully', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/adgroup/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            adgroup_id: '9876543210987654321',
            operation_status: 'ENABLE',
            budget: 100.0
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          code: 0,
          message: 'OK',
          data: {
            adgroup_id: '9876543210987654321',
            operation_status: 'ENABLE'
          }
        });
      });

      it('should fail when missing advertiser_id', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/adgroup/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            adgroup_id: '9876543210987654321',
            operation_status: 'ENABLE'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: advertiser_id',
          data: {}
        });
      });

      it('should fail when missing adgroup_id', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/adgroup/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            operation_status: 'ENABLE'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: adgroup_id',
          data: {}
        });
      });

      it('should fail with invalid operation_status', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/adgroup/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            adgroup_id: '9876543210987654321',
            operation_status: 'INVALID_STATUS'
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(40001);
        expect(response.body.message).toContain('Invalid operation_status');
      });
    });

    describe('GET /tiktok/v1.3/adgroup/get/', () => {
      it('should get ad groups successfully', async () => {
        const response = await request(app)
          .get('/tiktok/v1.3/adgroup/get/')
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
                adgroup_id: expect.any(String),
                advertiser_id: '123456',
                campaign_id: expect.any(String),
                adgroup_name: expect.any(String),
                placement_type: expect.any(String),
                operation_status: expect.any(String)
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

      it('should get specific ad groups by IDs', async () => {
        const adgroupIds = ['1111111111111111111', '2222222222222222222'];

        const response = await request(app)
          .get('/tiktok/v1.3/adgroup/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .query({
            advertiser_id: '123456',
            adgroup_ids: JSON.stringify(adgroupIds)
          });

        expect(response.status).toBe(200);
        expect(response.body.data.list).toHaveLength(2);
        expect(response.body.data.list[0].adgroup_id).toBe('1111111111111111111');
        expect(response.body.data.list[1].adgroup_id).toBe('2222222222222222222');
      });

      it('should fail when missing advertiser_id', async () => {
        const response = await request(app)
          .get('/tiktok/v1.3/adgroup/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: advertiser_id',
          data: {}
        });
      });
    });
  });

  // ============================================
  // Ad Tests
  // ============================================

  describe('Ads', () => {
    describe('POST /tiktok/v1.3/ad/create/', () => {
      it('should create ad successfully', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/ad/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            adgroup_id: '9876543210987654321',
            display_name: 'Test Ad',
            creatives: {
              video_id: 'v1234567890'
            }
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          code: 0,
          message: 'OK',
          data: {
            ad_id: expect.any(String)
          }
        });
        expect(response.body.data.ad_id).toMatch(/^\d+$/);
      });

      it('should fail when missing advertiser_id', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/ad/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            adgroup_id: '9876543210987654321',
            display_name: 'Test Ad'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: advertiser_id',
          data: {}
        });
      });

      it('should fail when missing adgroup_id', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/ad/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            display_name: 'Test Ad'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: adgroup_id',
          data: {}
        });
      });

      it('should fail when missing display_name', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/ad/create/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            adgroup_id: '9876543210987654321'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: display_name',
          data: {}
        });
      });
    });

    describe('POST /tiktok/v1.3/ad/update/', () => {
      it('should update ad successfully', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/ad/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            ad_id: '5555555555555555555',
            operation_status: 'DISABLE'
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          code: 0,
          message: 'OK',
          data: {
            ad_id: '5555555555555555555',
            operation_status: 'DISABLE'
          }
        });
      });

      it('should fail when missing advertiser_id', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/ad/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            ad_id: '5555555555555555555',
            operation_status: 'DISABLE'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: advertiser_id',
          data: {}
        });
      });

      it('should fail when missing ad_id', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/ad/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            operation_status: 'DISABLE'
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: ad_id',
          data: {}
        });
      });

      it('should fail with invalid operation_status', async () => {
        const response = await request(app)
          .post('/tiktok/v1.3/ad/update/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({
            advertiser_id: '123456',
            ad_id: '5555555555555555555',
            operation_status: 'INVALID_STATUS'
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(40001);
        expect(response.body.message).toContain('Invalid operation_status');
      });
    });

    describe('GET /tiktok/v1.3/ad/get/', () => {
      it('should get ads successfully', async () => {
        const response = await request(app)
          .get('/tiktok/v1.3/ad/get/')
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
                ad_id: expect.any(String),
                advertiser_id: '123456',
                adgroup_id: expect.any(String),
                display_name: expect.any(String),
                operation_status: expect.any(String)
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

      it('should get specific ads by IDs', async () => {
        const adIds = ['3333333333333333333', '4444444444444444444'];

        const response = await request(app)
          .get('/tiktok/v1.3/ad/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .query({
            advertiser_id: '123456',
            ad_ids: JSON.stringify(adIds)
          });

        expect(response.status).toBe(200);
        expect(response.body.data.list).toHaveLength(2);
        expect(response.body.data.list[0].ad_id).toBe('3333333333333333333');
        expect(response.body.data.list[1].ad_id).toBe('4444444444444444444');
      });

      it('should fail when missing advertiser_id', async () => {
        const response = await request(app)
          .get('/tiktok/v1.3/ad/get/')
          .set('Authorization', `Bearer ${VALID_TOKEN}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          code: 40001,
          message: 'Missing required parameter: advertiser_id',
          data: {}
        });
      });
    });
  });

  // ============================================
  // Authentication Tests for New Endpoints
  // ============================================

  describe('Authentication', () => {
    it('should fail reporting without token', async () => {
      const response = await request(app)
        .post('/tiktok/v1.3/reports/integrated/get/')
        .send({
          advertiser_id: '123456',
          data_level: 'AUCTION_CAMPAIGN',
          dimensions: ['campaign_id'],
          metrics: ['spend'],
          start_date: '2025-01-01',
          end_date: '2025-01-31'
        });

      expect(response.status).toBe(401);
    });

    it('should fail ad group creation without token', async () => {
      const response = await request(app)
        .post('/tiktok/v1.3/adgroup/create/')
        .send({
          advertiser_id: '123456',
          campaign_id: '1234567890123456789',
          adgroup_name: 'Test',
          placement_type: 'PLACEMENT_TYPE_AUTOMATIC'
        });

      expect(response.status).toBe(401);
    });

    it('should fail ad creation without token', async () => {
      const response = await request(app)
        .post('/tiktok/v1.3/ad/create/')
        .send({
          advertiser_id: '123456',
          adgroup_id: '9876543210987654321',
          display_name: 'Test Ad'
        });

      expect(response.status).toBe(401);
    });
  });
});
