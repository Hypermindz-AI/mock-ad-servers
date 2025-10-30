# Mock Ad Servers

Mock servers for testing campaign activation across 6 major advertising platforms using their latest API specifications (as of October 2025).

## Supported Platforms

| Platform | API Version | Auth Type | Status |
|----------|-------------|-----------|--------|
| **Google Ads** | v21 | OAuth 2.0 | ✅ Ready |
| **Meta (Facebook/Instagram)** | v23.0 | OAuth 2.0 | ✅ Ready |
| **LinkedIn** | 202510 | OAuth 2.0 | ✅ Ready |
| **TikTok** | v1.3 | OAuth 2.0 | ✅ Ready |
| **The Trade Desk** | v3 | Token-based | ✅ Ready |
| **DV360** | v4 | OAuth 2.0 | ✅ Ready |

## Quick Start

### 1. Installation

```bash
# Clone or navigate to the project
cd mock-ad-servers

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### 2. Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on **http://localhost:3000**

### 3. Test the Server

```bash
# Health check
curl http://localhost:3000/health

# API information
curl http://localhost:3000/
```

## Configuration

Edit `.env` file to configure:

```bash
# Server
PORT=3000
NODE_ENV=development

# Google Ads / DV360
GOOGLE_VALID_TOKEN=mock_google_access_token_12345
GOOGLE_CLIENT_ID=mock_google_client_id
GOOGLE_CLIENT_SECRET=mock_google_client_secret
GOOGLE_DEV_TOKEN=mock_google_dev_token_67890

# Meta
META_VALID_TOKEN=mock_meta_access_token_abcdef
META_APP_ID=mock_meta_app_id_123456
META_APP_SECRET=mock_meta_app_secret_789012

# LinkedIn
LINKEDIN_VALID_TOKEN=mock_linkedin_access_token_ghijkl
LINKEDIN_CLIENT_ID=mock_linkedin_client_id_345678
LINKEDIN_CLIENT_SECRET=mock_linkedin_client_secret_901234

# TikTok
TIKTOK_VALID_TOKEN=mock_tiktok_access_token_mnopqr
TIKTOK_CLIENT_KEY=mock_tiktok_client_key_567890
TIKTOK_CLIENT_SECRET=mock_tiktok_client_secret_123456

# The Trade Desk
TTD_VALID_TOKEN=mock_ttd_token_stuvwx_yzabcd_efghij
TTD_USERNAME=mock_ttd_username
TTD_PASSWORD=mock_ttd_password

# DV360
DV360_VALID_TOKEN=mock_dv360_access_token_klmnop

# Features
ENABLE_REQUEST_LOGGING=true
SIMULATE_RATE_LIMITING=false
```

## Usage Examples

### Google Ads API v21

#### 1. Authenticate

```bash
# Get authorization code
curl "http://localhost:3000/oauth/authorize?client_id=mock_google_client_id&redirect_uri=http://localhost/callback&response_type=code&scope=https://www.googleapis.com/auth/adwords"

# Exchange for access token
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "mock_google_client_id",
    "client_secret": "mock_google_client_secret",
    "code": "YOUR_AUTH_CODE",
    "grant_type": "authorization_code",
    "redirect_uri": "http://localhost/callback"
  }'
```

#### 2. Create Campaign

```bash
curl -X POST http://localhost:3000/googleads/v21/customers/1234567890/campaigns:mutate \
  -H "Authorization: Bearer mock_google_access_token_12345" \
  -H "developer-token: mock_google_dev_token_67890" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [{
      "create": {
        "name": "Test Campaign",
        "status": "ENABLED",
        "advertisingChannelType": "SEARCH",
        "budget": "customers/1234567890/campaignBudgets/1111111111"
      }
    }]
  }'
```

---

### Meta Marketing API v23.0

#### 1. Authenticate

```bash
# Get authorization code
curl "http://localhost:3000/v23.0/dialog/oauth?client_id=mock_meta_app_id_123456&redirect_uri=http://localhost/callback&response_type=code"

# Exchange for access token
curl "http://localhost:3000/v23.0/oauth/access_token?client_id=mock_meta_app_id_123456&client_secret=mock_meta_app_secret_789012&code=YOUR_AUTH_CODE&redirect_uri=http://localhost/callback"
```

#### 2. Create Campaign

```bash
curl -X POST http://localhost:3000/v23.0/act_123456/campaigns \
  -H "Authorization: Bearer mock_meta_access_token_abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "objective": "OUTCOME_TRAFFIC",
    "status": "ACTIVE",
    "daily_budget": 5000
  }'
```

#### 3. Update Campaign

```bash
curl -X POST http://localhost:3000/v23.0/CAMPAIGN_ID \
  -H "Authorization: Bearer mock_meta_access_token_abcdef" \
  -H "Content-Type: application/json" \
  -d '{"status": "PAUSED"}'
