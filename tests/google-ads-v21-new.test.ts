import request from 'supertest';
import app from '../src/index';

// Valid tokens from .env.example
const VALID_ACCESS_TOKEN = 'mock_google_access_token_12345';
const VALID_DEV_TOKEN = 'mock_google_dev_token_67890';

// Test data
const TEST_CUSTOMER_ID = '1234567890';

const validHeaders = {
  Authorization: `Bearer ${VALID_ACCESS_TOKEN}`,
  'developer-token': VALID_DEV_TOKEN,
};

describe('Google Ads API v21 - Search Endpoint Tests', () => {
  describe('POST /googleads/v21/customers/:customerId/googleAds:search', () => {
    it('should successfully search campaigns with GAQL query', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/googleAds:search`)
        .set(validHeaders)
        .send({
          query: 'SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks FROM campaign WHERE segments.date DURING LAST_30_DAYS',
          pageSize: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('fieldMask');
      expect(response.body).toHaveProperty('totalResultsCount');
      expect(response.body.results).toBeInstanceOf(Array);
      expect(response.body.results.length).toBeGreaterThan(0);

      // Check if results contain the selected fields
      const firstResult = response.body.results[0];
      expect(firstResult).toHaveProperty('campaign');
      expect(firstResult.campaign).toHaveProperty('id');
      expect(firstResult.campaign).toHaveProperty('name');
      expect(firstResult.campaign).toHaveProperty('status');
      expect(firstResult).toHaveProperty('metrics');
      expect(firstResult.metrics).toHaveProperty('impressions');
      expect(firstResult.metrics).toHaveProperty('clicks');
    });

    it('should support pagination with pageToken', async () => {
      // Create multiple campaigns first
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
          .set(validHeaders)
          .send({
            operations: [{
              create: {
                name: `Test Campaign ${i}`,
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
                budget: `customers/${TEST_CUSTOMER_ID}/campaignBudgets/123456`,
              },
            }],
          });
      }

      // First page
      const firstPage = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/googleAds:search`)
        .set(validHeaders)
        .send({
          query: 'SELECT campaign.id, campaign.name FROM campaign',
          pageSize: 2,
        });

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.results.length).toBe(2);
      expect(firstPage.body).toHaveProperty('nextPageToken');

      // Second page
      const secondPage = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/googleAds:search`)
        .set(validHeaders)
        .send({
          query: 'SELECT campaign.id, campaign.name FROM campaign',
          pageSize: 2,
          pageToken: firstPage.body.nextPageToken,
        });

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.results.length).toBeGreaterThan(0);
    });

    it('should search ad groups with GAQL query', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/googleAds:search`)
        .set(validHeaders)
        .send({
          query: 'SELECT adGroup.id, adGroup.name, adGroup.status, metrics.impressions FROM ad_group WHERE segments.date DURING LAST_7_DAYS',
          pageSize: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.results).toBeInstanceOf(Array);

      if (response.body.results.length > 0) {
        const firstResult = response.body.results[0];
        expect(firstResult).toHaveProperty('adGroup');
        expect(firstResult).toHaveProperty('metrics');
      }
    });

    it('should search ad group ads with GAQL query', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/googleAds:search`)
        .set(validHeaders)
        .send({
          query: 'SELECT ad_group_ad.ad.id, ad_group_ad.status, metrics.clicks FROM ad_group_ad',
          pageSize: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.results).toBeInstanceOf(Array);
    });

    it('should fail without query parameter', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/googleAds:search`)
        .set(validHeaders)
        .send({
          pageSize: 10,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.details[0].errors[0].errorCode).toHaveProperty('queryError');
    });

    it('should fail with invalid GAQL query', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/googleAds:search`)
        .set(validHeaders)
        .send({
          query: 'INVALID QUERY SYNTAX',
          pageSize: 10,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/googleAds:search`)
        .set('developer-token', VALID_DEV_TOKEN)
        .send({
          query: 'SELECT campaign.id FROM campaign',
        });

      expect(response.status).toBe(401);
    });

    it('should support BETWEEN date range', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/googleAds:search`)
        .set(validHeaders)
        .send({
          query: "SELECT campaign.id, metrics.impressions FROM campaign WHERE segments.date BETWEEN '2024-01-01' AND '2024-01-31'",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
    });
  });
});

describe('Google Ads API v21 - Ad Groups Mutate Tests', () => {
  let createdCampaignResource: string;

  beforeAll(async () => {
    // Create a campaign for ad group tests
    const campaignResponse = await request(app)
      .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
      .set(validHeaders)
      .send({
        operations: [{
          create: {
            name: 'Campaign for Ad Groups',
            status: 'ENABLED',
            advertisingChannelType: 'SEARCH',
            budget: `customers/${TEST_CUSTOMER_ID}/campaignBudgets/123456`,
          },
        }],
      });

    createdCampaignResource = campaignResponse.body.results[0].resourceName;
  });

  describe('POST /googleads/v21/customers/:customerId/adGroups:mutate', () => {
    it('should successfully create an ad group', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroups:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              name: 'Test Ad Group',
              campaign: createdCampaignResource,
              status: 'ENABLED',
              type: 'SEARCH_STANDARD',
              cpcBidMicros: '1000000',
            },
          }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0]).toHaveProperty('resourceName');
      expect(response.body.results[0].resourceName).toMatch(/^customers\/\d+\/adGroups\/\d+$/);
      expect(response.body.results[0]).toHaveProperty('adGroup');
      expect(response.body.results[0].adGroup.name).toBe('Test Ad Group');
      expect(response.body.results[0].adGroup.status).toBe('ENABLED');
      expect(response.body.results[0].adGroup.type).toBe('SEARCH_STANDARD');
    });

    it('should create an ad group with default status PAUSED', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroups:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              name: 'Ad Group with Default Status',
              campaign: createdCampaignResource,
              type: 'SEARCH_STANDARD',
            },
          }],
        });

      expect(response.status).toBe(200);
      expect(response.body.results[0].adGroup.status).toBe('PAUSED');
    });

    it('should successfully update an ad group status', async () => {
      // Create ad group
      const createResponse = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroups:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              name: 'Ad Group for Update',
              campaign: createdCampaignResource,
              status: 'ENABLED',
              type: 'SEARCH_STANDARD',
            },
          }],
        });

      const resourceName = createResponse.body.results[0].resourceName;

      // Update ad group
      const updateResponse = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroups:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            update: {
              resourceName,
              status: 'PAUSED',
            },
            update_mask: 'status',
          }],
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.results[0].resourceName).toBe(resourceName);
    });

    it('should fail when name is missing', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroups:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              campaign: createdCampaignResource,
              status: 'ENABLED',
            },
          }],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details[0].errors[0].errorCode).toHaveProperty('fieldError');
    });

    it('should fail when campaign is missing', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroups:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              name: 'Ad Group without Campaign',
              status: 'ENABLED',
            },
          }],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details[0].errors[0].errorCode).toHaveProperty('adGroupError');
    });

    it('should fail with invalid status', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroups:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              name: 'Ad Group Invalid Status',
              campaign: createdCampaignResource,
              status: 'INVALID_STATUS',
            },
          }],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details[0].errors[0].errorCode.adGroupError).toBe('INVALID_STATUS');
    });

    it('should fail with invalid type', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroups:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              name: 'Ad Group Invalid Type',
              campaign: createdCampaignResource,
              type: 'INVALID_TYPE',
            },
          }],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details[0].errors[0].errorCode.adGroupError).toBe('INVALID_TYPE');
    });

    it('should fail when operations array is empty', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroups:mutate`)
        .set(validHeaders)
        .send({
          operations: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Operations array is required');
    });
  });
});

