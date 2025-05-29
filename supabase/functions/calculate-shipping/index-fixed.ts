import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Complete CORS headers with all required fields
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours
}

interface ShippingRequest {
  collection: string; // This is actually the collection ID from frontend
  size: string;
  country: string;
  postalCode: string;
  originCountry: string;
  originPostalCode: string;
  preferredCurrency?: string;
  fedexConfig?: {
    accountNumber: string;
    clientId: string;
    clientSecret: string;
  };
}

interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
}

interface CollectionSize {
  weight_kg: number;
  height_cm: number;
  length_cm: number;
  width_cm: number;
}

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

// Enhanced error types for better error handling
enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NETWORK = 'NETWORK',
  API_RESPONSE = 'API_RESPONSE',
  RATE_PARSING = 'RATE_PARSING',
  DATABASE = 'DATABASE',
  CONFIGURATION = 'CONFIGURATION',
  TIMEOUT = 'TIMEOUT'
}

class ShippingError extends Error {
  public readonly type: ErrorType;
  public readonly userMessage: string;
  public readonly details?: unknown;

  constructor(type: ErrorType, message: string, userMessage: string, details?: unknown) {
    super(message);
    this.type = type;
    this.userMessage = userMessage;
    this.details = details;
    this.name = 'ShippingError';
  }
}

// Enhanced logging utility with request/response tracking
class Logger {
  private static requestId: string = '';

  static setRequestId(id: string) {
    this.requestId = id;
  }

