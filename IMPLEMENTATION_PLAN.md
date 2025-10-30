# Mock Ad Servers - Comprehensive Implementation Plan

## Overview
Mock servers for testing campaign activation across 6 major advertising platforms using their latest API specifications as of October 2025.

## Supported Platforms

| Platform | API Version | Auth Method | Release Date |
|----------|------------|-------------|--------------|
| Google Ads | v21 | OAuth 2.0 | August 2025 |
| Meta (Facebook/Instagram) | v23.0 | OAuth 2.0 | May 2025 |
| LinkedIn | 202510 | OAuth 2.0 (3-legged) | October 2025 |
| TikTok | v1.3 | OAuth 2.0 v2 | Current |
| The Trade Desk | v3 | Token-based | Current |
| DV360 | v4 | OAuth 2.0 (Google) | March 2025 |

---

## Architecture

### Project Structure
```
mock-ad-servers/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
├── IMPLEMENTATION_PLAN.md
├── src/
│   ├── index.ts                    # Main server entry point
│   ├── config/
│   │   ├── platforms.ts            # Platform configurations
│   │   └── auth.config.ts          # Valid tokens/credentials
│   ├── middleware/
│   │   ├── auth.ts                 # Authentication validation
│   │   ├── errorHandler.ts         # Error handling middleware
│   │   └── logger.ts               # Request logging
│   ├── auth/                       # OAuth flow implementations
│   │   ├── oauth2.controller.ts    # Generic OAuth2 controller
│   │   ├── google-oauth.ts         # Google OAuth (Ads + DV360)
│   │   ├── meta-oauth.ts           # Meta OAuth
│   │   ├── linkedin-oauth.ts       # LinkedIn OAuth
│   │   ├── tiktok-oauth.ts         # TikTok OAuth
│   │   └── tradedesk-token.ts      # Trade Desk token auth
│   ├── platforms/
│   │   ├── google-ads/
│   │   │   ├── routes.ts
│   │   │   ├── controllers.ts
│   │   │   └── mockData.ts
│   │   ├── meta/
│   │   │   ├── routes.ts
│   │   │   ├── controllers.ts
│   │   │   └── mockData.ts
│   │   ├── linkedin/
│   │   │   ├── routes.ts
│   │   │   ├── controllers.ts
│   │   │   └── mockData.ts
│   │   ├── tiktok/
│   │   │   ├── routes.ts
│   │   │   ├── controllers.ts
│   │   │   └── mockData.ts
│   │   ├── tradedesk/
│   │   │   ├── routes.ts
│   │   │   ├── controllers.ts
│   │   │   └── mockData.ts
│   │   └── dv360/
│   │       ├── routes.ts
│   │       ├── controllers.ts
│   │       └── mockData.ts
│   ├── models/                     # For future DB migration
│   │   └── campaign.model.ts
│   └── utils/
│       ├── responses.ts            # Response generators
│       ├── validators.ts           # Request validators
│       └── tokenGenerator.ts       # Mock token generation
└── tests/
    ├── google-ads.test.ts
    ├── meta.test.ts
    ├── linkedin.test.ts
    ├── tiktok.test.ts
    ├── tradedesk.test.ts
    └── dv360.test.ts
```

---

## Authentication Specifications

### 1. Google Ads API v21

**OAuth 2.0 Flow**
- **Authorization Endpoint**: `GET /oauth/authorize`
  - Query params: `client_id`, `redirect_uri`, `response_type=code`, `scope`
  - Returns: Authorization code

- **Token Endpoint**: `POST /oauth/token`
  - Body: `client_id`, `client_secret`, `code`, `grant_type=authorization_code`, `redirect_uri`
  - Response: `{ access_token, refresh_token, expires_in, token_type: "Bearer" }`

- **Refresh Token Endpoint**: `POST /oauth/token`
  - Body: `client_id`, `client_secret`, `refresh_token`, `grant_type=refresh_token`
  - Response: `{ access_token, expires_in, token_type: "Bearer" }`

**Required Scopes**: `https://www.googleapis.com/auth/adwords`

**API Authentication**:
- Header: `Authorization: Bearer {access_token}`
- Additional headers: `developer-token`, `login-customer-id`

### 2. Meta Marketing API v23.0

**OAuth 2.0 Flow**
- **Authorization Endpoint**: `GET /v23.0/dialog/oauth`
  - Query params: `client_id`, `redirect_uri`, `scope=ads_management`, `response_type=code`
  - Returns: Authorization code

- **Token Endpoint**: `GET /v23.0/oauth/access_token`
  - Query params: `client_id`, `client_secret`, `redirect_uri`, `code`
  - Response: `{ access_token, token_type: "bearer", expires_in }`

- **App Access Token**: `GET /v23.0/oauth/access_token`
  - Query params: `client_id`, `client_secret`, `grant_type=client_credentials`
  - Response: `{ access_token, token_type: "bearer" }`

