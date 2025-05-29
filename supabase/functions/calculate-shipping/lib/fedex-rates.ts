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
    userPreferredCurrency?: string
  ): Promise<ShippingRate[]> {
    const operationName = 'FedEx Rate Request';
    const retryOptions: RetryOptions = {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 15000
    };

    return retryWithBackoff(async () => {
      Logger.info('Requesting FedEx shipping rates');

      // Get current date for shipDateStamp - as required by roadmap
      const shipDateStamp = PayloadBuilder.generateShipDateStamp();

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
              currencySource: userPreferredCurrency ? 'USER_SELECTED' : 'AUTO_MAPPED'
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
   * Helper function to extract amount from various possible structures
   */
  private static extractAmount(obj: FedexChargeVariant | string | number | undefined | null): number | null {
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
          return this.extractAmount(obj.amount.value);
        }
        return this.extractAmount(obj.amount);
      }
      
      // Check for value field
      if ('value' in obj && obj.value !== undefined && obj.value !== null) {
        return this.extractAmount(obj.value);
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
        // Enhanced logging for delivery information
        Logger.info('Processing rate detail with delivery info', {
          serviceType: rateDetail.serviceType,
          hasRatedShipmentDetails: !!rateDetail.ratedShipmentDetails,
          ratedShipmentDetailsCount: rateDetail.ratedShipmentDetails?.length || 0,
          hasOperationalDetail: !!rateDetail.operationalDetail,
          operationalDetail: rateDetail.operationalDetail,
          hasCommit: !!rateDetail.commit,
          commit: rateDetail.commit,
          deliveryTimestamp: rateDetail.deliveryTimestamp,
          transitTime: rateDetail.transitTime
        });

        if (rateDetail.ratedShipmentDetails && rateDetail.ratedShipmentDetails.length > 0) {
          // FIXED: Check all ratedShipmentDetails and prioritize LIST rates
          let selectedDetail: FedexRatedShipmentDetail | null = null;
          
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
          let rateAmount: number | null = null;
          let rateCurrency = preferredCurrency;

          // The rate is directly on the shipmentDetail as totalNetCharge
          if ('totalNetCharge' in selectedDetail) {
            rateAmount = this.extractAmount(selectedDetail.totalNetCharge);
            rateCurrency = selectedDetail.currency || preferredCurrency;
            
            Logger.info('Found rate from selected detail', { 
              rateAmount, 
              rateCurrency,
              rateType: selectedDetail.rateType
            });
          }

          // ENHANCED: Extract transit time and delivery date from all possible fields
          let transitTime = 'Unknown';
          let deliveryDate = undefined;
          
          // Check top-level fields first
          if (rateDetail.transitTime) {
            transitTime = rateDetail.transitTime;
          }
          
          if (rateDetail.deliveryTimestamp) {
            deliveryDate = this.formatDeliveryDate(rateDetail.deliveryTimestamp);
          }
          
          // Check operationalDetail
          if (rateDetail.operationalDetail) {
            if (rateDetail.operationalDetail.transitTime) {
              transitTime = rateDetail.operationalDetail.transitTime;
            }
            if (!deliveryDate && rateDetail.operationalDetail.deliveryDate) {
              deliveryDate = this.formatDeliveryDate(rateDetail.operationalDetail.deliveryDate);
            }
            if (!deliveryDate && rateDetail.operationalDetail.deliveryDayOfWeek) {
              deliveryDate = rateDetail.operationalDetail.deliveryDayOfWeek;
            }
          }
          
          // Check commit information
          if (rateDetail.commit) {
            if (rateDetail.commit.label) {
              // Label often contains formatted delivery info like "DELIVERED BY 10:00 AM"
              transitTime = rateDetail.commit.label;
            } else if (rateDetail.commit.transitTime) {
              transitTime = rateDetail.commit.transitTime;
            }
            
            if (!deliveryDate && rateDetail.commit.dateDetail) {
              if (rateDetail.commit.dateDetail.dayOfWeek) {
                deliveryDate = rateDetail.commit.dateDetail.dayOfWeek;
              } else if (rateDetail.commit.dateDetail.dayCxsFormat) {
                deliveryDate = this.formatDeliveryDate(rateDetail.commit.dateDetail.dayCxsFormat);
              }
            }
            
            // If we have commitMessageDetails, it might contain additional info
            if (rateDetail.commit.commitMessageDetails) {
              Logger.info('Commit message details', { 
                commitMessageDetails: rateDetail.commit.commitMessageDetails 
              });
            }
          }

          Logger.info('Extracted delivery information', {
            serviceType: rateDetail.serviceType,
            transitTime,
            deliveryDate,
            rawCommit: rateDetail.commit,
            rawOperationalDetail: rateDetail.operationalDetail
          });

          // Add the rate if we found a valid amount
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
      Logger.warn('No rates found in FedEx response', { 
        responseStructure: JSON.stringify(responseData, null, 2),
        currencyInfo: {
          requested: preferredCurrency,
          source: userPreferredCurrency ? 'USER_SELECTED' : 'AUTO_MAPPED',
          userInput: userPreferredCurrency || 'Not provided'
        }
      });
      throw new ShippingError(
        ErrorType.RATE_PARSING,
        'No shipping rates available for this destination',
        'No shipping options available for this destination. This could be due to service availability or account restrictions.'
      );
    }

    Logger.info(`Successfully parsed ${rates.length} FedEx rates`);
    return rates;
  }
}
