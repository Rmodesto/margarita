// db/config/environment.ts
export interface EnvironmentConfig {
    database: {
      url: string;
      ssl: boolean;
      maxConnections: number;
    };
    api: {
      baseUrl: string;
    };
    stripe: {
      publicKey: string;
      webhookSecret: string;
    };
  }
  // TODO: Add a new environment for production
  
  const environments = {
    development: {
      database: {
        url:
          process.env.POSTGRES_URL || 'postgresql://localhost:5432/dreamwhisper',
        ssl: false,
        maxConnections: 5,
      },
      api: {
        baseUrl: 'http://localhost:3000',
      },
      stripe: {
        publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      },
    },
    production: {
      database: {
        url: process.env.POSTGRES_URL!,
        ssl: true,
        maxConnections: 20,
      },
      api: {
        baseUrl: process.env.NEXT_PUBLIC_API_URL!,
      },
      stripe: {
        publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      },
    },
  } as const;
  
  // Get current environment
  const environment = process.env.NODE_ENV || 'development';
  
  // Export the config for the current environment
  export const config: EnvironmentConfig =
    environments[environment as keyof typeof environments];
  
  // Export individual configs for easier access
  export const {
    database: dbConfig,
    api: apiConfig,
    stripe: stripeConfig,
  } = config;
  