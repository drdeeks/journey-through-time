interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  api: {
    contractAddress: string;
    networkId: string;
    rpcUrl: string;
  };
  features: {
    enableErrorReporting: boolean;
    enablePerformanceMonitoring: boolean;
    enableAnalytics: boolean;
    maxRetries: number;
    retryDelay: number;
  };
  ui: {
    itemsPerPageMobile: number;
    itemsPerPageTablet: number;
    itemsPerPageDesktop: number;
    debounceDelay: number;
    throttleDelay: number;
  };
  storage: {
    maxErrorLogSize: number;
    localStoragePrefix: string;
  };
}

const getEnvironment = (): AppConfig['environment'] => {
  if (process.env['NODE_ENV'] === 'production') {
    return 'production';
  }
  if (process.env['REACT_APP_ENV'] === 'staging') {
    return 'staging';
  }
  return 'development';
};

const config: AppConfig = {
  environment: getEnvironment(),
  api: {
    contractAddress: process.env['REACT_APP_CONTRACT_ADDRESS'] || '',
    networkId: process.env['REACT_APP_NETWORK_ID'] || '1',
    rpcUrl: process.env['REACT_APP_RPC_URL'] || 'https://rpc.testnet.monad.xyz',
  },
  features: {
    enableErrorReporting: process.env['NODE_ENV'] === 'production',
    enablePerformanceMonitoring: process.env['NODE_ENV'] === 'production',
    enableAnalytics: process.env['NODE_ENV'] === 'production',
    maxRetries: 3,
    retryDelay: 1000,
  },
  ui: {
    itemsPerPageMobile: 10,
    itemsPerPageTablet: 20,
    itemsPerPageDesktop: 50,
    debounceDelay: 300,
    throttleDelay: 1000,
  },
  storage: {
    maxErrorLogSize: 100,
    localStoragePrefix: 'journey_through_time_',
  },
};

export default config;

// Validation - only warn in production
if (config.environment === 'production' && !config.api.contractAddress) {
  console.warn('Warning: Contract address not configured for production');
}

// Export individual configs for convenience
export const { api, features, ui, storage } = config;
