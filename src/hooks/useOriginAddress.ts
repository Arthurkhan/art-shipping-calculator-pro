import { useState, useEffect } from 'react';
import { originAddressDefaults, validateOriginAddress } from '@/lib/utils';
import { originStorage } from '@/lib/storage-utils';
import { initializeOriginDefaults, getOriginAddress, updateOriginCountry, updateOriginPostalCode } from '@/lib/origin-address';

/**
 * Custom hook for managing origin address with Thailand defaults
 * Extracted from Index.tsx for Phase 2 refactoring
 */
export const useOriginAddress = () => {
  // Initialize origin address with Thailand defaults
  const [originCountry, setOriginCountry] = useState(() => {
    const savedCountry = originStorage.getOriginCountry('');
    return savedCountry || originAddressDefaults.countryName;
  });
  
  const [originPostalCode, setOriginPostalCode] = useState(() => {
    const savedPostalCode = originStorage.getOriginPostalCode('');
    return savedPostalCode || originAddressDefaults.postalCode;
  });

  // Initialize defaults on mount
  useEffect(() => {
    initializeOriginDefaults();
  }, []);

  // Handle origin country change
  const handleOriginCountryChange = (value: string) => {
    setOriginCountry(value);
    updateOriginCountry(value);
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

  // Reset to defaults
  const resetToDefaults = () => {
    setOriginCountry(originAddressDefaults.countryName);
    setOriginPostalCode(originAddressDefaults.postalCode);
    updateOriginCountry(originAddressDefaults.countryName);
    updateOriginPostalCode(originAddressDefaults.postalCode);
  };

  // Get current origin address
  const getCurrentOriginAddress = () => {
    return {
      country: originCountry,
      postalCode: originPostalCode,
      countryCode: originAddressDefaults.country,
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
