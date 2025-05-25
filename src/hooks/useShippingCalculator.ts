import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FedexConfig } from './useFedexConfig';

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
      setError(errorMsg);
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
      setError(errorMsg);
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

      if (response.error) {
        // Enhanced error handling with more specific messages
        const errorMessage = response.error.message || 'Failed to calculate shipping rates';
        
        let userFriendlyError: string;
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          userFriendlyError = 'FedEx API credentials are invalid. Please check your configuration.';
        } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          userFriendlyError = 'Your FedEx account does not have permission to access the API. Please contact FedEx support.';
        } else if (errorMessage.includes('timeout')) {
          userFriendlyError = 'Request timed out. Please try again.';
        } else {
          userFriendlyError = errorMessage;
        }
        
        throw new Error(userFriendlyError);
      }

      const calculatedRates = response.data?.rates || [];
      setRates(calculatedRates);
      
      if (calculatedRates.length === 0) {
        const noRatesMessage = "No shipping options available for this destination.";
        setError(noRatesMessage);
        toast({
          title: "No Rates Found",
          description: noRatesMessage,
          variant: "destructive",
        });
      } else {
        // Success feedback
        toast({
          title: "Rates Calculated",
          description: `Found ${calculatedRates.length} shipping options in ${preferredCurrency}.`,
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error calculating rates:', err);
      const errorMessage = err instanceof Error ? err.message : "Unable to calculate shipping rates. Please try again later.";
      setError(errorMessage);
      
      // Enhanced error feedback
      toast({
        title: "Calculation Error",
        description: errorMessage,
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
