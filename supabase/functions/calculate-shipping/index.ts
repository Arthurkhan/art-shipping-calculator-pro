/**
 * Main shipping calculation handler - Refactored to use modular architecture
 * Phase 1 Complete: 27KB → ~200 lines by extracting business logic to focused modules
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Import extracted modules
import { Logger } from './lib/logger.ts';
import { FedexAuthService } from './lib/fedex-auth.ts';
import { FedexRatesService } from './lib/fedex-rates.ts';
import { getCollectionSize } from './lib/collection-service.ts';
import { RequestValidator, AddressValidator } from './validators/index.ts';
import { ErrorType, ShippingError } from './types/index.ts';
import type { ShippingRequest, ShippingRate } from './types/index.ts';

// Complete CORS headers with all required fields
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Main serve function with comprehensive error handling
 */
serve(async (req) => {
  // Generate unique request ID for correlation
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  Logger.setRequestId(requestId);
  
  Logger.info('New shipping calculation request received', {
    method: req.method,
    url: req.url,
    requestId
  });

  // Handle CORS preflight requests - THIS IS CRITICAL
  if (req.method === 'OPTIONS') {
    Logger.info('Handling OPTIONS preflight request');
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    // Validate HTTP method
    if (req.method !== 'POST') {
      throw new ShippingError(
        ErrorType.VALIDATION,
        `Method ${req.method} not allowed`,
        'Only POST requests are allowed.'
      );
    }

    // Parse and validate request data
    const rawRequestData = await req.json();
    const requestData = RequestValidator.validateShippingRequest(rawRequestData);
    
    Logger.info('Request payload received with currency enhancement', { 
      requestData: {
        ...requestData,
        fedexConfig: requestData.fedexConfig ? '[REDACTED]' : 'Not provided',
        preferredCurrency: requestData.preferredCurrency || 'Not provided (will auto-map)'
      }
    });

    // Validate and set origin address with Thailand defaults (Phase 2)
    const { country: originCountry, postalCode: originPostalCode } = 
      RequestValidator.validateOriginAddress(requestData.originCountry, requestData.originPostalCode);

    Logger.info('Using origin address (Phase 2 defaults)', { originCountry, originPostalCode });

    // Validate destination address
    AddressValidator.validateAddress(requestData.postalCode, requestData.country);

    // Get collection size data from database
    const sizeData = await getCollectionSize(requestData.collection, requestData.size);

    let rates: ShippingRate[] = [];

    // Calculate FedEx rates if config is provided
    if (requestData.fedexConfig) {
      Logger.info('FedEx configuration provided, calculating rates');
      
      try {
        // Authenticate with FedEx
        const accessToken = await FedexAuthService.getAccessToken(
          requestData.fedexConfig.clientId, 
          requestData.fedexConfig.clientSecret
        );
        
        // Get FedEx rates using the new modular service
        const fedexRates = await FedexRatesService.getRates(
          accessToken,
          requestData.fedexConfig.accountNumber,
          sizeData,
          originCountry,
          originPostalCode,
          requestData.country,
          requestData.postalCode,
          requestData.preferredCurrency // Pass user-selected currency
        );
        
        rates = rates.concat(fedexRates);
        Logger.info(`Added ${fedexRates.length} FedEx rates`);
      } catch (error) {
        Logger.error('FedEx rate calculation failed', { error: error.message });
        
        if (error instanceof ShippingError) {
          // For FedEx-specific errors, we can still return partial results
          Logger.warn('Continuing with empty FedEx rates due to error');
        } else {
          throw error;
        }
      }
    } else {
      Logger.info('No FedEx configuration provided, skipping FedEx rates');
    }

    // TODO: Add other shipping providers here (DHL, UPS, etc.)

    Logger.info('Shipping calculation completed successfully', {
      totalRates: rates.length,
      requestId,
      currencyUsed: requestData.preferredCurrency || 'auto-mapped'
    });

    return new Response(
      JSON.stringify({
        success: true,
        rates,
        requestId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    Logger.error('Request failed', { 
      error: error.message,
      type: error instanceof ShippingError ? error.type : 'UNKNOWN',
      requestId
    });

    let statusCode = 500;
    let userMessage = 'An unexpected error occurred. Please try again.';

    if (error instanceof ShippingError) {
      userMessage = error.userMessage;
      
      // Map error types to appropriate HTTP status codes
      switch (error.type) {
        case ErrorType.VALIDATION:
          statusCode = 400;
          break;
        case ErrorType.AUTHENTICATION:
        case ErrorType.AUTHORIZATION:
          statusCode = 401;
          break;
        case ErrorType.CONFIGURATION:
          statusCode = 422;
          break;
        case ErrorType.TIMEOUT:
          statusCode = 408;
          break;
        case ErrorType.NETWORK:
        case ErrorType.API_RESPONSE:
        case ErrorType.RATE_PARSING:
        case ErrorType.DATABASE:
        default:
          statusCode = 500;
          break;
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: userMessage,
        requestId,
        ...(error instanceof ShippingError && { errorType: error.type })
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
