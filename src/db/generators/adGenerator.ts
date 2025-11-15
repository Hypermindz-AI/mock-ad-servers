import { faker } from '@faker-js/faker';

export interface GeneratedAd {
  id: string;
  platform: string;
  campaign_id: string;
  ad_group_id: string;
  name: string;
  status: string;
  creative_data: any;
  platform_specific_data: any;
}

export class AdGenerator {
  private static idCounter = 0;

  /**
   * Generate realistic ad name
   */
  static generateName(_platform: string): string {
    const adTypes = [
      'Image Ad', 'Video Ad', 'Carousel Ad', 'Collection Ad',
      'Story Ad', 'Dynamic Ad', 'Search Ad', 'Display Ad'
    ];

    const variations = [
      'A', 'B', 'C', 'D', 'Control', 'Test', 'V1', 'V2', 'V3'
    ];

    const adType = faker.helpers.arrayElement(adTypes);
    const variation = faker.helpers.arrayElement(variations);

    return `${adType} - ${variation}`;
  }

  /**
   * Generate ad for specific platform
   */
  static generate(
    platform: string,
    campaignId: string,
    adGroupId: string
  ): GeneratedAd {
    // Status distribution: 60% ACTIVE, 30% PAUSED, 10% DRAFT
    const statusDistribution = [
      'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE',
      'PAUSED', 'PAUSED', 'PAUSED',
      'DRAFT'
    ];
    const status = faker.helpers.arrayElement(statusDistribution);

    return {
      id: this.generateId(platform),
      platform,
      campaign_id: campaignId,
      ad_group_id: adGroupId,
      name: this.generateName(platform),
      status,
      creative_data: this.generateCreativeData(platform),
      platform_specific_data: this.getPlatformSpecificData(platform)
    };
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
        // Meta ads start with 23849... (add random for uniqueness)
        return `23849${timestamp.toString().slice(-10)}${random}${counter}`;

      case 'google_ads':
        // Google Ads uses numeric IDs
        return `${timestamp.toString().slice(-10)}${random}${counter}`;

      case 'linkedin':
        // LinkedIn uses URN format
        return `urn:li:sponsoredCreative:${timestamp}${random}${counter}`;

      case 'tiktok':
        // TikTok uses numeric IDs
        return `${timestamp}${random}${counter}`;

      case 'tradedesk':
        // Trade Desk uses prefixed format (add random for uniqueness)
        return `ttd_ad_${timestamp}${random}${counter}`;

      case 'dv360':
        // DV360 uses numeric IDs (line item)
        return `${timestamp}${random}${counter}`;

      default:
        return `${platform}_ad_${timestamp}${random}${counter}`;
    }
  }

  /**
   * Generate realistic creative data
   */
  private static generateCreativeData(platform: string): any {
    const headlines = [
      'Limited Time Offer - Save Big Today',
      'Discover Your Perfect Solution',
      'Transform Your Business Now',
      'Join Thousands of Happy Customers',
      'Get Started in Minutes',
      'Exclusive Deal Just for You',
      'Unlock Premium Features',
      'Your Success Starts Here'
    ];

    const descriptions = [
      'Experience the difference with our premium solution. Trusted by industry leaders.',
      'Get started today and see results fast. No credit card required.',
      'Join the revolution. Transform the way you work with cutting-edge technology.',
      'Limited time offer. Save up to 50% on all plans. Act now!',
      'Industry-leading features at unbeatable prices. See why customers love us.',
      'Take your business to the next level. Try free for 30 days.'
    ];

    const callsToAction = [
      'Shop Now', 'Learn More', 'Sign Up', 'Get Started',
      'Download', 'Book Now', 'Try Free', 'Contact Us',
      'Subscribe', 'Join Now', 'Get Quote', 'Apply Now'
    ];

    const baseCreative = {
      headline: faker.helpers.arrayElement(headlines),
      description: faker.helpers.arrayElement(descriptions),
      call_to_action: faker.helpers.arrayElement(callsToAction),
      destination_url: `https://${faker.internet.domainName()}`,
      display_url: faker.internet.domainName()
    };

    // Platform-specific creative additions
    switch (platform) {
      case 'meta':
        return {
          ...baseCreative,
          object_story_spec: {
            page_id: faker.number.int({ min: 100000000000, max: 999999999999 }).toString(),
            link_data: {
              image_url: faker.image.url(),
              link: baseCreative.destination_url,
              message: faker.helpers.arrayElement(descriptions),
              name: baseCreative.headline,
              description: faker.lorem.sentence()
            }
          },
          asset_feed_spec: {
            images: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
              url: faker.image.url(),
              hash: faker.string.alphanumeric(32)
            })),
            videos: faker.datatype.boolean() ? [{
              video_id: faker.number.int({ min: 1000000000, max: 9999999999 }).toString(),
              thumbnail_url: faker.image.url()
            }] : []
          }
        };

      case 'google_ads':
        return {
          ...baseCreative,
          responsive_search_ad: {
            headlines: Array.from({ length: 5 }, () => faker.helpers.arrayElement(headlines)),
            descriptions: Array.from({ length: 3 }, () => faker.helpers.arrayElement(descriptions)),
            path1: faker.helpers.arrayElement(['products', 'services', 'offers', 'solutions']),
            path2: faker.helpers.arrayElement(['buy', 'learn', 'get', 'try'])
          },
          responsive_display_ad: {
            marketing_images: Array.from({ length: 3 }, () => ({
              asset: faker.image.url()
            })),
            logo_images: Array.from({ length: 1 }, () => ({
              asset: faker.image.url()
            })),
            square_marketing_images: Array.from({ length: 2 }, () => ({
              asset: faker.image.url()
            }))
          }
        };

      case 'linkedin':
        return {
          ...baseCreative,
          reference: `urn:li:sponsoredCreative:${faker.number.int({ min: 100000000, max: 999999999 })}`,
          creative_type: faker.helpers.arrayElement(['TEXT_AD', 'SPONSORED_UPDATE', 'SPONSORED_INMAILS']),
          content: {
            title: baseCreative.headline,
            description: baseCreative.description,
            landing_page_url: baseCreative.destination_url,
            image_url: faker.image.url()
          }
        };

      case 'tiktok':
        return {
          ...baseCreative,
          ad_text: faker.helpers.arrayElement(descriptions),
          identity_id: faker.number.int({ min: 1000000000000, max: 9999999999999 }).toString(),
          video_id: faker.number.int({ min: 1000000000000, max: 9999999999999 }).toString(),
          display_name: faker.company.name(),
          card: {
            image_url: faker.image.url(),
            title: baseCreative.headline,
            description: baseCreative.description.substring(0, 100)
          }
        };

      case 'tradedesk':
        return {
          ...baseCreative,
          creative_type: faker.helpers.arrayElement(['BANNER', 'VIDEO', 'NATIVE', 'AUDIO']),
          banner: {
            width: faker.helpers.arrayElement([300, 728, 970, 160]),
            height: faker.helpers.arrayElement([250, 90, 250, 600]),
            image_url: faker.image.url(),
            click_through_url: baseCreative.destination_url
          },
          video: faker.datatype.boolean() ? {
            duration: faker.number.int({ min: 15, max: 60 }),
            video_url: `https://video.example.com/${faker.string.alphanumeric(10)}.mp4`,
            thumbnail_url: faker.image.url()
          } : undefined
        };

      case 'dv360':
        return {
          ...baseCreative,
          creative_type: faker.helpers.arrayElement(['CREATIVE_TYPE_DISPLAY', 'CREATIVE_TYPE_VIDEO', 'CREATIVE_TYPE_AUDIO']),
          display_creative: {
            creative_assets: [
              {
                asset: {
                  media_id: faker.number.int({ min: 1000000, max: 9999999 }).toString()
                },
                role: 'ASSET_ROLE_MAIN'
              }
            ],
            exit_events: [
              {
                name: 'Exit',
                type: 'EXIT_EVENT_TYPE_DEFAULT',
                url: baseCreative.destination_url
              }
            ]
          },
          expandable: faker.datatype.boolean(),
          expanding_direction: faker.helpers.arrayElement(['EXPANDING_DIRECTION_NONE', 'EXPANDING_DIRECTION_UP', 'EXPANDING_DIRECTION_DOWN'])
        };

      default:
        return baseCreative;
    }
  }

  /**
   * Get platform-specific data
   */
  private static getPlatformSpecificData(platform: string): any {
    switch (platform) {
      case 'meta':
        return {
          tracking_specs: [
            {
              action_type: ['offsite_conversion'],
              fb_pixel: [faker.number.int({ min: 1000000000000, max: 9999999999999 }).toString()]
            }
          ],
          url_tags: `utm_source=facebook&utm_medium=cpc&utm_campaign=${faker.string.alphanumeric(10)}`
        };

      case 'google_ads':
        return {
          tracking_url_template: `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}`,
          final_url_suffix: `gclid={gclid}`,
          policy_summary: {
            approval_status: faker.helpers.arrayElement(['APPROVED', 'APPROVED_LIMITED', 'UNDER_REVIEW']),
            review_status: 'REVIEWED'
          }
        };

      case 'linkedin':
        return {
          intended_status: faker.helpers.arrayElement(['ACTIVE', 'PAUSED', 'ARCHIVED']),
          is_test: faker.datatype.boolean({ probability: 0.1 }),
          is_serving: faker.datatype.boolean({ probability: 0.8 })
        };

      case 'tiktok':
        return {
          tracking_pixel_id: faker.number.int({ min: 1000000000000, max: 9999999999999 }).toString(),
          profile_image_url: faker.image.avatar(),
          shopping_ads_fallback_type: faker.helpers.arrayElement(['UNSET', 'VIDEO', 'CATALOG'])
        };

      case 'tradedesk':
        return {
          audit_status: faker.helpers.arrayElement(['PENDING', 'APPROVED', 'REJECTED']),
          third_party_tracking: {
            impression_trackers: [
              `https://tracker.example.com/imp?id=${faker.string.alphanumeric(16)}`
            ],
            click_trackers: [
              `https://tracker.example.com/click?id=${faker.string.alphanumeric(16)}`
            ]
          }
        };

      case 'dv360':
        return {
          entity_status: faker.helpers.arrayElement(['ENTITY_STATUS_ACTIVE', 'ENTITY_STATUS_PAUSED', 'ENTITY_STATUS_DRAFT']),
          review_status: {
            approval_status: faker.helpers.arrayElement(['APPROVAL_STATUS_APPROVED', 'APPROVAL_STATUS_PENDING_REVIEW']),
            creative_and_landing_page_review_status: 'REVIEW_STATUS_APPROVED'
          }
        };

      default:
        return {};
    }
  }

  /**
   * Generate multiple ads for an ad group
   */
  static generateBatch(
    platform: string,
    campaignId: string,
    adGroupId: string,
    count: number
  ): GeneratedAd[] {
    return Array.from({ length: count }, () =>
      this.generate(platform, campaignId, adGroupId)
    );
  }
}
