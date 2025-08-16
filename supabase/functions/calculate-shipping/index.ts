import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// TYPES
// ============================================
interface ShippingRequest {
  collection?: string;
  size?: string;
  country: string;
  postalCode: string;
  originCountry?: string;
  originPostalCode?: string;
  preferredCurrency?: string;
  shipDate?: string;
  overrideData?: {
    weight_kg: number;
    height_cm: number;
    length_cm: number;
    width_cm: number;
    quantity?: number;
  };
  sessionId?: string; // Session ID for FedEx config retrieval
}

interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime?: string;
  deliveryDate?: string;
  rateType?: string;
}

interface CollectionSize {
  weight_kg: number;
  height_cm: number;
  length_cm: number;
  width_cm: number;
}

// FedEx Error Response Structure
interface FedexErrorResponse {
  errors?: Array<{
    code?: string;
    message?: string;
    parameterList?: Array<{
      key?: string;
      value?: string;
    }>;
  }>;
  transactionId?: string;
  customerTransactionId?: string;
}

// ============================================
// LOGGER
// ============================================
class Logger {
  static requestId = '';
  static setRequestId(id: string) {
    this.requestId = id;
  }
  static info(message: string, data?: unknown) {
    // Logging disabled
  }
  static error(message: string, data?: unknown) {
    // Logging disabled
  }
  static warn(message: string, data?: unknown) {
    // Logging disabled
  }
}

