# Testing Guide

Comprehensive testing guide for the Mock Ad Servers project. This document covers test setup, running tests, test structure, and creating new tests.

## Table of Contents

1. [Test Setup](#test-setup)
2. [Running Tests](#running-tests)
3. [Test Coverage](#test-coverage)
4. [Test Structure](#test-structure)
5. [Writing New Tests](#writing-new-tests)
6. [Platform-Specific Testing](#platform-specific-testing)
7. [Troubleshooting](#troubleshooting)

---

## Test Setup

### Prerequisites

```bash
# Install dependencies
npm install
```

### Testing Stack

- **Jest**: Test framework
- **Supertest**: HTTP assertion library
- **TypeScript**: Type safety
- **ts-jest**: TypeScript preprocessor for Jest

### Configuration

Test configuration is defined in `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  verbose: true,
};
```

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

Automatically re-runs tests when files change.

### Coverage Report

```bash
npm run test:coverage
```

Generates coverage report in `/coverage` directory.

### Run Specific Platform

```bash
# Google Ads tests only
npm test google-ads

# Meta tests only
npm test meta

# LinkedIn tests only
npm test linkedin

# TikTok tests only
npm test tiktok

# The Trade Desk tests only
npm test tradedesk

# DV360 tests only
npm test dv360
```

### Run Specific Test Suite

```bash
npm test -- -t "OAuth Flow"
npm test -- -t "Campaign CRUD"
npm test -- -t "Authentication"
```

---

## Test Coverage

### Overall Statistics

| Platform | Test File | Tests | Status |
|----------|-----------|-------|--------|
| Google Ads | `tests/google-ads.test.ts` | 51 | ✅ Passing |
| Meta | `tests/meta.test.ts` | 52 | ✅ Passing |
| LinkedIn | `tests/linkedin.test.ts` | 65 | ⚠️ Some failing* |
| TikTok | `tests/tiktok.test.ts` | 49 | ✅ Passing |
| Trade Desk | `tests/tradedesk.test.ts` | 56 | ✅ Passing |
| DV360 | `tests/dv360.test.ts` | 42 | ✅ Passing |
| **Total** | | **315** | |

\* *LinkedIn tests require router mounting fix in main app*

### Coverage by Category

Each platform tests cover:

✅ **OAuth/Authentication Flow** (15-20 tests per platform)
- Authorization code generation
- Token exchange
- Token refresh (where applicable)
- Invalid credential handling
- Missing parameter validation

✅ **Campaign CRUD Operations** (20-30 tests per platform)
- Campaign creation with valid data
- Missing required fields
- Invalid field values
- Budget validation
- Status/enum validation
- Campaign retrieval
- Campaign updates

✅ **Authentication & Authorization** (8-15 tests per platform)
- Missing auth headers
- Invalid tokens
- Malformed headers
- Platform-specific headers (developer-token, Linkedin-Version, TTD-Auth)

✅ **Edge Cases** (5-10 tests per platform)
- Empty request bodies
- Very large/small values
- Special characters
- Concurrent operations

---

## Test Structure

### Standard Test Organization

```typescript
import request from 'supertest';
import app from '../src/index';

describe('Platform Name API', () => {
  describe('OAuth Flow', () => {
    describe('GET /oauth/authorize', () => {
      it('should return authorization code with valid parameters', async () => {
        // Test implementation
      });

      it('should return 400 when client_id is missing', async () => {
        // Test implementation
      });
    });
  });

  describe('Campaign CRUD Operations', () => {
    describe('POST /path/to/campaigns - Create Campaign', () => {
      it('should create campaign with valid data', async () => {
        // Test implementation
      });
    });
  });

  describe('Authentication', () => {
    it('should return 401 when Authorization header is missing', async () => {
      // Test implementation
    });
  });
});
```

### Test Anatomy

```typescript
it('should create campaign with valid data', async () => {
  // 1. Setup (if needed)
  const campaignData = {
    name: 'Test Campaign',
    // ... other fields
  };

  // 2. Execute
  const response = await request(app)
    .post('/api/campaigns')
    .set('Authorization', 'Bearer valid_token')
    .send(campaignData);

  // 3. Assert
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('id');
  expect(response.body.name).toBe('Test Campaign');

  // 4. Cleanup (if needed)
});
```

---

## Writing New Tests

### 1. Create Test File

Create a new file in `/tests` directory:

```bash
touch tests/new-platform.test.ts
```

### 2. Basic Template

```typescript
import request from 'supertest';
import app from '../src/index';

describe('New Platform API', () => {
  // Valid token from environment
  const VALID_TOKEN = 'mock_platform_access_token';
  const VALID_ADDITIONAL_HEADER = 'some_value';

  describe('Authentication', () => {
    it('should authenticate with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/token')
        .send({
          client_id: 'valid_client',
          client_secret: 'valid_secret',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
    });

    it('should return 401 with invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/token')
        .send({
          client_id: 'invalid',
          client_secret: 'invalid',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Campaign Operations', () => {
    it('should create campaign', async () => {
      const response = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({
          name: 'Test Campaign',
          // Add required fields
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });
  });
});
```

### 3. Test Patterns

#### Testing Success Responses

```typescript
it('should create campaign successfully', async () => {
  const response = await request(app)
    .post('/api/campaigns')
    .set('Authorization', 'Bearer valid_token')
    .send(validCampaignData);

  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({
    id: expect.any(String),
    name: 'Test Campaign',
    status: 'ACTIVE',
  });
});
```

#### Testing Validation Errors

```typescript
it('should return 400 when required field is missing', async () => {
  const invalidData = {
    // Missing required 'name' field
    status: 'ACTIVE',
  };

  const response = await request(app)
    .post('/api/campaigns')
    .set('Authorization', 'Bearer valid_token')
    .send(invalidData);

  expect(response.status).toBe(400);
  expect(response.body.error).toBeDefined();
  expect(response.body.error.message).toContain('name');
});
```

#### Testing Authentication

```typescript
it('should return 401 without authentication', async () => {
  const response = await request(app)
    .post('/api/campaigns')
    .send(validCampaignData);

  expect(response.status).toBe(401);
});

it('should return 401 with invalid token', async () => {
  const response = await request(app)
    .post('/api/campaigns')
    .set('Authorization', 'Bearer invalid_token')
    .send(validCampaignData);

  expect(response.status).toBe(401);
});
```

#### Testing Enum Values

```typescript
const validStatuses = ['ACTIVE', 'PAUSED', 'ARCHIVED'];

validStatuses.forEach((status) => {
  it(`should accept status: ${status}`, async () => {
    const response = await request(app)
      .post('/api/campaigns')
      .set('Authorization', 'Bearer valid_token')
      .send({ ...validData, status });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(status);
  });
});
```

---

## Platform-Specific Testing

### Google Ads API v21

**Key Features:**
- Requires both `Authorization` and `developer-token` headers
- Uses `operations` array for mutations
- Resource name format: `customers/{id}/campaigns/{id}`

**Example:**
```typescript
it('should create campaign with Google Ads format', async () => {
  const response = await request(app)
    .post('/googleads/v21/customers/123/campaigns:mutate')
    .set('Authorization', 'Bearer mock_google_access_token_12345')
    .set('developer-token', 'mock_google_dev_token_67890')
    .send({
      operations: [{
        create: {
          name: 'Test Campaign',
          status: 'ENABLED',
          advertisingChannelType: 'SEARCH',
          budget: 'customers/123/campaignBudgets/456',
        },
      }],
    });

  expect(response.status).toBe(200);
  expect(response.body.results[0].resourceName).toMatch(/customers\/\d+\/campaigns\/\d+/);
});
```

### Meta Marketing API v23.0

**Key Features:**
- Supports both Bearer header and `access_token` query parameter
- Error format includes `fbtrace_id`
- Objective-based campaign creation

**Example:**
```typescript
it('should create campaign with Meta format', async () => {
  const response = await request(app)
    .post('/v23.0/act_123456/campaigns')
    .set('Authorization', 'Bearer mock_meta_access_token_abcdef')
    .send({
      name: 'Test Campaign',
      objective: 'OUTCOME_TRAFFIC',
      status: 'ACTIVE',
      daily_budget: 5000,
    });

  expect(response.status).toBe(200);
  expect(response.body.id).toBeDefined();
  expect(response.body.objective).toBe('OUTCOME_TRAFFIC');
});
```

### LinkedIn Marketing API 202510

**Key Features:**
- Requires `Linkedin-Version: 202510` header
- Uses URN format for IDs
- Content-Type must be `application/json`

**Example:**
```typescript
it('should create campaign with LinkedIn format', async () => {
  const response = await request(app)
    .post('/rest/adCampaigns')
    .set('Authorization', 'Bearer mock_linkedin_access_token_ghijkl')
    .set('Linkedin-Version', '202510')
    .send({
      account: 'urn:li:sponsoredAccount:123456',
      name: 'Test Campaign',
      type: 'TEXT_AD',
      status: 'ACTIVE',
      dailyBudget: {
        amount: '50',
        currencyCode: 'USD',
      },
    });

  expect(response.status).toBe(201);
  expect(response.body.id).toMatch(/urn:li:sponsoredCampaign:\d+/);
});
```

### TikTok Marketing API

**Key Features:**
- Response format: `{code, message, data}`
- Success code is `0`
- Error codes start at `40000`

**Example:**
```typescript
it('should create campaign with TikTok format', async () => {
  const response = await request(app)
    .post('/open_api/v1.3/campaign/create/')
    .set('Authorization', 'Bearer mock_tiktok_access_token_mnopqr')
    .send({
      advertiser_id: '123456',
      campaign_name: 'Test Campaign',
      objective_type: 'TRAFFIC',
      budget_mode: 'BUDGET_MODE_DAY',
      budget: 100.0,
    });

  expect(response.status).toBe(200);
  expect(response.body.code).toBe(0);
  expect(response.body.message).toBe('OK');
  expect(response.body.data.campaign_id).toBeDefined();
});
```

### The Trade Desk API v3

**Key Features:**
- Uses `TTD-Auth` header (NOT `Authorization`)
- PascalCase for all fields
- Long-lived tokens

**Example:**
```typescript
it('should create campaign with Trade Desk format', async () => {
  const response = await request(app)
    .post('/v3/campaign')
    .set('TTD-Auth', 'mock_ttd_token_stuvwx_yzabcd_efghij')
    .send({
      CampaignName: 'Test Campaign',
      AdvertiserId: 'abc123',
      Budget: {
        Amount: 10000,
        CurrencyCode: 'USD',
      },
      StartDate: '2025-11-01T00:00:00Z',
    });

  expect(response.status).toBe(200);
  expect(response.body.CampaignId).toBeDefined();
  expect(response.body.CampaignName).toBe('Test Campaign');
});
```

### DV360 API v4

**Key Features:**
- Shares Google OAuth
- Resource name format: `advertisers/{id}/campaigns/{id}`
- Entity status enums with `ENTITY_STATUS_` prefix

**Example:**
```typescript
it('should create campaign with DV360 format', async () => {
  const response = await request(app)
    .post('/v4/advertisers/123456/campaigns')
    .set('Authorization', 'Bearer mock_dv360_access_token_klmnop')
    .send({
      displayName: 'Test Campaign',
      entityStatus: 'ENTITY_STATUS_ACTIVE',
      campaignGoal: {
        campaignGoalType: 'CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS',
      },
    });

  expect(response.status).toBe(200);
  expect(response.body.name).toMatch(/advertisers\/\d+\/campaigns\/\d+/);
  expect(response.body.entityStatus).toBe('ENTITY_STATUS_ACTIVE');
});
```

---

## Test Best Practices

### 1. Use Descriptive Test Names

❌ **Bad:**
```typescript
it('works', async () => { ... });
```

✅ **Good:**
```typescript
it('should create campaign with valid data and return 201', async () => { ... });
```

### 2. Test One Thing Per Test

❌ **Bad:**
```typescript
it('should handle campaigns', async () => {
  // Creates campaign
  // Updates campaign
  // Deletes campaign
  // Tests error handling
});
```

✅ **Good:**
```typescript
it('should create campaign with valid data', async () => { ... });
it('should update campaign status', async () => { ... });
it('should return 404 when campaign not found', async () => { ... });
```

### 3. Use beforeEach for Setup

```typescript
describe('Campaign Operations', () => {
  let validToken: string;
  let campaignId: string;

  beforeEach(() => {
    validToken = 'mock_access_token';
    // Clear any state if needed
  });

  it('should create campaign', async () => {
    // Use validToken
  });
});
```

### 4. Test Error Cases

For every success case, test corresponding error cases:

```typescript
describe('Create Campaign', () => {
  it('should create with valid data', async () => { ... });
  it('should return 400 when name is missing', async () => { ... });
  it('should return 400 when budget is negative', async () => { ... });
  it('should return 401 when not authenticated', async () => { ... });
});
```

### 5. Use Helper Functions

```typescript
// Helper function
const createCampaign = (data: any, token: string = VALID_TOKEN) => {
  return request(app)
    .post('/api/campaigns')
    .set('Authorization', `Bearer ${token}`)
    .send(data);
};

// Usage
it('should create campaign', async () => {
  const response = await createCampaign({ name: 'Test' });
  expect(response.status).toBe(200);
});
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Failing with Connection Error

**Problem:**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
The app should not start a server when imported for testing. Verify `src/index.ts` has:

```typescript
// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => { ... });
}
```

#### 2. TypeScript Compilation Errors

**Problem:**
```
Cannot find module '../src/index'
```

**Solution:**
```bash
# Build TypeScript files
npm run build

# Or use ts-jest directly
npm test
```

#### 3. Jest Not Finding Tests

**Problem:**
```
No tests found
```

**Solution:**
Check `jest.config.js`:
```javascript
{
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
}
```

#### 4. Module Resolution Errors

**Problem:**
```
Cannot find module with .js extension
```

**Solution:**
Ensure TypeScript is configured for ES modules:
```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true
  }
}
```

### Debugging Tests

#### Run Single Test

```bash
npm test -- -t "specific test name"
```

#### Debug with Console Logs

```typescript
it('should do something', async () => {
  const response = await request(app).get('/api/test');
  console.log('Response:', response.body);
  expect(response.status).toBe(200);
});
```

#### Use --verbose Flag

```bash
npm test -- --verbose
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - run: npm test
      - run: npm run test:coverage
```

---

## Test Maintenance

### Adding Tests for New Features

1. **Create test file** if adding new platform
2. **Add describe blocks** for new endpoint groups
3. **Write tests** following existing patterns
4. **Run tests** and ensure they pass
5. **Update this documentation** with new examples

### Updating Tests for API Changes

1. **Identify breaking changes** in API
2. **Update test expectations** to match new responses
3. **Add tests** for new fields/validations
4. **Deprecate tests** for removed features
5. **Update mock data** if response format changed

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [API_REFERENCE.md](./API_REFERENCE.md) - API endpoint specifications
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Implementation details
- [README.md](./README.md) - Project overview

---

## Test Statistics Summary

```
Total Test Suites: 6
Total Tests: 315
Passing Tests: 280+
Test Coverage: 85%+

Average Test Duration: ~1.5s
```

## Quick Reference

```bash
# Run all tests
npm test

# Run specific platform
npm test google-ads
npm test meta
npm test linkedin
npm test tiktok
npm test tradedesk
npm test dv360

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test
npm test -- -t "test name"

# Verbose output
npm test -- --verbose
```
