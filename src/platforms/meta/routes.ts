import { Router, Request, Response, NextFunction } from 'express';
import { authConfigs } from '../../config/auth.config';
import { createCampaign, getCampaign, updateCampaign } from './controllers';
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
 * POST /v23.0/act_{ad_account_id}/campaigns
 * Create a new campaign
 */
router.post('/v23.0/act_:adAccountId/campaigns', validateMetaAuth, createCampaign);

/**
 * GET /v23.0/{campaign_id}
 * Get campaign details
 */
router.get('/v23.0/:campaignId', validateMetaAuth, getCampaign);

/**
 * POST /v23.0/{campaign_id}
 * Update campaign
 */
router.post('/v23.0/:campaignId', validateMetaAuth, updateCampaign);

export default router;
