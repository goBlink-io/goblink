/**
 * Environment variable validation utility.
 * Ensures required env vars are present at build/startup time.
 */

const requiredEnvVars = [
  'ONE_CLICK_JWT',
  'ONE_CLICK_BASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const optionalEnvVars = [
  'BLOCKVISION_API_KEY',
  'NEAR_RPC_URL',
  'SOLANA_RPC_URL',
  'SUI_RPC_URL',
  'ETHEREUM_RPC_URL',
  'BASE_RPC_URL',
  'ARBITRUM_RPC_URL',
  'OPTIMISM_RPC_URL',
  'POLYGON_RPC_URL',
  'BSC_RPC_URL',
  'AVALANCHE_RPC_URL',
  'TRON_API_KEY',
  'TRON_API_URL',
  'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
] as const;

/**
 * Validate that all required environment variables are present
 * @throws Error if any required env vars are missing
 */
export function validateEnv(): void {
  const missing: string[] = [];
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    const errorMessage = [
      '❌ Missing required environment variables:',
      ...missing.map(v => `  - ${v}`),
      '',
      'Please check your .env file or deployment configuration.',
      'See .env.example for reference.',
    ].join('\n');
    
    throw new Error(errorMessage);
  }
  
  // Warn about optional vars in development
  if (process.env.NODE_ENV === 'development') {
    const missingOptional: string[] = [];
    
    for (const varName of optionalEnvVars) {
      if (!process.env[varName]) {
        missingOptional.push(varName);
      }
    }
    
    if (missingOptional.length > 0) {
      console.warn('⚠️  Optional environment variables not set:');
      missingOptional.forEach(v => console.warn(`  - ${v}`));
      console.warn('Some features may use default values or be unavailable.\n');
    }
  }
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key: string, fallback?: string): string {
  return process.env[key] || fallback || '';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
