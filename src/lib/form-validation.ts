// Form validation utilities for shipping calculator
// Centralized validation rules for Phase 2 refactoring

import { validateOriginAddress, ValidationResult } from './utils';

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
    const originValidation = validateOriginAddress(data.originCountry, data.originPostalCode);
    if (!originValidation.isValid) {
      errors.push(`Origin address: ${originValidation.error}`);
    }
  }

  // Currency validation
  if (data.preferredCurrency && !isValidCurrency(data.preferredCurrency)) {
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
  } else if (!isValidFedexAccountNumber(config.accountNumber)) {
    errors.push('FedEx account number format is invalid');
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
 */
export const isValidFedexAccountNumber = (accountNumber: string): boolean => {
  if (!accountNumber) return false;
  
  // FedEx account numbers are typically 9 digits
  const cleaned = accountNumber.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 12;
};

/**
 * Basic currency code validation
 */
export const isValidCurrency = (currency: string): boolean => {
  if (!currency) return false;
  
  // Currency codes are typically 3 uppercase letters (ISO 4217)
  return /^[A-Z]{3}$/.test(currency.trim().toUpperCase());
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
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>'"]/g, '');
};

/**
 * Validate postal code format for specific country
 */
export const validatePostalCodeForCountry = (postalCode: string, countryCode: string): ValidationResult => {
  if (!postalCode?.trim()) {
    return { isValid: false, error: 'Postal code is required' };
  }

  if (!countryCode?.trim()) {
    return { isValid: false, error: 'Country code is required' };
  }

  const sanitized = sanitizeInput(postalCode);
  
  // Use existing validation from utils
  return validateOriginAddress(countryCode, sanitized);
};
