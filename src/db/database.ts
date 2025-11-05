import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

export class Database {
  /**
   * Initialize database schema
   */
  static async initialize(): Promise<void> {
    try {
      // Check if schema exists
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'campaigns'
        );
      `;

      const schemaExists = result.rows[0].exists;

      if (!schemaExists) {
        console.log('📊 Initializing database schema...');
        const schemaPath = path.join(__dirname, 'schema.sql');

        // Check if schema file exists
        if (fs.existsSync(schemaPath)) {
          const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
          await sql.query(schemaSQL);
          console.log('✅ Database schema initialized');
        } else {
          console.log('⚠️  Schema file not found, skipping schema initialization');
        }
      } else {
        console.log('✅ Database schema already exists');
      }
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Check database connection
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await sql`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  static async getStats() {
    try {
      const [campaigns, adGroups, ads, metrics] = await Promise.all([
        sql`SELECT COUNT(*) as count FROM campaigns`,
        sql`SELECT COUNT(*) as count FROM ad_groups`,
        sql`SELECT COUNT(*) as count FROM ads`,
        sql`SELECT COUNT(*) as count FROM performance_metrics`
      ]);

      return {
        campaigns: parseInt(campaigns.rows[0].count),
        adGroups: parseInt(adGroups.rows[0].count),
        ads: parseInt(ads.rows[0].count),
        metrics: parseInt(metrics.rows[0].count)
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        campaigns: 0,
        adGroups: 0,
        ads: 0,
        metrics: 0,
        error: 'Database tables may not exist yet'
      };
    }
  }

  /**
   * Check if database is empty (no campaigns exist)
   */
  static async isEmpty(): Promise<boolean> {
    try {
      const result = await sql`SELECT COUNT(*) as count FROM campaigns`;
      return parseInt(result.rows[0].count) === 0;
    } catch (error) {
      // If table doesn't exist, consider it empty
      return true;
    }
  }

  /**
   * Reset database (for testing)
   */
  static async reset(): Promise<void> {
    try {
      console.log('🗑️  Resetting database...');
      await sql`TRUNCATE campaigns, ad_groups, ads, performance_metrics CASCADE`;
      console.log('✅ Database reset complete');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }
}
