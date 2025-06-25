import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FedexConfig } from './useFedexConfig';
import { 
  handleApiError, 
  logError, 
  ErrorType, 
  createShippingError,
  isServiceAvailabilityError,
  getRouteAlternatives 
} from '@/lib/error-utils';

// Extend window interface for debug handler
declare global {
  interface Window {
    __debugResponseHandler?: (data: unknown) => void;
  }
}

export interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
  rateType?: string;      // Added to match backend and ResultsDisplay expectations
  isLastMinute?: boolean; // Added to match backend and ResultsDisplay expectations
  isAlternative?: boolean; // Added to match backend and ResultsDisplay expectations
}

export interface OverrideData {
  weight_kg: number;
  height_cm: number;
  length_cm: number;
  width_cm: number;
  quantity: number;
}

export interface CalculateRatesParams {
  selectedCollection: string;
  selectedSize: string;
  country: string;
  postalCode: string;
  originCountry: string;
  originPostalCode: string;
  preferredCurrency: string;
  shipDate?: string; // Optional ship date in YYYY-MM-DD format
  fedexConfig?: FedexConfig;
  overrideData?: OverrideData | null; // New field for override data
}

export interface ServiceAvailabilityError {
  isServiceError: boolean;
  origin: { country: string; postalCode: string };
  destination: { country: string; postalCode: string };
  suggestions: string[];
  message: string;
}

/**
 * Custom hook for shipping rate calculations
 * Extracted from Index.tsx for Phase 2 refactoring - Core business logic
 * Updated for Phase 4 - Using shared error handling utilities
 * Updated for Override Feature - Support custom dimensions and weight
 * Updated to include rate type information for proper display
 * Updated 2025-06-25: Enhanced service availability error handling
 */
export const useShippingCalculator = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');
  const [serviceAvailabilityError, setServiceAvailabilityError] = useState<ServiceAvailabilityError | null>(null);
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
      shipDate,
      fedexConfig,
      overrideData
    } = params;

    // Clear previous errors
    setServiceAvailabilityError(null);

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
    // When override mode is enabled (overrideData is provided), we don't need collection/size
    const needsCollectionAndSize = !overrideData;
    
    if ((needsCollectionAndSize && (!selectedCollection || !selectedSize)) || 
        !country || !postalCode || !originCountry || !originPostalCode || !preferredCurrency) {
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
      const usingOverride = !!overrideData;
      toast({
        title: "Calculating Rates",
        description: `Contacting FedEx API for rates in ${preferredCurrency}${usingOverride ? ' (using custom dimensions)' : ''}...`,
      });

      console.log('🚀 Starting FedEx rate calculation with params:', {
        collection: selectedCollection || 'Not required (override mode)',
        size: selectedSize || 'Not required (override mode)',
        origin: `${originCountry} ${originPostalCode}`,
        destination: `${country} ${postalCode}`,
        currency: preferredCurrency,
        shipDate: shipDate || 'Not specified (will use tomorrow)',
        usingOverride,
        overrideData: overrideData || 'Not provided'
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
          shipDate, // Pass ship date to backend
          fedexConfig,
          overrideData, // Pass override data to backend
        },
      });

      // Enhanced logging of raw response
      console.log('📦 Raw API Response:', response);
      console.log('📊 Response Data:', response.data);
      
      // Check if the response has an error from our edge function
      if (response.data && response.data.success === false && response.data.error) {
        // Extract the actual error message from our edge function
        console.log('❌ Edge Function Error:', response.data.error);
        throw new Error(response.data.error);
      }
      
      // Check for Supabase-level errors
      if (response.error) {
        console.error('❌ Supabase Error:', response.error);
        // Try to extract meaningful error from response data if available
        if (response.data && response.data.error) {
          throw new Error(response.data.error);
        }
        throw response.error;
      }
      
      if (response.data) {
        console.log('✅ Response Success:', response.data.success);
        console.log('📋 Response Rates:', response.data.rates);
        console.log('🆔 Request ID:', response.data.requestId);
        
        // LOG RAW FEDEX RESPONSE FOR DEBUGGING
        if (response.data._debug?.rawFedexResponse) {
          console.log('🚨🚨🚨 RAW FEDEX API RESPONSE - COPY THIS! 🚨🚨🚨');
          console.log(JSON.stringify(response.data._debug.rawFedexResponse, null, 2));
          console.log('🚨🚨🚨 END OF RAW FEDEX RESPONSE 🚨🚨🚨');
          
          // Call the debug handler if it exists
          if (window.__debugResponseHandler) {
            window.__debugResponseHandler(response.data);
          }
        }
        
        // Log detailed rate information
        if (response.data.rates && Array.isArray(response.data.rates)) {
          response.data.rates.forEach((rate: ShippingRate, index: number) => {
            console.log(`📍 Rate ${index + 1}:`, {
              service: rate.service,
              cost: rate.cost,
              costType: typeof rate.cost,
              currency: rate.currency,
              transitTime: rate.transitTime,
              rateType: rate.rateType,
              isLastMinute: rate.isLastMinute,
              rawData: rate
            });
          });
        }
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
            transitTime: rate.transitTime,
            rateType: rate.rateType
          });
        });
        
        toast({
          title: "Rates Calculated",
          description: `Found ${calculatedRates.length} shipping options in ${preferredCurrency}${usingOverride ? ' using custom dimensions' : ''}.`,
        });
      }
      
      return true;
    } catch (err) {
      console.error('❌ Calculation Error:', err);
      
      // Extract error message
      let errorMessage = '';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as any).message;
      } else {
        errorMessage = 'An unexpected error occurred';
      }
      
      logError(new Error(errorMessage), 'useShippingCalculator.calculateRates', { params });
      
      const errorInfo = handleApiError(errorMessage);
      setError(errorInfo.message);
      
      // Check if it's a service availability error
      if (errorInfo.isServiceAvailability || isServiceAvailabilityError(errorMessage)) {
        const alternatives = getRouteAlternatives(originCountry, country);
        
        setServiceAvailabilityError({
          isServiceError: true,
          origin: { country: originCountry, postalCode: originPostalCode },
          destination: { country, postalCode },
          suggestions: alternatives.friendlyNames,
          message: errorInfo.message
        });
        
        // Special toast for service availability
        toast({
          title: "Service Not Available",
          description: "FedEx doesn't offer direct service for this route. See suggestions below.",
          variant: "destructive",
          duration: 8000, // Show longer
        });
      } else {
        // Enhanced error feedback based on error type
        const title = errorInfo.type === ErrorType.AUTH_ERROR ? "Authentication Error" :
                     errorInfo.type === ErrorType.NETWORK_ERROR ? "Network Error" :
                     errorInfo.type === ErrorType.PERMISSION_ERROR ? "Permission Error" :
                     "Calculation Error";
        
        toast({
          title,
          description: errorInfo.message,
          variant: "destructive",
        });
      }
      
      return false;
    } finally {
      setIsCalculating(false);
    }
  };

  // Clear rates and error state
  const clearRates = () => {
    setRates([]);
    setError('');
    setServiceAvailabilityError(null);
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
      shipDate: lastCalculationParams.shipDate,
      overrideData: lastCalculationParams.overrideData,
      ratesFound: rates.length,
      hasError: !!error,
      hasServiceError: !!serviceAvailabilityError,
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
    serviceAvailabilityError,
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
    hasServiceError: !!serviceAvailabilityError,
    hasCalculated: !!lastCalculationParams,
    canRetry: !!lastCalculationParams && !isCalculating,
  };
};
