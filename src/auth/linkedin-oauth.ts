import { Router, Request, Response } from 'express';
import { authConfigs } from '../config/auth.config';

const router = Router();

/**
 * LinkedIn 3-Legged OAuth 2.0 Authorization Endpoint
 * GET /oauth/v2/authorization
 *
 * Query parameters:
 * - response_type: code (required)
 * - client_id: LinkedIn client ID (required)
 * - redirect_uri: Callback URL (required)
 * - scope: r_ads,w_organization_social (required)
 */
router.get('/oauth/v2/authorization', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope } = req.query;

  // Validate required parameters
  if (!response_type || response_type !== 'code') {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'response_type must be "code"'
    });
  }

  if (!client_id) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'client_id is required'
    });
  }

  if (!redirect_uri) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'redirect_uri is required'
    });
  }

  if (!scope) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'scope is required'
    });
  }

  // Validate client_id
  if (client_id !== authConfigs.linkedin.clientId) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Invalid client_id'
    });
  }

  // Validate scope contains required permissions
  const scopeStr = scope as string;
  if (!scopeStr.includes('r_ads') && !scopeStr.includes('rw_ads')) {
    return res.status(400).json({
      error: 'invalid_scope',
      error_description: 'Scope must include r_ads or rw_ads'
    });
  }

  // Return authorization code
  return res.status(200).json({
    code: 'mock_linkedin_auth_code_123456',
    state: req.query.state || undefined
  });
});

/**
 * LinkedIn Token Exchange Endpoint
 * POST /oauth/v2/accessToken
 * Content-Type: application/x-www-form-urlencoded
 *
 * Body parameters:
 * - grant_type: authorization_code (required)
 * - code: Authorization code (required)
 * - client_id: LinkedIn client ID (required)
 * - client_secret: LinkedIn client secret (required)
 * - redirect_uri: Callback URL (required)
 */
router.post('/oauth/v2/accessToken', (req: Request, res: Response) => {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

  // Validate Content-Type
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/x-www-form-urlencoded')) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Content-Type must be application/x-www-form-urlencoded'
    });
  }

  // Validate required parameters
  if (!grant_type || grant_type !== 'authorization_code') {
    return res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: 'grant_type must be "authorization_code"'
    });
  }

  if (!code) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'code is required'
    });
  }

  if (!client_id) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'client_id is required'
    });
  }

  if (!client_secret) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'client_secret is required'
    });
  }

  if (!redirect_uri) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'redirect_uri is required'
    });
  }

  // Validate client credentials
  if (client_id !== authConfigs.linkedin.clientId) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Invalid client_id'
    });
  }

  if (client_secret !== authConfigs.linkedin.clientSecret) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Invalid client_secret'
    });
  }

  // Validate authorization code
  if (!code.startsWith('mock_linkedin_auth_code_')) {
    return res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Invalid authorization code'
    });
  }

  // Return access token
  return res.status(200).json({
    access_token: authConfigs.linkedin.validToken,
    expires_in: 5184000, // 60 days in seconds
    scope: 'r_ads,rw_ads,w_organization_social'
  });
});

export default router;