**Required Scopes**: `ads_management`, `business_management`

**API Authentication**:
- Header: `Authorization: Bearer {access_token}`
- Or query param: `?access_token={token}`

### 3. LinkedIn Marketing API 202510

**3-Legged OAuth 2.0 Flow**
- **Authorization Endpoint**: `GET /oauth/v2/authorization`
  - Query params: `response_type=code`, `client_id`, `redirect_uri`, `scope=r_ads,w_organization_social`
  - Returns: Authorization code

- **Token Endpoint**: `POST /oauth/v2/accessToken`
  - Content-Type: `application/x-www-form-urlencoded`
  - Body: `grant_type=authorization_code`, `code`, `client_id`, `client_secret`, `redirect_uri`
  - Response: `{ access_token, expires_in, scope }`

**Required Scopes**: `r_ads` (read), `rw_ads` (read/write)

**API Authentication**:
- Header: `Authorization: Bearer {access_token}`
- Header: `Linkedin-Version: 202510`

### 4. TikTok Marketing API

**OAuth 2.0 v2 Flow**
- **Authorization Endpoint**: `GET /oauth/authorize`
  - Query params: `client_key`, `response_type=code`, `scope`, `redirect_uri`
  - Returns: Authorization code

- **Token Endpoint**: `POST /v2/oauth/token/`
  - Content-Type: `application/x-www-form-urlencoded`
  - Body: `client_key`, `client_secret`, `code`, `grant_type=authorization_code`, `redirect_uri`
  - Response: `{ access_token, refresh_token, expires_in: 86400, refresh_expires_in: 31536000, open_id, scope, token_type: "Bearer" }`

- **Refresh Token**: `POST /v2/oauth/token/`
  - Body: `client_key`, `client_secret`, `refresh_token`, `grant_type=refresh_token`
  - Response: New access token

**Required Scopes**: `ad_management`, `campaign.create`, `campaign.update`

**API Authentication**:
- Header: `Authorization: Bearer {access_token}`

### 5. The Trade Desk API v3

**Token-Based Authentication** (Not OAuth)
- **Authentication Endpoint**: `POST /v3/authentication`
  - Body: `{ Login: "username", Password: "password" }`
  - Response: `{ Token: "long-lived-token", Expiration: "ISO-8601-date" }`

**API Authentication**:
- Header: `TTD-Auth: {token}` (NOT Authorization header)

**Token Generation UI**:
- Tokens can also be generated via partner portal at `https://partner.thetradedesk.com/v3/portal/tokens`
- Configurable lifespan
- Long-lived (no refresh needed)

### 6. DV360 API v4

**OAuth 2.0 Flow** (Same as Google Ads)
- Uses same Google OAuth infrastructure
- **Required Scopes**: `https://www.googleapis.com/auth/doubleclickbidmanager`

**Service Account Authentication**:
- JWT-based service account
- Domain-wide delegation for enterprise use
- Service account email must be linked to DV360 user

**API Authentication**:
- Header: `Authorization: Bearer {access_token}`

---

## Campaign API Endpoints

### 1. Google Ads API v21

**Base URL**: `/googleads/v21`

**Create Campaign**:
```
POST /googleads/v21/customers/{customerId}/campaigns:mutate
Authorization: Bearer {token}
developer-token: {dev_token}

Body:
{
  "operations": [{
    "create": {
      "name": "Campaign Name",
      "status": "ENABLED",
      "advertisingChannelType": "SEARCH",
      "budget": "customers/{customerId}/campaignBudgets/{budgetId}",
      "targetSpend": { "targetSpendMicros": "10000000" }
    }
  }]
}

Response 200:
{
  "results": [{
    "resourceName": "customers/123/campaigns/456",
    "campaign": { ... }
  }]
}

Error 400 (Validation):
{
  "error": {
    "code": 400,
    "message": "Invalid budget amount",
    "status": "INVALID_ARGUMENT"
  }
}
```

**Get Campaign**:
```
GET /googleads/v21/customers/{customerId}/campaigns/{campaignId}
```

**Update Campaign Status**:
```
POST /googleads/v21/customers/{customerId}/campaigns:mutate
Body: { "operations": [{ "update": { "status": "PAUSED" } }] }
```

### 2. Meta Marketing API v23.0

**Base URL**: `/v23.0`

**Create Campaign**:
```
POST /v23.0/act_{ad_account_id}/campaigns
Authorization: Bearer {token}

Body:
{
  "name": "Campaign Name",
  "objective": "OUTCOME_TRAFFIC",
  "status": "ACTIVE",
  "special_ad_categories": [],
  "daily_budget": 5000
}

Response 200:
{
  "id": "campaign_id_123",
  "name": "Campaign Name",
  "status": "ACTIVE"
}

Error 400:
{
  "error": {
    "message": "Invalid budget amount",
    "type": "OAuthException",
    "code": 100
  }
}
```

