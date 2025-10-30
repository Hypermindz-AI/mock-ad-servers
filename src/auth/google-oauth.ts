import { Request, Response, Router } from 'express';
import { authConfigs } from '../config/auth.config.js';

const router = Router();

// In-memory storage for auth codes and refresh tokens
const authorizationCodes = new Map<string, { clientId: string; redirectUri: string; expiresAt: number }>();
const refreshTokens = new Map<string, { clientId: string; issuedAt: number }>();

/**
 * OAuth 2.0 Authorization Endpoint
 * GET /oauth/authorize
 * Returns authorization code for Google Ads/DV360
 */
router.get('/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type, scope } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || response_type !== 'code') {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing or invalid required parameters',
    });
  }

  // Validate client_id
  if (client_id !== authConfigs.google.clientId) {
    return res.status(400).json({
      error: 'invalid_client',
      error_description: 'Invalid client_id',
    });
  }

  // Validate scope for Google Ads
  const requiredScope = 'https://www.googleapis.com/auth/adwords';
  if (scope && typeof scope === 'string' && !scope.includes(requiredScope)) {
    return res.status(400).json({
      error: 'invalid_scope',
      error_description: `Required scope: ${requiredScope}`,
    });
  }

  // Generate authorization code
  const authCode = `AUTH_CODE_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Store auth code with expiration (5 minutes)
  authorizationCodes.set(authCode, {
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  // Return authorization code
  res.status(200).json({
    code: authCode,
    state: req.query.state || '',
  });
});

/**
 * OAuth 2.0 Token Endpoint
 * POST /oauth/token
 * Exchanges authorization code for access/refresh tokens or refreshes access token
 */
router.post('/token', (req: Request, res: Response) => {
  const { client_id, client_secret, code, grant_type, redirect_uri, refresh_token } = req.body;

  // Validate client credentials
  if (!client_id || !client_secret) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing client credentials',
    });
  }

  if (client_id !== authConfigs.google.clientId || client_secret !== authConfigs.google.clientSecret) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Invalid client credentials',
    });
  }

  // Handle authorization_code grant type
  if (grant_type === 'authorization_code') {
    if (!code || !redirect_uri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing code or redirect_uri',
      });
    }

    // Validate authorization code
    const authData = authorizationCodes.get(code);
    if (!authData) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid or expired authorization code',
      });
    }

    // Check if code is expired
    if (Date.now() > authData.expiresAt) {
      authorizationCodes.delete(code);
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Authorization code expired',
      });
    }

    // Validate redirect_uri matches
    if (authData.redirectUri !== redirect_uri) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'redirect_uri mismatch',
      });
    }

    // Generate tokens
    const accessToken = authConfigs.google.validToken;
    const newRefreshToken = `REFRESH_TOKEN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store refresh token
    refreshTokens.set(newRefreshToken, {
      clientId: client_id,
      issuedAt: Date.now(),
    });

    // Delete used authorization code
    authorizationCodes.delete(code);

    return res.status(200).json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/adwords',
    });
  }

  // Handle refresh_token grant type
  if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing refresh_token',
      });
    }

    // Validate refresh token
    const refreshData = refreshTokens.get(refresh_token);
    if (!refreshData) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid refresh token',
      });
    }

    // Validate client_id matches
    if (refreshData.clientId !== client_id) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Client mismatch',
      });
    }

    // Generate new access token
    const accessToken = authConfigs.google.validToken;

    return res.status(200).json({
      access_token: accessToken,
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/adwords',
    });
  }

  // Invalid grant type
  return res.status(400).json({
    error: 'unsupported_grant_type',
    error_description: 'Only authorization_code and refresh_token grant types are supported',
  });
});

export default router;
