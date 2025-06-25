/**
 * FedEx rate calculation logic
 */

import { Logger } from './logger.ts';
import { retryWithBackoff } from './retry-utils.ts';
import { PayloadBuilder } from './payload-builder.ts';
import { getPreferredCurrency } from './currency-mapper.ts';
import { ErrorType, ShippingError, RetryOptions } from '../types/index.ts';
import type { ShippingRate, CollectionSize } from '../types/index.ts';
import type { 
  FedexRateResponse, 
  FedexChargeVariant, 
  FedexRatedShipmentDetail
} from '../types/fedex-types.ts';

// Type for the actual API response structure (differs from our TypeScript types)
interface FedexApiRatedShipmentDetail {
  rateType?: string;
  totalNetCharge?: number | { amount?: number | string; currency?: string };
  totalNetFedExCharge?: number | { amount?: number | string; currency?: string };
  shipmentRateDetail?: {
    totalNetCharge?: number | { amount?: number | string; currency?: string };
    [key: string]: unknown;
  };
  currency?: string;
  [key: string]: unknown;
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

/**
 * FedEx Rates Service
 */
export class FedexRatesService {
  // Store raw response for debugging
  static lastRawResponse: unknown = null;

  /**
   * Get FedEx shipping rates with enhanced error handling
   * Updated to support quantity parameter for multiple boxes
   */
  static async getRates(
    accessToken: string,
    accountNumber: string,
    sizeData: CollectionSize,
    originCountry: string,
    originPostalCode: string,
    destinationCountry: string,
    destinationPostalCode: string,
    userPreferredCurrency?: string,
    userShipDate?: string, // Optional user-selected ship date
    quantity: number = 1 // Optional quantity for multiple boxes
  ): Promise<ShippingRate[]> {
    const operationName = 'FedEx Rate Request';
    const retryOptions: RetryOptions = {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 15000
    };

    return retryWithBackoff(async () => {
      Logger.info('Requesting FedEx shipping rates', { quantity });

      // Use user-provided ship date or generate tomorrow's date
      const shipDateStamp = userShipDate || PayloadBuilder.generateShipDateStamp();
      
      Logger.info('Using ship date', { 
        shipDate: shipDateStamp,
        source: userShipDate ? 'User selected' : 'Auto-generated (tomorrow)'
      });

      // Use user-provided currency or fall back to auto-mapping
      const preferredCurrency = getPreferredCurrency(userPreferredCurrency, destinationCountry);

      // Build the n8n-compliant payload using PayloadBuilder
      const payload = PayloadBuilder.buildRateRequest({
        accountNumber,
        sizeData,
        originCountry,
        originPostalCode,
        destinationCountry,
        destinationPostalCode,
        preferredCurrency,
        shipDateStamp,
        quantity // Pass quantity to payload builder
      });

      // Validate payload structure
      if (!PayloadBuilder.validatePayloadStructure(payload)) {
        throw new ShippingError(
          ErrorType.VALIDATION,
          'Invalid payload structure',
          'Invalid request structure. Please try again.'
        );
      }

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
        
        // DEBUGGING: Store raw response for debugging
        this.lastRawResponse = responseData;
        
        // Enhanced debugging: Log full response for analysis
        Logger.info('FedEx rate response data (full for debugging)', { 
          responseData,
          hasOutput: !!responseData.output,
          hasRateReplyDetails: !!(responseData.output?.rateReplyDetails),
          rateReplyCount: responseData.output?.rateReplyDetails?.length || 0,
          hasErrors: !!responseData.errors,
          errorCount: responseData.errors?.length || 0
        });

        if (!response.ok) {
          Logger.error('FedEx rate request failed', { 
            status: response.status,
            statusText: response.statusText,
            responseData 
          });

          // Enhanced error handling with specific FedEx error parsing
          if (response.status === 400) {
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
                sentPayload: {
                  ...payload,
                  accountNumber: { value: '[REDACTED]' }
                },
                route: `${originCountry} (${originPostalCode}) → ${destinationCountry} (${destinationPostalCode})`,
                currencyUsed: preferredCurrency,
                currencySource: userPreferredCurrency ? 'USER_SELECTED' : 'AUTO_MAPPED',
                shipDateUsed: shipDateStamp,
                shipDateSource: userShipDate ? 'USER_SELECTED' : 'AUTO_GENERATED',
                quantity
              });
            } else {
              // Fallback if no specific errors array
              Logger.error('FedEx 400 error without specific error details', { 
                responseData,
                route: `${originCountry} (${originPostalCode}) → ${destinationCountry} (${destinationPostalCode})`
              });
            }
            
            throw new ShippingError(
              ErrorType.API_RESPONSE,
              `FedEx API error: ${errorMessage}`,
              userMessage
            );
          } else if (response.status === 401) {
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

        // Parse the response
        return this.parseRateResponse(responseData as FedexRateResponse, preferredCurrency, userPreferredCurrency);

      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
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

  /**
   * STRICT helper function to extract amount - NO RECURSION into nested objects
   * This prevents accidentally extracting from wrong nested fields
   */
  private static extractAmountDirect(value: unknown): number | null {
    // Direct numeric value
    if (typeof value === 'number') {
      return value;
    }
    
    // String numeric value
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }
    
    // For objects, only check direct amount/value properties, no recursion
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      
      // Check for amount property (but don't recurse)
      if ('amount' in obj) {
        const amount = obj.amount;
        if (typeof amount === 'number') return amount;
        if (typeof amount === 'string') {
          const cleaned = amount.replace(/[^0-9.-]/g, '');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? null : parsed;
        }
      }
      
      // Check for value property (but don't recurse)
      if ('value' in obj) {
        const val = obj.value;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const cleaned = val.replace(/[^0-9.-]/g, '');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? null : parsed;
        }
      }
    }
    
