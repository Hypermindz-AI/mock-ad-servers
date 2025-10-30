import { Request, Response, Router } from 'express';
import { authConfigs } from '../config/auth.config';

const router = Router();

/**
 * TikTok OAuth 2.0 v2 Authorization Endpoint
 * GET /oauth/authorize
 *
 * Query params:
 * - client_key: Application client key
 * - response_type: Must be "code"
 * - scope: Requested permissions (e.g., ad_management, campaign.create)
 * - redirect_uri: URL to redirect after authorization
 * - state: Optional CSRF protection token
 */
router.get('/oauth/authorize', (req: Request, res: Response, next) => {
  const { client_key, response_type, scope, redirect_uri, state } = req.query;

  // If client_key is not present, this is not a TikTok OAuth request, pass to next handler
  if (!client_key) {
    return next();
  }

  // Validate required parameters
  if (!response_type || !scope || !redirect_uri) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing required parameters: client_key, response_type, scope, or redirect_uri'
    });
  }

  // Validate response_type
  if (response_type !== 'code') {
    return res.status(400).json({
      error: 'unsupported_response_type',
      error_description: 'response_type must be "code"'
    });
  }

  // Validate client_key
  if (client_key !== authConfigs.tiktok.clientId) {
    return res.status(400).json({
      error: 'invalid_client',
      error_description: 'Invalid client_key'
    });
  }

  // Generate mock authorization code
  const authCode = `tiktok_auth_code_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Build redirect URL with authorization code
  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  // Redirect to the redirect_uri with the authorization code
  res.redirect(redirectUrl.toString());
});

/**
 * TikTok OAuth 2.0 v2 Token Endpoint
 * POST /v2/oauth/token/
 *
 * Supports two grant types:
 * 1. authorization_code - Exchange auth code for access token
 * 2. refresh_token - Refresh an expired access token
 *
 * Content-Type: application/x-www-form-urlencoded
 */
router.post('/v2/oauth/token/', (req: Request, res: Response) => {
  const { client_key, client_secret, grant_type, code, refresh_token, redirect_uri } = req.body;

  // Validate required parameters
  if (!client_key || !client_secret || !grant_type) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing required parameters: client_key, client_secret, or grant_type'
    });
  }

  // Validate client credentials
  if (client_key !== authConfigs.tiktok.clientId || client_secret !== authConfigs.tiktok.clientSecret) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Invalid client credentials'
    });
  }

  // Handle authorization_code grant type
  if (grant_type === 'authorization_code') {
    if (!code || !redirect_uri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters: code or redirect_uri'
      });
    }

    // Validate authorization code format (simple mock validation)
    if (!code.toString().startsWith('tiktok_auth_code_')) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid authorization code'
      });
    }

    // Return access token and refresh token
    return res.status(200).json({
      access_token: authConfigs.tiktok.validToken,
      refresh_token: `tiktok_refresh_token_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      expires_in: 86400, // 24 hours
      refresh_expires_in: 31536000, // 365 days (1 year)
      open_id: `tiktok_open_id_${Math.random().toString(36).substring(7)}`,
      scope: 'ad_management,campaign.create,campaign.update',
      token_type: 'Bearer'
    });
  }

  // Handle refresh_token grant type
  if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameter: refresh_token'
      });
    }

    // Validate refresh token format (simple mock validation)
    if (!refresh_token.toString().startsWith('tiktok_refresh_token_')) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid refresh token'
      });
    }

    // Return new access token
    return res.status(200).json({
      access_token: authConfigs.tiktok.validToken,
      refresh_token: `tiktok_refresh_token_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      expires_in: 86400, // 24 hours
      refresh_expires_in: 31536000, // 365 days (1 year)
      open_id: `tiktok_open_id_${Math.random().toString(36).substring(7)}`,
      scope: 'ad_management,campaign.create,campaign.update',
      token_type: 'Bearer'
    });
  }

  // Unsupported grant type
  return res.status(400).json({
    error: 'unsupported_grant_type',
    error_description: `Grant type "${grant_type}" is not supported. Use "authorization_code" or "refresh_token".`
  });
});

export default router;