**Get Campaign**:
```
GET /v23.0/{campaign_id}
```

**Update Campaign**:
```
POST /v23.0/{campaign_id}
Body: { "status": "PAUSED" }
```

### 3. LinkedIn Marketing API 202510

**Base URL**: `/rest`

**Create Campaign**:
```
POST /rest/adCampaigns
Authorization: Bearer {token}
Linkedin-Version: 202510

Body:
{
  "account": "urn:li:sponsoredAccount:123",
  "name": "Campaign Name",
  "type": "TEXT_AD",
  "status": "ACTIVE",
  "dailyBudget": {
    "amount": "50",
    "currencyCode": "USD"
  }
}

Response 201:
{
  "id": "urn:li:sponsoredCampaign:456",
  "status": "ACTIVE"
}
```

**Get Campaign**:
```
GET /rest/adCampaigns/{id}
Linkedin-Version: 202510
```

### 4. TikTok Marketing API

**Base URL**: `/open_api/v1.3`

**Create Campaign**:
```
POST /open_api/v1.3/campaign/create/
Authorization: Bearer {token}

Body:
{
  "advertiser_id": "123456",
  "campaign_name": "Campaign Name",
  "objective_type": "TRAFFIC",
  "budget_mode": "BUDGET_MODE_DAY",
  "budget": 100.0
}

Response 200:
{
  "code": 0,
  "message": "OK",
  "data": {
    "campaign_id": "789012"
  }
}

Error 400:
{
  "code": 40001,
  "message": "Invalid budget",
  "data": {}
}
```

**Update Campaign**:
```
POST /open_api/v1.3/campaign/update/
Body: { "advertiser_id": "123", "campaign_id": "789", "operation_status": "ENABLE" }
```

### 5. The Trade Desk API v3

**Base URL**: `/v3`

**Create Campaign**:
```
POST /v3/campaign
TTD-Auth: {token}

Body:
{
  "CampaignName": "Campaign Name",
  "AdvertiserId": "abc123",
  "Budget": {
    "Amount": 10000,
    "CurrencyCode": "USD"
  },
  "StartDate": "2025-11-01T00:00:00Z"
}

Response 200:
{
  "CampaignId": "xyz789",
  "CampaignName": "Campaign Name"
}
```

**Update Campaign**:
```
PUT /v3/campaign/{id}
Body: { "Availability": "Active" }
```

### 6. DV360 API v4

**Base URL**: `/v4`

**Create Campaign**:
```
POST /v4/advertisers/{advertiserId}/campaigns
Authorization: Bearer {token}

Body:
{
  "displayName": "Campaign Name",
  "entityStatus": "ENTITY_STATUS_ACTIVE",
  "campaignGoal": {
    "campaignGoalType": "CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS"
  }
}

Response 200:
{
  "name": "advertisers/123/campaigns/456",
  "campaignId": "456",
  "displayName": "Campaign Name"
}
```

**Update Campaign**:
```
PATCH /v4/advertisers/{advertiserId}/campaigns/{campaignId}
Body: { "entityStatus": "ENTITY_STATUS_PAUSED" }
```

---

## Error Response Scenarios

### Success Scenarios (200/201)
- Valid token + valid request body
- Returns campaign ID and confirmation

### Validation Errors (400)
- Missing required fields
- Invalid budget amounts (negative, too low)
- Invalid date formats
- Invalid enum values

### Authentication Errors (401)
- Missing token
- Expired token
- Invalid token format
- Malformed Authorization header

### Authorization Errors (403)
- Valid token but insufficient permissions
- Token doesn't have required scopes
- Account access denied

### Rate Limiting (429)
- Too many requests
- Include `Retry-After` header

---

## Configuration

### Environment Variables (.env)
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Google Ads / DV360
GOOGLE_VALID_TOKEN=mock_google_access_token_12345
GOOGLE_CLIENT_ID=mock_client_id
GOOGLE_CLIENT_SECRET=mock_client_secret
GOOGLE_DEV_TOKEN=mock_dev_token

# Meta
META_VALID_TOKEN=mock_meta_access_token_67890
META_APP_ID=mock_app_id
META_APP_SECRET=mock_app_secret

# LinkedIn
LINKEDIN_VALID_TOKEN=mock_linkedin_access_token_abcde
LINKEDIN_CLIENT_ID=mock_client_id
LINKEDIN_CLIENT_SECRET=mock_client_secret

# TikTok
TIKTOK_VALID_TOKEN=mock_tiktok_access_token_fghij
TIKTOK_CLIENT_KEY=mock_client_key
TIKTOK_CLIENT_SECRET=mock_client_secret

