import dotenv from 'dotenv';

dotenv.config();

export interface AuthConfig {
  validToken: string;
  clientId?: string;
  clientSecret?: string;
  additionalConfig?: Record<string, string>;
}

export const authConfigs: Record<string, AuthConfig> = {
  google: {
    validToken: process.env.GOOGLE_VALID_TOKEN || 'mock_google_access_token_12345',
    clientId: process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_client_secret',
    additionalConfig: {
      devToken: process.env.GOOGLE_DEV_TOKEN || 'mock_google_dev_token_67890',
    },
  },
  meta: {
    validToken: process.env.META_VALID_TOKEN || 'mock_meta_access_token_abcdef',
    clientId: process.env.META_APP_ID || 'mock_meta_app_id_123456',
    clientSecret: process.env.META_APP_SECRET || 'mock_meta_app_secret_789012',
  },
  linkedin: {
    validToken: process.env.LINKEDIN_VALID_TOKEN || 'mock_linkedin_access_token_ghijkl',
    clientId: process.env.LINKEDIN_CLIENT_ID || 'mock_linkedin_client_id_345678',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'mock_linkedin_client_secret_901234',
  },
  tiktok: {
    validToken: process.env.TIKTOK_VALID_TOKEN || 'mock_tiktok_access_token_mnopqr',
    clientId: process.env.TIKTOK_CLIENT_KEY || 'mock_tiktok_client_key_567890',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || 'mock_tiktok_client_secret_123456',
  },
  tradedesk: {
    validToken: process.env.TTD_VALID_TOKEN || 'mock_ttd_token_stuvwx_yzabcd_efghij',
    additionalConfig: {
      username: process.env.TTD_USERNAME || 'mock_ttd_username',
      password: process.env.TTD_PASSWORD || 'mock_ttd_password',
    },
  },
  dv360: {
    validToken: process.env.DV360_VALID_TOKEN || 'mock_dv360_access_token_klmnop',
    clientId: process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_client_secret',
    additionalConfig: {
      serviceAccountEmail: process.env.DV360_SERVICE_ACCOUNT_EMAIL || 'mock-service@example.iam.gserviceaccount.com',
    },
  },
};

export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
  simulateRateLimiting: process.env.SIMULATE_RATE_LIMITING === 'true',
  allowInvalidTokens: process.env.ALLOW_INVALID_TOKENS === 'true',
  defaultResponseMode: process.env.DEFAULT_RESPONSE_MODE || 'success',
};
