import { faker } from '@faker-js/faker';

export interface GeneratedAdGroup {
  id: string;
  platform: string;
  campaign_id: string;
  name: string;
  status: string;
  optimization_goal?: string;
  bid_amount?: number;
  daily_budget?: number;
  targeting: any;
  platform_specific_data: any;
}

export class AdGroupGenerator {
  /**
   * Generate realistic ad group name
   */
  static generateName(_platform: string): string {
    const segments = [
      'Desktop', 'Mobile', 'Tablet',
      'iOS', 'Android',
      '18-24', '25-34', '35-44', '45-54', '55+',
      'Male', 'Female', 'All Genders',
      'US', 'UK', 'Canada', 'Australia',
      'Interest - Tech', 'Interest - Fashion', 'Interest - Sports',
      'Lookalike', 'Remarketing', 'Cold Audience'
    ];

    const segment1 = faker.helpers.arrayElement(segments);
    const segment2 = faker.helpers.arrayElement(segments.filter(s => s !== segment1));

    return `${segment1} - ${segment2}`;
  }

  /**
   * Generate ad group for specific platform
   */
  static generate(platform: string, campaignId: string): GeneratedAdGroup {
    // Status distribution: 60% ACTIVE, 30% PAUSED, 10% DRAFT
    const statusDistribution = [
      'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE',
      'PAUSED', 'PAUSED', 'PAUSED',
      'DRAFT'
    ];
    const status = faker.helpers.arrayElement(statusDistribution);

    const adGroup: GeneratedAdGroup = {
      id: this.generateId(platform, campaignId),
      platform,
      campaign_id: campaignId,
      name: this.generateName(platform),
      status,
      optimization_goal: this.getOptimizationGoal(platform),
      bid_amount: faker.number.float({ min: 0.5, max: 50, fractionDigits: 2 }),
      targeting: this.generateTargeting(platform),
      platform_specific_data: this.getPlatformSpecificData(platform)
    };

    // 50% chance of having ad group level daily budget
    if (faker.datatype.boolean({ probability: 0.5 })) {
      adGroup.daily_budget = faker.number.float({ min: 5, max: 1000, fractionDigits: 2 });
    }

    return adGroup;
  }

  /**
   * Generate platform-specific ID
   */
  private static generateId(platform: string, _campaignId: string): string {
    const timestamp = Date.now();
    const random = faker.number.int({ min: 1000, max: 9999 });

    switch (platform) {
      case 'meta':
        // Meta ad sets start with 23847...
        return `23847${timestamp.toString().slice(-10)}`;

      case 'google_ads':
        // Google Ads uses numeric IDs
        return `${timestamp.toString().slice(-10)}${random}`;

      case 'linkedin':
        // LinkedIn uses URN format
        return `urn:li:sponsoredCampaignGroup:${timestamp}${random}`;

      case 'tiktok':
        // TikTok uses numeric IDs
        return `${timestamp}${random}`;

      case 'tradedesk':
        // Trade Desk uses prefixed format
        return `ttd_adgroup_${timestamp}`;

      case 'dv360':
        // DV360 uses numeric IDs (insertion order)
        return `${timestamp}${random}`;

      default:
        return `${platform}_ag_${timestamp}${random}`;
    }
  }

  /**
   * Get platform-appropriate optimization goal
   */
  private static getOptimizationGoal(platform: string): string {
    const goals: Record<string, string[]> = {
      meta: [
        'LINK_CLICKS',
        'IMPRESSIONS',
        'REACH',
        'LANDING_PAGE_VIEWS',
        'OFFSITE_CONVERSIONS',
        'VALUE'
      ],
      google_ads: [
        'TARGET_CPA',
        'TARGET_ROAS',
        'MAXIMIZE_CONVERSIONS',
        'MAXIMIZE_CLICKS',
        'TARGET_IMPRESSION_SHARE'
      ],
      linkedin: [
        'CLICK',
        'IMPRESSION',
        'VIDEO_VIEW',
        'LEAD_GENERATION',
        'ENGAGEMENT'
      ],
      tiktok: [
        'CLICK',
        'CONVERSION',
        'REACH',
        'VIDEO_VIEW',
        'ENGAGEMENT'
      ],
      tradedesk: [
        'CPM',
        'CPC',
        'CPA',
        'CPCV',
        'vCPM'
      ],
      dv360: [
        'PERFORMANCE_GOAL_TYPE_CPA',
        'PERFORMANCE_GOAL_TYPE_CPC',
        'PERFORMANCE_GOAL_TYPE_VIEWABLE_CPM',
        'PERFORMANCE_GOAL_TYPE_CPM'
      ]
    };

    return faker.helpers.arrayElement(goals[platform] || ['CLICK']);
  }

  /**
   * Generate realistic targeting data
   */
  private static generateTargeting(platform: string): any {
    const ages = [
      { min: 18, max: 24 },
      { min: 25, max: 34 },
      { min: 35, max: 44 },
      { min: 45, max: 54 },
      { min: 55, max: 64 },
      { min: 65, max: null }
    ];

    const devices = faker.helpers.arrayElements(
      ['MOBILE', 'DESKTOP', 'TABLET', 'CONNECTED_TV'],
      { min: 1, max: 3 }
    );

    const genders = faker.helpers.arrayElements(
      ['MALE', 'FEMALE', 'ALL'],
      { min: 1, max: 2 }
    );

    const locations = faker.helpers.arrayElements(
      ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'IN'],
      { min: 1, max: 3 }
    );

