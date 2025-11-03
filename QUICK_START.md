# Mock Ad Servers - Quick Start Guide

## 🚀 TL;DR

Mock advertising platform APIs for testing and development. All 6 major platforms supported with real API signatures.

**Production URL**: `https://mock-ad-servers.vercel.app`
**Swagger Docs**: `https://mock-ad-servers.vercel.app/api-docs`

---

## 🔑 Mock Credentials

```javascript
const TOKENS = {
  meta: 'mock_meta_access_token_abcdef',
  linkedin: 'mock_linkedin_access_token_ghijkl',
  tiktok: 'mock_tiktok_access_token_mnopqr',
  googleAds: 'mock_google_access_token_12345',
  googleDevToken: 'mock_google_dev_token_67890',
  dv360: 'mock_dv360_access_token_yzabcd',
  ttd: 'mock_ttd_token_stuvwx_yzabcd_efghij',
  ttdUsername: 'mock_ttd_username',
  ttdPassword: 'mock_ttd_password'
};
```

---

## 📋 Platform Quick Reference

### Meta Marketing API (v23.0)

**Auth**: Bearer Token
**Base Path**: `/meta/v23.0`

```bash
# Create Campaign
curl -X POST https://mock-ad-servers.vercel.app/meta/v23.0/act_123456789/campaigns \
  -H "Authorization: Bearer mock_meta_access_token_abcdef" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Campaign","objective":"OUTCOME_TRAFFIC","status":"PAUSED","daily_budget":1000}'

# Get Campaign Insights
curl https://mock-ad-servers.vercel.app/meta/v23.0/120210000000000000/insights?date_preset=last_7d \
  -H "Authorization: Bearer mock_meta_access_token_abcdef"

# List Ad Sets
curl https://mock-ad-servers.vercel.app/meta/v23.0/act_123456789/adsets?fields=name,status&limit=10 \
  -H "Authorization: Bearer mock_meta_access_token_abcdef"
```

**Key Endpoints**: `/campaigns`, `/adsets`, `/ads`, `/:campaignId/insights`

---

### Google Ads API (v21)

**Auth**: Bearer Token + Developer Token header
**Base Path**: `/googleads/v21`

```bash
# OAuth Flow
curl "https://mock-ad-servers.vercel.app/google/oauth/authorize?client_id=mock_google_client_id&redirect_uri=https://example.com/callback&response_type=code&scope=https://www.googleapis.com/auth/adwords"

# Search with GAQL
curl -X POST https://mock-ad-servers.vercel.app/googleads/v21/customers/1234567890/googleAds:search \
  -H "Authorization: Bearer mock_google_access_token_12345" \
  -H "developer-token: mock_google_dev_token_67890" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT campaign.id, campaign.name, campaign.status FROM campaign","pageSize":10}'

# Create Campaign
curl -X POST https://mock-ad-servers.vercel.app/googleads/v21/customers/1234567890/campaigns:mutate \
  -H "Authorization: Bearer mock_google_access_token_12345" \
  -H "developer-token: mock_google_dev_token_67890" \
  -H "Content-Type: application/json" \
  -d '{"operations":[{"create":{"name":"New Campaign","status":"PAUSED","advertisingChannelType":"SEARCH"}}]}'
```

**Key Endpoints**: `/googleAds:search`, `/campaigns:mutate`, `/adGroups:mutate`, `/adGroupAds:mutate`

---

### LinkedIn Marketing API (202510)

**Auth**: Bearer Token + LinkedIn-Version header
**Base Path**: `/linkedin/rest`

```bash
# Create Campaign
curl -X POST https://mock-ad-servers.vercel.app/linkedin/rest/adCampaigns \
  -H "Authorization: Bearer mock_linkedin_access_token_ghijkl" \
  -H "LinkedIn-Version: 202510" \
  -H "Content-Type: application/json" \
  -d '{"account":"urn:li:sponsoredAccount:123456789","name":"Test Campaign","type":"TEXT_AD","status":"ACTIVE"}'

# Search Campaigns
curl "https://mock-ad-servers.vercel.app/linkedin/rest/adCampaigns?q=search&search.account=urn:li:sponsoredAccount:123456789" \
  -H "Authorization: Bearer mock_linkedin_access_token_ghijkl" \
  -H "LinkedIn-Version: 202510"

# Get Analytics
curl "https://mock-ad-servers.vercel.app/linkedin/rest/adAnalytics?q=analytics&dateRange.start=2025-01-01&dateRange.end=2025-01-31" \
  -H "Authorization: Bearer mock_linkedin_access_token_ghijkl" \
  -H "LinkedIn-Version: 202510"
```

**Key Endpoints**: `/adCampaigns`, `/adCampaignGroups`, `/adCreatives`, `/adAnalytics`

---

### TikTok Marketing API (v1.3)

**Auth**: Bearer Token
**Base Path**: `/tiktok/v1.3`

