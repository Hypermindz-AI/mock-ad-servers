import express, { Request, Response, NextFunction } from 'express';
import { Database } from '../db/database';
import { seedAll } from '../db/seeders/seedAll';

const router = express.Router();

/**
 * Basic authentication middleware for admin endpoints
 * Uses API key from environment variable or basic auth
 */
const adminAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Check for API key in header
  const apiKey = req.headers['x-admin-api-key'] as string;
  const expectedApiKey = process.env.ADMIN_API_KEY || 'mock_admin_key_12345';

  if (apiKey && apiKey === expectedApiKey) {
    console.log('✅ Admin API key authenticated');
    return next();
  }

  // Check for Basic Auth
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === expectedUsername && password === expectedPassword) {
      console.log('✅ Admin basic auth authenticated');
      return next();
    }
  }

  // Authentication failed
  console.log('❌ Admin authentication failed');
  res.status(401).json({
    error: 'Unauthorized',
    message: 'Admin authentication required. Use X-Admin-API-Key header or Basic Auth.',
    timestamp: new Date().toISOString()
  });
};

/**
 * GET /admin/health
 * Database health check
 */
router.get('/health', adminAuth, async (_req: Request, res: Response) => {
  console.log('📊 Admin: Database health check requested');

  try {
    const healthy = await Database.healthCheck();
    const stats = await Database.getStats();

    const response = {
      healthy,
      database: {
        connected: healthy,
        stats
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    console.log(`✅ Database health: ${healthy ? 'OK' : 'FAILED'}`);
    res.json(response);
  } catch (error: any) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /admin/stats
 * Get database statistics
 */
router.get('/stats', adminAuth, async (_req: Request, res: Response) => {
  console.log('📊 Admin: Database stats requested');

  try {
    const stats = await Database.getStats();

    // Add additional platform breakdown if available
    const response = {
      overview: stats,
      platforms: {
        meta: 'Statistics per platform coming in Phase 2',
        google_ads: 'Statistics per platform coming in Phase 2',
        linkedin: 'Statistics per platform coming in Phase 2',
        tiktok: 'Statistics per platform coming in Phase 2',
        tradedesk: 'Statistics per platform coming in Phase 2',
        dv360: 'Statistics per platform coming in Phase 2'
      },
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Database stats: ${stats.campaigns} campaigns, ${stats.adGroups} ad groups, ${stats.ads} ads`);
    res.json(response);
  } catch (error: any) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve stats',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /admin/reset
 * Reset and reseed database
 */
router.post('/reset', adminAuth, async (_req: Request, res: Response) => {
  console.log('🗑️  Admin: Database reset and reseed requested');

  try {
    const startTime = Date.now();

    // Reset database
    console.log('📊 Resetting database...');
    await Database.reset();

    // Reseed database
    console.log('🌱 Reseeding database...');
    await seedAll();

    const duration = Date.now() - startTime;
    const stats = await Database.getStats();

    const response = {
      message: 'Database reset and reseeded successfully',
      stats,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Database reset complete in ${duration}ms`);
    console.log(`   📊 New stats: ${stats.campaigns} campaigns, ${stats.adGroups} ad groups, ${stats.ads} ads`);

    res.json(response);
  } catch (error: any) {
    console.error('❌ Reset error:', error);
    res.status(500).json({
      error: 'Database reset failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /admin/seed
 * Seed database if empty
 */
router.post('/seed', adminAuth, async (_req: Request, res: Response) => {
  console.log('🌱 Admin: Database seed requested');

  try {
    const isEmpty = await Database.isEmpty();

    if (!isEmpty) {
      const stats = await Database.getStats();
      console.log('ℹ️  Database already contains data, skipping seed');

      return res.json({
        message: 'Database already contains data, skipping seed',
        stats,
        timestamp: new Date().toISOString()
      });
    }

    const startTime = Date.now();

    // Seed database
    console.log('🌱 Seeding empty database...');
    await seedAll();

    const duration = Date.now() - startTime;
    const stats = await Database.getStats();

    const response = {
      message: 'Database seeded successfully',
      stats,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Database seeded in ${duration}ms`);
    console.log(`   📊 Stats: ${stats.campaigns} campaigns, ${stats.adGroups} ad groups, ${stats.ads} ads`);

    res.json(response);
  } catch (error: any) {
    console.error('❌ Seed error:', error);
    res.status(500).json({
      error: 'Database seeding failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /admin/info
 * Get admin endpoint information (no auth required)
 */
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    service: 'Mock Ad Servers - Admin API',
    version: '1.0.0',
    endpoints: [
      {
        method: 'GET',
        path: '/admin/health',
        description: 'Database health check',
        auth: 'Required'
      },
      {
        method: 'GET',
        path: '/admin/stats',
        description: 'Get database statistics',
        auth: 'Required'
      },
      {
        method: 'POST',
        path: '/admin/reset',
        description: 'Reset and reseed database',
        auth: 'Required'
      },
      {
        method: 'POST',
        path: '/admin/seed',
        description: 'Seed database if empty',
        auth: 'Required'
      }
    ],
    authentication: {
      methods: [
        'API Key: X-Admin-API-Key header',
        'Basic Auth: username and password'
      ],
      envVars: [
        'ADMIN_API_KEY (default: mock_admin_key_12345)',
        'ADMIN_USERNAME (default: admin)',
        'ADMIN_PASSWORD (default: admin123)'
      ]
    }
  });
});

export default router;