    return null;
  }

  /**
   * Format delivery date from various FedEx formats
   */
  private static formatDeliveryDate(dateStr: string | undefined): string | undefined {
    if (!dateStr) return undefined;
    
    // Check if it's already a day of week
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    if (daysOfWeek.some(day => dateStr.includes(day)) || shortDays.some(day => dateStr.includes(day))) {
      return dateStr;
    }
    
    // Try to parse as date and format
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        // Format as "Mon, Jun 2" or similar
        const options: Intl.DateTimeFormatOptions = { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
      }
    } catch (e) {
      Logger.warn('Failed to parse delivery date', { dateStr });
    }
    
    return dateStr;
  }

  /**
   * Parse FedEx rate response into ShippingRate array
   * UPDATED: Returns BOTH LIST and ACCOUNT rates for proper display
   */
  static parseRateResponse(
    responseData: FedexRateResponse, 
    preferredCurrency: string, 
    userPreferredCurrency?: string
  ): ShippingRate[] {
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
        // Enhanced logging for debugging
        Logger.info('=== Processing rate detail ===', {
          serviceType: rateDetail.serviceType,
          hasRatedShipmentDetails: !!rateDetail.ratedShipmentDetails,
          ratedShipmentDetailsCount: rateDetail.ratedShipmentDetails?.length || 0
        });

        if (rateDetail.ratedShipmentDetails && rateDetail.ratedShipmentDetails.length > 0) {
          // Collect all valid rates for this service
          const validRates: Array<{amount: number, rateType: string, detail: FedexApiRatedShipmentDetail}> = [];
          
          // Log ALL ratedShipmentDetails for debugging
          rateDetail.ratedShipmentDetails.forEach((detail: unknown, index: number) => {
            const detailApi = detail as FedexApiRatedShipmentDetail;
            Logger.info(`Detail ${index} structure:`, {
              rateType: detailApi.rateType,
              totalNetCharge: detailApi.totalNetCharge,
              totalNetChargeDirectExtraction: this.extractAmountDirect(detailApi.totalNetCharge),
              hasNestedFields: Object.keys(detailApi).filter(k => typeof detailApi[k] === 'object').length > 0,
              allKeys: Object.keys(detailApi)
            });
            
            // Extract amount from this detail
            const extractedAmount = this.extractAmountDirect(detailApi.totalNetCharge);
            if (extractedAmount && extractedAmount > 0 && detailApi.rateType) {
              validRates.push({
                amount: extractedAmount,
                rateType: detailApi.rateType,
                detail: detailApi
              });
            }
          });
          
          Logger.info('All valid rates for service', {
            serviceType: rateDetail.serviceType,
            validRates: validRates.map(r => ({ rateType: r.rateType, amount: r.amount }))
          });
          
          // Find the LIST rate
          const listRate = validRates.find(r => r.rateType === 'LIST' || r.rateType === 'RATED_LIST_PACKAGE');
          
          // Find the ACCOUNT rate
          const accountRate = validRates.find(r => 
            r.rateType === 'ACCOUNT' || 
            r.rateType === 'RATED_ACCOUNT' ||
            r.rateType === 'INCENTIVE' || 
            r.rateType === 'RATED_INCENTIVE'
          );
          
          // Extract common fields for this service
          let rateCurrency = preferredCurrency;
          const firstDetail = rateDetail.ratedShipmentDetails[0] as FedexApiRatedShipmentDetail;
          if (firstDetail && firstDetail.currency) {
            // If currency is a symbol, use the preferredCurrency instead
            const currencySymbols = ['$', '€', '£', '¥', '₹', '₩', 'R$', '₱'];
            if (currencySymbols.includes(firstDetail.currency)) {
              rateCurrency = preferredCurrency;
            } else {
              rateCurrency = firstDetail.currency;
            }
          }

          // Extract transit time and delivery date
          let transitTime = 'Unknown';
          let deliveryDate = undefined;
          
          if (rateDetail.transitTime) {
            transitTime = rateDetail.transitTime;
          }
          
          if (rateDetail.deliveryTimestamp) {
            deliveryDate = this.formatDeliveryDate(rateDetail.deliveryTimestamp);
          }
          
          if (rateDetail.operationalDetail) {
            if (rateDetail.operationalDetail.transitTime) {
              transitTime = rateDetail.operationalDetail.transitTime;
            }
            if (!deliveryDate && rateDetail.operationalDetail.deliveryDate) {
              deliveryDate = this.formatDeliveryDate(rateDetail.operationalDetail.deliveryDate);
            }
          }
          
          if (rateDetail.commit) {
            if (rateDetail.commit.label) {
              transitTime = rateDetail.commit.label;
            } else if (rateDetail.commit.transitTime) {
              transitTime = rateDetail.commit.transitTime;
            }
            
            if (!deliveryDate && rateDetail.commit.dateDetail) {
              if (rateDetail.commit.dateDetail.dayOfWeek) {
                deliveryDate = rateDetail.commit.dateDetail.dayOfWeek;
              }
            }
          }

          // Add the LIST rate (if available)
          if (listRate) {
            const rate: ShippingRate = {
              service: rateDetail.serviceType || 'Unknown Service',
              cost: listRate.amount,
              currency: rateCurrency,
              transitTime: transitTime,
              deliveryDate: deliveryDate,
              rateType: 'LIST'
            };
            
            Logger.info('=== LIST RATE ADDED ===', { 
              service: rate.service,
              cost: rate.cost,
              currency: rate.currency,
              rateType: rate.rateType
            });
            
            rates.push(rate);
          }
          
          // Add the ACCOUNT rate (if available)
          if (accountRate) {
            const rate: ShippingRate = {
              service: rateDetail.serviceType || 'Unknown Service',
              cost: accountRate.amount,
              currency: rateCurrency,
              transitTime: transitTime,
              deliveryDate: deliveryDate,
              rateType: 'ACCOUNT'
            };
            
            Logger.info('=== ACCOUNT RATE ADDED ===', { 
              service: rate.service,
              cost: rate.cost,
              currency: rate.currency,
              rateType: rate.rateType
            });
            
            rates.push(rate);
          }
          
          // If we have neither LIST nor ACCOUNT, add whatever we have as a fallback
          if (!listRate && !accountRate && validRates.length > 0) {
            const fallbackRate = validRates[0];
            const rate: ShippingRate = {
              service: rateDetail.serviceType || 'Unknown Service',
              cost: fallbackRate.amount,
              currency: rateCurrency,
              transitTime: transitTime,
              deliveryDate: deliveryDate,
              rateType: fallbackRate.rateType
            };
            
            Logger.info('=== FALLBACK RATE ADDED ===', { 
              service: rate.service,
              cost: rate.cost,
              currency: rate.currency,
              rateType: rate.rateType
            });
            
            rates.push(rate);
          }
        }
      }
    } catch (parseError) {
      Logger.error('Error parsing FedEx rates', { 
        parseError: parseError.message,
        responseData 
      });
      throw new ShippingError(
        ErrorType.RATE_PARSING,
        `Rate parsing error: ${parseError.message}`,
        'Unable to process shipping rates. Please try again.'
      );
    }

    if (rates.length === 0) {
      throw new ShippingError(
        ErrorType.RATE_PARSING,
        'No shipping rates available for this destination',
        'No shipping options available for this destination.'
      );
    }

    Logger.info(`Successfully parsed ${rates.length} FedEx rates`, { rates });
    return rates;
  }

  /**
   * Get the last raw FedEx response for debugging
   */
  static getLastRawResponse(): unknown {
    return this.lastRawResponse;
  }
}
