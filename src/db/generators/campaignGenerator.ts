import { faker } from '@faker-js/faker';

export interface GeneratedCampaign {
  id: string;
  platform: string;
  account_id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_date: Date;
  end_date?: Date;
  platform_specific_data: any;
}

export class CampaignGenerator {
  private static idCounter = 0;

  /**
   * Generate realistic campaign name
   */
  static generateName(_platform: string): string {
    const prefixes = [
      'Spring Sale', 'Black Friday', 'Q4 Launch', 'Summer Campaign',
      'Product Launch', 'Brand Awareness', 'Lead Generation', 'Retargeting',
      'Holiday Special', 'New Customer', 'Loyalty Program', 'Flash Sale'
    ];

    const prefix = faker.helpers.arrayElement(prefixes);
    const year = faker.date.future().getFullYear();
    return `${prefix} ${year}`;
  }

  /**
   * Generate campaign for specific platform
   */
  static generate(platform: string, accountId: string): GeneratedCampaign {
    // Status distribution: 60% ACTIVE, 30% PAUSED, 10% DRAFT
    const statusDistribution = [
      'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE',
      'PAUSED', 'PAUSED', 'PAUSED',
      'DRAFT'
    ];
    const status = faker.helpers.arrayElement(statusDistribution);

    const dailyBudget = faker.number.float({ min: 10, max: 10000, fractionDigits: 2 });

    const campaign: GeneratedCampaign = {
      id: this.generateId(platform),
      platform,
      account_id: accountId,
      name: this.generateName(platform),
      objective: this.getObjective(platform),
      status,
      daily_budget: dailyBudget,
      start_date: faker.date.past({ years: 0.5 }),
      platform_specific_data: this.getPlatformSpecificData(platform)
    };

    // 30% chance of having end date
    if (faker.datatype.boolean({ probability: 0.3 })) {
      campaign.end_date = faker.date.future({ years: 0.5 });
    }

    // 40% chance of lifetime budget instead of daily
    if (faker.datatype.boolean({ probability: 0.4 })) {
      campaign.lifetime_budget = dailyBudget * faker.number.int({ min: 30, max: 90 });
      delete campaign.daily_budget;
    }

    return campaign;
  }

  /**
   * Generate platform-specific ID
   */
  private static generateId(platform: string): string {
    const timestamp = Date.now();
    const random = faker.number.int({ min: 1000, max: 9999 });
    const counter = ++this.idCounter;

    switch (platform) {
      case 'meta':
        // Meta campaigns start with 12021...
        return `12021${timestamp.toString().slice(-10)}${random}${counter}`;

      case 'google_ads':
        // Google Ads uses numeric IDs
        return `${timestamp.toString().slice(-10)}${random}${counter}`;

      case 'linkedin':
        // LinkedIn uses URN format
        return `urn:li:sponsoredCampaign:${timestamp}${random}${counter}`;

      case 'tiktok':
        // TikTok uses numeric IDs
        return `${timestamp}${random}${counter}`;

      case 'tradedesk':
        // Trade Desk uses prefixed format
        return `ttd_campaign_${timestamp}${random}${counter}`;

      case 'dv360':
        // DV360 uses numeric IDs
        return `${timestamp}${random}${counter}`;

      default:
        return `${platform}_${timestamp}${random}${counter}`;
    }
  }

