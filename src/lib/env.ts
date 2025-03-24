/**
 * Safely access environment variables with proper validation
 */

// OpenAI API key for accessing AI features
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Binance API key for accessing P2P market data
export const BINANCE_API_KEY = process.env.NEXT_PUBLIC_BINANCE_API_KEY || '';

// Default application settings
export const DEFAULT_FIAT = process.env.NEXT_PUBLIC_DEFAULT_FIAT || 'USD';
export const DEFAULT_CRYPTO = process.env.NEXT_PUBLIC_DEFAULT_CRYPTO || 'USDT';
export const REFRESH_INTERVAL = parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '5000', 10);

// Check if we're running on the server side
export const isServer = typeof window === 'undefined';

/**
 * Validates that required environment variables are set
 * @returns Object with validation results
 */
export function validateEnv() {
  const missingVars = [];
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.warn('⚠️ OPENAI_API_KEY is not set. AI features will use mock data.');
    missingVars.push('OPENAI_API_KEY');
  }
  
  if (!BINANCE_API_KEY || BINANCE_API_KEY === 'your_binance_api_key_here') {
    console.warn('⚠️ BINANCE_API_KEY is not set. Binance API features may be limited.');
    missingVars.push('BINANCE_API_KEY');
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
} 