import { useState, useCallback } from 'react';
import { getAutoSuggestedCurrency, validateCurrency, getSupportedCurrencies } from '@/lib/currency-utils';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for managing currency selection with auto-suggestion
 * Extracted from Index.tsx for Phase 2 refactoring
 * Updated: Currency now defaults to empty string for manual selection
 */
export const useCurrencySelector = () => {
  const [preferredCurrency, setPreferredCurrency] = useState<string>(''); // Changed from 'USD' to ''
  const { toast } = useToast();

  // Handle currency change with validation
  const handlePreferredCurrencyChange = useCallback((value: string) => {
    // Allow empty currency selection
    if (!value || validateCurrency(value)) {
      setPreferredCurrency(value);
      if (value) {
        toast({
          title: "Currency Updated",
          description: `Preferred currency changed to ${value}`,
        });
      }
    } else {
      toast({
        title: "Invalid Currency",
        description: `${value} is not a supported currency code`,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Auto-suggest currency based on country code
  const autoSuggestCurrency = useCallback((countryCode: string) => {
    if (!countryCode) return;

    const suggestedCurrency = getAutoSuggestedCurrency(countryCode);
    if (suggestedCurrency !== preferredCurrency) {
      setPreferredCurrency(suggestedCurrency);
      toast({
        title: "Currency Auto-Selected",
        description: `Changed to ${suggestedCurrency} based on destination ${countryCode}. You can modify this if needed.`,
      });
    }
  }, [preferredCurrency, toast]);

  // Reset to default currency (now empty)
  const resetToDefault = useCallback(() => {
    setPreferredCurrency('');
    toast({
      title: "Currency Reset",
      description: "Currency selection cleared",
    });
  }, [toast]);

  // Get list of supported currencies
  const supportedCurrencies = getSupportedCurrencies();

  // Check if current currency is valid (empty is now valid)
  const isCurrentCurrencyValid = !preferredCurrency || validateCurrency(preferredCurrency);

  // Get currency info
  const getCurrencyInfo = () => ({
    code: preferredCurrency,
    isValid: isCurrentCurrencyValid,
    isDefault: preferredCurrency === '',
  });

  return {
    // State
    preferredCurrency,
    
    // Actions
    handlePreferredCurrencyChange,
    autoSuggestCurrency,
    resetToDefault,
    setPreferredCurrency,
    
    // Data
    supportedCurrencies,
    
    // Utilities
    getCurrencyInfo,
    
    // Status
    isCurrentCurrencyValid,
    isDefaultCurrency: preferredCurrency === '',
  };
};
