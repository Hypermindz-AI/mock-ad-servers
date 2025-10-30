import { Request, Response } from 'express';
import { authConfigs } from '../config/auth.config';

/**
 * The Trade Desk API v3 Token-Based Authentication
 * Unlike other platforms, TTD uses simple token-based auth (NOT OAuth)
 */

interface AuthenticationRequest {
  Login: string;
  Password: string;
}

interface AuthenticationResponse {
  Token: string;
  Expiration: string;
}

/**
 * POST /v3/authentication
 * Authenticates user and returns a long-lived token
 *
 * Request Body:
 * {
 *   "Login": "username",
 *   "Password": "password"
 * }
 *
 * Response 200:
 * {
 *   "Token": "long-lived-token",
 *   "Expiration": "2026-10-30T23:59:59Z"
 * }
 *
 * Error 401:
 * {
 *   "Message": "Invalid credentials"
 * }
 */
export const authenticate = (req: Request, res: Response): void => {
  const { Login, Password } = req.body as AuthenticationRequest;

  // Validate credentials against config
  const ttdConfig = authConfigs.tradedesk;
  const validUsername = ttdConfig.additionalConfig?.username;
  const validPassword = ttdConfig.additionalConfig?.password;

  if (!Login || !Password) {
    res.status(400).json({
      Message: 'Login and Password are required',
    });
    return;
  }

  if (Login !== validUsername || Password !== validPassword) {
    res.status(401).json({
      Message: 'Invalid credentials',
    });
    return;
  }

  // Generate expiration date (1 year from now for long-lived tokens)
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);

  const response: AuthenticationResponse = {
    Token: ttdConfig.validToken,
    Expiration: expirationDate.toISOString(),
  };

  res.status(200).json(response);
};

/**
 * Middleware to validate TTD-Auth header
 * TTD uses "TTD-Auth" header instead of "Authorization"
 */
export const validateTTDAuth = (req: Request, res: Response, next: Function): void => {
  const ttdAuthToken = req.headers['ttd-auth'] as string;

  if (!ttdAuthToken) {
    res.status(401).json({
      Message: 'TTD-Auth header is required',
    });
    return;
  }

  const validToken = authConfigs.tradedesk.validToken;

  if (ttdAuthToken !== validToken) {
    res.status(401).json({
      Message: 'Invalid or expired token',
    });
    return;
  }

  next();
};