# The Trade Desk
TTD_VALID_TOKEN=mock_ttd_token_klmno
TTD_USERNAME=mock_user
TTD_PASSWORD=mock_pass

# DV360 (uses Google OAuth)
DV360_VALID_TOKEN=mock_dv360_access_token_pqrst

# Feature Flags
ENABLE_REQUEST_LOGGING=true
SIMULATE_RATE_LIMITING=false
```

---

## Implementation Phases

### Phase 1: Hardcoded Responses (Initial)
- ✓ All platforms return hardcoded success/error responses
- ✓ Token validation against environment variables
- ✓ In-memory storage (no persistence)
- ✓ Quick setup for immediate testing

### Phase 2: Local Database (Future Enhancement)
- SQLite database for persistence
- Store campaigns with state tracking
- Token expiration simulation
- Full CRUD operations with data persistence

---

## Testing Scenarios

### Success Flow
1. Authenticate → Get valid token
2. Create campaign → 200/201 with campaign ID
3. Get campaign → 200 with campaign details
4. Update campaign status → 200 success
5. Verify state changes

### Validation Error Flow
1. Authenticate → Get valid token
2. Create campaign with invalid budget → 400 error
3. Create campaign without required field → 400 error
4. Update with invalid status → 400 error

### Auth Failure Flow
1. Create campaign without token → 401 error
2. Create campaign with expired token → 401 error
3. Create campaign with invalid token → 401 error
4. Create campaign with insufficient permissions → 403 error

---

## Development Roadmap

1. **Project Setup** (Agent: Setup)
   - Initialize Node.js + TypeScript project
   - Install dependencies
   - Create directory structure

2. **Google Ads v21** (Agent: GoogleAds)
   - OAuth2 endpoints
   - Campaign CRUD endpoints
   - Mock data and error scenarios

3. **Meta v23.0** (Agent: Meta)
   - OAuth2 endpoints
   - Campaign CRUD endpoints
   - Mock data and error scenarios

4. **LinkedIn 202510** (Agent: LinkedIn)
   - OAuth2 endpoints with version header
   - Campaign CRUD endpoints
   - Mock data and error scenarios

5. **TikTok** (Agent: TikTok)
   - OAuth2 v2 endpoints
   - Campaign CRUD endpoints
   - Token refresh simulation

6. **The Trade Desk v3** (Agent: TradeDesk)
   - Token authentication endpoints
   - Campaign CRUD endpoints
   - TTD-Auth header validation

7. **DV360 v4** (Agent: DV360)
   - Google OAuth with DV360 scope
   - Campaign CRUD endpoints
   - Service account support

8. **Integration** (Main)
   - Combine all platform routes
   - Shared middleware
   - Main server setup
   - Documentation

---

## Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2"
  }
}
```

---

## Usage Examples

### Start Server
```bash
npm install
npm run dev  # Development mode with hot reload
npm start    # Production mode
```

### Test Authentication
```bash
# Google Ads OAuth
curl -X POST http://localhost:3000/oauth/token \
  -d "client_id=mock_client&client_secret=secret&code=auth_code&grant_type=authorization_code"

# Get access token and use for API calls
curl -X POST http://localhost:3000/googleads/v21/customers/123/campaigns:mutate \
  -H "Authorization: Bearer mock_google_access_token_12345" \
  -H "developer-token: mock_dev_token" \
  -d '{"operations":[{"create":{"name":"Test Campaign"}}]}'
```

### Test Campaign Creation
```bash
# Meta
curl -X POST http://localhost:3000/v23.0/act_123/campaigns \
  -H "Authorization: Bearer mock_meta_access_token_67890" \
  -d '{"name":"Test Campaign","objective":"TRAFFIC","status":"ACTIVE"}'

# LinkedIn
curl -X POST http://localhost:3000/rest/adCampaigns \
  -H "Authorization: Bearer mock_linkedin_access_token_abcde" \
  -H "Linkedin-Version: 202510" \
  -d '{"name":"Test Campaign","status":"ACTIVE"}'
```

---

## Notes

- All API specifications are based on latest versions as of October 2025
- Mock servers simulate real API behavior including error codes and response formats
- Tokens are validated against `.env` configuration
- Easy to extend with additional platforms or endpoints
- Future DB integration planned for persistent state management

---

## References

- [Google Ads API v21 Documentation](https://developers.google.com/google-ads/api/)
- [Meta Marketing API v23.0 Documentation](https://developers.facebook.com/docs/marketing-apis/)
- [LinkedIn Marketing API 202510 Documentation](https://learn.microsoft.com/en-us/linkedin/marketing/)
- [TikTok Marketing API Documentation](https://ads.tiktok.com/marketing_api/docs)
- [The Trade Desk API v3 Documentation](https://partner.thetradedesk.com/v3/portal/api/doc)
- [DV360 API v4 Documentation](https://developers.google.com/display-video/api/)
