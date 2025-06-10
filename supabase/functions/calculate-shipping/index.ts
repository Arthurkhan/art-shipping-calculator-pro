import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Import refactored modules from lib directory
import { FedexAuthService } from './lib/fedex-auth.ts';
import { FedexRatesService } from './lib/fedex-rates.ts';
import { Logger } from './lib/logger.ts';
import { getCollectionSize } from './lib/collection-service.ts'; // Fixed import - it's a function, not a class
import type { ShippingRequest, ShippingRate, ShippingError, ErrorType, CollectionSize } from './types/index.ts';

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
        shipDate: requestData.shipDate || 'Not provided (will use tomorrow)',
        overrideData: requestData.overrideData || 'Not provided',
        hasOverride: !!requestData.overrideData
      }
    });

    // Validate required fields
    // FIX: When override data is provided, we don't need collection/size
    // Also handle empty strings as missing values
    const hasOverrideData = requestData.overrideData && 
                           typeof requestData.overrideData === 'object' &&
                           'weight_kg' in requestData.overrideData;
    
    const hasValidCollectionAndSize = requestData.collection && 
                                     requestData.collection.trim() !== '' &&
                                     requestData.size && 
                                     requestData.size.trim() !== '';
    
    // We need either override data OR collection/size, not both
    if (!hasOverrideData && !hasValidCollectionAndSize) {
      throw {
        type: 'VALIDATION',
        message: 'Missing required fields: Either provide collection/size or override data',
        userMessage: 'Please select a collection and size, or use custom dimensions.'
      };
    }
    
    if (!requestData.country || !requestData.postalCode) {
      throw {
        type: 'VALIDATION',
        message: 'Missing required destination fields',
        userMessage: 'Please provide destination country and postal code.'
      };
    }

    // PHASE 2: Set default origin to Thailand if not provided (matching roadmap)
    const originCountry = requestData.originCountry || 'TH';
    const originPostalCode = requestData.originPostalCode || '10240';

    Logger.info('Using origin address (Phase 2 defaults)', { originCountry, originPostalCode });

    // Get size data - either from override or database
    let sizeData: CollectionSize;
    let quantity = 1; // Default quantity

    if (hasOverrideData) {
      // Use override data if provided
      Logger.info('Using override data for dimensions and weight', { 
        overrideData: requestData.overrideData 
      });
      
      sizeData = {
        weight_kg: requestData.overrideData.weight_kg,
        height_cm: requestData.overrideData.height_cm,
        length_cm: requestData.overrideData.length_cm,
        width_cm: requestData.overrideData.width_cm
      };
      
      // Store quantity for logging but ALWAYS use 1 for FedEx API
      const userQuantity = requestData.overrideData.quantity || 1;
      quantity = 1; // ALWAYS use 1 for single shipment pricing
      
      Logger.info('FIX: Using quantity=1 for single shipment pricing', { 
        userRequestedQuantity: userQuantity,
        fedexApiQuantity: quantity,
        note: 'Always calculating rates for single shipment to match FedEx website pricing'
      });
    } else {
      // Use getCollectionSize function directly
      sizeData = await getCollectionSize(requestData.collection, requestData.size);
    }

    Logger.info('Size data determined', { 
      sizeData,
      quantity,
      source: hasOverrideData ? 'override' : 'database'
    });

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
        
        // Use FedexRatesService to get rates with optional ship date and quantity
        const fedexRates = await FedexRatesService.getRates(
          accessToken,
          accountNumber,
          sizeData,
          originCountry,
          originPostalCode,
          requestData.country,
          requestData.postalCode,
          requestData.preferredCurrency,
          requestData.shipDate, // Pass user-selected ship date (optional)
          quantity // Pass quantity for multiple boxes (now always 1)
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
      shipDateUsed: requestData.shipDate || 'auto-generated (tomorrow)',
      usingOverride: hasOverrideData,
      quantity
    });

    return new Response(
      JSON.stringify({
        success: true,
        rates,
        requestId,
        // DEBUGGING: Include raw FedEx response temporarily
        _debug: {
          rawFedexResponse: rawFedexResponse,
          usingOverride: hasOverrideData,
          fedexQuantityUsed: quantity
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