// ============================================
// ENCRYPTION SERVICE (copied from fedex-config)
// ============================================
class EncryptionService {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  static async generateKey(secret: string): Promise<CryptoKey> {
    const keyMaterial = await globalThis.crypto.subtle.importKey(
      "raw",
      this.encoder.encode(secret),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return await globalThis.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: this.encoder.encode("art-shipping-salt"),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  static async decrypt(encryptedText: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    return this.decoder.decode(decrypted);
  }
}

// ============================================
// FEDEX CONFIG RETRIEVAL
// ============================================
async function getFedexConfig(sessionId: string | undefined): Promise<{accountNumber: string, clientId: string, clientSecret: string} | null> {
  // First, try to get config from session if provided
  if (sessionId) {
    try {
      const encryptionSecret = Deno.env.get('FEDEX_ENCRYPTION_SECRET');
      if (!encryptionSecret) {
        Logger.error('Encryption configuration missing');
        return null;
      }

      // Get Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        Logger.error('Supabase configuration missing');
        return null;
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Retrieve session from Supabase
      const { data: session, error } = await supabase
        .from('fedex_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (session && !error) {
        const encryptionKey = await EncryptionService.generateKey(encryptionSecret);

        const decryptedConfig = {
          accountNumber: await EncryptionService.decrypt(session.encrypted_account_number, encryptionKey),
          clientId: await EncryptionService.decrypt(session.encrypted_client_id, encryptionKey),
          clientSecret: await EncryptionService.decrypt(session.encrypted_client_secret, encryptionKey)
        };

        Logger.info('FedEx config retrieved from session successfully');
        return decryptedConfig;
      }
    } catch (error) {
      Logger.warn('Failed to retrieve FedEx config from session', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  // Fallback to default credentials if available
  try {
    const defaultAccount = Deno.env.get('FEDEX_DEFAULT_ACCOUNT');
    const defaultClientId = Deno.env.get('FEDEX_DEFAULT_CLIENT_ID');
    const defaultClientSecret = Deno.env.get('FEDEX_DEFAULT_CLIENT_SECRET');

    if (defaultAccount && defaultClientId && defaultClientSecret) {
      Logger.info('Using default FedEx credentials');
      return {
        accountNumber: defaultAccount,
        clientId: defaultClientId,
        clientSecret: defaultClientSecret
      };
    }
  } catch (error) {
    Logger.error('Failed to retrieve default FedEx config', { error: error instanceof Error ? error.message : String(error) });
  }

  Logger.warn('No FedEx configuration available (neither session nor defaults)');
  return null;
}

// ============================================
// CURRENCY MAPPER
// ============================================
const CURRENCY_MAP: Record<string, string> = {
  // Asia Pacific
  'TH': 'THB',
  'SG': 'SGD',
  'MY': 'MYR',
  'ID': 'IDR',
  'PH': 'PHP',
  'VN': 'VND',
  'KH': 'USD',
  'LA': 'LAK',
  'MM': 'MMK',
  'BN': 'BND',
  'JP': 'JPY',
  'KR': 'KRW',
  'CN': 'CNY',
  'HK': 'HKD',
  'TW': 'TWD',
  'IN': 'INR',
  'PK': 'PKR',
  'BD': 'BDT',
  'LK': 'LKR',
  'NP': 'NPR',
  'AU': 'AUD',
  'NZ': 'NZD',
  'FJ': 'FJD',
  'PG': 'PGK',
  'WS': 'WST',
  // Europe
  'GB': 'GBP',
  'FR': 'EUR',
  'DE': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR',
  'NL': 'EUR',
  'BE': 'EUR',
  'AT': 'EUR',
  'PT': 'EUR',
  'GR': 'EUR',
  'IE': 'EUR',
  'FI': 'EUR',
  'LU': 'EUR',
  'MT': 'EUR',
  'CY': 'EUR',
  'SI': 'EUR',
  'SK': 'EUR',
  'EE': 'EUR',
  'LV': 'EUR',
  'LT': 'EUR',
  'CH': 'CHF',
  'NO': 'NOK',
  'SE': 'SEK',
  'DK': 'DKK',
  'IS': 'ISK',
  'PL': 'PLN',
  'CZ': 'CZK',
  'HU': 'HUF',
  'RO': 'RON',
  'BG': 'BGN',
  'HR': 'EUR',
  'RS': 'RSD',
  'UA': 'UAH',
  'RU': 'RUB',
  'TR': 'TRY',
  // Americas
  'US': 'USD',
  'CA': 'CAD',
  'MX': 'MXN',
  'BR': 'BRL',
  'AR': 'ARS',
  'CL': 'CLP',
  'CO': 'COP',
  'PE': 'PEN',
  'UY': 'UYU',
  'PY': 'PYG',
  'BO': 'BOB',
  'EC': 'USD',
  'VE': 'VES',
  'GY': 'GYD',
  'SR': 'SRD',
  // Middle East & Africa
  'AE': 'AED',
  'SA': 'SAR',
  'QA': 'QAR',
  'KW': 'KWD',
  'BH': 'BHD',
  'OM': 'OMR',
  'JO': 'JOD',
  'IL': 'ILS',
  'EG': 'EGP',
  'MA': 'MAD',
  'ZA': 'ZAR',
  'NG': 'NGN',
  'KE': 'KES',
  'GH': 'GHS',
  'TZ': 'TZS',
  'UG': 'UGX',
  'ET': 'ETB',
  'ZW': 'ZWL',
  'ZM': 'ZMW',
  'BW': 'BWP',
  // Caribbean & Central America
  'JM': 'JMD',
  'TT': 'TTD',
  'BB': 'BBD',
  'BS': 'BSD',
  'BZ': 'BZD',
  'GT': 'GTQ',
  'SV': 'USD',
  'HN': 'HNL',
  'NI': 'NIO',
  'CR': 'CRC',
  'PA': 'PAB',
  'DO': 'DOP',
  'HT': 'HTG',
  'CU': 'CUP',
  'PR': 'USD'
};

function getCurrencyForCountry(countryCode: string): string {
  return CURRENCY_MAP[countryCode] || 'USD';
}

// ============================================
// COLLECTION SERVICE
// ============================================
async function getCollectionSize(collectionId: string, size: string): Promise<CollectionSize> {
  try {
    Logger.info('Fetching collection size data', {
      collectionId,
      size
    });
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    Logger.info('Looking up collection size data by collection ID', {
      collectionId,
      size
    });
    const { data, error } = await supabase
      .from('sizes') // Using 'sizes' table
      .select('weight_kg, height_cm, length_cm, width_cm')
      .eq('collection_id', collectionId)
      .eq('size', size)
      .single();
    if (error) {
      Logger.error('Database query failed', {
        error: error.message,
        collectionId,
        size
      });
      throw new Error(`Database error: ${error.message}`);
    }
    if (!data) {
      Logger.warn('No size data found', {
        collectionId,
        size
      });
      throw new Error(`No size data found for collection ID: ${collectionId}, size: ${size}`);
    }
    Logger.info('Collection size data retrieved successfully', {
      data
    });
    return data;
  } catch (error) {
    Logger.error('Unexpected error fetching collection size', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// ============================================
// FEDEX AUTH SERVICE
// ============================================
class FedexAuthService {
  static async getAccessToken(clientId: string, clientSecret: string): Promise<string> {
    try {
      Logger.info('Requesting FedEx access token');
      const authUrl = 'https://apis.fedex.com/oauth/token';
      const authBody = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      });
      const authResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: authBody.toString()
      });
      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        Logger.error('FedEx auth failed', {
          status: authResponse.status,
          statusText: authResponse.statusText,
          error: errorText
        });
        throw new Error(`FedEx authentication failed: ${authResponse.statusText}`);
      }
      const authData = await authResponse.json();
      if (!authData.access_token) {
        throw new Error('No access token received from FedEx');
      }
      Logger.info('FedEx access token obtained successfully');
      return authData.access_token;
    } catch (error) {
      Logger.error('FedEx authentication error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

// ============================================
// FEDEX RATES SERVICE (WITH ENHANCED ERROR HANDLING)
// ============================================
class FedexRatesService {
  static lastRawResponse: unknown = null;
  
  static getLastRawResponse() {
    return this.lastRawResponse;
  }
  
  static async getRates(
    accessToken: string,
    accountNumber: string,
    sizeData: CollectionSize,
    originCountry: string,
    originPostalCode: string,
    destinationCountry: string,
    destinationPostalCode: string,
    preferredCurrency?: string,
    shipDate?: string,
    quantity: number = 1
  ): Promise<ShippingRate[]> {
    try {
      Logger.info('Starting FedEx rate calculation', {
        origin: `${originCountry} ${originPostalCode}`,
        destination: `${destinationCountry} ${destinationPostalCode}`,
        dimensions: sizeData,
        preferredCurrency,
        shipDate,
        quantity
      });
      
      const ratesUrl = 'https://apis.fedex.com/rate/v1/rates/quotes';
      
      // Currency mapping
      const currency = preferredCurrency || getCurrencyForCountry(destinationCountry);
      Logger.info('Using currency for rate calculation', {
        currency,
        preferredCurrency,
        destinationCountry
      });
      
      // Ship date handling
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const shipDateToUse = shipDate || tomorrow.toISOString().split('T')[0];
      Logger.info('Using ship date', {
        shipDateToUse,
        providedShipDate: shipDate
      });
      
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
          preferredCurrency: currency,
          shipDateStamp: shipDateToUse,
          pickupType: "DROPOFF_AT_FEDEX_LOCATION",
          packagingType: "YOUR_PACKAGING",
          rateRequestType: [
            "LIST",
            "ACCOUNT",
            "INCENTIVE"
          ],
          requestedPackageLineItems: [
            {
              groupPackageCount: 1, // Always use 1 for single shipment pricing
              weight: {
                units: "KG",
                value: sizeData.weight_kg
              },
              dimensions: {
                length: sizeData.length_cm,
                width: sizeData.width_cm,
                height: sizeData.height_cm,
                units: "CM"
              }
            }
          ],
          variableOptions: ["TRANSIT_TIME"]
        }
      };
      
      Logger.info('FedEx API Request Payload', payload);
      
      const ratesResponse = await fetch(ratesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-locale': 'en_US'
        },
        body: JSON.stringify(payload)
      });
      
      const responseText = await ratesResponse.text();
      Logger.info('FedEx API Raw Response Text', { responseText });
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        Logger.error('Failed to parse FedEx response as JSON', {
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
          responseText
        });
        throw new Error('Invalid response from FedEx API');
      }
      
      this.lastRawResponse = responseData;
      
      Logger.info('FedEx API Response Status', {
        status: ratesResponse.status,
        ok: ratesResponse.ok
      });
      
      if (!ratesResponse.ok) {
        Logger.error('FedEx API error response', responseData);
        
        // Enhanced error handling with specific FedEx error parsing
        if (ratesResponse.status === 400) {
          // Parse FedEx-specific error response
          const errorResponse = responseData as FedexErrorResponse;
          let errorMessage = 'Invalid request parameters';
          let userMessage = 'Invalid shipping parameters. Please check your destination details and try again.';
          
          // Extract specific error messages from FedEx response
          if (errorResponse.errors && errorResponse.errors.length > 0) {
            const fedexErrors = errorResponse.errors.map(err => ({
              code: err.code || 'UNKNOWN',
              message: err.message || 'Unknown error'
            }));
            
            // Get the first error message as the primary message
            const primaryError = fedexErrors[0];
            errorMessage = primaryError.message;
            
            // Check for specific error codes/messages
            if (primaryError.message?.includes('service is not currently available') ||
                primaryError.code?.includes('SERVICE.UNAVAILABLE') ||
                primaryError.code?.includes('SERVICE.NOT.AVAILABLE')) {
              // Service availability error
              userMessage = 'FedEx does not currently offer service between these locations. Please try a different destination or contact FedEx Customer Service.';
              
              Logger.warn('FedEx service availability issue', {
                route: `${originCountry} (${originPostalCode}) → ${destinationCountry} (${destinationPostalCode})`,
                fedexMessage: primaryError.message,
                fedexCode: primaryError.code
              });
            } else if (primaryError.message?.includes('postal code') || 
                      primaryError.message?.includes('country code')) {
              // Invalid address error
              userMessage = 'Invalid postal code or country code. Please verify your shipping addresses.';
            } else if (primaryError.message?.includes('account')) {
              // Account-related error
              userMessage = 'Account authorization issue. Please verify your FedEx account settings.';
            } else {
              // Use the FedEx error message directly if it's user-friendly
              userMessage = primaryError.message;
            }
            
            Logger.error('FedEx validation error details (400 - Bad Request)', { 
              fedexErrors,
              responseData,
              route: `${originCountry} (${originPostalCode}) → ${destinationCountry} (${destinationPostalCode})`,
              currencyUsed: currency
            });
          }
          
          throw new Error(userMessage);
        } else {
          throw new Error(`FedEx API error: ${responseData.errors?.[0]?.message || 'Unknown error'}`);
        }
      }
      
      if (!responseData.output?.rateReplyDetails) {
        Logger.warn('No rate details in response', responseData);
        return [];
      }
      
      const rates: ShippingRate[] = [];
      for (const rateDetail of responseData.output.rateReplyDetails) {
        const serviceName = rateDetail.serviceName || rateDetail.serviceType || 'Unknown Service';
        if (!rateDetail.ratedShipmentDetails?.length) {
          Logger.warn('No shipment details for service', {
            serviceName
          });
          continue;
        }
        
        for (const shipmentDetail of rateDetail.ratedShipmentDetails) {
          const rateType = shipmentDetail.rateType || 'UNKNOWN';
          const totalCharges = shipmentDetail.totalNetCharge || 
                              shipmentDetail.totalNetFedExCharge || 
                              shipmentDetail.shipmentRateDetail?.totalNetCharge;
          
          if (!totalCharges) {
            Logger.warn('No charges found for shipment detail', {
              serviceName,
              rateType
            });
            continue;
          }
          
          // Extract cost - handle both number and object formats
          let cost = 0;
          if (typeof totalCharges === 'number') {
            cost = totalCharges;
          } else if (totalCharges && typeof totalCharges === 'object' && 'amount' in totalCharges) {
            cost = typeof totalCharges.amount === 'number' 
              ? totalCharges.amount 
              : parseFloat(String(totalCharges.amount));
          } else {
            cost = parseFloat(String(totalCharges));
          }
          
          const currencyCode = shipmentDetail.currency || currency;
          
          // Extract transit time and delivery date
          let transitTime = 'Unknown';
          let deliveryDate = undefined;
          
          if (rateDetail.transitTime) {
            transitTime = rateDetail.transitTime;
          } else if (rateDetail.commit?.transitDays) {
            transitTime = `${rateDetail.commit.transitDays} days`;
          } else if (rateDetail.operationalDetail?.transitTime) {
            transitTime = rateDetail.operationalDetail.transitTime;
          }
          
          if (rateDetail.deliveryTimestamp) {
            deliveryDate = rateDetail.deliveryTimestamp;
          } else if (rateDetail.commit?.dateDetail?.dayOfWeek) {
            deliveryDate = rateDetail.commit.dateDetail.dayOfWeek;
          }
          
          const rate: ShippingRate = {
            service: serviceName,
            cost: cost,
            currency: currencyCode,
            transitTime: transitTime,
            deliveryDate: deliveryDate,
            rateType: rateType
          };
          
          rates.push(rate);
          Logger.info('Processed rate', rate);
        }
      }
      
      Logger.info(`Successfully parsed ${rates.length} FedEx rates`);
      return rates;
    } catch (error) {
      Logger.error('Error getting FedEx rates', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

// ============================================
// MAIN HANDLER
// ============================================
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8083',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://arthurkhan.github.io',
  'https://fedexcalculator.netlify.app'
];

const corsHeaders = (origin: string | null) => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };
  
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  return headers;
};

serve(async (req) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  Logger.setRequestId(requestId);
  const origin = req.headers.get('origin');
  Logger.info('New shipping calculation request received', {
    method: req.method,
    url: req.url,
    origin,
    requestId
  });
  
  if (req.method === 'OPTIONS') {
    Logger.info('Handling OPTIONS preflight request');
    return new Response('ok', {
      headers: corsHeaders(origin),
      status: 200
    });
  }
  
  try {
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }
    
    const requestData: ShippingRequest = await req.json();
    Logger.info('Request payload received', {
      requestData: {
        ...requestData,
        sessionId: requestData.sessionId ? '[REDACTED]' : 'Not provided'
      }
    });
    
    // Validate required fields
    const hasOverrideData = requestData.overrideData && 
                           typeof requestData.overrideData === 'object' && 
                           'weight_kg' in requestData.overrideData;
    const hasValidCollectionAndSize = requestData.collection && 
                                     requestData.collection.trim() !== '' && 
                                     requestData.size && 
                                     requestData.size.trim() !== '';
    
    if (!hasOverrideData && !hasValidCollectionAndSize) {
      throw new Error('Missing required fields: Either provide collection/size or override data');
    }
    if (!requestData.country || !requestData.postalCode) {
      throw new Error('Missing required destination fields');
    }
    
    const originCountry = requestData.originCountry || 'TH';
    const originPostalCode = requestData.originPostalCode || '10240';
    Logger.info('Using origin address', {
      originCountry,
      originPostalCode
    });
    
    // Get size data
    let sizeData: CollectionSize;
    let quantity = 1;
    if (hasOverrideData && requestData.overrideData) {
      Logger.info('Using override data for dimensions and weight', {
        overrideData: requestData.overrideData
      });
      sizeData = {
        weight_kg: requestData.overrideData.weight_kg,
        height_cm: requestData.overrideData.height_cm,
        length_cm: requestData.overrideData.length_cm,
        width_cm: requestData.overrideData.width_cm
      };
      quantity = 1; // Always use 1 for single shipment pricing
    } else {
      sizeData = await getCollectionSize(requestData.collection!, requestData.size!);
    }
    
    Logger.info('Size data determined', {
      sizeData,
      quantity,
      source: hasOverrideData ? 'override' : 'database'
    });
    
    let rates: ShippingRate[] = [];
    let rawFedexResponse = null;
    
    // Retrieve FedEx config from secure storage
    const fedexConfig = await getFedexConfig(requestData.sessionId);
    
    if (fedexConfig) {
      Logger.info('FedEx configuration retrieved, calculating rates');
      const { accountNumber, clientId, clientSecret } = fedexConfig;
      
      try {
        const accessToken = await FedexAuthService.getAccessToken(clientId, clientSecret);
        const fedexRates = await FedexRatesService.getRates(
          accessToken,
          accountNumber,
          sizeData,
          originCountry,
          originPostalCode,
          requestData.country,
          requestData.postalCode,
          requestData.preferredCurrency,
          requestData.shipDate,
          quantity
        );
        rawFedexResponse = FedexRatesService.getLastRawResponse();
        rates = rates.concat(fedexRates);
        Logger.info(`Added ${fedexRates.length} FedEx rates`);
      } catch (error) {
        Logger.error('FedEx rate calculation failed', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    } else {
      Logger.info('No FedEx configuration found, skipping FedEx rates');
    }
    
    Logger.info('Shipping calculation completed successfully', {
      totalRates: rates.length,
      requestId,
      currencyUsed: requestData.preferredCurrency || 'auto-mapped',
      shipDateUsed: requestData.shipDate || 'auto-generated (tomorrow)',
      usingOverride: hasOverrideData,
      quantity
    });
    
    return new Response(JSON.stringify({
      success: true,
      rates,
      requestId,
      _debug: {
        rawFedexResponse: rawFedexResponse,
        usingOverride: hasOverrideData,
        fedexQuantityUsed: quantity
      }
    }), {
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    Logger.error('Request failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId
    });
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      requestId
    }), {
      status: 500,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/json'
      }
    });
  }
});
