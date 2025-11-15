// Test database connection and check if data exists
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    console.log(`📍 DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);

    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL not found in environment');
      process.exit(1);
    }

    // Set POSTGRES_URL for @vercel/postgres SDK
    process.env.POSTGRES_URL = process.env.DATABASE_URL;

    // Test connection
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful\n');

    // Check if tables exist
    console.log('📊 Checking database schema...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    if (tables.rows.length === 0) {
      console.log('⚠️  No tables found - database needs initialization');
      process.exit(0);
    }

    console.log(`✅ Found ${tables.rows.length} tables:`);
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    console.log('');

    // Check data counts
    console.log('📈 Checking data counts...');
    const counts = await Promise.all([
      sql`SELECT COUNT(*) as count FROM campaigns`,
      sql`SELECT COUNT(*) as count FROM ad_groups`,
      sql`SELECT COUNT(*) as count FROM ads`,
      sql`SELECT COUNT(*) as count FROM performance_metrics`
    ]);

    const stats = {
      campaigns: parseInt(counts[0].rows[0].count),
      adGroups: parseInt(counts[1].rows[0].count),
      ads: parseInt(counts[2].rows[0].count),
      metrics: parseInt(counts[3].rows[0].count)
    };

    console.log(`   Campaigns: ${stats.campaigns}`);
    console.log(`   Ad Groups: ${stats.adGroups}`);
    console.log(`   Ads: ${stats.ads}`);
    console.log(`   Performance Metrics: ${stats.metrics}`);
    console.log('');

    if (stats.campaigns === 0) {
      console.log('⚠️  Database is empty - needs seeding');
    } else {
      console.log('✅ Database has data!');

      // Show sample campaign
      const sample = await sql`SELECT id, platform, name, status FROM campaigns LIMIT 1`;
      if (sample.rows.length > 0) {
        console.log('\n📝 Sample campaign:');
        console.log(JSON.stringify(sample.rows[0], null, 2));
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testDatabase();
