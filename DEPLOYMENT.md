# Deployment Guide - Vercel

This guide walks you through deploying the Mock Ad Servers to Vercel.

## Prerequisites

- Node.js 18+ installed
- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed

## Quick Deploy

### Option 1: Deploy with Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy to Vercel**:
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account/organization (Hypermindz-AI)
- Link to existing project? **No**
- What's your project's name? **mock-ad-servers**
- In which directory is your code located? **./** (press Enter)
- Want to override the settings? **No**

4. **Deploy to Production**:
```bash
vercel --prod
```

### Option 2: Deploy via GitHub Integration

1. Go to https://vercel.com/new
2. Import your GitHub repository: `Hypermindz-AI/mock-ad-servers`
3. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `npm run build` (optional)
   - **Output Directory**: Leave empty
4. Add environment variables (see below)
5. Click **Deploy**

---

## Environment Variables

Configure these in Vercel Dashboard (Settings → Environment Variables):

### Required Variables

```bash
NODE_ENV=production

# Google Ads / DV360
GOOGLE_VALID_TOKEN=your_mock_google_token
GOOGLE_CLIENT_ID=your_mock_google_client_id
GOOGLE_CLIENT_SECRET=your_mock_google_client_secret
GOOGLE_DEV_TOKEN=your_mock_google_dev_token

# Meta
META_VALID_TOKEN=your_mock_meta_token
META_APP_ID=your_mock_meta_app_id
META_APP_SECRET=your_mock_meta_app_secret

# LinkedIn
LINKEDIN_VALID_TOKEN=your_mock_linkedin_token
LINKEDIN_CLIENT_ID=your_mock_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_mock_linkedin_client_secret

# TikTok
TIKTOK_VALID_TOKEN=your_mock_tiktok_token
TIKTOK_CLIENT_KEY=your_mock_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_mock_tiktok_client_secret

# The Trade Desk
TTD_VALID_TOKEN=your_mock_ttd_token
TTD_USERNAME=your_mock_ttd_username
TTD_PASSWORD=your_mock_ttd_password

# DV360
DV360_VALID_TOKEN=your_mock_dv360_token

# Optional
ENABLE_REQUEST_LOGGING=true
SIMULATE_RATE_LIMITING=false
```

### Setting Environment Variables via CLI

```bash
vercel env add GOOGLE_VALID_TOKEN production
vercel env add META_VALID_TOKEN production
vercel env add LINKEDIN_VALID_TOKEN production
# ... continue for all variables
```

Or use the `.env` file content:
```bash
cat .env.example | while read line; do
  if [[ $line != \#* ]] && [[ ! -z "$line" ]]; then
    key=$(echo $line | cut -d '=' -f 1)
    vercel env add $key production
  fi
done
```

---

## Vercel Configuration

The project includes `vercel.json` with the following configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Key Configuration Details:

- **Serverless Function**: The app runs as a Vercel serverless function
- **Entry Point**: `api/index.ts` exports the Express app
- **Routing**: All routes (`/(.*)`) are handled by the main function
- **Environment**: Runs in production mode

---

## Deployment Architecture

```
┌─────────────────────────────────────┐
│     Vercel Edge Network (CDN)       │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│   Vercel Serverless Function        │
│   (api/index.ts)                    │
│                                     │
│   ┌───────────────────────────┐   │
│   │   Express App             │   │
│   │   (src/index.ts)          │   │
│   │                           │   │
│   │   - OAuth Routes          │   │
│   │   - Platform Routes       │   │
│   │   - Middleware            │   │
│   └───────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Post-Deployment

### 1. Verify Deployment

Once deployed, Vercel will provide a URL like:
```
https://mock-ad-servers.vercel.app
```

Test the deployment:

```bash
# Health check
curl https://mock-ad-servers.vercel.app/health

# API info
curl https://mock-ad-servers.vercel.app/

# Test OAuth endpoint
curl "https://mock-ad-servers.vercel.app/oauth/authorize?client_id=mock_google_client_id&redirect_uri=http://localhost/callback&response_type=code&scope=https://www.googleapis.com/auth/adwords"
```

### 2. Custom Domain (Optional)

Add a custom domain in Vercel Dashboard:
1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Configure DNS records as instructed
4. SSL certificate is automatically provisioned

### 3. Monitor Deployment

Access Vercel Dashboard to monitor:
- **Functions**: View function invocations and logs
- **Analytics**: Track usage and performance
- **Logs**: Real-time function logs
- **Deployments**: View deployment history

---

## API Endpoints (Deployed)

Replace `localhost:3000` with your Vercel URL in all API requests:

### Example: Google Ads Campaign Creation

```bash
curl -X POST https://mock-ad-servers.vercel.app/googleads/v21/customers/123/campaigns:mutate \
  -H "Authorization: Bearer mock_google_access_token_12345" \
  -H "developer-token: mock_google_dev_token_67890" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [{
      "create": {
        "name": "Test Campaign",
        "status": "ENABLED",
        "advertisingChannelType": "SEARCH",
        "budget": "customers/123/campaignBudgets/456"
      }
    }]
  }'
```

### Example: Meta Campaign Creation

```bash
curl -X POST https://mock-ad-servers.vercel.app/v23.0/act_123456/campaigns \
  -H "Authorization: Bearer mock_meta_access_token_abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "objective": "OUTCOME_TRAFFIC",
    "status": "ACTIVE",
    "daily_budget": 5000
  }'
```

---

## Troubleshooting

### Function Timeout

Vercel serverless functions have a 10-second timeout on Hobby plan, 60 seconds on Pro.

If you encounter timeouts:
1. Upgrade to Pro plan
2. Optimize slow operations
3. Use edge functions for faster response times

### Environment Variables Not Working

1. Verify variables are set in Vercel Dashboard
2. Redeploy after adding/updating variables:
   ```bash
   vercel --prod
   ```

### Build Errors

Check build logs in Vercel Dashboard:
```bash
vercel logs <deployment-url>
```

Common issues:
- Missing dependencies: Run `npm install` locally
- TypeScript errors: Run `npm run build` locally
- Module resolution: Check import paths use `.js` extensions

### Cold Starts

First request after inactivity may be slow (cold start).
Solutions:
- Use Vercel's Edge Functions
- Implement warming function
- Upgrade to Pro plan for better performance

---

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### Disable Auto-Deploy (Optional)

In Vercel Dashboard → **Settings** → **Git**:
- Uncheck "Automatically deploy"
- Deploy manually with `vercel --prod`

---

## Cost Considerations

### Hobby Plan (Free)
- ✅ Suitable for development/testing
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth
- ⚠️ 10-second function timeout
- ⚠️ No team features

### Pro Plan ($20/month)
- ✅ 60-second function timeout
- ✅ Advanced analytics
- ✅ Team collaboration
- ✅ Password protection
- ✅ Priority support

---

## Security Considerations

### API Security

The mock server uses hardcoded tokens for testing. For production use:

1. **Use Real OAuth**: Implement actual OAuth provider integration
2. **Secure Tokens**: Store tokens securely (e.g., Vercel KV, Redis)
3. **Rate Limiting**: Enable actual rate limiting
4. **CORS**: Configure CORS for specific domains
5. **Environment Isolation**: Use separate deployments for staging/production

### Vercel Security Features

- ✅ Automatic HTTPS/SSL
- ✅ DDoS protection
- ✅ Edge network security
- ✅ Environment variable encryption
- ✅ Secret scanning

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [API Reference](./API_REFERENCE.md)
- [Testing Guide](./TESTING.md)

---

## Quick Commands Reference

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm <deployment-url>

# View environment variables
vercel env ls

# Pull environment variables
vercel env pull

# Link local project to Vercel
vercel link
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/Hypermindz-AI/mock-ad-servers/issues
- Vercel Support: https://vercel.com/support
- Documentation: See README.md, API_REFERENCE.md, TESTING.md