```

---

### LinkedIn Marketing API 202510

#### 1. Authenticate

```bash
# Get authorization code
curl "http://localhost:3000/oauth/v2/authorization?response_type=code&client_id=mock_linkedin_client_id_345678&redirect_uri=http://localhost/callback&scope=r_ads,rw_ads"

# Exchange for access token
curl -X POST http://localhost:3000/oauth/v2/accessToken \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=YOUR_AUTH_CODE&client_id=mock_linkedin_client_id_345678&client_secret=mock_linkedin_client_secret_901234&redirect_uri=http://localhost/callback"
```

#### 2. Create Campaign

```bash
curl -X POST http://localhost:3000/rest/adCampaigns \
  -H "Authorization: Bearer mock_linkedin_access_token_ghijkl" \
  -H "Linkedin-Version: 202510" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "urn:li:sponsoredAccount:123456",
    "name": "Test Campaign",
    "type": "TEXT_AD",
    "status": "ACTIVE",
    "dailyBudget": {
      "amount": "50",
      "currencyCode": "USD"
    }
  }'
```

**Note:** LinkedIn requires the `Linkedin-Version: 202510` header on all API requests.

---

### TikTok Marketing API

#### 1. Authenticate

```bash
# Get authorization code
curl "http://localhost:3000/oauth/authorize?client_key=mock_tiktok_client_key_567890&response_type=code&scope=ad_management&redirect_uri=http://localhost/callback"

# Exchange for access token
curl -X POST http://localhost:3000/v2/oauth/token/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_key=mock_tiktok_client_key_567890&client_secret=mock_tiktok_client_secret_123456&code=YOUR_AUTH_CODE&grant_type=authorization_code&redirect_uri=http://localhost/callback"
```

#### 2. Create Campaign

```bash
curl -X POST http://localhost:3000/open_api/v1.3/campaign/create/ \
  -H "Authorization: Bearer mock_tiktok_access_token_mnopqr" \
  -H "Content-Type: application/json" \
  -d '{
    "advertiser_id": "123456",
    "campaign_name": "Test Campaign",
    "objective_type": "TRAFFIC",
    "budget_mode": "BUDGET_MODE_DAY",
    "budget": 100.0
  }'
```

---

### The Trade Desk API v3

#### 1. Authenticate

```bash
curl -X POST http://localhost:3000/v3/authentication \
  -H "Content-Type: application/json" \
  -d '{
    "Login": "mock_ttd_username",
    "Password": "mock_ttd_password"
  }'
```

#### 2. Create Campaign

```bash
curl -X POST http://localhost:3000/v3/campaign \
  -H "TTD-Auth: mock_ttd_token_stuvwx_yzabcd_efghij" \
  -H "Content-Type: application/json" \
  -d '{
    "CampaignName": "Test Campaign",
    "AdvertiserId": "abc123",
    "Budget": {
      "Amount": 10000,
      "CurrencyCode": "USD"
    },
    "StartDate": "2025-11-01T00:00:00Z"
  }'
```

**Note:** The Trade Desk uses `TTD-Auth` header instead of standard `Authorization` header.

---

### DV360 API v4

#### 1. Authenticate

DV360 uses the same Google OAuth flow as Google Ads:

```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "mock_google_client_id",
    "client_secret": "mock_google_client_secret",
    "code": "YOUR_AUTH_CODE",
    "grant_type": "authorization_code",
    "redirect_uri": "http://localhost/callback"
  }'
```

#### 2. Create Campaign

```bash
curl -X POST http://localhost:3000/v4/advertisers/123456/campaigns \
  -H "Authorization: Bearer mock_dv360_access_token_klmnop" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Test Campaign",
    "entityStatus": "ENTITY_STATUS_ACTIVE",
    "campaignGoal": {
      "campaignGoalType": "CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS"
    }
  }'
```

---

## Error Scenarios

### 401 Unauthorized (Missing Token)

```bash
curl -X POST http://localhost:3000/v23.0/act_123456/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","objective":"TRAFFIC","status":"ACTIVE"}'

# Response:
{
  "error": {
    "message": "Missing or invalid access token",
    "type": "OAuthException",
    "code": 190
  }
}
```

### 400 Validation Error (Invalid Budget)

```bash
curl -X POST http://localhost:3000/v23.0/act_123456/campaigns \
  -H "Authorization: Bearer mock_meta_access_token_abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "objective": "OUTCOME_TRAFFIC",
    "status": "ACTIVE",
    "daily_budget": -100
  }'

