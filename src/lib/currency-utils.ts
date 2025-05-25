// Currency mapping and utilities for shipping calculator
// Centralized currency mapping for Phase 2 refactoring

export const CURRENCY_MAP: Record<string, string> = {
  'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR',
  'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 'AT': 'EUR', 'BE': 'EUR',
  'JP': 'JPY', 'AU': 'AUD', 'TH': 'THB', 'SG': 'SGD', 'HK': 'HKD',
  'ID': 'IDR', 'MY': 'MYR', 'PH': 'PHP', 'VN': 'VND', 'IN': 'INR',
  'KR': 'KRW', 'TW': 'TWD', 'CN': 'CNY', 'BR': 'BRL', 'MX': 'MXN'
};

/**
 * Get auto-suggested currency based on country code
 */
export const getCurrencyForCountry = (countryCode: string): string => {
  return CURRENCY_MAP[countryCode] || 'USD'; // Default to USD
};

/**
 * Get auto-suggested currency with fallback to USD
 */
export const getAutoSuggestedCurrency = (countryCode: string): string => {
  return getCurrencyForCountry(countryCode);
};

/**
 * Validate if currency is supported
 */
export const validateCurrency = (currency: string): boolean => {
  const supportedCurrencies = new Set(Object.values(CURRENCY_MAP));
  supportedCurrencies.add('USD'); // Ensure USD is always supported
  return supportedCurrencies.has(currency);
};

/**
 * Get list of all supported currencies
 */
export const getSupportedCurrencies = (): string[] => {
  const currencies = new Set(Object.values(CURRENCY_MAP));
  currencies.add('USD'); // Ensure USD is included
  return Array.from(currencies).sort();
};
