import { Database } from '../database';
import { seedMeta } from './seedMeta';
import { seedGoogleAds } from './seedGoogleAds';
import { seedLinkedIn } from './seedLinkedIn';
import { seedTikTok } from './seedTikTok';
import { seedTradeDesk } from './seedTradeDesk';
import { seedDV360 } from './seedDV360';

/**
 * Seed all platforms with realistic campaign data
 * Runs all platform seeders in parallel for optimal performance
 */
export async function seedAll() {
  console.log('🌱 Starting database seeding...');
  console.log('');

  const startTime = Date.now();

  try {
    // Check if database is already seeded
    const stats = await Database.getStats();
    if (stats.campaigns > 0) {
      console.log('ℹ️  Database already contains data, skipping seed');
      console.log(`   📊 Current: ${stats.campaigns} campaigns, ${stats.adGroups} ad groups, ${stats.ads} ads, ${stats.metrics} metrics`);
      return;
    }

    console.log('📝 Database is empty - starting seeding process...');
    console.log('');

    // Seed all platforms in parallel for optimal performance
    const results = await Promise.all([
      seedMeta(),
      seedGoogleAds(),
      seedLinkedIn(),
      seedTikTok(),
      seedTradeDesk(),
      seedDV360()
    ]);

    // Aggregate results
    const totals = results.reduce(
      (acc, result) => ({
        campaigns: acc.campaigns + result.campaigns,
        adGroups: acc.adGroups + result.adGroups,
        ads: acc.ads + result.ads,
        metrics: acc.metrics + result.metrics
      }),
      { campaigns: 0, adGroups: 0, ads: 0, metrics: 0 }
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('✅ Seeding complete!');
    console.log(`   ⏱️  Duration: ${duration}s`);
    console.log(`   📊 Total created:`);
    console.log(`      • ${totals.campaigns} campaigns`);
    console.log(`      • ${totals.adGroups} ad groups/sets`);
    console.log(`      • ${totals.ads} ads/creatives`);
    console.log(`      • ${totals.metrics} performance metrics`);
    console.log('');

    // Verify final database stats
    const finalStats = await Database.getStats();
    console.log('   📈 Database totals:');
    console.log(`      • ${finalStats.campaigns} campaigns`);
    console.log(`      • ${finalStats.adGroups} ad groups`);
    console.log(`      • ${finalStats.ads} ads`);
    console.log(`      • ${finalStats.metrics} metrics`);

  } catch (error) {
    console.error('');
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}