    const baseTargeting = {
      age_range: faker.helpers.arrayElement(ages),
      genders,
      devices,
      locations,
      languages: faker.helpers.arrayElements(['en', 'es', 'fr', 'de', 'ja'], { min: 1, max: 2 })
    };

    // Platform-specific targeting additions
    switch (platform) {
      case 'meta':
        return {
          ...baseTargeting,
          detailed_targeting: {
            interests: faker.helpers.arrayElements([
              'Technology', 'Fashion', 'Sports', 'Travel', 'Food', 'Fitness'
            ], { min: 1, max: 3 }),
            behaviors: faker.helpers.arrayElements([
              'Digital activities', 'Purchase behavior', 'Travel'
            ], { min: 0, max: 2 })
          },
          placement_types: faker.helpers.arrayElements([
            'feed', 'story', 'reels', 'search', 'messages'
          ], { min: 2, max: 4 })
        };

      case 'google_ads':
        return {
          ...baseTargeting,
          keywords: faker.helpers.arrayElements([
            'buy shoes online', 'best laptop 2025', 'digital marketing',
            'fitness tracker', 'online courses', 'web hosting'
          ], { min: 5, max: 15 }),
          match_types: ['EXACT', 'PHRASE', 'BROAD']
        };

      case 'linkedin':
        return {
          ...baseTargeting,
          job_titles: faker.helpers.arrayElements([
            'Software Engineer', 'Marketing Manager', 'Sales Director',
            'Product Manager', 'CEO', 'Data Analyst'
          ], { min: 2, max: 5 }),
          seniorities: faker.helpers.arrayElements([
            'ENTRY', 'SENIOR', 'MANAGER', 'DIRECTOR', 'VP', 'CXO'
          ], { min: 1, max: 3 }),
          industries: faker.helpers.arrayElements([
            'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'
          ], { min: 1, max: 3 })
        };

      case 'tiktok':
        return {
          ...baseTargeting,
          interests: faker.helpers.arrayElements([
            'Gaming', 'Beauty', 'Fashion', 'Food', 'Sports', 'Music'
          ], { min: 2, max: 4 }),
          video_download: faker.datatype.boolean(),
          operating_systems: faker.helpers.arrayElements(['IOS', 'ANDROID'], { min: 1, max: 2 })
        };

      case 'tradedesk':
        return {
          ...baseTargeting,
          audience_segments: faker.helpers.arrayElements([
            'In-Market: Auto', 'In-Market: Travel', 'Lifestyle: Tech Enthusiast',
            'Demo: High Income', 'Interest: Business'
          ], { min: 2, max: 5 }),
          inventory_sources: faker.helpers.arrayElements([
            'OPEN_EXCHANGE', 'PRIVATE_MARKETPLACE', 'PROGRAMMATIC_GUARANTEED'
          ], { min: 1, max: 2 })
        };

      case 'dv360':
        return {
          ...baseTargeting,
          audience_targeting: {
            included_google_audience_ids: Array.from(
              { length: faker.number.int({ min: 2, max: 5 }) },
              () => faker.number.int({ min: 100000, max: 999999 }).toString()
            ),
            included_custom_list_ids: []
          },
          inventory_source_settings: {
            include_google_owned_and_operated: faker.datatype.boolean(),
            include_exchange: faker.datatype.boolean()
          }
        };

      default:
        return baseTargeting;
    }
  }

  /**
   * Get platform-specific data
   */
  private static getPlatformSpecificData(platform: string): any {
    switch (platform) {
      case 'meta':
        return {
          attribution_spec: [
            {
              event_type: 'CLICK_THROUGH',
              window_days: faker.helpers.arrayElement([1, 7, 28])
            },
            {
              event_type: 'VIEW_THROUGH',
              window_days: faker.helpers.arrayElement([1, 7, 28])
            }
          ],
          destination_type: faker.helpers.arrayElement(['WEBSITE', 'APP', 'MESSENGER', 'WHATSAPP'])
        };

      case 'google_ads':
        return {
          ad_rotation_mode: faker.helpers.arrayElement(['OPTIMIZE', 'ROTATE_INDEFINITELY']),
          target_cpa: faker.number.float({ min: 5, max: 100, fractionDigits: 2 })
        };

      case 'linkedin':
        return {
          run_schedule: {
            start: '00:00',
            end: '23:59'
          },
          cost_type: faker.helpers.arrayElement(['CPM', 'CPC'])
        };

      case 'tiktok':
        return {
          placement_type: faker.helpers.arrayElement(['PLACEMENT_TYPE_AUTOMATIC', 'PLACEMENT_TYPE_NORMAL']),
          pixel_id: `${faker.number.int({ min: 1000000000000, max: 9999999999999 })}`
        };

      case 'tradedesk':
        return {
          pacing: faker.helpers.arrayElement(['EVEN', 'ASAP']),
          frequency_cap: {
            amount: faker.number.int({ min: 1, max: 10 }),
            duration: faker.helpers.arrayElement(['DAY', 'WEEK', 'MONTH'])
          }
        };

      case 'dv360':
        return {
          pacing_period: faker.helpers.arrayElement(['DAILY', 'FLIGHT']),
          pacing_type: faker.helpers.arrayElement(['PACING_TYPE_EVEN', 'PACING_TYPE_ASAP'])
        };

      default:
        return {};
    }
  }

  /**
   * Generate multiple ad groups for a campaign
   */
  static generateBatch(
    platform: string,
    campaignId: string,
    count: number
  ): GeneratedAdGroup[] {
    return Array.from({ length: count }, () => this.generate(platform, campaignId));
  }
}
