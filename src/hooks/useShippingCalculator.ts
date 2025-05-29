import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FedexConfig } from './useFedexConfig';
import { handleApiError, logError, ErrorType, createShippingError } from '@/lib/error-utils';

export interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
}

export interface CalculateRatesParams {
  selectedCollection: string;
  selectedSize: string;
  country: string;
  postalCode: string;
  originCountry: string;
  originPostalCode: string;
  preferredCurrency: string;
  fedexConfig?: FedexConfig;
}

/**
 * Custom hook for shipping rate calculations
 * Extracted from Index.tsx for Phase 2 refactoring - Core business logic
 * Updated for Phase 4 - Using shared error handling utilities
 */
export const useShippingCalculator = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');
  const [lastCalculationParams, setLastCalculationParams] = useState<CalculateRatesParams | null>(null);
  const { toast } = useToast();

  // Main calculation function
  const calculateRates = async (params: CalculateRatesParams) => {
    const {
      selectedCollection,
      selectedSize,
      country,
      postalCode,
      originCountry,
      originPostalCode,
      preferredCurrency,
      fedexConfig
    } = params;

    // Validation - FedEx config must be provided
    if (!fedexConfig) {
      const errorMsg = "FedEx configuration is required to calculate rates";
      const error = createShippingError(
        ErrorType.CONFIGURATION_ERROR,
        errorMsg,
        'CONFIG_MISSING',
        null,
        'useShippingCalculator.calculateRates'
      );
      setError(errorMsg);
      logError(error, 'useShippingCalculator.calculateRates.validation');
      toast({
        title: "Configuration Error",
        description: errorMsg,
        variant: "destructive",
      });
      return false;
    }

    // Validation - all required fields
    if (!selectedCollection || !selectedSize || !country || !postalCode || 
        !originCountry || !originPostalCode || !preferredCurrency) {
      const errorMsg = "Please fill in all required fields before calculating rates";
      const error = createShippingError(
        ErrorType.VALIDATION,
        errorMsg,
        'MISSING_REQUIRED_FIELDS',
        { params },
        'useShippingCalculator.calculateRates'
      );
      setError(errorMsg);
      logError(error, 'useShippingCalculator.calculateRates.validation');
      toast({
        title: "Validation Error",
        description: errorMsg,
        variant: "destructive",
      });
      return false;
    }

    setIsCalculating(true);
    setError('');
    setRates([]);
    setLastCalculationParams(params);

    try {
      // Enhanced feedback during calculation
      toast({
        title: "Calculating Rates",
        description: `Contacting FedEx API for rates in ${preferredCurrency}...`,
      });

      console.log('🚀 Starting FedEx rate calculation with params:', {
        collection: selectedCollection,
        size: selectedSize,
        origin: `${originCountry} ${originPostalCode}`,
        destination: `${country} ${postalCode}`,
        currency: preferredCurrency
      });

      const response = await supabase.functions.invoke('calculate-shipping', {
        body: {
          collection: selectedCollection,
          size: selectedSize,
          country,
          postalCode,
          originCountry,
          originPostalCode,
          preferredCurrency,
          fedexConfig,
        },
      });

      // Enhanced logging of raw response
      console.log('📦 Raw API Response:', response);
      console.log('📊 Response Data:', response.data);
      
      if (response.data) {
        console.log('✅ Response Success:', response.data.success);
        console.log('📋 Response Rates:', response.data.rates);
        console.log('🆔 Request ID:', response.data.requestId);
        
        // Log detailed rate information
        if (response.data.rates && Array.isArray(response.data.rates)) {
          response.data.rates.forEach((rate: any, index: number) => {
            console.log(`📍 Rate ${index + 1}:`, {
              service: rate.service,
              cost: rate.cost,
              costType: typeof rate.cost,
              currency: rate.currency,
              transitTime: rate.transitTime,
              rawData: rate
            });
          });
        }
      }

      if (response.error) {
        console.error('❌ API Error:', response.error);
        throw response.error;
      }

      const calculatedRates = response.data?.rates || [];
      setRates(calculatedRates);
      
      if (calculatedRates.length === 0) {
        const noRatesMessage = "No shipping options available for this destination.";
        setError(noRatesMessage);
        console.warn('⚠️ No rates found in response');
        toast({
          title: "No Rates Found",
          description: noRatesMessage,
          variant: "destructive",
        });
      } else {
        // Success feedback with detailed logging
        console.log(`✅ Successfully retrieved ${calculatedRates.length} rates`);
        calculatedRates.forEach((rate: ShippingRate, index: number) => {
          console.log(`💰 Final Rate ${index + 1}:`, {
            service: rate.service,
            displayCost: `${rate.currency} ${rate.cost}`,
            rawCost: rate.cost,
            transitTime: rate.transitTime
          });
        });
        
        toast({
          title: "Rates Calculated",
          description: `Found ${calculatedRates.length} shipping options in ${preferredCurrency}.`,
        });
      }
      
      return true;
    } catch (err) {
      console.error('❌ Calculation Error:', err);
      logError(err as Error, 'useShippingCalculator.calculateRates', { params });
      
      const { message, type } = handleApiError(err);
      setError(message);
      
      // Enhanced error feedback based on error type
      const title = type === ErrorType.AUTH_ERROR ? "Authentication Error" :
                   type === ErrorType.NETWORK_ERROR ? "Network Error" :
                   type === ErrorType.PERMISSION_ERROR ? "Permission Error" :
                   "Calculation Error";
      
      toast({
        title,
        description: message,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsCalculating(false);
    }
  };

  // Clear rates and error state
  const clearRates = () => {
    setRates([]);
    setError('');
    setLastCalculationParams(null);
  };

  // Retry last calculation
  const retryLastCalculation = async () => {
    if (!lastCalculationParams) {
      toast({
        title: "No Previous Calculation",
        description: "No previous calculation to retry.",
        variant: "destructive",
      });
      return false;
    }
    
    return await calculateRates(lastCalculationParams);
  };

  // Get calculation summary
  const getCalculationSummary = () => {
    if (!lastCalculationParams) return null;
    
    return {
      collection: lastCalculationParams.selectedCollection,
      size: lastCalculationParams.selectedSize,
      destination: {
        country: lastCalculationParams.country,
        postalCode: lastCalculationParams.postalCode,
      },
      origin: {
        country: lastCalculationParams.originCountry,
        postalCode: lastCalculationParams.originPostalCode,
      },
      currency: lastCalculationParams.preferredCurrency,
      ratesFound: rates.length,
      hasError: !!error,
      timestamp: new Date().toISOString(),
    };
  };

  // Get cheapest rate
  const getCheapestRate = (): ShippingRate | null => {
    if (rates.length === 0) return null;
    return rates.reduce((cheapest, current) => 
      current.cost < cheapest.cost ? current : cheapest
    );
  };

  // Get fastest rate (shortest transit time)
  const getFastestRate = (): ShippingRate | null => {
    if (rates.length === 0) return null;
    return rates.reduce((fastest, current) => {
      const fastestDays = parseInt(fastest.transitTime.split(' ')[0]) || 999;
      const currentDays = parseInt(current.transitTime.split(' ')[0]) || 999;
      return currentDays < fastestDays ? current : fastest;
    });
  };

  return {
    // State
    rates,
    isCalculating,
    error,
    lastCalculationParams,
    
    // Actions
    calculateRates,
    clearRates,
    retryLastCalculation,
    
    // Utilities
    getCalculationSummary,
    getCheapestRate,
    getFastestRate,
    
    // Status
    hasRates: rates.length > 0,
    hasError: !!error,
    hasCalculated: !!lastCalculationParams,
    canRetry: !!lastCalculationParams && !isCalculating,
  };
};
