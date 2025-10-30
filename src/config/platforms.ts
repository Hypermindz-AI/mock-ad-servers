export interface PlatformConfig {
  name: string;
  version: string;
  baseUrl: string;
  authType: 'oauth2' | 'token';
  authHeader: string;
  requiresAdditionalHeaders?: Record<string, string>;
}

export const platformConfigs: Record<string, PlatformConfig> = {
  googleAds: {
    name: 'Google Ads',
    version: 'v21',
    baseUrl: '/googleads/v21',
    authType: 'oauth2',
    authHeader: 'Authorization',
    requiresAdditionalHeaders: {
      'developer-token': 'required',
    },
  },
  meta: {
    name: 'Meta Marketing',
    version: 'v23.0',
    baseUrl: '/v23.0',
    authType: 'oauth2',
    authHeader: 'Authorization',
  },
  linkedin: {
    name: 'LinkedIn Marketing',
    version: '202510',
    baseUrl: '/rest',
    authType: 'oauth2',
    authHeader: 'Authorization',
    requiresAdditionalHeaders: {
      'Linkedin-Version': '202510',
    },
  },
  tiktok: {
    name: 'TikTok Marketing',
    version: 'v1.3',
    baseUrl: '/open_api/v1.3',
    authType: 'oauth2',
    authHeader: 'Authorization',
  },
  tradedesk: {
    name: 'The Trade Desk',
    version: 'v3',
    baseUrl: '/v3',
    authType: 'token',
    authHeader: 'TTD-Auth',
  },
  dv360: {
    name: 'DV360',
    version: 'v4',
    baseUrl: '/v4',
    authType: 'oauth2',
    authHeader: 'Authorization',
  },
};
