// Form validation utilities for shipping calculator
// Centralized validation rules for Phase 2 refactoring
// Updated for Phase 4 - Using shared validation utilities

import { 
  validateCountryCode, 
  validateFedexAccountNumber,
  validateCurrencyCode,
  validatePostalCode,
  sanitizeInput as sanitizeInputUtil,
  ValidationResult 
} from '@/lib/validation-utils';

export interface FormValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validate shipping form fields
 */
export const validateShippingForm = (data: {
  selectedCollection: string;
  selectedSize: string;
  country: string;
  postalCode: string;
  originCountry: string;
  originPostalCode: string;
  preferredCurrency: string;
}): FormValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!data.selectedCollection?.trim()) {
    errors.push('Art collection selection is required');
  }

  if (!data.selectedSize?.trim()) {
    errors.push('Artwork size selection is required');
  }

  if (!data.country?.trim()) {
    errors.push('Destination country is required');
  }

  if (!data.postalCode?.trim()) {
    errors.push('Destination postal code is required');
  }

  if (!data.originCountry?.trim()) {
    errors.push('Origin country is required');
  }

  if (!data.originPostalCode?.trim()) {
    errors.push('Origin postal code is required');
  }

  if (!data.preferredCurrency?.trim()) {
    errors.push('Preferred currency is required');
  }

  // Origin address validation
  if (data.originCountry && data.originPostalCode) {
    const originValidation = validatePostalCode(data.originPostalCode, data.originCountry);
    if (!originValidation.isValid) {
      errors.push(`Origin address: ${originValidation.error}`);
    }
  }

  // Destination address validation
  if (data.country && data.postalCode) {
    const destValidation = validatePostalCode(data.postalCode, data.country);
    if (!destValidation.isValid) {
      errors.push(`Destination address: ${destValidation.error}`);
    }
  }

  // Country code validation
  if (data.country && !validateCountryCode(data.country)) {
    errors.push('Invalid destination country code');
  }

  if (data.originCountry && !validateCountryCode(data.originCountry)) {
    errors.push('Invalid origin country code');
  }

  // Currency validation
  if (data.preferredCurrency && !validateCurrencyCode(data.preferredCurrency)) {
    errors.push('Invalid currency format');
  }

  // Additional business rule validations
  if (data.country && data.originCountry && data.country === data.originCountry) {
    warnings.push('Destination and origin countries are the same - this may result in domestic shipping rates');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Validate FedEx configuration
 */
export const validateFedexConfig = (config: {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}): FormValidationResult => {
  const errors: string[] = [];

  if (!config.accountNumber?.trim()) {
    errors.push('FedEx account number is required');
  } else if (!validateFedexAccountNumber(config.accountNumber)) {
    errors.push('FedEx account number format is invalid (should be 8-12 digits)');
  }

  if (!config.clientId?.trim()) {
    errors.push('FedEx client ID is required');
  }

  if (!config.clientSecret?.trim()) {
    errors.push('FedEx client secret is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Check if FedEx account number format is valid
 * Delegating to shared validation utility
 */
export const isValidFedexAccountNumber = (accountNumber: string): boolean => {
  return validateFedexAccountNumber(accountNumber);
};

/**
 * Basic currency code validation
 * Delegating to shared validation utility
 */
export const isValidCurrency = (currency: string): boolean => {
  return validateCurrencyCode(currency);
};

/**
 * Validate collection and size combination
 */
export const validateCollectionSize = (collection: string, size: string): FormValidationResult => {
  const errors: string[] = [];

  if (!collection?.trim()) {
    errors.push('Collection must be selected');
  }

  if (!size?.trim()) {
    errors.push('Size must be selected');
  }

  if (collection && !size) {
    errors.push('Please select a size for the chosen collection');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get validation status type
 */
export type ValidationStatus = 'missing' | 'partial' | 'complete' | 'invalid';

/**
 * Get FedEx configuration status
 */
export const getFedexConfigStatus = (config: {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}): ValidationStatus => {
  const { accountNumber, clientId, clientSecret } = config;

  if (!accountNumber && !clientId && !clientSecret) {
    return 'missing';
  }

  if (!accountNumber || !clientId || !clientSecret) {
    return 'partial';
  }

  const validation = validateFedexConfig(config);
  if (!validation.isValid) {
    return 'invalid';
  }

  return 'complete';
};

/**
 * Sanitize input strings
 * Delegating to shared validation utility
 */
export const sanitizeInput = (input: string): string => {
  return sanitizeInputUtil(input);
};

/**
 * Validate postal code format for specific country
 * Delegating to shared validation utility
 */
export const validatePostalCodeForCountry = (postalCode: string, countryCode: string): ValidationResult => {
  return validatePostalCode(postalCode, countryCode);
};
