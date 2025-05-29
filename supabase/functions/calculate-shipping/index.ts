import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Import refactored modules from lib directory
import { FedexAuthService } from './lib/fedex-auth.ts';
import { FedexRatesService } from './lib/fedex-rates.ts';
import { Logger } from './lib/logger.ts';
import { getCollectionSize } from './lib/collection-service.ts'; // Fixed import - it's a function, not a class
import type { ShippingRequest, ShippingRate, ShippingError, ErrorType } from './types/index.ts';

// Complete CORS headers with all required fields
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours
}

// Main serve function with comprehensive error handling
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
    if (req.method !== 'POST') {
      throw {
        type: 'VALIDATION',
        message: `Method ${req.method} not allowed`,
        userMessage: 'Only POST requests are allowed.'
      };
    }

    const requestData: ShippingRequest = await req.json();
    Logger.info('Request payload received', { 
      requestData: {
        ...requestData,
        fedexConfig: requestData.fedexConfig ? '[REDACTED]' : 'Not provided',
        preferredCurrency: requestData.preferredCurrency || 'Not provided (will auto-map)',
        shipDate: requestData.shipDate || 'Not provided (will use tomorrow)'
      }
    });

    // Validate required fields
    if (!requestData.collection || !requestData.size || !requestData.country || !requestData.postalCode) {
      throw {
        type: 'VALIDATION',
        message: 'Missing required fields',
        userMessage: 'Please fill in all required shipping information.'
      };
    }

    // PHASE 2: Set default origin to Thailand if not provided (matching roadmap)
    const originCountry = requestData.originCountry || 'TH';
    const originPostalCode = requestData.originPostalCode || '10240';

    Logger.info('Using origin address (Phase 2 defaults)', { originCountry, originPostalCode });

    // Use getCollectionSize function directly
    const sizeData = await getCollectionSize(requestData.collection, requestData.size);

    let rates: ShippingRate[] = [];
    let rawFedexResponse = null; // Store raw response for debugging

    // Calculate FedEx rates if config is provided
    if (requestData.fedexConfig) {
      Logger.info('FedEx configuration provided, calculating rates');
      
      const { accountNumber, clientId, clientSecret } = requestData.fedexConfig;
      
      if (!accountNumber || !clientId || !clientSecret) {
        throw {
          type: 'CONFIGURATION',
          message: 'Incomplete FedEx configuration',
          userMessage: 'FedEx configuration is incomplete. Please check your API credentials.'
        };
      }

      try {
        // Use FedexAuthService to get access token
        const accessToken = await FedexAuthService.getAccessToken(clientId, clientSecret);
        
        // Use FedexRatesService to get rates with optional ship date
        const fedexRates = await FedexRatesService.getRates(
          accessToken,
          accountNumber,
          sizeData,
          originCountry,
          originPostalCode,
          requestData.country,
          requestData.postalCode,
          requestData.preferredCurrency,
          requestData.shipDate // Pass user-selected ship date (optional)
        );
        
        // DEBUGGING: Get the raw FedEx response
        rawFedexResponse = FedexRatesService.getLastRawResponse();
        
        rates = rates.concat(fedexRates);
        Logger.info(`Added ${fedexRates.length} FedEx rates`);
      } catch (error) {
        Logger.error('FedEx rate calculation failed', { error: error.message });
        
        if (error.type) {
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
      currencyUsed: requestData.preferredCurrency || 'auto-mapped',
      shipDateUsed: requestData.shipDate || 'auto-generated (tomorrow)'
    });

    return new Response(
      JSON.stringify({
        success: true,
        rates,
        requestId,
        // DEBUGGING: Include raw FedEx response temporarily
        _debug: {
          rawFedexResponse: rawFedexResponse
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    Logger.error('Request failed', { 
      error: error.message,
      type: error.type || 'UNKNOWN',
      requestId
    });

    let statusCode = 500;
    let userMessage = 'An unexpected error occurred. Please try again.';

    if (error.type) {
      userMessage = error.userMessage || userMessage;
      
      // Map error types to appropriate HTTP status codes
      switch (error.type) {
        case 'VALIDATION':
          statusCode = 400;
          break;
        case 'AUTHENTICATION':
        case 'AUTHORIZATION':
          statusCode = 401;
          break;
        case 'CONFIGURATION':
          statusCode = 422;
          break;
        case 'TIMEOUT':
          statusCode = 408;
          break;
        case 'NETWORK':
        case 'API_RESPONSE':
        case 'RATE_PARSING':
        case 'DATABASE':
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
        ...(error.type && { errorType: error.type })
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
