// Initialize database schema and seed data
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...\n');

    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL not found');
      process.exit(1);
    }

    // Set POSTGRES_URL for @vercel/postgres SDK
    process.env.POSTGRES_URL = process.env.DATABASE_URL;

    // Read and execute schema
    console.log('📊 Creating database schema...');
    const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

    await sql.query(schemaSQL);
    console.log('✅ Schema created successfully\n');

    // Check tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`✅ Created ${tables.rows.length} tables:`);
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    console.log('');

    // Now run the seeding
    console.log('🌱 Starting database seeding...\n');
    console.log('   This will create:');
    console.log('   - 130 campaigns (25 Meta, 25 Google, 20 each for other platforms)');
    console.log('   - ~390 ad groups (3 per campaign average)');
    console.log('   - ~1,365 ads (3.5 per ad group average)');
    console.log('   - ~7,930 performance metrics (60 days × 130 campaigns)');
    console.log('');

    // Import and run seedAll
    const { seedAll } = require('./dist/db/seeders/seedAll');
    await seedAll();

    // Final stats
    const counts = await Promise.all([
      sql`SELECT COUNT(*) as count FROM campaigns`,
      sql`SELECT COUNT(*) as count FROM ad_groups`,
      sql`SELECT COUNT(*) as count FROM ads`,
      sql`SELECT COUNT(*) as count FROM performance_metrics`
    ]);

    console.log('\n✅ Database initialization complete!\n');
    console.log('📊 Final counts:');
    console.log(`   Campaigns: ${counts[0].rows[0].count}`);
    console.log(`   Ad Groups: ${counts[1].rows[0].count}`);
    console.log(`   Ads: ${counts[2].rows[0].count}`);
    console.log(`   Performance Metrics: ${counts[3].rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initializeDatabase();
