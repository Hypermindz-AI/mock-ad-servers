import { Request, Response, NextFunction } from 'express';

/**
 * Global error response interface
 */
interface ErrorResponse {
  error: {
    message: string;
    code?: number;
    status?: string;
    type?: string;
  };
}

/**
 * Global error handling middleware
 * Catches any errors that occur in route handlers and formats them consistently
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', err);

  // Default error response
  const errorResponse: ErrorResponse = {
    error: {
      message: err.message || 'Internal server error',
      code: 500,
      status: 'INTERNAL_ERROR',
    },
  };

  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Send error response
  res.status(500).json(errorResponse);
};

/**
 * 404 Not Found handler for unmatched routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 404,
      status: 'NOT_FOUND',
    },
  });
};

/**
 * Async error wrapper to catch errors in async route handlers
 * Usage: router.get('/route', asyncErrorHandler(async (req, res) => { ... }))
 */
export const asyncErrorHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
