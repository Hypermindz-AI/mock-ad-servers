# API Reference

Complete API reference for all 6 mock ad server platforms. This document provides detailed endpoint specifications, request/response formats, authentication methods, and example usage.

## Table of Contents

1. [Google Ads API v21](#google-ads-api-v21)
2. [Meta Marketing API v23.0](#meta-marketing-api-v230)
3. [LinkedIn Marketing API 202510](#linkedin-marketing-api-202510)
4. [TikTok Marketing API](#tiktok-marketing-api)
5. [The Trade Desk API v3](#the-trade-desk-api-v3)
6. [DV360 API v4](#dv360-api-v4)
7. [Common Error Codes](#common-error-codes)

---

## Google Ads API v21

**Base URL**: `/googleads/v21`
**Authentication**: OAuth 2.0 + Developer Token
**API Version**: v21 (August 2025)

### Authentication

#### 1. Get Authorization Code

```http
GET /oauth/authorize
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_id | string | Yes | OAuth client ID |
| redirect_uri | string | Yes | Callback URL |
| response_type | string | Yes | Must be "code" |
| scope | string | Yes | Must include "https://www.googleapis.com/auth/adwords" |

**Example Request:**
```bash
curl "http://localhost:3000/oauth/authorize?client_id=mock_google_client_id&redirect_uri=http://localhost/callback&response_type=code&scope=https://www.googleapis.com/auth/adwords"
```

**Success Response (302 Redirect):**
```
Location: http://localhost/callback?code=mock_google_auth_code_123456
```

#### 2. Exchange Authorization Code for Token

```http
POST /oauth/token
Content-Type: application/json
```

**Request Body:**
```json
{
  "client_id": "mock_google_client_id",
  "client_secret": "mock_google_client_secret",
  "code": "mock_google_auth_code_123456",
  "grant_type": "authorization_code",
  "redirect_uri": "http://localhost/callback"
}
```

**Success Response (200):**
```json
{
  "access_token": "mock_google_access_token_12345",
  "refresh_token": "mock_google_refresh_token_67890",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

#### 3. Refresh Access Token

```http
POST /oauth/token
Content-Type: application/json
```

**Request Body:**
```json
{
  "client_id": "mock_google_client_id",
  "client_secret": "mock_google_client_secret",
  "refresh_token": "mock_google_refresh_token_67890",
  "grant_type": "refresh_token"
}
```

### Campaign Operations

#### Create Campaign

```http
POST /googleads/v21/customers/{customerId}/campaigns:mutate
Authorization: Bearer {access_token}
developer-token: {developer_token}
Content-Type: application/json
```

**Path Parameters:**
- `customerId` (string): Google Ads customer ID

**Request Body:**
```json
{
  "operations": [{
    "create": {
      "name": "My Campaign",
      "status": "ENABLED",
      "advertisingChannelType": "SEARCH",
      "budget": "customers/1234567890/campaignBudgets/1111111111",
      "targetSpend": {
        "targetSpendMicros": "10000000"
      }
    }
  }]
}
```

**Field Descriptions:**
- `name` (string, required): Campaign name
- `status` (enum, optional): ENABLED | PAUSED | REMOVED (default: PAUSED)
- `advertisingChannelType` (enum, required): SEARCH | DISPLAY | SHOPPING | VIDEO | MULTI_CHANNEL
- `budget` (string, required): Resource name of campaign budget
- `targetSpend` (object, optional): Target spend configuration

**Success Response (200):**
```json
{
  "results": [{
    "resourceName": "customers/1234567890/campaigns/9876543210",
    "campaign": {
      "resourceName": "customers/1234567890/campaigns/9876543210",
      "id": "9876543210",
      "name": "My Campaign",
      "status": "ENABLED",
      "advertisingChannelType": "SEARCH",
      "budget": "customers/1234567890/campaignBudgets/1111111111",
      "targetSpend": {
        "targetSpendMicros": "10000000"
      }
    }
  }]
}
```

#### Get Campaign

```http
GET /googleads/v21/customers/{customerId}/campaigns/{campaignId}
Authorization: Bearer {access_token}
developer-token: {developer_token}
```

**Success Response (200):**
```json
{
  "resourceName": "customers/1234567890/campaigns/9876543210",
  "id": "9876543210",
  "name": "My Campaign",
  "status": "ENABLED",
  "advertisingChannelType": "SEARCH",
  "budget": "customers/1234567890/campaignBudgets/1111111111"
}
```

#### Update Campaign

```http
POST /googleads/v21/customers/{customerId}/campaigns:mutate
Authorization: Bearer {access_token}
developer-token: {developer_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "operations": [{
    "update": {
      "resourceName": "customers/1234567890/campaigns/9876543210",
      "status": "PAUSED"
    }
  }]
}
```

### Error Responses

**400 - Invalid Request:**
```json
{
  "error": {
    "code": 400,
    "message": "Invalid budget amount",
    "status": "INVALID_ARGUMENT"
  }
}
```

**401 - Unauthorized:**
```json
{
  "error": {
    "code": 401,
    "message": "Request is missing required authentication credential",
    "status": "UNAUTHENTICATED"
  }
}
```

**404 - Not Found:**
```json
{
  "error": {
    "code": 404,
    "message": "Campaign not found",
    "status": "NOT_FOUND"
  }
}
```

---

## Meta Marketing API v23.0

**Base URL**: `/v23.0`
**Authentication**: OAuth 2.0
**API Version**: v23.0 (May 2025)

### Authentication

#### 1. Get Authorization Code

```http
GET /v23.0/dialog/oauth
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_id | string | Yes | Meta App ID |
| redirect_uri | string | Yes | Callback URL |
| response_type | string | Yes | Must be "code" |
| scope | string | Optional | Comma-separated permissions (default: ads_management) |

**Example Request:**
```bash
curl "http://localhost:3000/v23.0/dialog/oauth?client_id=mock_meta_app_id_123456&redirect_uri=http://localhost/callback&response_type=code"
```

#### 2. Get Access Token

```http
GET /v23.0/oauth/access_token
```

**Query Parameters (Authorization Code Flow):**
```
?client_id=mock_meta_app_id_123456
&client_secret=mock_meta_app_secret_789012
&code=mock_auth_code_123456
&redirect_uri=http://localhost/callback
```

**Success Response (200):**
```json
{
  "access_token": "mock_meta_access_token_abcdef",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

**App Access Token (Client Credentials):**
```
?client_id=mock_meta_app_id_123456
&client_secret=mock_meta_app_secret_789012
&grant_type=client_credentials
```

### Campaign Operations

#### Create Campaign

```http
POST /v23.0/act_{ad_account_id}/campaigns
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "My Meta Campaign",
  "objective": "OUTCOME_TRAFFIC",
  "status": "ACTIVE",
  "daily_budget": 5000,
  "special_ad_categories": []
}
```

**Field Descriptions:**
- `name` (string, required): Campaign name
- `objective` (enum, required): Campaign objective (see valid objectives below)
- `status` (enum, required): ACTIVE | PAUSED | DELETED | ARCHIVED
- `daily_budget` (number, conditional): Daily budget in cents (required if no lifetime_budget)
- `lifetime_budget` (number, conditional): Lifetime budget in cents (required if no daily_budget)
- `special_ad_categories` (array, optional): Special ad category declarations

**Valid Objectives:**
- OUTCOME_TRAFFIC
- OUTCOME_ENGAGEMENT
- OUTCOME_LEADS
- OUTCOME_SALES
- OUTCOME_AWARENESS
- OUTCOME_APP_PROMOTION
- And 14 more...

**Success Response (200):**
```json
{
  "id": "120210000123456789",
  "name": "My Meta Campaign",
  "status": "ACTIVE",
  "objective": "OUTCOME_TRAFFIC",
  "daily_budget": 5000
}
```

#### Get Campaign

```http
GET /v23.0/{campaign_id}
Authorization: Bearer {access_token}
```

**Alternative Authentication (Query Parameter):**
```http
GET /v23.0/{campaign_id}?access_token={access_token}
```

**Success Response (200):**
```json
{
  "id": "120210000123456789",
  "name": "My Meta Campaign",
  "status": "ACTIVE",
  "objective": "OUTCOME_TRAFFIC",
  "daily_budget": 5000,
  "created_time": "2025-10-30T12:00:00+0000",
  "updated_time": "2025-10-30T12:00:00+0000"
}
```

#### Update Campaign

```http
POST /v23.0/{campaign_id}
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "PAUSED",
  "daily_budget": 7500
}
```

**Success Response (200):**
```json
{
  "success": true,
  "id": "120210000123456789",
  "status": "PAUSED",
  "daily_budget": 7500
}
```

### Error Responses

**Meta-Specific Error Format:**
```json
{
  "error": {
    "message": "Invalid budget amount. Must be positive.",
    "type": "OAuthException",
    "code": 100,
    "fbtrace_id": "AaBbCcDdEeFfGg"
  }
}
```

**Error Codes:**
- `100`: Invalid parameter
- `190`: Access token expired or invalid
- `2500`: Parameter validation error

---

## LinkedIn Marketing API 202510

**Base URL**: `/rest`
**Authentication**: OAuth 2.0 (3-legged)
**API Version**: 202510 (October 2025)
**Special Header Required**: `Linkedin-Version: 202510`

### Authentication

#### 1. Get Authorization Code

```http
GET /oauth/v2/authorization
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| response_type | string | Yes | Must be "code" |
| client_id | string | Yes | LinkedIn Client ID |
| redirect_uri | string | Yes | Callback URL |
| scope | string | Yes | Space-separated scopes (must include r_ads or rw_ads) |

**Required Scopes:**
- `r_ads`: Read access to advertising accounts
- `rw_ads`: Read/write access to advertising accounts

**Example Request:**
```bash
curl "http://localhost:3000/oauth/v2/authorization?response_type=code&client_id=mock_linkedin_client_id_345678&redirect_uri=http://localhost/callback&scope=r_ads%20rw_ads"
```

#### 2. Get Access Token

```http
POST /oauth/v2/accessToken
Content-Type: application/x-www-form-urlencoded
```

**Request Body (URL-encoded):**
```
grant_type=authorization_code
&code=mock_linkedin_auth_code_123456
&client_id=mock_linkedin_client_id_345678
&client_secret=mock_linkedin_client_secret_901234
&redirect_uri=http://localhost/callback
```

**Success Response (200):**
```json
{
  "access_token": "mock_linkedin_access_token_ghijkl",
  "expires_in": 5184000,
  "scope": "r_ads,rw_ads"
}
```

### Campaign Operations

**Important**: All campaign API requests require the `Linkedin-Version: 202510` header.

#### Create Campaign

```http
POST /rest/adCampaigns
Authorization: Bearer {access_token}
Linkedin-Version: 202510
Content-Type: application/json
```

**Request Body:**
```json
{
  "account": "urn:li:sponsoredAccount:123456",
  "name": "My LinkedIn Campaign",
  "type": "TEXT_AD",
  "status": "ACTIVE",
  "dailyBudget": {
    "amount": "50",
    "currencyCode": "USD"
  }
}
```

**Field Descriptions:**
- `account` (string, required): Sponsored account URN (format: `urn:li:sponsoredAccount:{id}`)
- `name` (string, required): Campaign name
- `type` (enum, required): TEXT_AD | SPONSORED_UPDATES | SPONSORED_INMAILS | DYNAMIC
- `status` (enum, required): ACTIVE | PAUSED | ARCHIVED | COMPLETED | CANCELED
- `dailyBudget` (object, optional): Daily budget configuration
- `totalBudget` (object, optional): Total budget configuration

**Success Response (201):**
```json
{
  "id": "urn:li:sponsoredCampaign:789012",
  "account": "urn:li:sponsoredAccount:123456",
  "name": "My LinkedIn Campaign",
  "type": "TEXT_AD",
  "status": "ACTIVE",
  "dailyBudget": {
    "amount": "50",
    "currencyCode": "USD"
  },
  "createdAt": "2025-10-30T12:00:00.000Z",
  "lastModifiedAt": "2025-10-30T12:00:00.000Z"
}
```

#### Get Campaign

```http
GET /rest/adCampaigns/{campaign_urn}
Authorization: Bearer {access_token}
Linkedin-Version: 202510
```

**Path Parameters:**
- `campaign_urn` (string): Campaign URN (format: `urn:li:sponsoredCampaign:{id}`)

#### Update Campaign

```http
POST /rest/adCampaigns/{campaign_urn}
Authorization: Bearer {access_token}
Linkedin-Version: 202510
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "PAUSED",
  "dailyBudget": {
    "amount": "75",
    "currencyCode": "USD"
  }
}
```

### Error Responses

**400 - Missing Version Header:**
```json
{
  "message": "Linkedin-Version header is required",
  "status": 400
}
```

**400 - Invalid URN Format:**
```json
{
  "message": "Invalid account URN format. Expected: urn:li:sponsoredAccount:{id}",
  "status": 400
}
```

---

## TikTok Marketing API

**Base URL**: `/open_api/v1.3`
**Authentication**: OAuth 2.0 v2
**Token Expiration**: Access token (86400s), Refresh token (31536000s)

### Authentication

#### 1. Get Authorization Code

```http
GET /oauth/authorize
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_key | string | Yes | TikTok client key |
| response_type | string | Yes | Must be "code" |
| scope | string | Yes | Comma-separated permissions |
| redirect_uri | string | Yes | Callback URL |
| state | string | Optional | CSRF protection token |

**Example Request:**
```bash
curl "http://localhost:3000/oauth/authorize?client_key=mock_tiktok_client_key_567890&response_type=code&scope=ad_management&redirect_uri=http://localhost/callback"
```

#### 2. Get Access Token

```http
POST /v2/oauth/token/
Content-Type: application/x-www-form-urlencoded
```

**Authorization Code Grant:**
```
client_key=mock_tiktok_client_key_567890
&client_secret=mock_tiktok_client_secret_123456
&code=mock_auth_code_123456
&grant_type=authorization_code
&redirect_uri=http://localhost/callback
```

**Success Response (200):**
```json
{
  "access_token": "mock_tiktok_access_token_mnopqr",
  "refresh_token": "mock_tiktok_refresh_token_stuvwx",
  "expires_in": 86400,
  "refresh_expires_in": 31536000,
  "open_id": "tiktok_user_123456",
  "scope": "ad_management",
  "token_type": "Bearer"
}
```

**Refresh Token Grant:**
```
client_key=mock_tiktok_client_key_567890
&client_secret=mock_tiktok_client_secret_123456
&refresh_token=mock_tiktok_refresh_token_stuvwx
&grant_type=refresh_token
```

### Campaign Operations

**TikTok Response Format:**
All successful responses follow this format:
```json
{
  "code": 0,
  "message": "OK",
  "data": { ... }
}
```

Error responses:
```json
{
  "code": 40001,
  "message": "Error description",
  "data": {}
}
```

#### Create Campaign

```http
POST /open_api/v1.3/campaign/create/
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "advertiser_id": "123456",
  "campaign_name": "My TikTok Campaign",
  "objective_type": "TRAFFIC",
  "budget_mode": "BUDGET_MODE_DAY",
  "budget": 100.0
}
```

**Field Descriptions:**
- `advertiser_id` (string, required): Advertiser account ID
- `campaign_name` (string, required): Campaign name
- `objective_type` (enum, required): TRAFFIC | CONVERSIONS | APP_PROMOTION | REACH | VIDEO_VIEWS | LEAD_GENERATION | PRODUCT_SALES
- `budget_mode` (enum, required): BUDGET_MODE_DAY | BUDGET_MODE_TOTAL | BUDGET_MODE_INFINITE
- `budget` (number, conditional): Budget amount (required for DAY and TOTAL modes)

**Success Response (200):**
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "campaign_id": "789012345678901234"
  }
}
```

#### Update Campaign

```http
POST /open_api/v1.3/campaign/update/
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "advertiser_id": "123456",
  "campaign_id": "789012345678901234",
  "operation_status": "DISABLE",
  "budget": 150.0
}
```

**Field Descriptions:**
- `operation_status` (enum, optional): ENABLE | DISABLE | DELETE

#### Get Campaign

```http
GET /open_api/v1.3/campaign/get/
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `advertiser_id` (string, required): Advertiser account ID
- `campaign_ids` (string, optional): JSON array of campaign IDs

**Example:**
```bash
curl "http://localhost:3000/open_api/v1.3/campaign/get/?advertiser_id=123456&campaign_ids=%5B%22789012%22%5D" \
  -H "Authorization: Bearer mock_tiktok_access_token_mnopqr"
```

**Success Response (200):**
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "list": [{
      "campaign_id": "789012345678901234",
      "campaign_name": "My TikTok Campaign",
      "objective_type": "TRAFFIC",
      "budget_mode": "BUDGET_MODE_DAY",
      "budget": 100.0
    }],
    "page_info": {
      "total_number": 1,
      "page": 1,
      "page_size": 10
    }
  }
}
```

### Error Responses

**Error Codes:**
- `40001`: Validation error
- `40100`: Authentication failed
- `40104`: Authorization failed
- `40002`: Rate limit exceeded
- `50000`: Internal server error

---

## The Trade Desk API v3

**Base URL**: `/v3`
**Authentication**: Token-based (NOT OAuth)
**Special Header**: `TTD-Auth` (NOT Authorization)

### Authentication

#### Get Authentication Token

```http
POST /v3/authentication
Content-Type: application/json
```

**Request Body:**
```json
{
  "Login": "mock_ttd_username",
  "Password": "mock_ttd_password"
}
```

**Note**: Uses PascalCase for field names.

**Success Response (200):**
```json
{
  "Token": "mock_ttd_token_stuvwx_yzabcd_efghij",
  "Expiration": "2026-10-30T23:59:59.000Z"
}
```

**Token Properties:**
- Long-lived (typically 1 year)
- No refresh mechanism
- Must be regenerated when expired

### Campaign Operations

**Important**: All campaign requests use the `TTD-Auth` header (NOT `Authorization`).

#### Create Campaign

```http
POST /v3/campaign
TTD-Auth: {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "CampaignName": "My TTD Campaign",
  "AdvertiserId": "abc123",
  "Budget": {
    "Amount": 10000,
    "CurrencyCode": "USD"
  },
  "StartDate": "2025-11-01T00:00:00Z",
  "EndDate": "2025-12-31T23:59:59Z"
}
```

**Field Descriptions (PascalCase):**
- `CampaignName` (string, required): Campaign name
- `AdvertiserId` (string, required): Advertiser ID
- `Budget` (object, required): Budget configuration
  - `Amount` (number, required): Budget amount (must be positive)
  - `CurrencyCode` (string, required): ISO currency code
- `StartDate` (string, required): ISO 8601 date-time
- `EndDate` (string, optional): ISO 8601 date-time

**Success Response (200):**
```json
{
  "CampaignId": "ttd_campaign_1730289600000",
  "CampaignName": "My TTD Campaign"
}
```

#### Update Campaign

```http
PUT /v3/campaign/{campaign_id}
TTD-Auth: {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "Availability": "Paused",
  "CampaignName": "Updated Campaign Name",
  "Budget": {
    "Amount": 15000,
    "CurrencyCode": "USD"
  }
}
```

**Field Descriptions:**
- `Availability` (enum, optional): Active | Paused | Archived

#### Get Campaign

```http
GET /v3/campaign/{campaign_id}
TTD-Auth: {token}
```

**Success Response (200):**
```json
{
  "CampaignId": "ttd_campaign_1730289600000",
  "CampaignName": "My TTD Campaign",
  "AdvertiserId": "abc123",
  "Budget": {
    "Amount": 10000,
    "CurrencyCode": "USD"
  },
  "Availability": "Active",
  "StartDate": "2025-11-01T00:00:00Z"
}
```

### Error Responses

**401 - Missing TTD-Auth Header:**
```json
{
  "Message": "TTD-Auth header is required"
}
```

**400 - Validation Error:**
```json
{
  "Message": "Invalid request: CampaignName is required",
  "ErrorCode": "VALIDATION_ERROR"
}
```

---

## DV360 API v4

**Base URL**: `/v4`
**Authentication**: OAuth 2.0 (Shares Google OAuth)
**API Version**: v4 (March 2025)
**Required Scope**: `https://www.googleapis.com/auth/doubleclickbidmanager`

### Authentication

Uses the same OAuth flow as Google Ads (see Google Ads Authentication section).

**Key Difference**: Scope must be `doubleclickbidmanager` instead of `adwords`.

### Campaign Operations

#### Create Campaign

```http
POST /v4/advertisers/{advertiserId}/campaigns
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "displayName": "My DV360 Campaign",
  "entityStatus": "ENTITY_STATUS_ACTIVE",
  "campaignGoal": {
    "campaignGoalType": "CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS",
    "performanceGoal": {
      "performanceGoalType": "PERFORMANCE_GOAL_TYPE_CPM",
      "performanceGoalAmountMicros": "5000000"
    }
  },
  "campaignFlight": {
    "plannedSpendAmountMicros": "10000000000",
    "plannedDates": {
      "startDate": {
        "year": 2025,
        "month": 11,
        "day": 1
      },
      "endDate": {
        "year": 2025,
        "month": 12,
        "day": 31
      }
    }
  },
  "frequencyCap": {
    "maxImpressions": 10,
    "timeUnit": "TIME_UNIT_DAYS",
    "timeUnitCount": 7
  }
}
```

**Field Descriptions:**
- `displayName` (string, required): Campaign display name
- `entityStatus` (enum, optional): ENTITY_STATUS_ACTIVE | ENTITY_STATUS_PAUSED | ENTITY_STATUS_ARCHIVED
- `campaignGoal` (object, optional): Campaign goal configuration
- `campaignFlight` (object, optional): Flight dates and budget
- `frequencyCap` (object, optional): Frequency capping rules

**Success Response (200):**
```json
{
  "name": "advertisers/123456/campaigns/789012",
  "campaignId": "789012",
  "displayName": "My DV360 Campaign",
  "entityStatus": "ENTITY_STATUS_ACTIVE",
  "campaignGoal": {
    "campaignGoalType": "CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS"
  }
}
```

**Resource Name Format**: `advertisers/{advertiserId}/campaigns/{campaignId}`

#### Update Campaign

```http
PATCH /v4/advertisers/{advertiserId}/campaigns/{campaignId}
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body (Partial Update):**
```json
{
  "entityStatus": "ENTITY_STATUS_PAUSED"
}
```

#### Get Campaign

```http
GET /v4/advertisers/{advertiserId}/campaigns/{campaignId}
Authorization: Bearer {access_token}
```

**Success Response (200):**
```json
{
  "name": "advertisers/123456/campaigns/789012",
  "campaignId": "789012",
  "displayName": "My DV360 Campaign",
  "entityStatus": "ENTITY_STATUS_ACTIVE"
}
```

### Error Responses

Uses Google API error format (same as Google Ads):

```json
{
  "error": {
    "code": 400,
    "message": "displayName is required",
    "status": "INVALID_ARGUMENT",
    "details": [{
      "@type": "type.googleapis.com/google.rpc.BadRequest",
      "fieldViolations": [{
        "field": "displayName",
        "description": "displayName is required"
      }]
    }]
  }
}
```

---

## Common Error Codes

### HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid parameters, missing required fields |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Platform-Specific Error Codes

**Google Ads / DV360:**
- `INVALID_ARGUMENT`: Invalid request parameters
- `UNAUTHENTICATED`: Missing or invalid credentials
- `PERMISSION_DENIED`: Insufficient permissions
- `NOT_FOUND`: Resource not found

**Meta:**
- `100`: Parameter validation error
- `190`: Access token expired or invalid
- `2500`: Parameter validation error

**LinkedIn:**
- `400`: Bad request (validation error)
- `401`: Unauthorized (invalid token)
- `403`: Forbidden (insufficient permissions)

**TikTok:**
- `40001`: Validation error
- `40100`: Authentication failed
- `40104`: Authorization failed
- `40002`: Rate limit exceeded

**The Trade Desk:**
- `VALIDATION_ERROR`: Invalid request parameters
- `AUTHENTICATION_ERROR`: Invalid credentials

---

## Rate Limiting

All platforms support optional rate limiting simulation. Enable in `.env`:

```bash
SIMULATE_RATE_LIMITING=true
```

When enabled, 10% of requests will randomly return a 429 error:

```json
{
  "error": {
    "message": "Too many requests. Please try again later.",
    "code": 429,
    "status": "RATE_LIMIT_EXCEEDED"
  },
  "Retry-After": 60
}
```

---

## Additional Resources

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Detailed implementation specifications
- [TESTING.md](./TESTING.md) - Testing guide and examples
- [README.md](./README.md) - Quick start guide
- Official API Documentation:
  - [Google Ads API](https://developers.google.com/google-ads/api/)
  - [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis/)
  - [LinkedIn Marketing API](https://learn.microsoft.com/en-us/linkedin/marketing/)
  - [TikTok Marketing API](https://ads.tiktok.com/marketing_api/docs)
  - [The Trade Desk API](https://partner.thetradedesk.com/v3/portal/api/doc)
  - [DV360 API](https://developers.google.com/display-video/api/)
