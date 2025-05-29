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

/**
 * FedEx Rates Service
 */
export class FedexRatesService {
  /**
   * Get FedEx shipping rates with enhanced error handling
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
    userShipDate?: string // Optional user-selected ship date
  ): Promise<ShippingRate[]> {
    const operationName = 'FedEx Rate Request';
    const retryOptions: RetryOptions = {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 15000
    };

    return retryWithBackoff(async () => {
      Logger.info('Requesting FedEx shipping rates');

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
        shipDateStamp
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

        const responseData = await response.json() as FedexRateResponse;
        
        // Enhanced debugging: Log full response for analysis
        Logger.info('FedEx rate response data (full for debugging)', { 
          responseData,
          hasOutput: !!responseData.output,
          hasRateReplyDetails: !!(responseData.output?.rateReplyDetails),
          rateReplyCount: responseData.output?.rateReplyDetails?.length || 0
        });

        if (!response.ok) {
          Logger.error('FedEx rate request failed', { 
            status: response.status,
            statusText: response.statusText,
            responseData 
          });

          // Enhanced 400 error handling with detailed logging
          if (response.status === 400) {
            const errorDetails = responseData?.errors || responseData?.messages || [];
            const errorMessage = errorDetails.length > 0 
              ? `Validation error: ${JSON.stringify(errorDetails)}`
              : 'Invalid request parameters';
            
            Logger.error('FedEx validation error details (400 - Bad Request)', { 
              errorDetails, 
              responseData,
              sentPayload: {
                ...payload,
                accountNumber: { value: '[REDACTED]' }
              },
              currencyUsed: preferredCurrency,
              currencySource: userPreferredCurrency ? 'USER_SELECTED' : 'AUTO_MAPPED',
              shipDateUsed: shipDateStamp,
              shipDateSource: userShipDate ? 'USER_SELECTED' : 'AUTO_GENERATED'
            });
            
            throw new ShippingError(
              ErrorType.VALIDATION,
              errorMessage,
              'Invalid shipping parameters. Please check your destination details and try again.'
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
        return this.parseRateResponse(responseData, preferredCurrency, userPreferredCurrency);

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
          let selectedRateAmount: number | null = null;
          let selectedRateType: string | undefined = undefined;
          
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
          });
          
          // First, try to find a LIST rate
          for (const detail of rateDetail.ratedShipmentDetails) {
            const detailApi = detail as FedexApiRatedShipmentDetail;
            
            if (detailApi.rateType === 'LIST' || detailApi.rateType === 'RATED_LIST_PACKAGE') {
              // CRITICAL: Use strict extraction - no recursion
              const extractedAmount = this.extractAmountDirect(detailApi.totalNetCharge);
              
              Logger.info('LIST rate extraction attempt:', {
                serviceType: rateDetail.serviceType,
                rateType: detailApi.rateType,
                totalNetChargeRaw: detailApi.totalNetCharge,
                extractedAmount: extractedAmount
              });
              
              if (extractedAmount && extractedAmount > 0) {
                selectedRateAmount = extractedAmount;
                selectedRateType = detailApi.rateType;
                break;
              }
            }
          }
          
          // If no LIST rate found, try ACCOUNT rate
          if (!selectedRateAmount) {
            for (const detail of rateDetail.ratedShipmentDetails) {
              const detailApi = detail as FedexApiRatedShipmentDetail;
              
              if (detailApi.rateType === 'ACCOUNT') {
                const extractedAmount = this.extractAmountDirect(detailApi.totalNetCharge);
                
                Logger.info('ACCOUNT rate extraction attempt:', {
                  serviceType: rateDetail.serviceType,
                  rateType: detailApi.rateType,
                  totalNetChargeRaw: detailApi.totalNetCharge,
                  extractedAmount: extractedAmount
                });
                
                if (extractedAmount && extractedAmount > 0) {
                  selectedRateAmount = extractedAmount;
                  selectedRateType = detailApi.rateType;
                  break;
                }
              }
            }
          }
          
          // Extract currency (using first detail for currency info)
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

          // Add the rate if we found a valid amount
          if (selectedRateAmount !== null && selectedRateAmount > 0) {
            const rate: ShippingRate = {
              service: rateDetail.serviceType || 'Unknown Service',
              cost: selectedRateAmount,
              currency: rateCurrency,
              transitTime: transitTime,
              deliveryDate: deliveryDate
            };
            
            Logger.info('=== FINAL RATE ADDED ===', { 
              service: rate.service,
              cost: rate.cost,
              currency: rate.currency,
              extractedFrom: selectedRateType
            });
            
            rates.push(rate);
          } else {
            Logger.error('No valid rate amount found for service', {
              serviceType: rateDetail.serviceType
            });
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
}
