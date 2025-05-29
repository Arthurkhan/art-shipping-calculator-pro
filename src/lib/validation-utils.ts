/**
 * Standardized validation utilities for shipping calculator
 * Phase 4 implementation - Consolidating validation patterns
 */

import { validateOriginAddress as validateOriginAddressUtil, ValidationResult } from './utils';

/**
 * Validate postal code format for specific country
 */
export const validatePostalCode = (postalCode: string, countryCode: string): ValidationResult => {
  return validateOriginAddressUtil(countryCode, postalCode);
};

/**
 * Validate country code (ISO 3166-1 alpha-2 format)
 */
export const validateCountryCode = (countryCode: string): boolean => {
  if (!countryCode || countryCode.length !== 2) return false;
  
  const validCountryCodes = new Set([
    "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
    "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
    "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
    "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
    "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
    "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
    "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
    "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
    "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
    "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
    "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
    "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
    "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
    "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
    "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
    "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"
  ]);
  
  return validCountryCodes.has(countryCode.toUpperCase());
};

/**
 * Validate FedEx account number
 * FedEx account numbers are typically 9 digits
 */
export const validateFedexAccountNumber = (accountNumber: string): boolean => {
  if (!accountNumber) return false;
  
  // Remove non-digits
  const cleaned = accountNumber.replace(/\D/g, '');
  
  // FedEx account numbers are typically 9 digits, but can be 8-12 digits
  return cleaned.length >= 8 && cleaned.length <= 12;
};

/**
 * Stricter validation for FedEx account number - exactly 9 digits
 */
export const validateFedexAccountNumberStrict = (accountNumber: string): boolean => {
  if (!accountNumber) return false;
  
  // Remove non-digits
  const cleaned = accountNumber.replace(/\D/g, '');
  
  // FedEx account numbers should be exactly 9 digits
  return cleaned.length === 9;
};

/**
 * Validate currency code (ISO 4217 format)
 */
export const validateCurrencyCode = (currency: string): boolean => {
  if (!currency) return false;
  
  // Currency codes are typically 3 uppercase letters
  return /^[A-Z]{3}$/.test(currency.trim().toUpperCase());
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate phone number (basic validation)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  
  // Remove common phone number characters
  const cleaned = phone.replace(/[\s\-()+]/g, '');
  
  // Check if it's all digits and has reasonable length (7-15 digits)
  return /^\d{7,15}$/.test(cleaned);
};

/**
 * Validate numeric value (positive numbers)
 */
export const validatePositiveNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

/**
 * Validate dimension value (positive number with max limit)
 */
export const validateDimension = (value: string | number, maxValue: number = 999): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0 && num <= maxValue;
};

/**
 * Validate weight value (positive number with max limit)
 */
export const validateWeight = (value: string | number, maxWeight: number = 999): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0 && num <= maxWeight;
};

/**
 * Sanitize input string (remove potentially harmful characters)
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input.trim().replace(/[<>'"]/g, '');
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate date format (YYYY-MM-DD)
 */
export const validateDateFormat = (date: string): boolean => {
  if (!date) return false;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  // Check if it's a valid date
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

/**
 * Validate alphanumeric string
 */
export const validateAlphanumeric = (value: string, allowSpaces: boolean = false): boolean => {
  if (!value) return false;
  
  const regex = allowSpaces ? /^[a-zA-Z0-9\s]+$/ : /^[a-zA-Z0-9]+$/;
  return regex.test(value);
};

/**
 * Combined validation result with field name
 */
export interface FieldValidationResult extends ValidationResult {
  field?: string;
}

type ValidationRule = (value: unknown) => boolean;
type FieldRules = Record<string, ValidationRule>;
type FieldValues = Record<string, unknown>;

/**
 * Validate multiple fields at once
 */
export const validateFields = (fields: FieldValues, rules: FieldRules): FieldValidationResult[] => {
  const results: FieldValidationResult[] = [];
  
  for (const [field, validator] of Object.entries(rules)) {
    const value = fields[field];
    const isValid = validator(value);
    
    if (!isValid) {
      results.push({
        isValid: false,
        field,
        error: `${field} is invalid`
      });
    }
  }
  
  return results;
};

/**
 * Check if all validations pass
 */
export const allValidationsPassed = (results: FieldValidationResult[]): boolean => {
  return results.length === 0;
};