describe('Google Ads API v21 - Ad Group Ads Mutate Tests', () => {
  let createdAdGroupResource: string;
  let createdCampaignResource: string;

  beforeAll(async () => {
    // Create a campaign
    const campaignResponse = await request(app)
      .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
      .set(validHeaders)
      .send({
        operations: [{
          create: {
            name: 'Campaign for Ad Group Ads',
            status: 'ENABLED',
            advertisingChannelType: 'SEARCH',
            budget: `customers/${TEST_CUSTOMER_ID}/campaignBudgets/123456`,
          },
        }],
      });

    createdCampaignResource = campaignResponse.body.results[0].resourceName;

    // Create an ad group
    const adGroupResponse = await request(app)
      .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroups:mutate`)
      .set(validHeaders)
      .send({
        operations: [{
          create: {
            name: 'Ad Group for Ads',
            campaign: createdCampaignResource,
            status: 'ENABLED',
            type: 'SEARCH_STANDARD',
          },
        }],
      });

    createdAdGroupResource = adGroupResponse.body.results[0].resourceName;
  });

  describe('POST /googleads/v21/customers/:customerId/adGroupAds:mutate', () => {
    it('should successfully create a responsive search ad', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroupAds:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              adGroup: createdAdGroupResource,
              status: 'ENABLED',
              ad: {
                finalUrls: ['https://example.com'],
                responsiveSearchAd: {
                  headlines: [
                    { text: 'Best Products Ever' },
                    { text: 'Shop Now' },
                    { text: 'Limited Time Offer' },
                  ],
                  descriptions: [
                    { text: 'Get the best deals on our products. Shop now and save!' },
                    { text: 'Free shipping on orders over $50.' },
                  ],
                  path1: 'products',
                  path2: 'sale',
                },
              },
            },
          }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0]).toHaveProperty('resourceName');
      expect(response.body.results[0].resourceName).toMatch(/^customers\/\d+\/adGroupAds\/.+$/);
      expect(response.body.results[0]).toHaveProperty('adGroupAd');
      expect(response.body.results[0].adGroupAd.status).toBe('ENABLED');
      expect(response.body.results[0].adGroupAd.ad.type).toBe('RESPONSIVE_SEARCH_AD');
      expect(response.body.results[0].adGroupAd.ad.responsiveSearchAd).toBeDefined();
    });

    it('should successfully create an expanded text ad', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroupAds:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              adGroup: createdAdGroupResource,
              status: 'ENABLED',
              ad: {
                finalUrls: ['https://example.com/products'],
                expandedTextAd: {
                  headlinePart1: 'Best Products',
                  headlinePart2: 'Shop Now',
                  description: 'Get the best deals on our products today.',
                  path1: 'products',
                  path2: 'sale',
                },
              },
            },
          }],
        });

      expect(response.status).toBe(200);
      expect(response.body.results[0].adGroupAd.ad.type).toBe('EXPANDED_TEXT_AD');
      expect(response.body.results[0].adGroupAd.ad.expandedTextAd).toBeDefined();
    });

    it('should create ad with default status PAUSED', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroupAds:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              adGroup: createdAdGroupResource,
              ad: {
                finalUrls: ['https://example.com'],
                responsiveSearchAd: {
                  headlines: [{ text: 'Headline' }],
                  descriptions: [{ text: 'Description' }],
                },
              },
            },
          }],
        });

      expect(response.status).toBe(200);
      expect(response.body.results[0].adGroupAd.status).toBe('PAUSED');
    });

    it('should successfully update ad status', async () => {
      // Create ad
      const createResponse = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroupAds:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              adGroup: createdAdGroupResource,
              status: 'ENABLED',
              ad: {
                finalUrls: ['https://example.com'],
                responsiveSearchAd: {
                  headlines: [{ text: 'Headline' }],
                  descriptions: [{ text: 'Description' }],
                },
              },
            },
          }],
        });

      const resourceName = createResponse.body.results[0].resourceName;

      // Update ad
      const updateResponse = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroupAds:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            update: {
              resourceName,
              status: 'PAUSED',
            },
            update_mask: 'status',
          }],
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.results[0].resourceName).toBe(resourceName);
    });

    it('should fail when ad group is missing', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroupAds:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              status: 'ENABLED',
              ad: {
                finalUrls: ['https://example.com'],
                responsiveSearchAd: {
                  headlines: [{ text: 'Headline' }],
                  descriptions: [{ text: 'Description' }],
                },
              },
            },
          }],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details[0].errors[0].errorCode.adGroupAdError).toBe('INVALID_AD_GROUP');
    });

    it('should fail when ad is missing', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroupAds:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              adGroup: createdAdGroupResource,
              status: 'ENABLED',
            },
          }],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details[0].errors[0].errorCode.adGroupAdError).toBe('MISSING_AD');
    });

    it('should fail when final URLs are missing', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroupAds:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              adGroup: createdAdGroupResource,
              status: 'ENABLED',
              ad: {
                responsiveSearchAd: {
                  headlines: [{ text: 'Headline' }],
                  descriptions: [{ text: 'Description' }],
                },
              },
            },
          }],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details[0].errors[0].errorCode.adError).toBe('MISSING_FINAL_URLS');
    });

    it('should fail with invalid status', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroupAds:mutate`)
        .set(validHeaders)
        .send({
          operations: [{
            create: {
              adGroup: createdAdGroupResource,
              status: 'INVALID_STATUS',
              ad: {
                finalUrls: ['https://example.com'],
                responsiveSearchAd: {
                  headlines: [{ text: 'Headline' }],
                  descriptions: [{ text: 'Description' }],
                },
              },
            },
          }],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details[0].errors[0].errorCode.adGroupAdError).toBe('INVALID_STATUS');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroupAds:mutate`)
        .set('developer-token', VALID_DEV_TOKEN)
        .send({
          operations: [{
            create: {
              adGroup: createdAdGroupResource,
              ad: {
                finalUrls: ['https://example.com'],
                responsiveSearchAd: {
                  headlines: [{ text: 'Headline' }],
                  descriptions: [{ text: 'Description' }],
                },
              },
            },
          }],
        });

      expect(response.status).toBe(401);
    });
  });
});

describe('Google Ads API v21 - Integration Tests', () => {
  it('should complete full workflow: campaign -> ad group -> ad -> search', async () => {
    // Step 1: Create campaign
    const campaignResponse = await request(app)
      .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/campaigns:mutate`)
      .set(validHeaders)
      .send({
        operations: [{
          create: {
            name: 'Integration Test Campaign',
            status: 'ENABLED',
            advertisingChannelType: 'SEARCH',
            budget: `customers/${TEST_CUSTOMER_ID}/campaignBudgets/999999`,
          },
        }],
      });

    expect(campaignResponse.status).toBe(200);
    const campaignResource = campaignResponse.body.results[0].resourceName;

    // Step 2: Create ad group
    const adGroupResponse = await request(app)
      .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroups:mutate`)
      .set(validHeaders)
      .send({
        operations: [{
          create: {
            name: 'Integration Test Ad Group',
            campaign: campaignResource,
            status: 'ENABLED',
            type: 'SEARCH_STANDARD',
            cpcBidMicros: '2000000',
          },
        }],
      });

    expect(adGroupResponse.status).toBe(200);
    const adGroupResource = adGroupResponse.body.results[0].resourceName;

    // Step 3: Create ad
    const adResponse = await request(app)
      .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/adGroupAds:mutate`)
      .set(validHeaders)
      .send({
        operations: [{
          create: {
            adGroup: adGroupResource,
            status: 'ENABLED',
            ad: {
              finalUrls: ['https://integration-test.com'],
              responsiveSearchAd: {
                headlines: [
                  { text: 'Integration Test Ad' },
                  { text: 'Test Headline 2' },
                ],
                descriptions: [
                  { text: 'This is an integration test ad.' },
                ],
              },
            },
          },
        }],
      });

    expect(adResponse.status).toBe(200);

    // Step 4: Search for campaigns
    const searchResponse = await request(app)
      .post(`/googleads/v21/customers/${TEST_CUSTOMER_ID}/googleAds:search`)
      .set(validHeaders)
      .send({
        query: 'SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status = ENABLED',
      });

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.results.length).toBeGreaterThan(0);

    // Verify our campaign is in the results
    const ourCampaign = searchResponse.body.results.find(
      (r: any) => r.campaign.name === 'Integration Test Campaign'
    );
    expect(ourCampaign).toBeDefined();
  });
});
