import { Router, Request, Response, NextFunction } from 'express';
import { authConfigs } from '../../config/auth.config';
import {
  createCampaign,
  getCampaign,
  updateCampaign,
  listCampaigns,
  getCampaignInsights,
  listAdSets,
  createAdSet,
  getAdSet,
  updateAdSet,
  listAds,
  createAd,
  getAd,
  updateAd,
} from './controllers';
import { generateFbTraceId } from './mockData';

const router = Router();

/**
 * Meta Authentication Middleware
 * Validates Bearer token in Authorization header or access_token query parameter
 */
const validateMetaAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader) {
    // Validate Bearer token format
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return void res.status(401).json({
        error: {
          message: 'Invalid Authorization header format. Expected: Bearer {token}',
          type: 'OAuthException',
          code: 190,
          fbtrace_id: generateFbTraceId(),
        },
      });
    }

    const [scheme, credentials] = parts;

    if (scheme !== 'Bearer') {
      return void res.status(401).json({
        error: {
          message: 'Invalid Authorization header scheme. Expected: Bearer',
          type: 'OAuthException',
          code: 190,
          fbtrace_id: generateFbTraceId(),
        },
      });
    }

    token = credentials;
  } else {
    // Check for access_token query parameter
    token = req.query.access_token as string;
  }

  // Validate token presence
  if (!token) {
    return void res.status(401).json({
      error: {
        message: 'Missing access token. Provide via Authorization header or access_token query parameter',
        type: 'OAuthException',
        code: 190,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Validate token value
  if (token !== authConfigs.meta.validToken) {
    return void res.status(401).json({
      error: {
        message: 'Invalid OAuth access token',
        type: 'OAuthException',
        code: 190,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }

  // Token is valid, proceed
  next();
};

/**
 * Meta Campaign Routes
 * All routes require authentication
 */

/**
 * GET /v23.0/act_{ad_account_id}/campaigns
 * List campaigns
 */
router.get('/v23.0/act_:adAccountId/campaigns', validateMetaAuth, listCampaigns);

/**
 * POST /v23.0/act_{ad_account_id}/campaigns
 * Create a new campaign
 */
router.post('/v23.0/act_:adAccountId/campaigns', validateMetaAuth, createCampaign);

/**
 * GET /v23.0/{campaign_id}/insights
 * Get campaign insights
 */
router.get('/v23.0/:campaignId/insights', validateMetaAuth, getCampaignInsights);

/**
 * Meta Ad Set Routes
 */

/**
 * GET /v23.0/act_{ad_account_id}/adsets
 * List ad sets
 */
router.get('/v23.0/act_:adAccountId/adsets', validateMetaAuth, listAdSets);

/**
 * POST /v23.0/act_{ad_account_id}/adsets
 * Create a new ad set
 */
router.post('/v23.0/act_:adAccountId/adsets', validateMetaAuth, createAdSet);

/**
 * Meta Ads Routes
 */

/**
 * GET /v23.0/act_{ad_account_id}/ads
 * List ads
 */
router.get('/v23.0/act_:adAccountId/ads', validateMetaAuth, listAds);

/**
 * POST /v23.0/act_{ad_account_id}/ads
 * Create a new ad
 */
router.post('/v23.0/act_:adAccountId/ads', validateMetaAuth, createAd);

/**
 * Generic Resource Routes (must be last to avoid conflicts)
 */

/**
 * GET /v23.0/{id}
 * Get campaign, ad set, or ad details by ID
 * Routes are checked in order: insights first, then generic GET
 */
router.get('/v23.0/:resourceId', validateMetaAuth, (req: Request, res: Response) => {
  const { resourceId } = req.params;

  // Try to identify resource type by ID prefix
  if (resourceId.startsWith('120210')) {
    // Campaign ID
    req.params.campaignId = resourceId;
    return getCampaign(req, res);
  } else if (resourceId.startsWith('230110')) {
    // Ad Set ID
    req.params.adSetId = resourceId;
    return getAdSet(req, res);
  } else if (resourceId.startsWith('230210')) {
    // Ad ID
    req.params.adId = resourceId;
    return getAd(req, res);
  } else {
    // Try each storage in order
    req.params.campaignId = resourceId;
    const campaign = require('./mockData').campaignStorage.get(resourceId);
    if (campaign) {
      return getCampaign(req, res);
    }

    req.params.adSetId = resourceId;
    const adSet = require('./mockData').adSetStorage.get(resourceId);
    if (adSet) {
      return getAdSet(req, res);
    }

    req.params.adId = resourceId;
    const ad = require('./mockData').adStorage.get(resourceId);
    if (ad) {
      return getAd(req, res);
    }

    // Not found
    return res.status(404).json({
      error: {
        message: `Resource with ID ${resourceId} not found`,
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }
});

/**
 * POST /v23.0/{id}
 * Update campaign, ad set, or ad
 */
router.post('/v23.0/:resourceId', validateMetaAuth, (req: Request, res: Response) => {
  const { resourceId } = req.params;

  // Try to identify resource type by ID prefix
  if (resourceId.startsWith('120210')) {
    // Campaign ID
    req.params.campaignId = resourceId;
    return updateCampaign(req, res);
  } else if (resourceId.startsWith('230110')) {
    // Ad Set ID
    req.params.adSetId = resourceId;
    return updateAdSet(req, res);
  } else if (resourceId.startsWith('230210')) {
    // Ad ID
    req.params.adId = resourceId;
    return updateAd(req, res);
  } else {
    // Try each storage in order
    req.params.campaignId = resourceId;
    const campaign = require('./mockData').campaignStorage.get(resourceId);
    if (campaign) {
      return updateCampaign(req, res);
    }

    req.params.adSetId = resourceId;
    const adSet = require('./mockData').adSetStorage.get(resourceId);
    if (adSet) {
      return updateAdSet(req, res);
    }

    req.params.adId = resourceId;
    const ad = require('./mockData').adStorage.get(resourceId);
    if (ad) {
      return updateAd(req, res);
    }

    // Not found
    return res.status(404).json({
      error: {
        message: `Resource with ID ${resourceId} not found`,
        type: 'OAuthException',
        code: 100,
        fbtrace_id: generateFbTraceId(),
      },
    });
  }
});

export default router;
