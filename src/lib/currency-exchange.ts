/**
 * Currency Exchange Service
 * Handles currency conversion from THB to preferred currencies using ExchangeRate API
 */

// API configuration
const API_KEY = '0f2ffd665d71f3f372734e8c';
const BASE_URL = 'https://v6.exchangerate-api.com/v6';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache interface
interface ExchangeRateCache {
  rate: number;
  timestamp: number;
  fromCurrency: string;
  toCurrency: string;
}

// Response interface
export interface ExchangeRateResponse {
  rate: number;
  fromCurrency: string;
  toCurrency: string;
  lastUpdated: Date;
  isFromCache: boolean;
}

// Error interface
export interface ExchangeRateError {
  message: string;
  code: 'NETWORK_ERROR' | 'INVALID_CURRENCY' | 'API_ERROR' | 'RATE_LIMIT';
}

// In-memory cache
const rateCache = new Map<string, ExchangeRateCache>();

/**
 * Format price with proper number formatting
 * @param amount - The amount to format
 * @param currency - The currency code
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency?: string): string {
  const formatted = Math.round(amount).toLocaleString();
  return currency ? `${currency} ${formatted}` : formatted;
}

/**
 * Get cache key for currency pair
 */
function getCacheKey(from: string, to: string): string {
  return `${from.toUpperCase()}_${to.toUpperCase()}`;
}

/**
 * Check if cache is still valid
 */
function isCacheValid(cache: ExchangeRateCache): boolean {
  return Date.now() - cache.timestamp < CACHE_DURATION;
}

/**
 * Fetch exchange rate from API
 * @param fromCurrency - Source currency (THB in most cases)
 * @param toCurrency - Target currency
 * @returns Exchange rate or null if error
 */
export async function fetchExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<ExchangeRateResponse | null> {
  // Normalize currency codes
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  
  // If same currency, return 1:1 rate
  if (from === to) {
    return {
      rate: 1,
      fromCurrency: from,
      toCurrency: to,
      lastUpdated: new Date(),
      isFromCache: false
    };
  }
  
  // Check cache first
  const cacheKey = getCacheKey(from, to);
  const cached = rateCache.get(cacheKey);
  
  if (cached && isCacheValid(cached)) {
    return {
      rate: cached.rate,
      fromCurrency: cached.fromCurrency,
      toCurrency: cached.toCurrency,
      lastUpdated: new Date(cached.timestamp),
      isFromCache: true
    };
  }
  
  try {
    // Fetch from API
    const url = `${BASE_URL}/${API_KEY}/pair/${from}/${to}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        throw { code: 'RATE_LIMIT', message: 'Rate limit exceeded' } as ExchangeRateError;
      }
      throw { code: 'API_ERROR', message: `API error: ${response.status}` } as ExchangeRateError;
    }
    
    const data = await response.json();
    
    if (data.result !== 'success') {
      throw { 
        code: 'INVALID_CURRENCY', 
        message: `Invalid currency pair: ${from}/${to}` 
      } as ExchangeRateError;
    }
    
    const rate = data.conversion_rate;
    const timestamp = Date.now();
    
    // Update cache
    rateCache.set(cacheKey, {
      rate,
      timestamp,
      fromCurrency: from,
      toCurrency: to
    });
    
    return {
      rate,
      fromCurrency: from,
      toCurrency: to,
      lastUpdated: new Date(timestamp),
      isFromCache: false
    };
    
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    
    // If we have expired cache, use it as fallback
    if (cached) {
      return {
        rate: cached.rate,
        fromCurrency: cached.fromCurrency,
        toCurrency: cached.toCurrency,
        lastUpdated: new Date(cached.timestamp),
        isFromCache: true
      };
    }
    
    return null;
  }
}

/**
 * Convert amount from one currency to another
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Converted amount or null if error
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  const rateData = await fetchExchangeRate(fromCurrency, toCurrency);
  
  if (!rateData) {
    return null;
  }
  
  return amount * rateData.rate;
}

/**
 * Convert and format price
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Formatted string with both currencies or null
 */
export async function convertAndFormatPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<string | null> {
  // If same currency, just return formatted amount
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return formatPrice(amount, fromCurrency);
  }
  
  const converted = await convertCurrency(amount, fromCurrency, toCurrency);
  
  if (converted === null) {
    return null;
  }
  
  // Return both original and converted
  return `${formatPrice(amount, fromCurrency)} (${formatPrice(converted, toCurrency)})`;
}

/**
 * Get exchange rate display string
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Exchange rate string or null
 */
export async function getExchangeRateDisplay(
  fromCurrency: string,
  toCurrency: string
): Promise<string | null> {
  const rateData = await fetchExchangeRate(fromCurrency, toCurrency);
  
  if (!rateData) {
    return null;
  }
  
  return `1 ${rateData.fromCurrency} = ${rateData.rate.toFixed(4)} ${rateData.toCurrency}`;
}

/**
 * Clear the exchange rate cache
 */
export function clearExchangeRateCache(): void {
  rateCache.clear();
}

/**
 * Batch convert multiple amounts
 * @param amounts - Array of amounts to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Array of converted amounts
 */
export async function batchConvertCurrency(
  amounts: number[],
  fromCurrency: string,
  toCurrency: string
): Promise<(number | null)[]> {
  const rateData = await fetchExchangeRate(fromCurrency, toCurrency);
  
  if (!rateData) {
    return amounts.map(() => null);
  }
  
  return amounts.map(amount => amount * rateData.rate);
}