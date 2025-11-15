import { sql } from '@vercel/postgres';
import { GeneratedMetric } from "../generators/metricsGenerator";

export class MetricsRepository {
  /**
   * Create a single metric entry
   */
  async create(metric: GeneratedMetric): Promise<void> {
    await sql`
      INSERT INTO performance_metrics (
        platform, entity_type, entity_id, date,
        impressions, clicks, spend, conversions,
        ctr, cpc, cpm
      ) VALUES (
        ${metric.platform}, ${metric.entity_type}, ${metric.entity_id}, ${metric.date},
        ${metric.impressions}, ${metric.clicks}, ${metric.spend}, ${metric.conversions},
        ${metric.ctr}, ${metric.cpc}, ${metric.cpm}
      )
      ON CONFLICT (platform, entity_type, entity_id, date) DO UPDATE
      SET impressions = EXCLUDED.impressions,
          clicks = EXCLUDED.clicks,
          spend = EXCLUDED.spend,
          conversions = EXCLUDED.conversions,
          ctr = EXCLUDED.ctr,
          cpc = EXCLUDED.cpc,
          cpm = EXCLUDED.cpm
    `;
  }

  /**
   * Create multiple metric entries in batch
   */
  async createBatch(metrics: GeneratedMetric[]): Promise<void> {
    if (metrics.length === 0) return;

    // Build values for batch insert
    const values: any[] = [];
    const placeholders: string[] = [];
    
    metrics.forEach((metric, index) => {
      const baseIndex = index * 11;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11})`
      );
      values.push(
        metric.platform,
        metric.entity_type,
        metric.entity_id,
        metric.date,
        metric.impressions,
        metric.clicks,
        metric.spend,
        metric.conversions,
        metric.ctr,
        metric.cpc,
        metric.cpm
      );
    });

    const query = `
      INSERT INTO performance_metrics (
        platform, entity_type, entity_id, date,
        impressions, clicks, spend, conversions,
        ctr, cpc, cpm
      ) VALUES ${placeholders.join(', ')}
      ON CONFLICT (platform, entity_type, entity_id, date) DO UPDATE
      SET impressions = EXCLUDED.impressions,
          clicks = EXCLUDED.clicks,
          spend = EXCLUDED.spend,
          conversions = EXCLUDED.conversions,
          ctr = EXCLUDED.ctr,
          cpc = EXCLUDED.cpc,
          cpm = EXCLUDED.cpm
    `;

    await sql.query(query, values);
  }

  /**
   * Get metrics for an entity within a date range
   */
  async getMetrics(
    platform: string,
    entityType: 'campaign' | 'ad_group' | 'ad',
    entityId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GeneratedMetric[]> {
    let query = `
      SELECT * FROM performance_metrics
      WHERE platform = $1
      AND entity_type = $2
      AND entity_id = $3
    `;
    const values: any[] = [platform, entityType, entityId];

    if (startDate) {
      query += ` AND date >= $${values.length + 1}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND date <= $${values.length + 1}`;
      values.push(endDate);
    }

    query += ` ORDER BY date DESC`;

    const result = await sql.query(query, values);
    
    return result.rows.map(row => ({
      platform: row.platform,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      date: new Date(row.date),
      impressions: parseInt(row.impressions),
      clicks: parseInt(row.clicks),
      spend: parseFloat(row.spend),
      conversions: parseInt(row.conversions),
      ctr: parseFloat(row.ctr),
      cpc: parseFloat(row.cpc),
      cpm: parseFloat(row.cpm)
    }));
  }
}
