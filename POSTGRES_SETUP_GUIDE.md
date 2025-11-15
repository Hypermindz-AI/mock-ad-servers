# Postgres Setup Guide for Mock Ad Servers

## Quick Start: Enable Postgres Database

Follow these steps to enable persistent database storage with Vercel Postgres.

---

## Option 1: Vercel Postgres (Recommended - 5 minutes)

### Step 1: Add Postgres to Your Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **mock-ad-servers**
3. Click on the **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a database name (e.g., `mock-ads-db`)
7. Select a region (choose closest to your users)
8. Click **Create**

### Step 2: Connect Database to Project

Vercel will automatically:
- Create the database
- Generate connection strings
- Add environment variables to your project

The following variables are auto-configured:
```
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
```

### Step 3: Deploy (Automatic Database Setup)

```bash
# Commit any pending changes
git add -A
git commit -m "docs: add postgres setup guide"
git push
```

Vercel will:
1. Deploy your code
2. Connect to the database
3. Initialize the schema (4 tables, 13 indexes)
4. Seed 130 campaigns with full data hierarchy
5. Make everything available at your production URL

### Step 4: Verify Database is Working

After deployment completes (~2 minutes), test the admin endpoints:

```bash
# Check database health
curl -H "X-Admin-API-Key: mock_admin_key_12345" \
  https://mock-ad-servers.vercel.app/admin/health

# Expected response:
{
  "healthy": true,
  "message": "Database is connected and healthy",
  "stats": {
    "campaigns": 130,
    "adGroups": 390,
    "ads": 1365,
    "metrics": 7930
  },
  "uptime": "0h 0m 15s",
  "timestamp": "2025-11-05T..."
}

# Get detailed stats
curl -H "X-Admin-API-Key: mock_admin_key_12345" \
  https://mock-ad-servers.vercel.app/admin/stats
```

### Step 5: Test Campaign Endpoints

```bash
# List Meta campaigns (should show seeded data)
curl https://mock-ad-servers.vercel.app/meta/v23.0/act_123456789/campaigns \
  -H "Authorization: Bearer mock_meta_access_token_abcdef"

# Should return 20+ campaigns with realistic data
```

---

## Option 2: Local Testing with Postgres (Optional)

If you want to test the database features locally before deploying:

### Step 1: Install PostgreSQL Locally

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Or use Docker:**
```bash
docker run --name mock-ads-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mock_ads \
  -p 5432:5432 \
  -d postgres:15
```

### Step 2: Create Local .env File

```bash
# Copy the example
cp .env.example .env

# Edit .env and add your local database URL
# For Homebrew install:
POSTGRES_URL=postgresql://localhost:5432/mock_ads

# For Docker:
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/mock_ads
```

### Step 3: Start Local Server

```bash
npm run dev
```

You should see:
```
📊 Initializing database schema...
✅ Database schema initialized
🌱 Starting database seeding...
✅ Seeded 25 Meta campaigns
✅ Seeded 25 Google Ads campaigns
✅ Seeded 20 LinkedIn campaigns
✅ Seeded 20 TikTok campaigns
✅ Seeded 20 Trade Desk campaigns
✅ Seeded 20 DV360 campaigns
✅ Seeding complete!
   📊 Total: 130 campaigns, 390 ad groups, 1365 ads
   📈 7930 performance data points
✅ Database ready
🚀 Server running on http://localhost:3000
```

### Step 4: Test Locally

```bash
# Check health
curl -H "X-Admin-API-Key: mock_admin_key_12345" \
  http://localhost:3000/admin/health

# List campaigns
curl http://localhost:3000/meta/v23.0/act_123456789/campaigns \
  -H "Authorization: Bearer mock_meta_access_token_abcdef"
```

---

## Option 3: Other Postgres Providers

You can also use any PostgreSQL provider:

### Supported Providers:
- **Supabase** - Free tier with 500MB
- **Railway** - $5/month
- **Neon** - Serverless Postgres
- **AWS RDS** - Production grade
- **Heroku Postgres** - Simple setup

### Setup Steps:
1. Create a Postgres database with your provider
2. Get the connection string (format: `postgresql://user:pass@host:5432/dbname`)
3. In Vercel dashboard:
   - Go to Settings → Environment Variables
   - Add `POSTGRES_URL` with your connection string
   - Apply to Production, Preview, and Development
4. Redeploy your application

---

## What Happens on First Startup?

When the app starts with `POSTGRES_URL` configured:

1. **Schema Initialization** (runs once)
   - Checks if `campaigns` table exists
   - If not, creates all 4 tables and 13 indexes
   - Takes ~2 seconds

