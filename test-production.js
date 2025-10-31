const axios = require('axios');

const BASE_URL = 'https://mock-ad-servers.vercel.app';

// Test credentials from auth.config.ts
const VALID_TOKENS = {
  meta: 'mock_meta_access_token_abcdef',
  linkedin: 'mock_linkedin_access_token_ghijkl',
  tiktok: 'mock_tiktok_access_token_mnopqr',
  googleAds: 'mock_google_ads_access_token_stuvwx',
  dv360: 'mock_dv360_access_token_yzabcd',
  ttd: 'mock_ttd_token_stuvwx_yzabcd_efghij'
};

const TTD_CREDS = {
  Login: 'mock_ttd_username',
  Password: 'mock_ttd_password'
};

async function testEndpoint(name, config) {
  try {
    const response = await axios(config);
    console.log(`✅ ${name}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data).substring(0, 100) + '...\n');
    return true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Status: ${error.response?.status || 'N/A'}`);
    console.log(`   Error:`, error.response?.data || error.message);
    console.log();
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Production Deployment on Vercel\n');
  console.log('=' .repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  // Test Meta Campaign Creation
  if (await testEndpoint('Meta - Create Campaign', {
    method: 'POST',
    url: `${BASE_URL}/meta/v23.0/act_123456789/campaigns`,
    headers: {
      'Authorization': `Bearer ${VALID_TOKENS.meta}`,
      'Content-Type': 'application/json'
    },
    data: {
      name: 'Test Campaign',
      objective: 'OUTCOME_TRAFFIC',
      status: 'PAUSED',
      daily_budget: 1000
    }
  })) { passed++; } else { failed++; }

  // Test Meta Get Campaign (should 404 for non-existent)
  if (await testEndpoint('Meta - Get Non-Existent Campaign', {
    method: 'GET',
    url: `${BASE_URL}/meta/v23.0/999999999999`,
    headers: {
      'Authorization': `Bearer ${VALID_TOKENS.meta}`
    },
    validateStatus: (status) => status === 404
  })) { passed++; } else { failed++; }

  // Test Trade Desk Authentication
  if (await testEndpoint('Trade Desk - Authentication', {
    method: 'POST',
    url: `${BASE_URL}/ttd/v3/authentication`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: TTD_CREDS
  })) { passed++; } else { failed++; }

  // Test Trade Desk Campaign Creation
  if (await testEndpoint('Trade Desk - Create Campaign', {
    method: 'POST',
    url: `${BASE_URL}/ttd/v3/campaign`,
    headers: {
      'TTD-Auth': VALID_TOKENS.ttd,
      'Content-Type': 'application/json'
    },
    data: {
      CampaignName: 'Test Campaign',
      AdvertiserId: 'test-advertiser',
      Budget: {
        Amount: 1000,
        CurrencyCode: 'USD'
      },
      StartDate: new Date(Date.now() + 86400000).toISOString().replace(/\.\d{3}Z$/, 'Z')
    }
  })) { passed++; } else { failed++; }

  // Test TikTok Campaign Creation
  if (await testEndpoint('TikTok - Create Campaign', {
    method: 'POST',
    url: `${BASE_URL}/tiktok/v1.3/campaign/create/`,
    headers: {
      'Authorization': `Bearer ${VALID_TOKENS.tiktok}`,
      'Content-Type': 'application/json'
    },
    data: {
      advertiser_id: '1234567890',
      campaign_name: 'Test Campaign',
      objective_type: 'TRAFFIC',
      budget_mode: 'BUDGET_MODE_DAY',
      budget: 100
    }
  })) { passed++; } else { failed++; }

  // Test LinkedIn Campaign Creation
  if (await testEndpoint('LinkedIn - Create Campaign', {
    method: 'POST',
    url: `${BASE_URL}/linkedin/rest/adCampaigns`,
    headers: {
      'Authorization': `Bearer ${VALID_TOKENS.linkedin}`,
      'Linkedin-Version': '202510',
      'Content-Type': 'application/json'
    },
    data: {
      account: 'urn:li:sponsoredAccount:123456789',
      name: 'Test Campaign',
      type: 'TEXT_AD',
      status: 'ACTIVE',
      dailyBudget: {
        amount: '100',
        currencyCode: 'USD'
      }
    }
  })) { passed++; } else { failed++; }

  // Test Google Ads OAuth
  if (await testEndpoint('Google Ads - OAuth Authorize', {
    method: 'GET',
    url: `${BASE_URL}/google/oauth/authorize`,
    params: {
      client_id: 'mock_google_client_id',
      redirect_uri: 'https://example.com/callback',
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/adwords'
    }
  })) { passed++; } else { failed++; }

  // Test DV360 Campaign Creation
  if (await testEndpoint('DV360 - Create Campaign', {
    method: 'POST',
    url: `${BASE_URL}/dv360/v4/advertisers/123456789/campaigns`,
    headers: {
      'Authorization': `Bearer ${VALID_TOKENS.dv360}`,
      'Content-Type': 'application/json'
    },
    data: {
      displayName: 'Test Campaign',
      entityStatus: 'ENTITY_STATUS_ACTIVE',
      campaignGoal: {
        campaignGoalType: 'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS'
      }
    }
  })) { passed++; } else { failed++; }

  // Test Meta Campaign Listing
  if (await testEndpoint('Meta - List Campaigns', {
    method: 'GET',
    url: `${BASE_URL}/meta/v23.0/act_123456789/campaigns?fields=name,status,objective&limit=5`,
    headers: {
      'Authorization': `Bearer ${VALID_TOKENS.meta}`
    }
  })) { passed++; } else { failed++; }

  // Test Meta Campaign Insights (using default campaign ID)
  if (await testEndpoint('Meta - Get Campaign Insights', {
    method: 'GET',
    url: `${BASE_URL}/meta/v23.0/120210000000000000/insights?date_preset=last_7d`,
    headers: {
      'Authorization': `Bearer ${VALID_TOKENS.meta}`
    }
  })) { passed++; } else { failed++; }

  // Test Google Ads Search (GAQL)
  if (await testEndpoint('Google Ads - Search Campaigns', {
    method: 'POST',
    url: `${BASE_URL}/googleads/v21/customers/1234567890/googleAds:search`,
    headers: {
      'Authorization': `Bearer ${VALID_TOKENS.googleAds}`,
      'developer-token': 'mock_google_dev_token_67890',
      'Content-Type': 'application/json'
    },
    data: {
      query: 'SELECT campaign.id, campaign.name, campaign.status FROM campaign',
      pageSize: 10
    }
  })) { passed++; } else { failed++; }

  // Test LinkedIn Campaign Search
  if (await testEndpoint('LinkedIn - Search Campaigns', {
    method: 'GET',
    url: `${BASE_URL}/linkedin/rest/adCampaigns?q=search&search.account=urn:li:sponsoredAccount:123456789`,
    headers: {
      'Authorization': `Bearer ${VALID_TOKENS.linkedin}`,
      'Linkedin-Version': '202510'
    }
  })) { passed++; } else { failed++; }

  // Test TikTok Integrated Reporting
  if (await testEndpoint('TikTok - Get Integrated Report', {
    method: 'POST',
    url: `${BASE_URL}/tiktok/v1.3/reports/integrated/get/`,
    headers: {
      'Authorization': `Bearer ${VALID_TOKENS.tiktok}`,
      'Content-Type': 'application/json'
    },
    data: {
      advertiser_id: '1234567890',
      data_level: 'AUCTION_CAMPAIGN',
      dimensions: ['campaign_id', 'stat_time_day'],
      metrics: ['spend', 'impressions', 'clicks'],
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      page: 1,
      page_size: 10
    }
  })) { passed++; } else { failed++; }

  // Test Trade Desk Campaign Query
  if (await testEndpoint('Trade Desk - Query Campaigns', {
    method: 'POST',
    url: `${BASE_URL}/ttd/v3/campaign/query/facets`,
    headers: {
      'TTD-Auth': VALID_TOKENS.ttd,
      'Content-Type': 'application/json'
    },
    data: {
      AdvertiserIds: ['test-advertiser'],
      PageStartIndex: 0,
      PageSize: 10
    }
  })) { passed++; } else { failed++; }

  // Test DV360 List Campaigns
  if (await testEndpoint('DV360 - List Campaigns', {
    method: 'GET',
    url: `${BASE_URL}/dv360/v4/advertisers/123456789/campaigns?pageSize=10`,
    headers: {
      'Authorization': `Bearer ${VALID_TOKENS.dv360}`
    }
  })) { passed++; } else { failed++; }

  console.log('=' .repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests\n`);

  if (failed === 0) {
    console.log('🎉 All production tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
