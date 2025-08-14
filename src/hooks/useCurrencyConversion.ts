/**
 * React Hook for Currency Conversion
 * Manages exchange rates and conversion from THB to preferred currencies
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchExchangeRate,
  convertCurrency,
  formatPrice,
  ExchangeRateResponse,
  clearExchangeRateCache
} from '@/lib/currency-exchange';
import { useToast } from '@/hooks/use-toast';

// Hook return type
export interface CurrencyConversionState {
  // Exchange rate data
  exchangeRate: number | null;
  fromCurrency: string;
  toCurrency: string;
  lastUpdated: Date | null;
  isFromCache: boolean;
  
  // Status
  isLoading: boolean;
  error: string | null;
  
  // Functions
  convertAmount: (amount: number) => number | null;
  formatDualCurrency: (amount: number, showOriginal?: boolean) => string;
  refreshRate: () => Promise<void>;
  getExchangeRateDisplay: () => string;
}

/**
 * Custom hook for currency conversion
 * @param preferredCurrency - The target currency to convert to
 * @param baseCurrency - The base currency (defaults to THB)
 * @returns Currency conversion state and functions
 */
export function useCurrencyConversion(
  preferredCurrency: string,
  baseCurrency: string = 'THB'
): CurrencyConversionState {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Normalize currencies
  const fromCurrency = baseCurrency.toUpperCase();
  const toCurrency = preferredCurrency ? preferredCurrency.toUpperCase() : '';

  // Fetch exchange rate
  const fetchRate = useCallback(async (showToast = false) => {
    // Skip if no target currency or same as base
    if (!toCurrency || fromCurrency === toCurrency) {
      setExchangeRate(1);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rateData = await fetchExchangeRate(fromCurrency, toCurrency);

      if (rateData) {
        setExchangeRate(rateData.rate);
        setLastUpdated(rateData.lastUpdated);
        setIsFromCache(rateData.isFromCache);

        if (showToast) {
          toast({
            title: "Exchange Rate Updated",
            description: `1 ${fromCurrency} = ${rateData.rate.toFixed(4)} ${toCurrency}${
              rateData.isFromCache ? ' (cached)' : ''
            }`,
          });
        }
      } else {
        throw new Error('Failed to fetch exchange rate');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch exchange rate';
      setError(errorMessage);
      
      // Don't show error toast on initial load
      if (showToast) {
        toast({
          title: "Exchange Rate Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      // Set rate to null to indicate conversion unavailable
      setExchangeRate(null);
    } finally {
      setIsLoading(false);
    }
  }, [fromCurrency, toCurrency, toast]);

  // Fetch rate when currency changes
  useEffect(() => {
    if (toCurrency && fromCurrency) {
      fetchRate(false);
    }
  }, [toCurrency, fromCurrency, fetchRate]);

  // Convert amount using current exchange rate
  const convertAmount = useCallback((amount: number): number | null => {
    if (!exchangeRate) return null;
    return amount * exchangeRate;
  }, [exchangeRate]);

  // Format price with dual currency display
  const formatDualCurrency = useCallback((amount: number, showOriginal = true): string => {
    // If no conversion available or same currency, show single currency
    if (!exchangeRate || !toCurrency || fromCurrency === toCurrency) {
      return formatPrice(amount, fromCurrency);
    }

    const converted = convertAmount(amount);
    if (converted === null) {
      return formatPrice(amount, fromCurrency);
    }

    // Show both currencies
    if (showOriginal) {
      return `${formatPrice(amount, fromCurrency)} (${formatPrice(converted, toCurrency)})`;
    } else {
      // Just show converted amount
      return formatPrice(converted, toCurrency);
    }
  }, [exchangeRate, fromCurrency, toCurrency, convertAmount]);

  // Refresh exchange rate manually
  const refreshRate = useCallback(async () => {
    // Clear cache for this currency pair
    clearExchangeRateCache();
    await fetchRate(true);
  }, [fetchRate]);

  // Get exchange rate display string
  const getExchangeRateDisplay = useCallback((): string => {
    if (!exchangeRate || !toCurrency || fromCurrency === toCurrency) {
      return '';
    }
    return `1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency}`;
  }, [exchangeRate, fromCurrency, toCurrency]);

  return {
    // Exchange rate data
    exchangeRate,
    fromCurrency,
    toCurrency,
    lastUpdated,
    isFromCache,
    
    // Status
    isLoading,
    error,
    
    // Functions
    convertAmount,
    formatDualCurrency,
    refreshRate,
    getExchangeRateDisplay,
  };
}

/**
 * Hook to convert shipping rates array
 * @param rates - Array of shipping rates
 * @param preferredCurrency - Target currency
 * @returns Rates with converted prices
 */
export function useConvertedRates(
  rates: Array<{ cost: number; currency: string; [key: string]: any }>,
  preferredCurrency: string
) {
  const { convertAmount, exchangeRate } = useCurrencyConversion(preferredCurrency, 'THB');
  
  const convertedRates = useMemo(() => {
    if (!rates || rates.length === 0) return [];
    
    return rates.map(rate => {
      // Skip if already in preferred currency or no conversion available
      if (rate.currency === preferredCurrency || !exchangeRate) {
        return rate;
      }
      
      const convertedCost = convertAmount(rate.cost);
      
      return {
        ...rate,
        originalCost: rate.cost,
        originalCurrency: rate.currency,
        convertedCost,
        convertedCurrency: preferredCurrency,
        hasConversion: convertedCost !== null
      };
    });
  }, [rates, preferredCurrency, exchangeRate, convertAmount]);
  
  return convertedRates;
}