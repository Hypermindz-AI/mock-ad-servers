import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import { serverConfig } from './config/auth.config.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger, rateLimitSimulator } from './middleware/logger.js';
import { swaggerOptions } from './config/swagger.js';

// Import OAuth/Auth routes
import googleOAuthRouter from './auth/google-oauth.js';
import metaOAuthRouter from './auth/meta-oauth.js';
import linkedInOAuthRouter from './auth/linkedin-oauth.js';
import tikTokOAuthRouter from './auth/tiktok-oauth.js';

// Import platform routes
import googleAdsRouter from './platforms/google-ads/routes.js';
import metaRouter from './platforms/meta/routes.js';
import linkedInRouter from './platforms/linkedin/routes.js';
import tikTokRouter from './platforms/tiktok/routes.js';
import tradeDeskRouter from './platforms/tradedesk/routes.js';
import dv360Router from './platforms/dv360/routes.js';

// Import admin routes
import adminRouter from './routes/admin.js';

// Import database utilities
import { Database } from './db/database.js';
import { seedAll } from './db/seeders/seedAll.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();

// ============================================
// Database Initialization (Async)
// ============================================

/**
 * Initialize database on cold start
 * Only runs if POSTGRES_URL is configured
 */
(async () => {
  try {
    // Check if Postgres is configured
    if (process.env.POSTGRES_URL) {
      console.log('🗄️  Initializing Vercel Postgres database...');

      await Database.initialize();

      // Check if database is empty and seed if needed
      const isEmpty = await Database.isEmpty();
      if (isEmpty) {
        console.log('📝 Database is empty, running initial seed...');
        await seedAll();
      }

      const stats = await Database.getStats();
      console.log('✅ Database ready');
      console.log(`   📊 ${stats.campaigns} campaigns, ${stats.adGroups} ad groups, ${stats.ads} ads`);
    } else {
      console.log('⚠️  POSTGRES_URL not configured, running in mock-only mode');
      console.log('   Database features will be unavailable');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('   Application will continue in mock-only mode');
  }
})();

// Security middleware
// Configure helmet to allow Swagger UI to load from CDN
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors());

// Request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (serverConfig.nodeEnv === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Rate limiting simulation (optional)
if (serverConfig.simulateRateLimiting) {
  app.use(rateLimitSimulator);
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: serverConfig.nodeEnv,
  });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Mock Ad Servers API',
    version: '1.0.0',
    platforms: [
      { name: 'Google Ads', version: 'v21', baseUrl: '/googleads/v21' },
      { name: 'Meta Marketing', version: 'v23.0', baseUrl: '/meta/v23.0' },
      { name: 'LinkedIn Marketing', version: '202510', baseUrl: '/linkedin/rest' },
      { name: 'TikTok Marketing', version: 'v1.3', baseUrl: '/tiktok/v1.3' },
      { name: 'The Trade Desk', version: 'v3', baseUrl: '/ttd/v3' },
      { name: 'DV360', version: 'v4', baseUrl: '/dv360/v4' },
    ],
    oauth: [
      { platform: 'Google (Ads & DV360)', baseUrl: '/google/oauth' },
      { platform: 'Meta', baseUrl: '/meta/v23.0/dialog/oauth' },
      { platform: 'LinkedIn', baseUrl: '/linkedin/oauth/v2' },
      { platform: 'TikTok', baseUrl: '/tiktok/oauth' },
      { platform: 'The Trade Desk', baseUrl: '/ttd/v3/authentication (Token-based)' },
    ],
    admin: {
      info: '/admin/info',
      endpoints: [
        '/admin/health',
        '/admin/stats',
        '/admin/reset',
        '/admin/seed'
      ]
    },
    documentation: '/api-docs',
  });
});

// ============================================
// Swagger API Documentation
// ============================================

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve OpenAPI spec as JSON
app.get('/api-docs/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve Swagger UI using CDN for serverless compatibility
app.get('/api-docs', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mock Ad Servers API Documentation</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui.css" crossorigin="anonymous" />
      <style>
        body { margin: 0; }
        .swagger-ui .topbar { display: none; }
        #loading { padding: 20px; font-family: sans-serif; }
      </style>
    </head>
    <body>
      <div id="loading">Loading Swagger UI...</div>
      <div id="swagger-ui"></div>
      <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-bundle.js" crossorigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js" crossorigin="anonymous"></script>
      <script>
        window.onload = () => {
          try {
            if (typeof SwaggerUIBundle === 'undefined') {
              document.getElementById('loading').innerHTML = 'Error: Swagger UI failed to load. Please check your internet connection and try again.';
              console.error('SwaggerUIBundle not loaded');
              return;
            }
            document.getElementById('loading').style.display = 'none';
            window.ui = SwaggerUIBundle({
              url: '/api-docs/swagger.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout"
            });
          } catch (error) {
            document.getElementById('loading').innerHTML = 'Error initializing Swagger UI: ' + error.message;
            console.error('Error initializing Swagger UI:', error);
          }
        };
      </script>
    </body>
    </html>
  `);
});

// ============================================
// OAuth/Authentication Routes
// ============================================

// Google OAuth (used by Google Ads & DV360)
app.use('/google/oauth', googleOAuthRouter);

// Meta OAuth
app.use('/meta', metaOAuthRouter);

// LinkedIn OAuth
app.use('/linkedin', linkedInOAuthRouter);

// TikTok OAuth
app.use('/tiktok', tikTokOAuthRouter);

// ============================================
// Platform API Routes
// ============================================

// Google Ads API v21
app.use('/googleads/v21', googleAdsRouter);

// Meta Marketing API v23.0
app.use('/meta', metaRouter);

// LinkedIn Marketing API 202510
app.use('/linkedin/rest', linkedInRouter);

// TikTok Marketing API v1.3
app.use('/tiktok/v1.3', tikTokRouter);

// The Trade Desk API v3
app.use('/ttd/v3', tradeDeskRouter);

// DV360 API v4
app.use('/dv360/v4', dv360Router);

// ============================================
// Admin Routes
// ============================================

// Admin endpoints for database management
app.use('/admin', adminRouter);

// ============================================
// Error Handling
// ============================================

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// Server Startup
// ============================================

const PORT = serverConfig.port;

// Only start the server if this file is run directly (not imported for tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('\n===========================================');
    console.log(`🚀 Mock Ad Servers API`);
    console.log('===========================================');
    console.log(`Environment: ${serverConfig.nodeEnv}`);
    console.log(`Server running on: http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
    console.log(`API overview: http://localhost:${PORT}/`);
    console.log('===========================================');
    console.log('\n📋 Available Platforms:');
    console.log('  • Google Ads API v21');
    console.log('  • Meta Marketing API v23.0');
    console.log('  • LinkedIn Marketing API 202510');
    console.log('  • TikTok Marketing API');
    console.log('  • The Trade Desk API v3');
    console.log('  • DV360 API v4');
    console.log('\n===========================================\n');
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    process.exit(0);
  });
}

export default app;
