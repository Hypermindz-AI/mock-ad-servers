import { Router, Request, Response } from 'express';
import { authConfigs } from '../config/auth.config';

const router = Router();

/**
 * Meta OAuth 2.0 Authorization Endpoint
 * GET /v23.0/dialog/oauth
 *
 * Initiates the OAuth authorization flow
 * Query params: client_id, redirect_uri, scope, response_type=code
 */
router.get('/v23.0/dialog/oauth', (req: Request, res: Response): void => {
  const { client_id, redirect_uri, response_type } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !response_type) {
    return void res.status(400).json({
      error: {
        message: 'Missing required parameters: client_id, redirect_uri, response_type',
        type: 'OAuthException',
        code: 100,
      },
    });
  }

  // Validate response_type
  if (response_type !== 'code') {
    return void res.status(400).json({
      error: {
        message: 'Invalid response_type. Must be "code"',
        type: 'OAuthException',
        code: 100,
      },
    });
  }

  // Validate client_id
  if (client_id !== authConfigs.meta.clientId) {
    return void res.status(401).json({
      error: {
        message: 'Invalid client_id',
        type: 'OAuthException',
        code: 190,
      },
    });
  }

  // Generate mock authorization code
  const authCode = `mock_auth_code_${Date.now()}`;

  // In real OAuth flow, this would redirect to redirect_uri with code
  // For mock server, we return the code directly
  const redirectUrl = `${redirect_uri}?code=${authCode}`;

  res.json({
    authorization_code: authCode,
    redirect_url: redirectUrl,
    message: 'Authorization successful. Use the authorization_code to get access_token',
  });
});

/**
 * Meta OAuth 2.0 Token Endpoint
 * GET /v23.0/oauth/access_token
 *
 * Exchanges authorization code for access token OR generates app access token
 *
 * For authorization code flow:
 * Query params: client_id, client_secret, redirect_uri, code
 *
 * For client credentials flow:
 * Query params: client_id, client_secret, grant_type=client_credentials
 */
router.get('/v23.0/oauth/access_token', (req: Request, res: Response): void => {
  const { client_id, client_secret, redirect_uri, code, grant_type } = req.query;

  // Validate required parameters
  if (!client_id || !client_secret) {
    return void res.status(400).json({
      error: {
        message: 'Missing required parameters: client_id, client_secret',
        type: 'OAuthException',
        code: 100,
      },
    });
  }

  // Validate client credentials
  if (
    client_id !== authConfigs.meta.clientId ||
    client_secret !== authConfigs.meta.clientSecret
  ) {
    return void res.status(401).json({
      error: {
        message: 'Invalid client_id or client_secret',
        type: 'OAuthException',
        code: 190,
      },
    });
  }

  // Handle client credentials flow (app access token)
  if (grant_type === 'client_credentials') {
    return void res.json({
      access_token: authConfigs.meta.validToken,
      token_type: 'bearer',
    });
  }

  // Handle authorization code flow
  if (!code || !redirect_uri) {
    return void res.status(400).json({
      error: {
        message: 'Missing required parameters: code, redirect_uri (or grant_type=client_credentials)',
        type: 'OAuthException',
        code: 100,
      },
    });
  }

  // Validate authorization code format
  if (!code.toString().startsWith('mock_auth_code_')) {
    return void res.status(400).json({
      error: {
        message: 'Invalid authorization code',
        type: 'OAuthException',
        code: 100,
      },
    });
  }

  // Generate access token
  res.json({
    access_token: authConfigs.meta.validToken,
    token_type: 'bearer',
    expires_in: 5184000, // 60 days in seconds (Meta's default)
  });
});

export default router;
