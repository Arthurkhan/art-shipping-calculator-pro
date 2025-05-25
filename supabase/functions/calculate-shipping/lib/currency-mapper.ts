/**
 * Currency mapping utilities
 */

import { Logger } from './logger.ts';

// Currency mapping for different countries
const CURRENCY_MAP: { [key: string]: string } = {
  'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR',
  'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 'AT': 'EUR', 'BE': 'EUR',
  'JP': 'JPY', 'AU': 'AUD', 'TH': 'THB', 'SG': 'SGD', 'HK': 'HKD',
  'ID': 'IDR', 'MY': 'MYR', 'PH': 'PHP', 'VN': 'VND', 'IN': 'INR',
  'KR': 'KRW', 'TW': 'TWD', 'CN': 'CNY', 'BR': 'BRL', 'MX': 'MXN'
};

/**
 * Get currency - either user-provided or auto-mapped from destination country
 */
export function getPreferredCurrency(userCurrency: string | undefined, destinationCountry: string): string {
  // If user provided a currency, use it
  if (userCurrency && userCurrency.trim()) {
    Logger.info('Using user-provided currency', { userCurrency, destinationCountry });
    return userCurrency.toUpperCase();
  }

  // Fall back to auto-mapping based on destination country
  const autoMappedCurrency = CURRENCY_MAP[destinationCountry] || 'USD';
  Logger.info('Auto-mapped currency from destination country', { 
    destinationCountry, 
    autoMappedCurrency 
  });
  
  return autoMappedCurrency;
}

/**
 * Get auto-suggested currency for a country
 */
export function getAutoSuggestedCurrency(countryCode: string): string {
  return CURRENCY_MAP[countryCode] || 'USD';
}

/**
 * Validate if a currency code is supported
 */
export function validateCurrency(currency: string): boolean {
  const supportedCurrencies = Object.values(CURRENCY_MAP);
  return supportedCurrencies.includes(currency.toUpperCase());
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return Object.values(CURRENCY_MAP);
}

/**
 * Get currency map for reference
 */
export function getCurrencyMap(): { [key: string]: string } {
  return { ...CURRENCY_MAP };
}
