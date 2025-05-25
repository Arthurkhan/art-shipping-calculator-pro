import { useState, useEffect } from 'react';
import { originAddressDefaults, validateOriginAddress } from '@/lib/utils';
import { originStorage } from '@/lib/storage-utils';
import { initializeOriginDefaults, getOriginAddress, updateOriginCountry, updateOriginPostalCode } from '@/lib/origin-address';

/**
 * Custom hook for managing origin address with Thailand defaults
 * Extracted from Index.tsx for Phase 2 refactoring
 * Updated: Now uses 2-letter country codes only
 */
export const useOriginAddress = () => {
  // Initialize origin address with Thailand defaults (2-letter code)
  const [originCountry, setOriginCountry] = useState(() => {
    const savedCountry = originStorage.getOriginCountry('');
    // Ensure we use 2-letter code, convert if necessary
    if (savedCountry === 'Thailand') {
      return originAddressDefaults.country; // "TH"
    }
    return savedCountry || originAddressDefaults.country; // "TH"
  });
  
  const [originPostalCode, setOriginPostalCode] = useState(() => {
    const savedPostalCode = originStorage.getOriginPostalCode('');
    return savedPostalCode || originAddressDefaults.postalCode;
  });

  // Initialize defaults on mount
  useEffect(() => {
    initializeOriginDefaults();
  }, []);

  // Handle origin country change with automatic uppercase conversion
  const handleOriginCountryChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setOriginCountry(upperValue);
    updateOriginCountry(upperValue);
  };

  // Handle origin postal code change
  const handleOriginPostalCodeChange = (value: string) => {
    setOriginPostalCode(value);
    updateOriginPostalCode(value);
  };

  // Validate current origin address
  const validateOrigin = () => {
    return validateOriginAddress(originCountry, originPostalCode);
  };

  // Reset to defaults (using 2-letter code)
  const resetToDefaults = () => {
    setOriginCountry(originAddressDefaults.country); // "TH"
    setOriginPostalCode(originAddressDefaults.postalCode);
    updateOriginCountry(originAddressDefaults.country); // "TH"
    updateOriginPostalCode(originAddressDefaults.postalCode);
  };

  // Get current origin address
  const getCurrentOriginAddress = () => {
    return {
      country: originCountry,
      postalCode: originPostalCode,
      countryCode: originCountry, // Now same as country since we only use codes
    };
  };

  return {
    // State
    originCountry,
    originPostalCode,
    
    // Actions
    handleOriginCountryChange,
    handleOriginPostalCodeChange,
    resetToDefaults,
    
    // Utilities
    validateOrigin,
    getCurrentOriginAddress,
    
    // Status
    isValid: validateOriginAddress(originCountry, originPostalCode).isValid,
  };
};
