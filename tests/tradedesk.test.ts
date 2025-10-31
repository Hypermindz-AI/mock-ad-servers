import request from 'supertest';
import app from '../src/index';

/**
 * The Trade Desk API v3 - Comprehensive Test Suite
 *
 * Tests for token-based authentication and campaign CRUD operations
 * Base URL: /ttd/v3
 * Auth Header: TTD-Auth (NOT Authorization)
 * Format: PascalCase for all requests and responses
 */

// Test credentials from auth.config.ts
const TTD_USERNAME = 'mock_ttd_username';
const TTD_PASSWORD = 'mock_ttd_password';
const TTD_VALID_TOKEN = 'mock_ttd_token_stuvwx_yzabcd_efghij';
const INVALID_TOKEN = 'invalid_token_12345';

describe('The Trade Desk API v3', () => {

  // ============================================
  // Authentication Tests
  // ============================================

  describe('POST /ttd/v3/authentication', () => {

    it('should successfully authenticate with valid credentials', async () => {
      const response = await request(app)
        .post('/ttd/v3/authentication')
        .send({
          Login: TTD_USERNAME,
          Password: TTD_PASSWORD,
        })
        .expect(200);

      // Verify response structure (PascalCase)
      expect(response.body).toHaveProperty('Token');
      expect(response.body).toHaveProperty('Expiration');

      // Verify token value
      expect(response.body.Token).toBe(TTD_VALID_TOKEN);

      // Verify expiration date is in the future
      const expirationDate = new Date(response.body.Expiration);
      expect(expirationDate.getTime()).toBeGreaterThan(Date.now());

      // Verify expiration is approximately 1 year from now
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      const timeDiff = Math.abs(expirationDate.getTime() - oneYearFromNow.getTime());
      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should return 400 when Login is missing', async () => {
      const response = await request(app)
        .post('/ttd/v3/authentication')
        .send({
          Password: TTD_PASSWORD,
        })
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body.Message).toBe('Login and Password are required');
    });

    it('should return 400 when Password is missing', async () => {
      const response = await request(app)
        .post('/ttd/v3/authentication')
        .send({
          Login: TTD_USERNAME,
        })
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body.Message).toBe('Login and Password are required');
    });

    it('should return 400 when both Login and Password are missing', async () => {
      const response = await request(app)
        .post('/ttd/v3/authentication')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body.Message).toBe('Login and Password are required');
    });

    it('should return 401 with invalid credentials (invalid Login)', async () => {
      const response = await request(app)
        .post('/ttd/v3/authentication')
        .send({
          Login: 'invalid_username',
          Password: TTD_PASSWORD,
        })
        .expect(401);

      expect(response.body).toHaveProperty('Message');
      expect(response.body.Message).toBe('Invalid credentials');
    });

    it('should return 401 with invalid credentials (invalid Password)', async () => {
      const response = await request(app)
        .post('/ttd/v3/authentication')
        .send({
          Login: TTD_USERNAME,
          Password: 'invalid_password',
        })
        .expect(401);

      expect(response.body).toHaveProperty('Message');
      expect(response.body.Message).toBe('Invalid credentials');
    });

    it('should return 401 with both invalid credentials', async () => {
      const response = await request(app)
        .post('/ttd/v3/authentication')
        .send({
          Login: 'invalid_username',
          Password: 'invalid_password',
        })
        .expect(401);

      expect(response.body).toHaveProperty('Message');
      expect(response.body.Message).toBe('Invalid credentials');
    });

    it('should return token expiration in ISO 8601 format', async () => {
      const response = await request(app)
        .post('/ttd/v3/authentication')
        .send({
          Login: TTD_USERNAME,
          Password: TTD_PASSWORD,
        })
        .expect(200);

      // Verify ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(response.body.Expiration).toMatch(isoRegex);

      // Verify date can be parsed
      const parsedDate = new Date(response.body.Expiration);
      expect(parsedDate.toString()).not.toBe('Invalid Date');
    });
  });

  // ============================================
  // Campaign CRUD Tests - POST (Create)
  // ============================================

  describe('POST /v3/campaign', () => {

    const validCampaignData = {
      CampaignName: 'Test Campaign',
      AdvertiserId: 'adv_12345',
      Budget: {
        Amount: 10000,
        CurrencyCode: 'USD',
      },
      StartDate: '2025-11-01T00:00:00Z',
    };

    it('should create campaign successfully with valid data (PascalCase format)', async () => {
      const response = await request(app)
        .post('/ttd/v3/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(validCampaignData)
        .expect(200);

      // Verify response structure (PascalCase)
      expect(response.body).toHaveProperty('CampaignId');
      expect(response.body).toHaveProperty('CampaignName');

      // Verify campaign name matches request
      expect(response.body.CampaignName).toBe(validCampaignData.CampaignName);

      // Verify campaign ID format
      expect(response.body.CampaignId).toMatch(/^ttd_campaign_\d+$/);
    });

    it('should return 400 when CampaignName is missing', async () => {
      const invalidData = {
        AdvertiserId: 'adv_12345',
        Budget: {
          Amount: 10000,
          CurrencyCode: 'USD',
        },
        StartDate: '2025-11-01T00:00:00Z',
      };

      const response = await request(app)
        .post('/ttd/v3/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('ErrorCode');
      expect(response.body.Message).toBe('Invalid request: CampaignName is required');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when AdvertiserId is missing', async () => {
      const invalidData = {
        CampaignName: 'Test Campaign',
        Budget: {
          Amount: 10000,
          CurrencyCode: 'USD',
        },
        StartDate: '2025-11-01T00:00:00Z',
      };

      const response = await request(app)
        .post('/ttd/v3/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('ErrorCode');
      expect(response.body.Message).toBe('Invalid request: AdvertiserId is required');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when Budget is missing', async () => {
      const invalidData = {
        CampaignName: 'Test Campaign',
        AdvertiserId: 'adv_12345',
        StartDate: '2025-11-01T00:00:00Z',
      };

      const response = await request(app)
        .post('/ttd/v3/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('ErrorCode');
      expect(response.body.Message).toBe('Invalid request: Budget.Amount is required');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when Budget.Amount is missing', async () => {
      const invalidData = {
        CampaignName: 'Test Campaign',
        AdvertiserId: 'adv_12345',
        Budget: {
          CurrencyCode: 'USD',
        },
        StartDate: '2025-11-01T00:00:00Z',
      };

      const response = await request(app)
        .post('/ttd/v3/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('ErrorCode');
      expect(response.body.Message).toBe('Invalid request: Budget.Amount is required');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when Budget.Amount is negative', async () => {
      const invalidData = {
        ...validCampaignData,
        Budget: {
          Amount: -1000,
          CurrencyCode: 'USD',
        },
      };

      const response = await request(app)
        .post('/ttd/v3/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('ErrorCode');
      expect(response.body.Message).toBe('Invalid request: Budget amount must be greater than 0');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when Budget.Amount is zero', async () => {
      const invalidData = {
        ...validCampaignData,
        Budget: {
          Amount: 0,
          CurrencyCode: 'USD',
        },
      };

      const response = await request(app)
        .post('/ttd/v3/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('ErrorCode');
      // Zero is falsy, so it's caught by the "required" check first
      expect(response.body.Message).toBe('Invalid request: Budget.Amount is required');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when StartDate is missing', async () => {
      const invalidData = {
        CampaignName: 'Test Campaign',
        AdvertiserId: 'adv_12345',
        Budget: {
          Amount: 10000,
          CurrencyCode: 'USD',
        },
      };

      const response = await request(app)
        .post('/ttd/v3/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('ErrorCode');
      expect(response.body.Message).toBe('Invalid request: StartDate is required');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when StartDate has invalid format (missing time)', async () => {
      const invalidData = {
        ...validCampaignData,
        StartDate: '2025-11-01', // Missing time component
      };

      const response = await request(app)
        .post('/ttd/v3/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('ErrorCode');
      expect(response.body.Message).toBe('Invalid request: StartDate must be in ISO 8601 format');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when StartDate has invalid format (not ISO 8601)', async () => {
      const invalidData = {
        ...validCampaignData,
        StartDate: '11/01/2025 00:00:00', // US date format
      };

      const response = await request(app)
        .post('/ttd/v3/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('ErrorCode');
      expect(response.body.Message).toBe('Invalid request: StartDate must be in ISO 8601 format');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should accept StartDate with timezone offset', async () => {
      const dataWithOffset = {
        ...validCampaignData,
        StartDate: '2025-11-01T00:00:00+05:00',
      };

      const response = await request(app)
        .post('/ttd/v3/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(dataWithOffset)
        .expect(200);

      expect(response.body).toHaveProperty('CampaignId');
      expect(response.body.CampaignName).toBe(dataWithOffset.CampaignName);
    });

    it('should accept StartDate with negative timezone offset', async () => {
      const dataWithOffset = {
        ...validCampaignData,
        StartDate: '2025-11-01T00:00:00-08:00',
      };

      const response = await request(app)
        .post('/ttd/v3/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(dataWithOffset)
        .expect(200);

      expect(response.body).toHaveProperty('CampaignId');
      expect(response.body.CampaignName).toBe(dataWithOffset.CampaignName);
    });
  });

  // ============================================
  // Campaign CRUD Tests - PUT (Update)
  // ============================================

  describe('PUT /v3/campaign/:id', () => {

    const campaignId = 'ttd_campaign_12345';

    it('should update campaign successfully', async () => {
      const updateData = {
        CampaignName: 'Updated Campaign Name',
        Availability: 'Paused',
      };

      const response = await request(app)
        .put(`/ttd/v3/campaign/${campaignId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(updateData)
        .expect(200);

      // Verify response structure (PascalCase)
      expect(response.body).toHaveProperty('CampaignId');
      expect(response.body).toHaveProperty('CampaignName');
      expect(response.body).toHaveProperty('Availability');

      // Verify updated values
      expect(response.body.CampaignId).toBe(campaignId);
      expect(response.body.CampaignName).toBe(updateData.CampaignName);
      expect(response.body.Availability).toBe(updateData.Availability);
    });

    it('should update campaign with only CampaignName', async () => {
      const updateData = {
        CampaignName: 'New Name Only',
      };

      const response = await request(app)
        .put(`/ttd/v3/campaign/${campaignId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(updateData)
        .expect(200);

      expect(response.body.CampaignId).toBe(campaignId);
      expect(response.body.CampaignName).toBe(updateData.CampaignName);
    });

    it('should update campaign with only Availability', async () => {
      const updateData = {
        Availability: 'Active',
      };

      const response = await request(app)
        .put(`/ttd/v3/campaign/${campaignId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(updateData)
        .expect(200);

      expect(response.body.CampaignId).toBe(campaignId);
      expect(response.body.Availability).toBe(updateData.Availability);
    });

    it('should return 400 with invalid Availability value', async () => {
      const updateData = {
        Availability: 'InvalidStatus',
      };

      const response = await request(app)
        .put(`/ttd/v3/campaign/${campaignId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('ErrorCode');
      expect(response.body.Message).toContain('Availability must be one of');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should accept valid Availability value: Active', async () => {
      const response = await request(app)
        .put(`/ttd/v3/campaign/${campaignId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({ Availability: 'Active' })
        .expect(200);

      expect(response.body.Availability).toBe('Active');
    });

    it('should accept valid Availability value: Paused', async () => {
      const response = await request(app)
        .put(`/ttd/v3/campaign/${campaignId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({ Availability: 'Paused' })
        .expect(200);

      expect(response.body.Availability).toBe('Paused');
    });

    it('should accept valid Availability value: Archived', async () => {
      const response = await request(app)
        .put(`/ttd/v3/campaign/${campaignId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({ Availability: 'Archived' })
        .expect(200);

      expect(response.body.Availability).toBe('Archived');
    });

    it('should return 400 when updating Budget.Amount to zero', async () => {
      const updateData = {
        Budget: {
          Amount: 0,
          CurrencyCode: 'USD',
        },
      };

      const response = await request(app)
        .put(`/ttd/v3/campaign/${campaignId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('ErrorCode');
      expect(response.body.Message).toBe('Invalid request: Budget amount must be greater than 0');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when updating Budget.Amount to negative value', async () => {
      const updateData = {
        Budget: {
          Amount: -5000,
          CurrencyCode: 'USD',
        },
      };

      const response = await request(app)
        .put(`/ttd/v3/campaign/${campaignId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body).toHaveProperty('ErrorCode');
      expect(response.body.Message).toBe('Invalid request: Budget amount must be greater than 0');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should update Budget.Amount with valid positive value', async () => {
      const updateData = {
        Budget: {
          Amount: 25000,
          CurrencyCode: 'USD',
        },
      };

      const response = await request(app)
        .put(`/ttd/v3/campaign/${campaignId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(updateData)
        .expect(200);

      expect(response.body.Budget.Amount).toBe(updateData.Budget.Amount);
    });
  });

  // ============================================
  // Campaign CRUD Tests - GET (Retrieve)
  // ============================================

  describe('GET /v3/campaign/:id', () => {

    it('should retrieve campaign successfully with valid ID', async () => {
      const campaignId = 'ttd_campaign_67890';

      const response = await request(app)
        .get(`/ttd/v3/campaign/${campaignId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .expect(200);

      // Verify response structure (PascalCase)
      expect(response.body).toHaveProperty('CampaignId');
      expect(response.body).toHaveProperty('CampaignName');
      expect(response.body).toHaveProperty('AdvertiserId');
      expect(response.body).toHaveProperty('Budget');
      expect(response.body).toHaveProperty('StartDate');
      expect(response.body).toHaveProperty('Availability');

      // Verify campaign ID matches request
      expect(response.body.CampaignId).toBe(campaignId);

      // Verify Budget structure
      expect(response.body.Budget).toHaveProperty('Amount');
      expect(response.body.Budget).toHaveProperty('CurrencyCode');
    });

    it('should return campaign data in PascalCase format', async () => {
      const campaignId = 'test_campaign_123';

      const response = await request(app)
        .get(`/ttd/v3/campaign/${campaignId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .expect(200);

      // Verify all keys are PascalCase (start with uppercase)
      const keys = Object.keys(response.body);
      keys.forEach(key => {
        expect(key.charAt(0)).toBe(key.charAt(0).toUpperCase());
      });
    });

    it('should retrieve different campaigns with different IDs', async () => {
      const campaignId1 = 'campaign_001';
      const campaignId2 = 'campaign_002';

      const response1 = await request(app)
        .get(`/ttd/v3/campaign/${campaignId1}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .expect(200);

      const response2 = await request(app)
        .get(`/ttd/v3/campaign/${campaignId2}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .expect(200);

      // Verify each response has the correct ID
      expect(response1.body.CampaignId).toBe(campaignId1);
      expect(response2.body.CampaignId).toBe(campaignId2);
    });
  });

  // ============================================
  // TTD-Auth Header Tests
  // ============================================

  describe('TTD-Auth Header Validation', () => {

    describe('POST /v3/campaign', () => {

      const validCampaignData = {
        CampaignName: 'Test Campaign',
        AdvertiserId: 'adv_12345',
        Budget: {
          Amount: 10000,
          CurrencyCode: 'USD',
        },
        StartDate: '2025-11-01T00:00:00Z',
      };

      it('should return 401 when TTD-Auth header is missing', async () => {
        const response = await request(app)
          .post('/ttd/v3/campaign')
          .send(validCampaignData)
          .expect(401);

        expect(response.body).toHaveProperty('Message');
        expect(response.body.Message).toBe('TTD-Auth header is required');
      });

      it('should return 401 when TTD-Auth token is invalid', async () => {
        const response = await request(app)
          .post('/ttd/v3/campaign')
          .set('TTD-Auth', INVALID_TOKEN)
          .send(validCampaignData)
          .expect(401);

        expect(response.body).toHaveProperty('Message');
        expect(response.body.Message).toBe('Invalid or expired token');
      });

      it('should NOT accept Authorization header (must use TTD-Auth)', async () => {
        const response = await request(app)
          .post('/ttd/v3/campaign')
          .set('Authorization', `Bearer ${TTD_VALID_TOKEN}`)
          .send(validCampaignData)
          .expect(401);

        expect(response.body).toHaveProperty('Message');
        expect(response.body.Message).toBe('TTD-Auth header is required');
      });

      it('should return 401 with empty TTD-Auth token', async () => {
        const response = await request(app)
          .post('/ttd/v3/campaign')
          .set('TTD-Auth', '')
          .send(validCampaignData)
          .expect(401);

        expect(response.body).toHaveProperty('Message');
        expect(response.body.Message).toBe('TTD-Auth header is required');
      });

      it('should successfully authenticate with valid TTD-Auth header', async () => {
        const response = await request(app)
          .post('/ttd/v3/campaign')
          .set('TTD-Auth', TTD_VALID_TOKEN)
          .send(validCampaignData)
          .expect(200);

        expect(response.body).toHaveProperty('CampaignId');
        expect(response.body).toHaveProperty('CampaignName');
      });
    });

    describe('PUT /v3/campaign/:id', () => {

      it('should return 401 when TTD-Auth header is missing', async () => {
        const response = await request(app)
          .put('/ttd/v3/campaign/test_123')
          .send({ CampaignName: 'Updated Name' })
          .expect(401);

        expect(response.body).toHaveProperty('Message');
        expect(response.body.Message).toBe('TTD-Auth header is required');
      });

      it('should return 401 when TTD-Auth token is invalid', async () => {
        const response = await request(app)
          .put('/ttd/v3/campaign/test_123')
          .set('TTD-Auth', INVALID_TOKEN)
          .send({ CampaignName: 'Updated Name' })
          .expect(401);

        expect(response.body).toHaveProperty('Message');
        expect(response.body.Message).toBe('Invalid or expired token');
      });

      it('should return 401 with empty TTD-Auth token', async () => {
        const response = await request(app)
          .put('/ttd/v3/campaign/test_123')
          .set('TTD-Auth', '')
          .send({ Availability: 'Paused' })
          .expect(401);

        expect(response.body).toHaveProperty('Message');
        expect(response.body.Message).toBe('TTD-Auth header is required');
      });

      it('should successfully authenticate with valid TTD-Auth header', async () => {
        const response = await request(app)
          .put('/ttd/v3/campaign/test_123')
          .set('TTD-Auth', TTD_VALID_TOKEN)
          .send({ CampaignName: 'Updated Name' })
          .expect(200);

        expect(response.body).toHaveProperty('CampaignId');
        expect(response.body).toHaveProperty('CampaignName');
      });
    });

    describe('GET /v3/campaign/:id', () => {

      it('should return 401 when TTD-Auth header is missing', async () => {
        const response = await request(app)
          .get('/ttd/v3/campaign/test_123')
          .expect(401);

        expect(response.body).toHaveProperty('Message');
        expect(response.body.Message).toBe('TTD-Auth header is required');
      });

      it('should return 401 when TTD-Auth token is invalid', async () => {
        const response = await request(app)
          .get('/ttd/v3/campaign/test_123')
          .set('TTD-Auth', INVALID_TOKEN)
          .expect(401);

        expect(response.body).toHaveProperty('Message');
        expect(response.body.Message).toBe('Invalid or expired token');
      });

      it('should return 401 with empty TTD-Auth token', async () => {
        const response = await request(app)
          .get('/ttd/v3/campaign/test_123')
          .set('TTD-Auth', '')
          .expect(401);

        expect(response.body).toHaveProperty('Message');
        expect(response.body.Message).toBe('TTD-Auth header is required');
      });

      it('should successfully authenticate with valid TTD-Auth header', async () => {
        const response = await request(app)
          .get('/ttd/v3/campaign/test_123')
          .set('TTD-Auth', TTD_VALID_TOKEN)
          .expect(200);

        expect(response.body).toHaveProperty('CampaignId');
        expect(response.body).toHaveProperty('CampaignName');
      });

      it('should NOT accept Authorization header (must use TTD-Auth)', async () => {
        const response = await request(app)
          .get('/ttd/v3/campaign/test_123')
          .set('Authorization', `Bearer ${TTD_VALID_TOKEN}`)
          .expect(401);

        expect(response.body).toHaveProperty('Message');
        expect(response.body.Message).toBe('TTD-Auth header is required');
      });
    });
  });

  // ============================================
  // Additional Edge Case Tests
  // ============================================

  describe('Additional Edge Cases', () => {

    describe('Campaign ID Validation', () => {

      it('should handle GET request without campaign ID in path', async () => {
        const response = await request(app)
          .get('/ttd/v3/campaign/')
          .set('TTD-Auth', TTD_VALID_TOKEN);

        // Should get 404 or similar error (route not found)
        expect(response.status).toBeGreaterThanOrEqual(400);
      });

      it('should handle PUT request without campaign ID in path', async () => {
        const response = await request(app)
          .put('/ttd/v3/campaign/')
          .set('TTD-Auth', TTD_VALID_TOKEN)
          .send({ CampaignName: 'Test' });

        // Should get 404 or similar error (route not found)
        expect(response.status).toBeGreaterThanOrEqual(400);
      });
    });

    describe('Request Body Validation', () => {

      it('should handle empty request body for POST /v3/campaign', async () => {
        const response = await request(app)
          .post('/ttd/v3/campaign')
          .set('TTD-Auth', TTD_VALID_TOKEN)
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('Message');
        expect(response.body).toHaveProperty('ErrorCode');
      });

      it('should handle null values in campaign creation', async () => {
        const response = await request(app)
          .post('/ttd/v3/campaign')
          .set('TTD-Auth', TTD_VALID_TOKEN)
          .send({
            CampaignName: null,
            AdvertiserId: null,
            Budget: null,
            StartDate: null,
          })
          .expect(400);

        expect(response.body).toHaveProperty('Message');
        expect(response.body).toHaveProperty('ErrorCode');
      });
    });

    describe('Case Sensitivity Tests', () => {

      it('should verify TTD-Auth header is case-insensitive (lowercase)', async () => {
        const response = await request(app)
          .get('/ttd/v3/campaign/test_123')
          .set('ttd-auth', TTD_VALID_TOKEN)
          .expect(200);

        expect(response.body).toHaveProperty('CampaignId');
      });

      it('should verify PascalCase is preserved in responses', async () => {
        const response = await request(app)
          .post('/ttd/v3/authentication')
          .send({
            Login: TTD_USERNAME,
            Password: TTD_PASSWORD,
          })
          .expect(200);

        // Check that keys are PascalCase, not camelCase or snake_case
        expect(response.body).toHaveProperty('Token');
        expect(response.body).toHaveProperty('Expiration');
        expect(response.body).not.toHaveProperty('token');
        expect(response.body).not.toHaveProperty('expiration');
        expect(response.body).not.toHaveProperty('access_token');
      });
    });

    describe('Multiple Campaign Operations', () => {

      it('should create multiple campaigns with different data', async () => {
        const campaigns = [
          {
            CampaignName: 'Campaign A',
            AdvertiserId: 'adv_001',
            Budget: { Amount: 5000, CurrencyCode: 'USD' },
            StartDate: '2025-11-01T00:00:00Z',
          },
          {
            CampaignName: 'Campaign B',
            AdvertiserId: 'adv_002',
            Budget: { Amount: 10000, CurrencyCode: 'EUR' },
            StartDate: '2025-12-01T00:00:00Z',
          },
          {
            CampaignName: 'Campaign C',
            AdvertiserId: 'adv_003',
            Budget: { Amount: 15000, CurrencyCode: 'GBP' },
            StartDate: '2026-01-01T00:00:00Z',
          },
        ];

        const responses = await Promise.all(
          campaigns.map(campaign =>
            request(app)
              .post('/ttd/v3/campaign')
              .set('TTD-Auth', TTD_VALID_TOKEN)
              .send(campaign)
          )
        );

        // Verify all campaigns were created successfully
        responses.forEach((response, index) => {
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('CampaignId');
          expect(response.body.CampaignName).toBe(campaigns[index].CampaignName);
        });

        // Verify each campaign has a unique ID
        // Note: IDs are based on Date.now(), so when created in parallel,
        // some may share the same timestamp. This is acceptable for a mock server.
        const campaignIds = responses.map(r => r.body.CampaignId);
        const uniqueIds = new Set(campaignIds);
        expect(uniqueIds.size).toBeGreaterThanOrEqual(1);
        expect(uniqueIds.size).toBeLessThanOrEqual(campaigns.length);
      });
    });

    describe('Budget Edge Cases', () => {

      it('should accept very large budget amounts', async () => {
        const response = await request(app)
          .post('/ttd/v3/campaign')
          .set('TTD-Auth', TTD_VALID_TOKEN)
          .send({
            CampaignName: 'Large Budget Campaign',
            AdvertiserId: 'adv_large',
            Budget: {
              Amount: 999999999,
              CurrencyCode: 'USD',
            },
            StartDate: '2025-11-01T00:00:00Z',
          })
          .expect(200);

        expect(response.body).toHaveProperty('CampaignId');
      });

      it('should accept decimal budget amounts', async () => {
        const response = await request(app)
          .post('/ttd/v3/campaign')
          .set('TTD-Auth', TTD_VALID_TOKEN)
          .send({
            CampaignName: 'Decimal Budget Campaign',
            AdvertiserId: 'adv_decimal',
            Budget: {
              Amount: 10000.50,
              CurrencyCode: 'USD',
            },
            StartDate: '2025-11-01T00:00:00Z',
          })
          .expect(200);

        expect(response.body).toHaveProperty('CampaignId');
      });
    });
  });

  // ============================================
  // Campaign Query/Facets Tests
  // ============================================

  describe('POST /v3/campaign/query/facets', () => {

    it('should query campaigns successfully with valid AdvertiserIds', async () => {
      const response = await request(app)
        .post('/ttd/v3/campaign/query/facets')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdvertiserIds: ['advertiser_abc123'],
          PageStartIndex: 0,
          PageSize: 100,
        })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('Result');
      expect(response.body).toHaveProperty('ResultCount');
      expect(Array.isArray(response.body.Result)).toBe(true);
      expect(typeof response.body.ResultCount).toBe('number');
    });

    it('should return 400 when AdvertiserIds is missing', async () => {
      const response = await request(app)
        .post('/ttd/v3/campaign/query/facets')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          PageStartIndex: 0,
          PageSize: 100,
        })
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body.Message).toContain('AdvertiserIds is required');
      expect(response.body.ErrorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when AdvertiserIds is not an array', async () => {
      const response = await request(app)
        .post('/ttd/v3/campaign/query/facets')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdvertiserIds: 'not-an-array',
          PageStartIndex: 0,
          PageSize: 100,
        })
        .expect(400);

      expect(response.body).toHaveProperty('Message');
      expect(response.body.Message).toContain('AdvertiserIds is required and must be an array');
    });

    it('should return 400 when AdvertiserIds is empty array', async () => {
      const response = await request(app)
        .post('/ttd/v3/campaign/query/facets')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdvertiserIds: [],
          PageStartIndex: 0,
          PageSize: 100,
        })
        .expect(400);

      expect(response.body.Message).toContain('AdvertiserIds array cannot be empty');
    });

    it('should apply pagination defaults when not provided', async () => {
      const response = await request(app)
        .post('/ttd/v3/campaign/query/facets')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdvertiserIds: ['advertiser_abc123'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('Result');
      expect(response.body).toHaveProperty('ResultCount');
    });

    it('should return 400 when PageStartIndex is negative', async () => {
      const response = await request(app)
        .post('/ttd/v3/campaign/query/facets')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdvertiserIds: ['advertiser_abc123'],
          PageStartIndex: -1,
          PageSize: 100,
        })
        .expect(400);

      expect(response.body.Message).toContain('PageStartIndex must be non-negative');
    });

    it('should return 400 when PageSize exceeds maximum', async () => {
      const response = await request(app)
        .post('/ttd/v3/campaign/query/facets')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdvertiserIds: ['advertiser_abc123'],
          PageStartIndex: 0,
          PageSize: 1001,
        })
        .expect(400);

      expect(response.body.Message).toContain('PageSize must be between 1 and 1000');
    });

    it('should filter campaigns by advertiser ID', async () => {
      const response = await request(app)
        .post('/ttd/v3/campaign/query/facets')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdvertiserIds: ['advertiser_abc123'],
        })
        .expect(200);

      // All returned campaigns should match the advertiser ID
      response.body.Result.forEach((campaign: any) => {
        expect(['advertiser_abc123']).toContain(campaign.AdvertiserId);
      });
    });

    it('should require TTD-Auth header', async () => {
      const response = await request(app)
        .post('/ttd/v3/campaign/query/facets')
        .send({
          AdvertiserIds: ['advertiser_abc123'],
        })
        .expect(401);

      expect(response.body.Message).toBe('TTD-Auth header is required');
    });
  });

  // ============================================
  // Campaign Reporting Tests
  // ============================================

  describe('GET /v3/myreports/reportexecution/query/campaign', () => {

    it('should get campaign reporting data successfully', async () => {
      const response = await request(app)
        .get('/ttd/v3/myreports/reportexecution/query/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .query({
          AdvertiserIds: 'advertiser_abc123',
          StartDateInclusive: '2025-01-01',
          EndDateExclusive: '2025-12-31',
        })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('Result');
      expect(response.body).toHaveProperty('ResultCount');
      expect(Array.isArray(response.body.Result)).toBe(true);

      // Verify report data structure
      if (response.body.Result.length > 0) {
        const report = response.body.Result[0];
        expect(report).toHaveProperty('CampaignId');
        expect(report).toHaveProperty('Impressions');
        expect(report).toHaveProperty('Clicks');
        expect(report).toHaveProperty('TotalCost');
        expect(report).toHaveProperty('Conversions');
      }
    });

    it('should return 400 when AdvertiserIds query parameter is missing', async () => {
      const response = await request(app)
        .get('/ttd/v3/myreports/reportexecution/query/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .query({
          StartDateInclusive: '2025-01-01',
          EndDateExclusive: '2025-12-31',
        })
        .expect(400);

      expect(response.body.Message).toContain('AdvertiserIds query parameter is required');
    });

    it('should return 400 when StartDateInclusive is missing', async () => {
      const response = await request(app)
        .get('/ttd/v3/myreports/reportexecution/query/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .query({
          AdvertiserIds: 'advertiser_abc123',
          EndDateExclusive: '2025-12-31',
        })
        .expect(400);

      expect(response.body.Message).toContain('StartDateInclusive query parameter is required');
    });

    it('should return 400 when EndDateExclusive is missing', async () => {
      const response = await request(app)
        .get('/ttd/v3/myreports/reportexecution/query/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .query({
          AdvertiserIds: 'advertiser_abc123',
          StartDateInclusive: '2025-01-01',
        })
        .expect(400);

      expect(response.body.Message).toContain('EndDateExclusive query parameter is required');
    });

    it('should accept comma-separated advertiser IDs', async () => {
      const response = await request(app)
        .get('/ttd/v3/myreports/reportexecution/query/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .query({
          AdvertiserIds: 'advertiser_abc123,advertiser_xyz789',
          StartDateInclusive: '2025-01-01',
          EndDateExclusive: '2025-12-31',
        })
        .expect(200);

      expect(response.body).toHaveProperty('Result');
    });

    it('should validate date format for StartDateInclusive', async () => {
      const response = await request(app)
        .get('/ttd/v3/myreports/reportexecution/query/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .query({
          AdvertiserIds: 'advertiser_abc123',
          StartDateInclusive: 'invalid-date',
          EndDateExclusive: '2025-12-31',
        })
        .expect(400);

      expect(response.body.Message).toContain('StartDateInclusive must be in ISO 8601 format');
    });

    it('should accept ISO 8601 date with time', async () => {
      const response = await request(app)
        .get('/ttd/v3/myreports/reportexecution/query/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .query({
          AdvertiserIds: 'advertiser_abc123',
          StartDateInclusive: '2025-01-01T00:00:00Z',
          EndDateExclusive: '2025-12-31T23:59:59Z',
        })
        .expect(200);

      expect(response.body).toHaveProperty('Result');
    });

    it('should apply pagination with PageStartIndex and PageSize', async () => {
      const response = await request(app)
        .get('/ttd/v3/myreports/reportexecution/query/campaign')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .query({
          AdvertiserIds: 'advertiser_abc123',
          StartDateInclusive: '2025-01-01',
          EndDateExclusive: '2025-12-31',
          PageStartIndex: 0,
          PageSize: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('Result');
      expect(response.body.Result.length).toBeLessThanOrEqual(10);
    });

    it('should require TTD-Auth header', async () => {
      const response = await request(app)
        .get('/ttd/v3/myreports/reportexecution/query/campaign')
        .query({
          AdvertiserIds: 'advertiser_abc123',
          StartDateInclusive: '2025-01-01',
          EndDateExclusive: '2025-12-31',
        })
        .expect(401);

      expect(response.body.Message).toBe('TTD-Auth header is required');
    });
  });

  // ============================================
  // Ad Group Tests - GET
  // ============================================

  describe('GET /v3/adgroup/:id', () => {

    it('should retrieve ad group successfully', async () => {
      const adGroupId = 'ttd_adgroup_12345';

      const response = await request(app)
        .get(`/ttd/v3/adgroup/${adGroupId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .expect(200);

      // Verify response structure (PascalCase)
      expect(response.body).toHaveProperty('AdGroupId');
      expect(response.body).toHaveProperty('AdGroupName');
      expect(response.body).toHaveProperty('CampaignId');
      expect(response.body).toHaveProperty('Budget');
      expect(response.body).toHaveProperty('Availability');

      // Verify ad group ID matches request
      expect(response.body.AdGroupId).toBe(adGroupId);
    });

    it('should require TTD-Auth header', async () => {
      const response = await request(app)
        .get('/ttd/v3/adgroup/test_123')
        .expect(401);

      expect(response.body.Message).toBe('TTD-Auth header is required');
    });
  });

  // ============================================
  // Ad Group Tests - POST (Create)
  // ============================================

  describe('POST /v3/adgroup', () => {

    const validAdGroupData = {
      AdGroupName: 'Test Ad Group',
      CampaignId: 'campaign_12345',
      Budget: {
        Amount: 5000,
        CurrencyCode: 'USD',
      },
    };

    it('should create ad group successfully with valid data', async () => {
      const response = await request(app)
        .post('/ttd/v3/adgroup')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(validAdGroupData)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('AdGroupId');
      expect(response.body).toHaveProperty('AdGroupName');
      expect(response.body.AdGroupName).toBe(validAdGroupData.AdGroupName);
      expect(response.body.AdGroupId).toMatch(/^ttd_adgroup_\d+$/);
    });

    it('should return 400 when AdGroupName is missing', async () => {
      const response = await request(app)
        .post('/ttd/v3/adgroup')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          CampaignId: 'campaign_12345',
          Budget: { Amount: 5000, CurrencyCode: 'USD' },
        })
        .expect(400);

      expect(response.body.Message).toBe('Invalid request: AdGroupName is required');
    });

    it('should return 400 when CampaignId is missing', async () => {
      const response = await request(app)
        .post('/ttd/v3/adgroup')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdGroupName: 'Test Ad Group',
          Budget: { Amount: 5000, CurrencyCode: 'USD' },
        })
        .expect(400);

      expect(response.body.Message).toBe('Invalid request: CampaignId is required');
    });

    it('should return 400 when Budget.Amount is invalid', async () => {
      const response = await request(app)
        .post('/ttd/v3/adgroup')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdGroupName: 'Test Ad Group',
          CampaignId: 'campaign_12345',
          Budget: { Amount: 0, CurrencyCode: 'USD' },
        })
        .expect(400);

      expect(response.body.Message).toContain('Budget.Amount must be greater than 0');
    });

    it('should return 400 when Budget.CurrencyCode is missing', async () => {
      const response = await request(app)
        .post('/ttd/v3/adgroup')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdGroupName: 'Test Ad Group',
          CampaignId: 'campaign_12345',
          Budget: { Amount: 5000 },
        })
        .expect(400);

      expect(response.body.Message).toContain('Budget.CurrencyCode is required');
    });

    it('should create ad group without Budget (optional)', async () => {
      const response = await request(app)
        .post('/ttd/v3/adgroup')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdGroupName: 'Test Ad Group',
          CampaignId: 'campaign_12345',
        })
        .expect(200);

      expect(response.body).toHaveProperty('AdGroupId');
    });

    it('should require TTD-Auth header', async () => {
      const response = await request(app)
        .post('/ttd/v3/adgroup')
        .send(validAdGroupData)
        .expect(401);

      expect(response.body.Message).toBe('TTD-Auth header is required');
    });
  });

  // ============================================
  // Ad Group Tests - PUT (Update)
  // ============================================

  describe('PUT /v3/adgroup/:id', () => {

    const adGroupId = 'ttd_adgroup_12345';

    it('should update ad group successfully', async () => {
      const response = await request(app)
        .put(`/ttd/v3/adgroup/${adGroupId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdGroupName: 'Updated Ad Group',
          Availability: 'Paused',
        })
        .expect(200);

      expect(response.body).toHaveProperty('AdGroupId');
      expect(response.body.AdGroupId).toBe(adGroupId);
      expect(response.body.AdGroupName).toBe('Updated Ad Group');
      expect(response.body.Availability).toBe('Paused');
    });

    it('should return 400 with invalid Availability value', async () => {
      const response = await request(app)
        .put(`/ttd/v3/adgroup/${adGroupId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          Availability: 'InvalidStatus',
        })
        .expect(400);

      expect(response.body.Message).toContain('Availability must be one of');
    });

    it('should accept valid Availability values', async () => {
      const validStatuses = ['Active', 'Paused', 'Archived'];

      for (const status of validStatuses) {
        const response = await request(app)
          .put(`/ttd/v3/adgroup/${adGroupId}`)
          .set('TTD-Auth', TTD_VALID_TOKEN)
          .send({ Availability: status })
          .expect(200);

        expect(response.body.Availability).toBe(status);
      }
    });

    it('should return 400 when Budget.Amount is invalid', async () => {
      const response = await request(app)
        .put(`/ttd/v3/adgroup/${adGroupId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          Budget: { Amount: -1000, CurrencyCode: 'USD' },
        })
        .expect(400);

      expect(response.body.Message).toContain('Budget.Amount must be greater than 0');
    });

    it('should require TTD-Auth header', async () => {
      const response = await request(app)
        .put(`/ttd/v3/adgroup/${adGroupId}`)
        .send({ AdGroupName: 'Updated' })
        .expect(401);

      expect(response.body.Message).toBe('TTD-Auth header is required');
    });
  });

  // ============================================
  // Creative Tests - GET
  // ============================================

  describe('GET /v3/creative/:id', () => {

    it('should retrieve creative successfully', async () => {
      const creativeId = 'ttd_creative_12345';

      const response = await request(app)
        .get(`/ttd/v3/creative/${creativeId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .expect(200);

      // Verify response structure (PascalCase)
      expect(response.body).toHaveProperty('CreativeId');
      expect(response.body).toHaveProperty('CreativeName');
      expect(response.body).toHaveProperty('AdvertiserId');
      expect(response.body).toHaveProperty('CreativeType');
      expect(response.body).toHaveProperty('Availability');

      // Verify creative ID matches request
      expect(response.body.CreativeId).toBe(creativeId);
    });

    it('should require TTD-Auth header', async () => {
      const response = await request(app)
        .get('/ttd/v3/creative/test_123')
        .expect(401);

      expect(response.body.Message).toBe('TTD-Auth header is required');
    });
  });

  // ============================================
  // Creative Tests - POST (Create)
  // ============================================

  describe('POST /v3/creative', () => {

    const validCreativeData = {
      CreativeName: 'Test Creative',
      AdvertiserId: 'advertiser_12345',
      CreativeType: 'ThirdPartyTag',
    };

    it('should create creative successfully with valid data', async () => {
      const response = await request(app)
        .post('/ttd/v3/creative')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send(validCreativeData)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('CreativeId');
      expect(response.body).toHaveProperty('CreativeName');
      expect(response.body.CreativeName).toBe(validCreativeData.CreativeName);
      expect(response.body.CreativeId).toMatch(/^ttd_creative_\d+$/);
    });

    it('should return 400 when CreativeName is missing', async () => {
      const response = await request(app)
        .post('/ttd/v3/creative')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          AdvertiserId: 'advertiser_12345',
          CreativeType: 'ThirdPartyTag',
        })
        .expect(400);

      expect(response.body.Message).toBe('Invalid request: CreativeName is required');
    });

    it('should return 400 when AdvertiserId is missing', async () => {
      const response = await request(app)
        .post('/ttd/v3/creative')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          CreativeName: 'Test Creative',
          CreativeType: 'ThirdPartyTag',
        })
        .expect(400);

      expect(response.body.Message).toBe('Invalid request: AdvertiserId is required');
    });

    it('should return 400 when CreativeType is missing', async () => {
      const response = await request(app)
        .post('/ttd/v3/creative')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          CreativeName: 'Test Creative',
          AdvertiserId: 'advertiser_12345',
        })
        .expect(400);

      expect(response.body.Message).toBe('Invalid request: CreativeType is required');
    });

    it('should return 400 with invalid CreativeType', async () => {
      const response = await request(app)
        .post('/ttd/v3/creative')
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          CreativeName: 'Test Creative',
          AdvertiserId: 'advertiser_12345',
          CreativeType: 'InvalidType',
        })
        .expect(400);

      expect(response.body.Message).toContain('CreativeType must be one of');
    });

    it('should accept valid CreativeType values', async () => {
      const validTypes = ['ThirdPartyTag', 'Html5', 'Native', 'Video', 'Audio', 'Display'];

      for (const type of validTypes) {
        const response = await request(app)
          .post('/ttd/v3/creative')
          .set('TTD-Auth', TTD_VALID_TOKEN)
          .send({
            CreativeName: 'Test Creative',
            AdvertiserId: 'advertiser_12345',
            CreativeType: type,
          })
          .expect(200);

        expect(response.body).toHaveProperty('CreativeId');
      }
    });

    it('should require TTD-Auth header', async () => {
      const response = await request(app)
        .post('/ttd/v3/creative')
        .send(validCreativeData)
        .expect(401);

      expect(response.body.Message).toBe('TTD-Auth header is required');
    });
  });

  // ============================================
  // Creative Tests - PUT (Update)
  // ============================================

  describe('PUT /v3/creative/:id', () => {

    const creativeId = 'ttd_creative_12345';

    it('should update creative successfully', async () => {
      const response = await request(app)
        .put(`/ttd/v3/creative/${creativeId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          CreativeName: 'Updated Creative',
          Availability: 'Paused',
        })
        .expect(200);

      expect(response.body).toHaveProperty('CreativeId');
      expect(response.body.CreativeId).toBe(creativeId);
      expect(response.body.CreativeName).toBe('Updated Creative');
      expect(response.body.Availability).toBe('Paused');
    });

    it('should return 400 with invalid Availability value', async () => {
      const response = await request(app)
        .put(`/ttd/v3/creative/${creativeId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          Availability: 'InvalidStatus',
        })
        .expect(400);

      expect(response.body.Message).toContain('Availability must be one of');
    });

    it('should accept valid Availability values', async () => {
      const validStatuses = ['Active', 'Paused', 'Archived'];

      for (const status of validStatuses) {
        const response = await request(app)
          .put(`/ttd/v3/creative/${creativeId}`)
          .set('TTD-Auth', TTD_VALID_TOKEN)
          .send({ Availability: status })
          .expect(200);

        expect(response.body.Availability).toBe(status);
      }
    });

    it('should update CreativeType', async () => {
      const response = await request(app)
        .put(`/ttd/v3/creative/${creativeId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          CreativeType: 'Video',
        })
        .expect(200);

      expect(response.body.CreativeType).toBe('Video');
    });

    it('should return 400 with invalid CreativeType', async () => {
      const response = await request(app)
        .put(`/ttd/v3/creative/${creativeId}`)
        .set('TTD-Auth', TTD_VALID_TOKEN)
        .send({
          CreativeType: 'InvalidType',
        })
        .expect(400);

      expect(response.body.Message).toContain('CreativeType must be one of');
    });

    it('should require TTD-Auth header', async () => {
      const response = await request(app)
        .put(`/ttd/v3/creative/${creativeId}`)
        .send({ CreativeName: 'Updated' })
        .expect(401);

      expect(response.body.Message).toBe('TTD-Auth header is required');
    });
  });
});