2. **Data Seeding** (runs once)
   - Checks if database is empty
   - If empty, seeds all 6 platforms in parallel
   - Takes ~5-10 seconds
   - Creates 130 campaigns, 390 ad groups, 1,365 ads, 7,930 metrics

3. **Ready to Serve**
   - All API endpoints work with persistent data
   - Admin endpoints available at `/admin/*`
   - Data persists between deployments

---

## Database Management

### Admin Endpoints (Require Authentication)

**Authentication Options:**
```bash
# Option 1: API Key
-H "X-Admin-API-Key: mock_admin_key_12345"

# Option 2: Basic Auth
-u admin:admin123
```

**Available Endpoints:**

```bash
# Check database health
GET /admin/health

# Get database statistics
GET /admin/stats

# Seed database (if empty)
POST /admin/seed

# Reset database and reseed (DESTRUCTIVE)
POST /admin/reset
```

### Resetting the Database

If you want to reset the database to fresh seed data:

```bash
curl -X POST \
  -H "X-Admin-API-Key: mock_admin_key_12345" \
  https://mock-ad-servers.vercel.app/admin/reset

# Response:
{
  "message": "Database reset and reseeded successfully",
  "duration": "8.5s",
  "stats": {
    "campaigns": 130,
    "adGroups": 390,
    "ads": 1365,
    "metrics": 7930
  }
}
```

---

## Troubleshooting

### Issue: "No POSTGRES_URL configured"

**Solution:**
- Check that POSTGRES_URL environment variable is set in Vercel
- Redeploy after adding the variable

### Issue: Schema initialization fails

**Check Vercel function logs:**
```bash
vercel logs mock-ad-servers --follow
```

**Common causes:**
- Database connection timeout (increase timeout in Vercel settings)
- Invalid connection string format
- Database not accessible from Vercel region

### Issue: Seeding is slow or times out

**Solution:**
- Seeding runs once on first cold start
- Subsequent requests use existing data
- You can disable auto-seeding by setting `DISABLE_AUTO_SEED=true`

### Issue: Want to skip seeding in development

**Create `.env.local`:**
```bash
# Skip auto-seeding (use admin endpoints instead)
DISABLE_AUTO_SEED=true
```

Then manually seed when ready:
```bash
curl -X POST -H "X-Admin-API-Key: mock_admin_key_12345" \
  http://localhost:3000/admin/seed
```

---

## Environment Variables Reference

### Required (for Postgres features)
```bash
POSTGRES_URL=postgresql://...
```

### Optional (auto-configured by Vercel)
```bash
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
```

### Admin API (already configured)
```bash
ADMIN_API_KEY=mock_admin_key_12345
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Feature Flags (optional)
```bash
DISABLE_AUTO_SEED=false          # Set to true to skip auto-seeding
DATABASE_RESET_ON_START=false    # Set to true to reset DB on every start (dev only)
SEED_CAMPAIGNS_COUNT=25          # Campaigns per platform (default: 25)
SEED_METRICS_DAYS=60            # Days of historical data (default: 60)
```

---

## Database Schema Overview

### Tables Created

1. **campaigns** (130 rows)
   - id, platform, account_id, name, objective, status
   - daily_budget, lifetime_budget, start_date, end_date
   - platform_specific_data (JSONB)

2. **ad_groups** (~390 rows)
   - id, platform, campaign_id, name, status
   - optimization_goal, bid_amount, targeting (JSONB)
   - platform_specific_data (JSONB)

3. **ads** (~1,365 rows)
   - id, platform, campaign_id, ad_group_id, name, status
   - creative_data (JSONB), platform_specific_data (JSONB)

4. **performance_metrics** (~7,930 rows)
   - platform, entity_type, entity_id, date
   - impressions, clicks, spend, conversions
   - ctr, cpc, cpm

### Indexes for Performance
- campaigns: platform, account_id, status, created_at
- ad_groups: campaign_id, platform
- ads: campaign_id, ad_group_id, platform
- metrics: entity_type + entity_id + date, platform

---

## Next Steps After Setup

Once Postgres is configured:

1. ✅ All existing API endpoints work as before
2. ✅ Data persists between deployments
3. ✅ 150+ realistic campaigns ready for testing
4. ✅ 60+ days of historical performance data
5. ✅ Admin endpoints for database management

**No code changes required!** The app works with or without Postgres.

---

## Support

For issues or questions:
- Check [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for feature status
- Review [IMPLEMENTATION_PLAN_DYNAMIC_CAMPAIGNS.md](./IMPLEMENTATION_PLAN_DYNAMIC_CAMPAIGNS.md) for architecture
- Check Vercel function logs for errors

---

**Ready to enable Postgres?** Follow Option 1 above (takes 5 minutes)! 🚀