  /**
   * Get platform-appropriate objective
   */
  private static getObjective(platform: string): string {
    const objectives: Record<string, string[]> = {
      meta: [
        'OUTCOME_TRAFFIC',
        'OUTCOME_SALES',
        'OUTCOME_AWARENESS',
        'OUTCOME_LEADS',
        'OUTCOME_ENGAGEMENT',
        'OUTCOME_APP_PROMOTION'
      ],
      google_ads: [
        'SEARCH',
        'DISPLAY',
        'VIDEO',
        'SHOPPING',
        'PERFORMANCE_MAX',
        'APP_CAMPAIGN'
      ],
      linkedin: [
        'TEXT_AD',
        'SPONSORED_CONTENT',
        'SPONSORED_INMAILS',
        'VIDEO_ADS',
        'DYNAMIC_ADS',
        'LEAD_GENERATION'
      ],
      tiktok: [
        'TRAFFIC',
        'CONVERSIONS',
        'APP_PROMOTION',
        'REACH',
        'VIDEO_VIEWS',
        'LEAD_GENERATION'
      ],
      tradedesk: [
        'BRAND_AWARENESS',
        'CLICKS',
        'CONVERSIONS',
        'VIDEO_COMPLETION',
        'REACH',
        'ENGAGEMENT'
      ],
      dv360: [
        'BRAND_AWARENESS',
        'OFFLINE_ACTION',
        'ONLINE_ACTION',
        'APP_INSTALL',
        'VIDEO_COMPLETION',
        'REACH'
      ]
    };

    return faker.helpers.arrayElement(objectives[platform] || ['TRAFFIC']);
  }

  /**
   * Get platform-specific data
   */
  private static getPlatformSpecificData(platform: string): any {
    switch (platform) {
      case 'meta':
        return {
          special_ad_categories: faker.helpers.arrayElement([[], ['CREDIT'], ['EMPLOYMENT'], ['HOUSING']]),
          buying_type: faker.helpers.arrayElement(['AUCTION', 'RESERVED']),
          bid_strategy: faker.helpers.arrayElement(['LOWEST_COST_WITHOUT_CAP', 'LOWEST_COST_WITH_BID_CAP', 'COST_CAP'])
        };

      case 'google_ads':
        return {
          advertising_channel_type: faker.helpers.arrayElement(['SEARCH', 'DISPLAY', 'VIDEO', 'SHOPPING']),
          bidding_strategy: faker.helpers.arrayElement(['TARGET_CPA', 'TARGET_ROAS', 'MAXIMIZE_CONVERSIONS', 'MAXIMIZE_CLICKS'])
        };

      case 'linkedin':
        return {
          campaign_group: `urn:li:sponsoredCampaignGroup:${faker.number.int({ min: 100000, max: 999999 })}`,
          locale: faker.helpers.arrayElement(['en_US', 'en_GB', 'en_CA', 'en_AU'])
        };

      case 'tiktok':
        return {
          objective_type: faker.helpers.arrayElement(['TRAFFIC', 'CONVERSIONS', 'APP_PROMOTION', 'REACH']),
          budget_mode: faker.helpers.arrayElement(['BUDGET_MODE_DAY', 'BUDGET_MODE_TOTAL'])
        };

      case 'tradedesk':
        return {
          campaign_flight: {
            start_date: faker.date.recent({ days: 30 }).toISOString(),
            end_date: faker.date.future({ years: 0.5 }).toISOString()
          },
          kpi_type: faker.helpers.arrayElement(['CPC', 'CPM', 'CPA', 'CPCV'])
        };

      case 'dv360':
        return {
          campaign_goal: faker.helpers.arrayElement(['BRAND_AWARENESS', 'OFFLINE_ACTION', 'ONLINE_ACTION', 'APP_INSTALL']),
          frequency_cap: {
            unlimited: faker.datatype.boolean(),
            time_unit: faker.helpers.arrayElement(['TIME_UNIT_DAYS', 'TIME_UNIT_WEEKS', 'TIME_UNIT_MONTHS']),
            time_unit_count: faker.number.int({ min: 1, max: 10 }),
            max_impressions: faker.number.int({ min: 1, max: 10 })
          }
        };

      default:
        return {};
    }
  }

  /**
   * Generate multiple campaigns
   */
  static generateBatch(
    platform: string,
    accountId: string,
    count: number
  ): GeneratedCampaign[] {
    return Array.from({ length: count }, () => this.generate(platform, accountId));
  }
}
