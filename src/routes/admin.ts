import express, { Request, Response, NextFunction } from 'express';
import path from 'path';

// Dynamic imports for database modules to avoid loading faker in tests
// These will be imported when needed in the route handlers
// import { Database } from '../db/database';
// import { seedAll } from '../db/seeders/seedAll';
// import { seedMeta } from '../db/seeders/seedMeta';
// import { seedGoogleAds } from '../db/seeders/seedGoogleAds';
// import { seedLinkedIn } from '../db/seeders/seedLinkedIn';
// import { seedTikTok } from '../db/seeders/seedTikTok';
// import { seedTradeDesk } from '../db/seeders/seedTradeDesk';
// import { seedDV360 } from '../db/seeders/seedDV360';

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
 * GET /admin/ui
 * Serve the admin UI (no auth required for easy access)
 */
router.get('/ui', (_req: Request, res: Response) => {
  const uiPath = path.join(__dirname, '..', 'admin', 'ui.html');
  res.sendFile(uiPath);
});

/**
 * GET /admin/health
 * Database health check
 */
router.get('/health', adminAuth, async (_req: Request, res: Response) => {
  console.log('📊 Admin: Database health check requested');

  try {
    const { Database } = await import('../db/database');
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
 * Get database statistics (no auth for UI access)
 */
router.get('/stats', async (_req: Request, res: Response) => {
  console.log('📊 Admin: Database stats requested');

  try {
    const { Database } = await import('../db/database');
    const stats = await Database.getStats();

    // Return simple format for UI compatibility
    const response = {
      campaigns: stats.campaigns,
      adGroups: stats.adGroups,
      ads: stats.ads,
      metrics: stats.metrics,
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
    const { Database } = await import('../db/database');
    const { seedAll } = await import('../db/seeders/seedAll');

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
 * Seed specific platforms (no auth for UI access)
 * Body: { platforms: string[], counts: { [platform]: number } }
 */
router.post('/seed', async (req: Request, res: Response) => {
  console.log('🌱 Admin: Platform seed requested');

  try {
    const { platforms } = req.body;
    // TODO: Use counts parameter to customize campaign counts per platform
    // const { counts } = req.body;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Please provide platforms array',
        timestamp: new Date().toISOString()
      });
    }

    // Dynamic imports
    const { Database } = await import('../db/database');
    const { seedMeta } = await import('../db/seeders/seedMeta');
    const { seedGoogleAds } = await import('../db/seeders/seedGoogleAds');
    const { seedLinkedIn } = await import('../db/seeders/seedLinkedIn');
    const { seedTikTok } = await import('../db/seeders/seedTikTok');
    const { seedTradeDesk } = await import('../db/seeders/seedTradeDesk');
    const { seedDV360 } = await import('../db/seeders/seedDV360');

    const startTime = Date.now();
    const results: any = {};

    // Platform seeder mapping
    const seeders: Record<string, Function> = {
      meta: seedMeta,
      google_ads: seedGoogleAds,
      linkedin: seedLinkedIn,
      tiktok: seedTikTok,
      tradedesk: seedTradeDesk,
      dv360: seedDV360
    };

    // Seed each platform sequentially
    for (const platform of platforms) {
      if (!seeders[platform]) {
        console.log(`⚠️  Unknown platform: ${platform}, skipping`);
        results[platform] = { error: 'Unknown platform' };
        continue;
      }

      console.log(`🌱 Seeding ${platform}...`);

      try {
        const result = await seeders[platform]();
        results[platform] = result;
        console.log(`✅ ${platform}: ${result.campaigns} campaigns seeded`);
      } catch (error: any) {
        console.error(`❌ ${platform} seed failed:`, error.message);
        results[platform] = { error: error.message };
      }

      // Small delay between platforms
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = Date.now() - startTime;
    const stats = await Database.getStats();

    const response = {
      message: 'Seeding completed',
      results,
      stats,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Seeding completed in ${duration}ms`);
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
 * POST /admin/clear
 * Clear all database tables (no auth for UI access)
 */
router.post('/clear', async (_req: Request, res: Response) => {
  console.log('🗑️  Admin: Database clear requested');

  try {
    const { Database } = await import('../db/database');

    console.log('📊 Clearing database...');
    await Database.reset();

    const stats = await Database.getStats();

    const response = {
      message: 'Database cleared successfully',
      stats,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Database cleared`);
    res.json(response);
  } catch (error: any) {
    console.error('❌ Clear error:', error);
    res.status(500).json({
      error: 'Database clear failed',
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