# Response:
{
  "error": {
    "message": "Invalid budget amount. Must be positive.",
    "type": "OAuthException",
    "code": 100
  }
}
```

## Testing Different Scenarios

The mock server supports three types of scenarios:

### 1. Success Scenarios (200/201)
Use valid tokens and proper request bodies to get successful responses.

### 2. Validation Errors (400)
- Missing required fields
- Invalid enum values
- Negative budgets
- Invalid date formats

### 3. Authentication Errors (401)
- Missing Bearer token
- Invalid token value
- Wrong token format

## Project Structure

```
mock-ad-servers/
├── src/
│   ├── index.ts                 # Main server
│   ├── config/
│   │   ├── platforms.ts         # Platform configs
│   │   └── auth.config.ts       # Auth configs
│   ├── middleware/
│   │   ├── errorHandler.ts      # Error handling
│   │   └── logger.ts            # Request logging
│   ├── auth/
│   │   ├── google-oauth.ts      # Google OAuth
│   │   ├── meta-oauth.ts        # Meta OAuth
│   │   ├── linkedin-oauth.ts    # LinkedIn OAuth
│   │   ├── tiktok-oauth.ts      # TikTok OAuth
│   │   └── tradedesk-token.ts   # TTD Token Auth
│   └── platforms/
│       ├── google-ads/          # Google Ads v21
│       ├── meta/                # Meta v23.0
│       ├── linkedin/            # LinkedIn 202510
│       ├── tiktok/              # TikTok v1.3
│       ├── tradedesk/           # TTD v3
│       └── dv360/               # DV360 v4
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

## API Endpoints Reference

### Google Ads API v21
- `POST /oauth/authorize` - Get authorization code
- `POST /oauth/token` - Exchange code for token
- `POST /googleads/v21/customers/{customerId}/campaigns:mutate` - Create/update campaign
- `GET /googleads/v21/customers/{customerId}/campaigns/{campaignId}` - Get campaign

### Meta Marketing API v23.0
- `GET /v23.0/dialog/oauth` - Get authorization code
- `GET /v23.0/oauth/access_token` - Get access token
- `POST /v23.0/act_{adAccountId}/campaigns` - Create campaign
- `GET /v23.0/{campaignId}` - Get campaign
- `POST /v23.0/{campaignId}` - Update campaign

### LinkedIn Marketing API 202510
- `GET /oauth/v2/authorization` - Get authorization code
- `POST /oauth/v2/accessToken` - Get access token
- `POST /rest/adCampaigns` - Create campaign
- `GET /rest/adCampaigns/{id}` - Get campaign
- `POST /rest/adCampaigns/{id}` - Update campaign

### TikTok Marketing API
- `GET /oauth/authorize` - Get authorization code
- `POST /v2/oauth/token/` - Get/refresh access token
- `POST /open_api/v1.3/campaign/create/` - Create campaign
- `POST /open_api/v1.3/campaign/update/` - Update campaign
- `GET /open_api/v1.3/campaign/get/` - Get campaign

### The Trade Desk API v3
- `POST /v3/authentication` - Get authentication token
- `POST /v3/campaign` - Create campaign
- `PUT /v3/campaign/{id}` - Update campaign
- `GET /v3/campaign/{id}` - Get campaign

### DV360 API v4
- `POST /oauth/authorize` - Get authorization code (uses Google OAuth)
- `POST /oauth/token` - Get access token
- `POST /v4/advertisers/{advertiserId}/campaigns` - Create campaign
- `PATCH /v4/advertisers/{advertiserId}/campaigns/{campaignId}` - Update campaign
- `GET /v4/advertisers/{advertiserId}/campaigns/{campaignId}` - Get campaign

## Development

### Run in Development Mode

```bash
npm run dev
```

Uses `nodemon` and `ts-node` for hot reloading.

### Build for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npx tsc --noEmit
```

## Features

✅ **Latest API Versions** - All platforms use their latest API versions as of October 2025
✅ **OAuth 2.0 Support** - Full OAuth flows for Google, Meta, LinkedIn, and TikTok
✅ **Token Authentication** - Token-based auth for The Trade Desk
✅ **Request Validation** - Comprehensive validation with detailed error messages
✅ **In-Memory Storage** - Campaign data persists during server lifetime
✅ **Error Scenarios** - Support for success, validation, and auth error testing
✅ **TypeScript** - Fully typed with TypeScript for type safety
✅ **Middleware Support** - Logging, error handling, CORS, security headers
✅ **Configurable** - Easy configuration via environment variables

## Future Enhancements

- 🔄 SQLite database for persistent storage
- 🔄 Rate limiting with actual token bucket algorithm
- 🔄 Webhook support for campaign status updates
- 🔄 Additional campaign operations (list, search, delete)
- 🔄 Support for ad groups and ads endpoints
- 🔄 Advanced filtering and pagination

## Documentation

For detailed API specifications, see [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

## License

MIT
