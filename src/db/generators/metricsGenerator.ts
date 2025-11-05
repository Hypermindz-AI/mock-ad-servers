import { faker } from '@faker-js/faker';

export interface GeneratedMetric {
  platform: string;
  entity_type: 'campaign' | 'ad_group' | 'ad';
  entity_id: string;
  date: Date;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

export class MetricsGenerator {
  /**
   * Generate realistic daily metrics
   */
  static generateDaily(
    platform: string,
    entityType: string,
    entityId: string,
    date: Date,
    dailyBudget: number
  ): GeneratedMetric {
    // Base metrics on budget
    const spend = faker.number.float({
      min: dailyBudget * 0.6,
      max: dailyBudget * 1.0,
      fractionDigits: 2
    });

    const impressions = faker.number.int({ min: 1000, max: 50000 });
    const clicks = Math.floor(impressions * faker.number.float({ min: 0.005, max: 0.05, fractionDigits: 4 }));
    const conversions = Math.floor(clicks * faker.number.float({ min: 0.01, max: 0.10, fractionDigits: 4 }));

    const ctr = (clicks / impressions) * 100;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpm = (spend / impressions) * 1000;

    return {
      platform,
      entity_type: entityType as any,
      entity_id: entityId,
      date,
      impressions,
      clicks,
      spend: parseFloat(spend.toFixed(2)),
      conversions,
      ctr: parseFloat(ctr.toFixed(2)),
      cpc: parseFloat(cpc.toFixed(2)),
      cpm: parseFloat(cpm.toFixed(2))
    };
  }

  /**
   * Generate time-series metrics (default 30 days)
   */
  static generateTimeSeries(
    platform: string,
    entityType: string,
    entityId: string,
    dailyBudget: number,
    days: number = 30
  ): GeneratedMetric[] {
    const metrics: GeneratedMetric[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      metrics.push(this.generateDaily(platform, entityType, entityId, date, dailyBudget));
    }

    return metrics;
  }
}