```bash
# Create Campaign
curl -X POST https://mock-ad-servers.vercel.app/tiktok/v1.3/campaign/create/ \
  -H "Authorization: Bearer mock_tiktok_access_token_mnopqr" \
  -H "Content-Type: application/json" \
  -d '{"advertiser_id":"1234567890","campaign_name":"Test Campaign","objective_type":"TRAFFIC","budget_mode":"BUDGET_MODE_DAY","budget":100}'

# Get Reporting (POST-style GET)
curl -X POST https://mock-ad-servers.vercel.app/tiktok/v1.3/reports/integrated/get/ \
  -H "Authorization: Bearer mock_tiktok_access_token_mnopqr" \
  -H "Content-Type: application/json" \
  -d '{"advertiser_id":"1234567890","data_level":"AUCTION_CAMPAIGN","dimensions":["campaign_id"],"metrics":["spend","impressions"],"start_date":"2025-01-01","end_date":"2025-01-31"}'
```

**Key Endpoints**: `/campaign/create`, `/campaign/get`, `/adgroup/create`, `/ad/create`, `/reports/integrated/get`

---

### The Trade Desk API (v3)

**Auth**: TTD-Auth header (get token via authentication endpoint)
**Base Path**: `/ttd/v3`

```bash
# Authenticate
curl -X POST https://mock-ad-servers.vercel.app/ttd/v3/authentication \
  -H "Content-Type: application/json" \
  -d '{"Login":"mock_ttd_username","Password":"mock_ttd_password"}'

# Create Campaign (PascalCase naming)
curl -X POST https://mock-ad-servers.vercel.app/ttd/v3/campaign \
  -H "TTD-Auth: mock_ttd_token_stuvwx_yzabcd_efghij" \
  -H "Content-Type: application/json" \
  -d '{"CampaignName":"Test Campaign","AdvertiserId":"test-advertiser","Budget":{"Amount":1000,"CurrencyCode":"USD"}}'

# Query Campaigns
curl -X POST https://mock-ad-servers.vercel.app/ttd/v3/campaign/query/facets \
  -H "TTD-Auth: mock_ttd_token_stuvwx_yzabcd_efghij" \
  -H "Content-Type: application/json" \
  -d '{"AdvertiserIds":["test-advertiser"],"PageStartIndex":0,"PageSize":10}'
```

**Key Endpoints**: `/authentication`, `/campaign`, `/campaign/query/facets`, `/adgroup`, `/creative`

---

### DV360 API (v4)

**Auth**: Bearer Token
**Base Path**: `/dv360/v4`

```bash
# Create Campaign
curl -X POST https://mock-ad-servers.vercel.app/dv360/v4/advertisers/123456789/campaigns \
  -H "Authorization: Bearer mock_dv360_access_token_yzabcd" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test Campaign","entityStatus":"ENTITY_STATUS_ACTIVE","campaignGoal":{"campaignGoalType":"CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS"}}'

# List Campaigns
curl "https://mock-ad-servers.vercel.app/dv360/v4/advertisers/123456789/campaigns?pageSize=10" \
  -H "Authorization: Bearer mock_dv360_access_token_yzabcd"

# Update Insertion Order (PATCH with updateMask)
curl -X PATCH "https://mock-ad-servers.vercel.app/dv360/v4/advertisers/123456789/insertionOrders/456?updateMask=displayName,entityStatus" \
  -H "Authorization: Bearer mock_dv360_access_token_yzabcd" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Updated IO","entityStatus":"ENTITY_STATUS_PAUSED"}'
```

**Key Endpoints**: `/campaigns`, `/insertionOrders`, `/lineItems`

---

## 🎯 Common Patterns

### Pagination
- **Meta**: Cursor-based (`after`, `before`, `limit`)
- **Google Ads**: Token-based (`pageToken`, `pageSize`)
- **LinkedIn**: Offset-based (`start`, `count`)
- **TikTok**: Page-based (`page`, `page_size`)
- **TTD**: Index-based (`PageStartIndex`, `PageSize`)
- **DV360**: Token-based (`pageToken`, `pageSize`)

### Field Filtering
- **Meta**: `?fields=name,status,objective`
- **Google Ads**: Use GAQL SELECT clause
- **LinkedIn**: Returns standard fields, filter in code
- **Others**: Return all fields

### Date Ranges
- **Meta**: `date_preset` or `time_range`
- **Google Ads**: WHERE clause in GAQL
- **LinkedIn**: `dateRange.start` / `dateRange.end`
- **TikTok**: `start_date` / `end_date` (YYYY-MM-DD)
- **TTD**: `StartDateInclusive` / `EndDateExclusive`
- **DV360**: `dateRanges` array with `startDate` / `endDate`

---

## 💡 Tips

1. **All data is in-memory** - restarts clear all state
2. **IDs are auto-generated** - use returned IDs for subsequent calls
3. **Default campaigns exist** - campaign ID `120210000000000000` for Meta insights
4. **Status codes match real APIs** - 400 for validation, 401 for auth, 404 for not found
5. **Error formats match platforms** - Meta uses `OAuthException`, Google uses structured errors, etc.

---

## 🧪 Testing

```bash
# Run all unit tests
npm test

# Run production integration tests
node test-production.js
```

---

## 📚 Full Documentation

Visit the interactive Swagger UI for complete API specs:
**https://mock-ad-servers.vercel.app/api-docs**
