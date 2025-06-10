/**
 * Input validation for shipping requests
 */

import { Logger } from '../lib/logger.ts';
import { ErrorType, ShippingError } from '../types/index.ts';
import type { ShippingRequest, FedexConfig } from '../types/index.ts';

/**
 * Request Validator
 */
export class RequestValidator {
  /**
   * Validate shipping request data
   */
  static validateShippingRequest(requestData: unknown): ShippingRequest {
    if (!requestData || typeof requestData !== 'object') {
      throw new ShippingError(
        ErrorType.VALIDATION,
        'Invalid request data',
        'Invalid request format.'
      );
    }

    const data = requestData as Record<string, unknown>;

    Logger.info('Validating shipping request', { 
      hasCollection: !!data.collection,
      hasSize: !!data.size,
      hasCountry: !!data.country,
      hasPostalCode: !!data.postalCode,
      hasFedexConfig: !!data.fedexConfig
    });

    // Validate required fields
    if (!data.collection || !data.size || !data.country || !data.postalCode) {
      throw new ShippingError(
        ErrorType.VALIDATION,
        'Missing required fields',
        'Please fill in all required shipping information.'
      );
    }

    // Validate string fields
    if (typeof data.collection !== 'string' || data.collection.trim() === '') {
      throw new ShippingError(
        ErrorType.VALIDATION,
        'Invalid collection ID',
        'Please select a valid collection.'
      );
    }

    if (typeof data.size !== 'string' || data.size.trim() === '') {
      throw new ShippingError(
        ErrorType.VALIDATION,
        'Invalid size',
        'Please select a valid size.'
      );
    }

    if (typeof data.country !== 'string' || data.country.trim() === '') {
      throw new ShippingError(
        ErrorType.VALIDATION,
        'Invalid destination country',
        'Please select a valid destination country.'
      );
    }

    if (typeof data.postalCode !== 'string' || data.postalCode.trim() === '') {
      throw new ShippingError(
        ErrorType.VALIDATION,
        'Invalid postal code',
        'Please enter a valid postal code.'
      );
    }

    // Validate optional currency field
    if (data.preferredCurrency && 
        (typeof data.preferredCurrency !== 'string' || data.preferredCurrency.trim() === '')) {
      throw new ShippingError(
        ErrorType.VALIDATION,
        'Invalid preferred currency',
        'Please select a valid currency or leave blank for auto-selection.'
      );
    }

    // Validate FedEx config if provided
    if (data.fedexConfig) {
      this.validateFedexConfig(data.fedexConfig);
    }

    Logger.info('Shipping request validation successful');
    return data as ShippingRequest;
  }

  /**
   * Validate FedEx configuration
   */
  static validateFedexConfig(fedexConfig: unknown): FedexConfig {
    if (!fedexConfig || typeof fedexConfig !== 'object') {
      throw new ShippingError(
        ErrorType.CONFIGURATION,
        'Invalid FedEx configuration structure',
        'FedEx configuration is invalid.'
      );
    }

    const config = fedexConfig as Record<string, unknown>;
    const { accountNumber, clientId, clientSecret } = config;
    
    if (!accountNumber || !clientId || !clientSecret) {
      throw new ShippingError(
        ErrorType.CONFIGURATION,
        'Incomplete FedEx configuration',
        'FedEx configuration is incomplete. Please check your API credentials.'
      );
    }

    // Validate account number format
    if (typeof accountNumber !== 'string' || 
        accountNumber.length < 8 || 
        accountNumber.length > 12 || 
        !/^\d+$/.test(accountNumber)) {
      throw new ShippingError(
        ErrorType.CONFIGURATION,
        'Invalid FedEx account number format',
        'FedEx account number must be 8-12 digits.'
      );
    }

    // Validate client ID format
    if (typeof clientId !== 'string' || clientId.length < 10) {
      throw new ShippingError(
        ErrorType.CONFIGURATION,
        'Invalid FedEx client ID format',
        'FedEx client ID is invalid.'
      );
    }

    // Validate client secret format
    if (typeof clientSecret !== 'string' || clientSecret.length < 20) {
      throw new ShippingError(
        ErrorType.CONFIGURATION,
        'Invalid FedEx client secret format',
        'FedEx client secret is invalid.'
      );
    }

    Logger.info('FedEx configuration validation successful');
    return config as FedexConfig;
  }

  /**
   * Validate origin address with Thailand defaults
   */
  static validateOriginAddress(originCountry?: string, originPostalCode?: string): { country: string; postalCode: string } {
    // Set default origin to Thailand if not provided (matching roadmap Phase 2)
    const country = originCountry || 'TH';
    const postalCode = originPostalCode || '10240';

    // Validate country code format
    if (!/^[A-Z]{2}$/.test(country)) {
      throw new ShippingError(
        ErrorType.VALIDATION,
        'Invalid origin country code format',
        'Origin country code must be 2 uppercase letters.'
      );
    }

    // Basic postal code validation
    if (!/^[A-Z0-9\s-]{3,10}$/i.test(postalCode)) {
      throw new ShippingError(
        ErrorType.VALIDATION,
        'Invalid origin postal code format',
        'Origin postal code format is invalid.'
      );
    }

    Logger.info('Origin address validation successful', { country, postalCode });
    return { country, postalCode };
  }
}
