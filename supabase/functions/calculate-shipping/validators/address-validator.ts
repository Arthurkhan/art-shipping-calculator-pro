/**
 * Address validation utilities
 */

import { Logger } from '../lib/logger.ts';
import { ErrorType, ShippingError } from '../types/index.ts';

/**
 * Address Validator
 */
export class AddressValidator {
  /**
   * Validate postal code format for specific countries
   */
  static validatePostalCode(postalCode: string, countryCode: string): boolean {
    const patterns: { [key: string]: RegExp } = {
      'US': /^\d{5}(-\d{4})?$/,
      'CA': /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
      'GB': /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
      'DE': /^\d{5}$/,
      'FR': /^\d{5}$/,
      'IT': /^\d{5}$/,
      'ES': /^\d{5}$/,
      'NL': /^\d{4}\s?[A-Z]{2}$/i,
      'AU': /^\d{4}$/,
      'JP': /^\d{3}-\d{4}$/,
      'TH': /^\d{5}$/,
      'SG': /^\d{6}$/,
      'HK': /^\d{6}$/,
      'ID': /^\d{5}$/,
      'MY': /^\d{5}$/,
      'PH': /^\d{4}$/,
      'VN': /^\d{6}$/,
      'IN': /^\d{6}$/,
      'KR': /^\d{5}$/,
      'TW': /^\d{3}(\d{2})?$/,
      'CN': /^\d{6}$/,
      'BR': /^\d{5}-?\d{3}$/,
      'MX': /^\d{5}$/
    };

    const pattern = patterns[countryCode];
    if (!pattern) {
      // For countries without specific patterns, use basic validation
      return /^[A-Z0-9\s-]{3,10}$/i.test(postalCode);
    }

    const isValid = pattern.test(postalCode);
    
    if (!isValid) {
      Logger.warn('Postal code validation failed', { postalCode, countryCode, pattern: pattern.toString() });
    }
    
    return isValid;
  }

  /**
   * Validate country code format
   */
  static validateCountryCode(countryCode: string): boolean {
    // Basic ISO 3166-1 alpha-2 format validation
    return /^[A-Z]{2}$/.test(countryCode);
  }

  /**
   * Validate full address
   */
  static validateAddress(postalCode: string, countryCode: string): void {
    if (!this.validateCountryCode(countryCode)) {
      throw new ShippingError(
        ErrorType.VALIDATION,
        `Invalid country code: ${countryCode}`,
        'Please select a valid destination country.'
      );
    }

    if (!this.validatePostalCode(postalCode, countryCode)) {
      throw new ShippingError(
        ErrorType.VALIDATION,
        `Invalid postal code ${postalCode} for country ${countryCode}`,
        `Please enter a valid postal code for ${countryCode}.`
      );
    }

    Logger.info('Address validation successful', { postalCode, countryCode });
  }

  /**
   * Get supported countries list
   */
  static getSupportedCountries(): string[] {
    return [
      'US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'BE',
      'JP', 'AU', 'TH', 'SG', 'HK', 'ID', 'MY', 'PH', 'VN', 'IN',
      'KR', 'TW', 'CN', 'BR', 'MX'
    ];
  }
}
