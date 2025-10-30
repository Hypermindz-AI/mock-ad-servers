import { Request, Response, NextFunction } from 'express';
import { serverConfig } from '../config/auth.config.js';

/**
 * Custom request logging middleware
 * Logs incoming requests with timestamp, method, path, and response time
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!serverConfig.enableRequestLogging) {
    return next();
  }

  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.path}`);

  // Log request headers (excluding sensitive data)
  const headers = { ...req.headers };
  if (headers.authorization) {
    headers.authorization = 'Bearer ***';
  }
  if (headers['ttd-auth']) {
    headers['ttd-auth'] = '***';
  }
  console.log('Headers:', JSON.stringify(headers, null, 2));

  // Log request body (excluding sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const body = { ...req.body };
    if (body.client_secret) body.client_secret = '***';
    if (body.Password) body.Password = '***';
    if (body.access_token) body.access_token = '***';
    console.log('Body:', JSON.stringify(body, null, 2));
  }

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(
      `[${timestamp}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms\n`
    );
  });

  next();
};

/**
 * Rate limiting simulation middleware
 * Simulates API rate limiting by randomly returning 429 errors
 */
export const rateLimitSimulator = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!serverConfig.simulateRateLimiting) {
    return next();
  }

  // 10% chance of hitting rate limit
  const shouldRateLimit = Math.random() < 0.1;

  if (shouldRateLimit) {
    res.status(429).json({
      error: {
        message: 'Too many requests. Please try again later.',
        code: 429,
        status: 'RATE_LIMIT_EXCEEDED',
      },
      'Retry-After': 60, // Retry after 60 seconds
    });
    return;
  }

  next();
};
