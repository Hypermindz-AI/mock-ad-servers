// Reset database and seed sequentially
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function resetAndSeed() {
  try {
    console.log('🗑️  Resetting database...\n');

    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL not found');
      process.exit(1);
    }

    process.env.POSTGRES_URL = process.env.DATABASE_URL;

    // Truncate all tables
    await sql`TRUNCATE campaigns, ad_groups, ads, performance_metrics CASCADE`;
    console.log('✅ Database cleared\n');

    // Import seeding functions
    const { seedMeta } = require('./dist/db/seeders/seedMeta');
    const { seedGoogleAds } = require('./dist/db/seeders/seedGoogleAds');
    const { seedLinkedIn } = require('./dist/db/seeders/seedLinkedIn');
    const { seedTikTok } = require('./dist/db/seeders/seedTikTok');
    const { seedTradeDesk } = require('./dist/db/seeders/seedTradeDesk');
    const { seedDV360 } = require('./dist/db/seeders/seedDV360');

    console.log('🌱 Starting sequential seeding...\n');

    // Run sequentially to avoid ID collisions
    console.log('📝 Seeding Meta campaigns (1/6)...');
    await seedMeta();
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

    console.log('📝 Seeding Google Ads campaigns (2/6)...');
    await seedGoogleAds();
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('📝 Seeding LinkedIn campaigns (3/6)...');
    await seedLinkedIn();
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('📝 Seeding TikTok campaigns (4/6)...');
    await seedTikTok();
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('📝 Seeding Trade Desk campaigns (5/6)...');
    await seedTradeDesk();
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('📝 Seeding DV360 campaigns (6/6)...');
    await seedDV360();

    console.log('\n✅ Seeding complete!\n');

    // Final stats
    const counts = await Promise.all([
      sql`SELECT COUNT(*) as count FROM campaigns`,
      sql`SELECT COUNT(*) as count FROM ad_groups`,
      sql`SELECT COUNT(*) as count FROM ads`,
      sql`SELECT COUNT(*) as count FROM performance_metrics`
    ]);

    console.log('📊 Final counts:');
    console.log(`   Campaigns: ${counts[0].rows[0].count}`);
    console.log(`   Ad Groups: ${counts[1].rows[0].count}`);
    console.log(`   Ads: ${counts[2].rows[0].count}`);
    console.log(`   Performance Metrics: ${counts[3].rows[0].count}`);

    // Show sample data by platform
    console.log('\n📝 Sample campaigns by platform:');
    const samples = await sql`
      SELECT platform, COUNT(*) as count
      FROM campaigns
      GROUP BY platform
      ORDER BY platform
    `;
    samples.rows.forEach(row => {
      console.log(`   ${row.platform}: ${row.count} campaigns`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Reset and seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetAndSeed();
