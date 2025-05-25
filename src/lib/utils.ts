import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Origin address validation utilities for Phase 2 implementation
export const originAddressDefaults = {
  country: "TH",
  countryName: "Thailand", 
  postalCode: "10240"
} as const;

// Country code validation (ISO 3166-1 alpha-2 format)
export function validateCountryCode(countryCode: string): boolean {
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
}

// Basic postal code format validation
export function validatePostalCode(postalCode: string, countryCode: string): boolean {
  if (!postalCode || !countryCode) return false;
  
  const code = postalCode.trim();
  const country = countryCode.toUpperCase();
  
  // Basic length check (most postal codes are 3-10 characters)
  if (code.length < 3 || code.length > 10) return false;
  
  // Country-specific postal code patterns
  const patterns: Record<string, RegExp> = {
    "US": /^\d{5}(-\d{4})?$/, // 12345 or 12345-1234
    "CA": /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/, // A1A 1A1 or A1A1A1
    "GB": /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, // Various UK formats
    "DE": /^\d{5}$/, // 12345
    "FR": /^\d{5}$/, // 12345
    "JP": /^\d{3}-?\d{4}$/, // 123-1234 or 1231234
    "AU": /^\d{4}$/, // 1234
    "NL": /^\d{4} ?[A-Z]{2}$/i, // 1234 AB or 1234AB
    "CH": /^\d{4}$/, // 1234
    "IT": /^\d{5}$/, // 12345
    "ES": /^\d{5}$/, // 12345
    "TH": /^\d{5}$/, // 12345 (Thailand uses 5-digit postal codes)
    "SG": /^\d{6}$/, // 123456
    "MY": /^\d{5}$/, // 12345
    "HK": /^$/, // Hong Kong doesn't use postal codes
    "CN": /^\d{6}$/, // 123456
    "KR": /^\d{5}$/, // 12345
    "IN": /^\d{6}$/, // 123456
    "BR": /^\d{5}-?\d{3}$/, // 12345-123 or 12345123
    "MX": /^\d{5}$/, // 12345
    "RU": /^\d{6}$/, // 123456
    "ZA": /^\d{4}$/, // 1234
    "IL": /^\d{5,7}$/, // 12345, 123456, or 1234567
    "AE": /^$/, // UAE doesn't use postal codes consistently
    "SA": /^\d{5}(-\d{4})?$/, // 12345 or 12345-1234
  };
  
  // If we have a specific pattern for the country, use it
  if (patterns[country]) {
    return patterns[country].test(code);
  }
  
  // For countries without specific patterns, use general alphanumeric validation
  return /^[A-Z0-9\s\-]{3,10}$/i.test(code);
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateOriginAddress(country: string, postalCode: string): ValidationResult {
  if (!country.trim()) {
    return { isValid: false, error: "Country is required" };
  }
  
  if (!postalCode.trim()) {
    return { isValid: false, error: "Postal code is required" };
  }
  
  // Updated validation: Only accept 2-letter country codes
  if (country.length !== 2) {
    return { isValid: false, error: "Country must be a 2-letter code (e.g., TH, US, GB)" };
  }
  
  if (!validateCountryCode(country)) {
    return { isValid: false, error: "Invalid country code (use ISO 3166-1 alpha-2 format like 'TH', 'US', 'GB')" };
  }
  
  if (!validatePostalCode(postalCode, country)) {
    return { isValid: false, error: "Invalid postal code format for the specified country" };
  }
  
  return { isValid: true };
}