  static log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      requestId: this.requestId,
      level,
      message,
      ...(data && { data: this.sanitizeData(data) })
    };
    console.log(JSON.stringify(logEntry));
  }

  static info(message: string, data?: unknown) {
    this.log('INFO', message, data);
  }

  static warn(message: string, data?: unknown) {
    this.log('WARN', message, data);
  }

  static error(message: string, data?: unknown) {
    this.log('ERROR', message, data);
  }

  // Sanitize sensitive data for logging
  private static sanitizeData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = ['clientSecret', 'access_token', 'clientId', 'accountNumber'];
    const sanitized = JSON.parse(JSON.stringify(data));

    const sanitizeRecursive = (obj: unknown): unknown => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeRecursive);
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = sanitizeRecursive(value);
          }
        }
        return result;
      }
      
      return obj;
    };

    return sanitizeRecursive(sanitized);
  }
}

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
  errorType: ErrorType,
  operationName: string
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      Logger.info(`${operationName} - Attempt ${attempt}/${options.maxRetries}`);
      const result = await operation();
      if (attempt > 1) {
        Logger.info(`${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      Logger.warn(`${operationName} failed on attempt ${attempt}`, { 
        error: lastError.message,
        attempt,
        maxRetries: options.maxRetries
      });

      // Don't retry on certain error types
      if (error instanceof ShippingError) {
        if (error.type === ErrorType.AUTHENTICATION || 
            error.type === ErrorType.AUTHORIZATION || 
            error.type === ErrorType.VALIDATION ||
            error.type === ErrorType.CONFIGURATION) {
          Logger.info(`Not retrying ${operationName} due to error type: ${error.type}`);
          throw error;
        }
      }

      // Don't retry on last attempt
      if (attempt === options.maxRetries) {
        Logger.error(`${operationName} failed after ${options.maxRetries} attempts`);
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        options.maxDelay
      );
      
      Logger.info(`Retrying ${operationName} in ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// FIXED: Updated to work with collection ID directly (frontend passes collection.id)
async function getCollectionSize(collectionId: string, size: string): Promise<CollectionSize> {
  try {
    Logger.info('Fetching collection size data', { collectionId, size });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new ShippingError(
        ErrorType.CONFIGURATION,
        'Missing Supabase configuration',
        'Configuration error. Please contact support.'
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // CRITICAL FIX: Frontend passes collection ID, so query directly with collection_id
    Logger.info('Looking up collection size data by collection ID', { collectionId, size });
    
    const { data, error } = await supabase
      .from('collection_sizes')
      .select('weight_kg, height_cm, length_cm, width_cm')
      .eq('collection_id', collectionId)
      .eq('size', size)
      .single();

    if (error) {
      Logger.error('Database query failed', { error: error.message, collectionId, size });
      throw new ShippingError(
        ErrorType.DATABASE,
        `Database error: ${error.message}`,
        'Unable to retrieve shipping information. Please try again.'
      );
    }

    if (!data) {
      Logger.warn('No size data found', { collectionId, size });
      throw new ShippingError(
        ErrorType.VALIDATION,
        `No size data found for collection ID: ${collectionId}, size: ${size}`,
        'The selected artwork size is not available for shipping calculation.'
      );
    }

    Logger.info('Collection size data retrieved successfully', { data });
    return data;
  } catch (error) {
    if (error instanceof ShippingError) {
      throw error;
    }
    
    Logger.error('Unexpected error fetching collection size', { error: (error as Error).message });
    throw new ShippingError(
      ErrorType.DATABASE,
      `Unexpected database error: ${(error as Error).message}`,
      'Unable to retrieve shipping information. Please contact support.'
    );
  }
}

// Get FedEx access token with enhanced error handling
async function getFedexAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const operationName = 'FedEx Authentication';
  const retryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  };

  return retryWithBackoff(async () => {
    Logger.info('Requesting FedEx access token');
    
    const authPayload = {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    };

    Logger.info('Sending FedEx auth request', { 
      grant_type: authPayload.grant_type,
      client_id: authPayload.client_id 
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('https://apis.fedex.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(authPayload).toString(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      Logger.info('FedEx auth response received', { 
        status: response.status,
        statusText: response.statusText 
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error('FedEx authentication failed', { 
          status: response.status,
          statusText: response.statusText,
          errorText 
        });

        if (response.status === 401) {
          throw new ShippingError(
            ErrorType.AUTHENTICATION,
            `Authentication failed: ${response.status}`,
            'Invalid FedEx credentials. Please check your API keys.'
          );
        } else if (response.status === 403) {
          throw new ShippingError(
            ErrorType.AUTHORIZATION,
            `Authorization failed: ${response.status}`,
            'FedEx account not authorized for this operation.'
          );
        } else if (response.status >= 500) {
          throw new ShippingError(
            ErrorType.NETWORK,
            `FedEx server error: ${response.status}`,
            'FedEx service temporarily unavailable. Please try again.'
          );
        } else {
          throw new ShippingError(
            ErrorType.API_RESPONSE,
            `Unexpected response: ${response.status}`,
            'Authentication error. Please try again or contact support.'
          );
        }
      }

      const data = await response.json();
      Logger.info('FedEx access token received successfully');
      
      if (!data.access_token) {
        throw new ShippingError(
          ErrorType.API_RESPONSE,
          'No access token in response',
          'Authentication error. Please try again.'
        );
      }

      return data.access_token;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if ((error as Error).name === 'AbortError') {
        throw new ShippingError(
          ErrorType.TIMEOUT,
          'FedEx authentication request timed out',
          'Request timed out. Please try again.'
        );
      }
      
      throw error;
    }
  }, retryOptions, ErrorType.AUTHENTICATION, operationName);
}

// Helper function to extract amount from various possible structures
function extractAmount(obj: any): number | null {
  if (!obj) return null;
  
  // Direct numeric value
  if (typeof obj === 'number') {
    return obj;
  }
  
  // String numeric value
  if (typeof obj === 'string') {
    const parsed = parseFloat(obj);
    return isNaN(parsed) ? null : parsed;
  }
  
  // Object with amount field
  if (typeof obj === 'object') {
    // Check for direct amount field
    if ('amount' in obj && obj.amount !== undefined && obj.amount !== null) {
      // Recursive call for nested amount
      if (typeof obj.amount === 'object' && 'value' in obj.amount) {
        return extractAmount(obj.amount.value);
      }
      return extractAmount(obj.amount);
    }
    
    // Check for value field
    if ('value' in obj && obj.value !== undefined && obj.value !== null) {
      return extractAmount(obj.value);
    }
  }
  
  return null;
}

// ROADMAP PHASE 1: Updated FedEx API payload to match n8n workflow structure exactly
async function getFedexRates(
  accessToken: string,
  accountNumber: string,
  sizeData: CollectionSize,
  originCountry: string,
  originPostalCode: string,
  destinationCountry: string,
  destinationPostalCode: string,
  preferredCurrency?: string
): Promise<ShippingRate[]> {
  const operationName = 'FedEx Rate Request';
  const retryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 15000
  };

  return retryWithBackoff(async () => {
    Logger.info('Requesting FedEx shipping rates');

    // Phase 1: Get current date for shipDateStamp - as required by roadmap
    const now = new Date();
    const shipDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const shipDateStamp = shipDate.toISOString().split('T')[0];

    // Phase 1: Dynamic currency handling based on destination country
    const getCurrency = (country: string): string => {
      const currencyMap: { [key: string]: string } = {
        'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR',
        'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 'AT': 'EUR', 'BE': 'EUR',
        'JP': 'JPY', 'AU': 'AUD', 'TH': 'THB', 'SG': 'SGD', 'HK': 'HKD',
        'ID': 'IDR', 'MY': 'MYR', 'PH': 'PHP', 'VN': 'VND', 'IN': 'INR',
        'KR': 'KRW', 'TW': 'TWD', 'CN': 'CNY', 'BR': 'BRL', 'MX': 'MXN'
      };
      return currencyMap[country] || 'USD'; // Default to USD for international
    };

    const currency = preferredCurrency || getCurrency(destinationCountry);

    // PHASE 1 CRITICAL FIX: Construct payload exactly matching n8n workflow structure
    const payload = {
      accountNumber: {
        value: accountNumber
      },
      requestedShipment: {
        shipper: {
          address: {
            postalCode: originPostalCode,
            countryCode: originCountry
          }
        },
        recipient: {
          address: {
            postalCode: destinationPostalCode,
            countryCode: destinationCountry
          }
        },
        shipDateStamp: shipDateStamp, // Required field added
        rateRequestType: ["LIST", "ACCOUNT", "INCENTIVE"], // Array format as required
        requestedPackageLineItems: [
          {
            groupPackageCount: 1, // Added groupPackageCount to line item
            weight: {
              units: "KG", // Use KG directly - no unit conversion
              value: sizeData.weight_kg
            },
            dimensions: {
              length: sizeData.length_cm, // Use CM directly - no unit conversion
              width: sizeData.width_cm,
              height: sizeData.height_cm,
              units: "CM"
            }
          }
        ],
        pickupType: "DROPOFF_AT_FEDEX_LOCATION", // Fixed pickup type as per roadmap
        packagingType: "YOUR_PACKAGING", // Required field added
        preferredCurrency: currency // Required field added
      }
    };

    Logger.info('Sending FedEx rate request with n8n structure', { 
      payload: {
        ...payload,
        accountNumber: { value: '[REDACTED]' }
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

    try {
      const response = await fetch('https://apis.fedex.com/rate/v1/rates/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-locale': 'en_US'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      Logger.info('FedEx rate response received', { 
        status: response.status,
        statusText: response.statusText 
      });

      const responseData = await response.json();
      Logger.info('FedEx rate response data', { responseData });

      if (!response.ok) {
        Logger.error('FedEx rate request failed', { 
          status: response.status,
          statusText: response.statusText,
          responseData 
        });

        if (response.status === 401) {
          throw new ShippingError(
            ErrorType.AUTHENTICATION,
            'FedEx access token expired or invalid',
            'Authentication expired. Please try again.'
          );
        } else if (response.status === 403) {
          throw new ShippingError(
            ErrorType.AUTHORIZATION,
            'FedEx account not authorized for rate requests',
            'Account not authorized for shipping rates.'
          );
        } else if (response.status === 400) {
          // Enhanced 400 error handling for Phase 3
          const errorDetails = responseData?.errors || responseData?.messages || [];
          const errorMessage = errorDetails.length > 0 
            ? `Validation error: ${JSON.stringify(errorDetails)}`
            : 'Invalid request parameters';
          
          Logger.error('FedEx validation error details', { errorDetails, responseData });
          
          throw new ShippingError(
            ErrorType.VALIDATION,
            errorMessage,
            'Invalid shipping parameters. Please check your destination details and try again.'
          );
        } else if (response.status >= 500) {
          throw new ShippingError(
            ErrorType.NETWORK,
            `FedEx server error: ${response.status}`,
            'FedEx service temporarily unavailable. Please try again.'
          );
        } else {
          throw new ShippingError(
            ErrorType.API_RESPONSE,
            `Unexpected response: ${response.status}`,
            'Rate calculation error. Please try again or contact support.'
          );
        }
      }

      // Enhanced response parsing and validation
      if (!responseData.output || !responseData.output.rateReplyDetails) {
        Logger.error('Invalid FedEx response structure', { responseData });
        throw new ShippingError(
          ErrorType.RATE_PARSING,
          'Invalid response structure from FedEx',
          'Unable to parse shipping rates. Please try again.'
        );
      }

      const rates: ShippingRate[] = [];
      
      try {
        for (const rateDetail of responseData.output.rateReplyDetails) {
          // Log each rate detail for debugging
          Logger.info('Processing rate detail', {
            serviceType: rateDetail.serviceType,
            hasRatedShipmentDetails: !!rateDetail.ratedShipmentDetails,
            ratedShipmentDetailsCount: rateDetail.ratedShipmentDetails?.length || 0,
            hasOperationalDetail: !!rateDetail.operationalDetail,
            hasCommit: !!rateDetail.commit
          });

          if (rateDetail.ratedShipmentDetails && rateDetail.ratedShipmentDetails.length > 0) {
            // FIXED: Check all ratedShipmentDetails and prioritize LIST rates
            let selectedDetail = null;
            
            // First, try to find a LIST rate (customer rate)
            for (const detail of rateDetail.ratedShipmentDetails) {
              Logger.info('Checking ratedShipmentDetail', {
                rateType: detail.rateType,
                hasTotalNetCharge: 'totalNetCharge' in detail,
                totalNetCharge: detail.totalNetCharge,
                currency: detail.currency
              });
              
              if (detail.rateType === 'LIST' || detail.rateType === 'RATED_LIST_PACKAGE') {
                selectedDetail = detail;
                break;
              }
            }
            
            // If no LIST rate found, fall back to the first detail (usually ACCOUNT)
            if (!selectedDetail) {
              selectedDetail = rateDetail.ratedShipmentDetails[0];
              Logger.info('No LIST rate found, using first detail', {
                rateType: selectedDetail.rateType
              });
            }
            
            // Extract rate from the selected detail
            let rateAmount = null;
            let rateCurrency = currency;
            
            // The rate is directly on the shipmentDetail as totalNetCharge
            if ('totalNetCharge' in selectedDetail) {
              rateAmount = extractAmount(selectedDetail.totalNetCharge);
              rateCurrency = selectedDetail.currency || currency;
              
              Logger.info('Found rate from selected detail', { 
                rateAmount, 
                rateCurrency,
                rateType: selectedDetail.rateType
              });
            }
            
            // FIXED: Extract transit time from the correct fields
            let transitTime = 'Unknown';
            let deliveryDate = undefined;
            
            if (rateDetail.operationalDetail) {
              transitTime = rateDetail.operationalDetail.transitTime || transitTime;
              deliveryDate = rateDetail.operationalDetail.deliveryDate || 
                            rateDetail.operationalDetail.deliveryDayOfWeek;
            }
            
            if (rateDetail.commit) {
              transitTime = rateDetail.commit.label || 
                           rateDetail.commit.transitTime || 
                           transitTime;
              if (!deliveryDate && rateDetail.commit?.dateDetail) {
                deliveryDate = rateDetail.commit.dateDetail.dayOfWeek;
              }
            }
            
            if (rateAmount !== null && rateAmount > 0) {
              const rate: ShippingRate = {
                service: rateDetail.serviceType || 'Unknown Service',
                cost: rateAmount,
                currency: rateCurrency,
                transitTime: transitTime,
                deliveryDate: deliveryDate
              };
              
              rates.push(rate);
              Logger.info('Added FedEx rate', { rate });
            } else {
              Logger.warn('No valid rate amount found', {
                serviceType: rateDetail.serviceType,
                selectedDetailRateType: selectedDetail.rateType,
                shipmentDetail: JSON.stringify(selectedDetail, null, 2)
              });
            }
          }
        }
      } catch (parseError) {
        Logger.error('Error parsing FedEx rates', { 
          parseError: (parseError as Error).message,
          responseData 
        });
        throw new ShippingError(
          ErrorType.RATE_PARSING,
          `Rate parsing error: ${(parseError as Error).message}`,
          'Unable to process shipping rates. Please try again.'
        );
      }

      if (rates.length === 0) {
        Logger.warn('No rates found in FedEx response', { responseData });
        throw new ShippingError(
          ErrorType.RATE_PARSING,
          'No shipping rates available for this destination',
          'No shipping options available for this destination.'
        );
      }

      Logger.info(`Successfully parsed ${rates.length} FedEx rates`);
      return rates;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if ((error as Error).name === 'AbortError') {
        throw new ShippingError(
          ErrorType.TIMEOUT,
          'FedEx rate request timed out',
          'Request timed out. Please try again.'
        );
      }
      
      throw error;
    }
  }, retryOptions, ErrorType.NETWORK, operationName);
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
      throw new ShippingError(
        ErrorType.VALIDATION,
        `Method ${req.method} not allowed`,
        'Only POST requests are allowed.'
      );
    }

    const requestData: ShippingRequest = await req.json();
    Logger.info('Request payload received', { requestData });

    // Validate required fields
    if (!requestData.collection || !requestData.size || !requestData.country || !requestData.postalCode) {
      throw new ShippingError(
        ErrorType.VALIDATION,
        'Missing required fields',
        'Please fill in all required shipping information.'
      );
    }

    // PHASE 2: Set default origin to Thailand if not provided (matching roadmap)
    const originCountry = requestData.originCountry || 'TH';
    const originPostalCode = requestData.originPostalCode || '10240';

    Logger.info('Using origin address (Phase 2 defaults)', { originCountry, originPostalCode });

    // FIXED: Frontend passes collection ID, so use it directly
    const sizeData = await getCollectionSize(requestData.collection, requestData.size);

    let rates: ShippingRate[] = [];

    // Calculate FedEx rates if config is provided
    if (requestData.fedexConfig) {
      Logger.info('FedEx configuration provided, calculating rates');
      
      const { accountNumber, clientId, clientSecret } = requestData.fedexConfig;
      
      if (!accountNumber || !clientId || !clientSecret) {
        throw new ShippingError(
          ErrorType.CONFIGURATION,
          'Incomplete FedEx configuration',
          'FedEx configuration is incomplete. Please check your API credentials.'
        );
      }

      try {
        const accessToken = await getFedexAccessToken(clientId, clientSecret);
        const fedexRates = await getFedexRates(
          accessToken,
          accountNumber,
          sizeData,
          originCountry,
          originPostalCode,
          requestData.country,
          requestData.postalCode,
          requestData.preferredCurrency
        );
        
        rates = rates.concat(fedexRates);
        Logger.info(`Added ${fedexRates.length} FedEx rates`);
      } catch (error) {
        Logger.error('FedEx rate calculation failed', { error: (error as Error).message });
        
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
      requestId
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
      error: (error as Error).message,
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
