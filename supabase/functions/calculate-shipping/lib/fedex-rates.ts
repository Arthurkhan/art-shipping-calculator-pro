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
   * Enhanced helper function to extract amount from various possible structures
   * Handles both direct numeric values and object structures
   */
  private static extractAmount(obj: any): number | null {
    if (!obj && obj !== 0) return null;
    
    // Direct numeric value (as shown in the sample response)
    if (typeof obj === 'number') {
      return obj;
    }
    
    // String numeric value
    if (typeof obj === 'string') {
      // Remove any currency symbols or formatting
      const cleaned = obj.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }
    
    // Object with amount field (as defined in our types)
    if (typeof obj === 'object') {
      // Check for direct amount field (could be string or number)
      if ('amount' in obj && obj.amount !== undefined && obj.amount !== null) {
        return this.extractAmount(obj.amount);
      }
      
      // Check for value field
      if ('value' in obj && obj.value !== undefined && obj.value !== null) {
        return this.extractAmount(obj.value);
      }
      
      // Check for nested structure like {amount: {value: 123}}
      if ('amount' in obj && typeof obj.amount === 'object' && obj.amount !== null) {
        if ('value' in obj.amount) {
          return this.extractAmount(obj.amount.value);
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
          let selectedDetail: any = null;
          let selectedRateAmount: number | null = null;
          
          // First, try to find a LIST rate (customer rate)
          for (const detail of rateDetail.ratedShipmentDetails) {
            // Cast to any to handle both possible structures
            const detailAny = detail as any;
            
            Logger.info('Checking ratedShipmentDetail structure', {
              rateType: detailAny.rateType,
              hasTotalNetCharge: 'totalNetCharge' in detailAny,
              totalNetChargeType: typeof detailAny.totalNetCharge,
              totalNetChargeValue: detailAny.totalNetCharge,
              hasShipmentRateDetail: 'shipmentRateDetail' in detailAny,
              currency: detailAny.currency
            });
            
            if (detailAny.rateType === 'LIST' || detailAny.rateType === 'RATED_LIST_PACKAGE') {
              // Try to extract rate from multiple possible locations
              let extractedAmount = this.extractAmount(detailAny.totalNetCharge);
              
              // If totalNetCharge extraction failed, try other fields
              if (!extractedAmount && detailAny.totalNetFedExCharge) {
                extractedAmount = this.extractAmount(detailAny.totalNetFedExCharge);
                Logger.info('Using totalNetFedExCharge instead of totalNetCharge');
              }
              
              // If still no amount, try shipmentRateDetail.totalNetCharge
              if (!extractedAmount && detailAny.shipmentRateDetail?.totalNetCharge) {
                extractedAmount = this.extractAmount(detailAny.shipmentRateDetail.totalNetCharge);
                Logger.info('Using shipmentRateDetail.totalNetCharge');
              }
              
              if (extractedAmount && extractedAmount > 0) {
                selectedDetail = detailAny;
                selectedRateAmount = extractedAmount;
                Logger.info('Found LIST rate', { 
                  rateType: detailAny.rateType,
                  amount: extractedAmount 
                });
                break;
              }
            }
          }
          
          // If no LIST rate found, fall back to ACCOUNT rate
          if (!selectedDetail || !selectedRateAmount) {
            Logger.info('No valid LIST rate found, checking ACCOUNT rates');
            
            for (const detail of rateDetail.ratedShipmentDetails) {
              const detailAny = detail as any;
              
              if (detailAny.rateType === 'ACCOUNT' || !detailAny.rateType) {
                // Try to extract rate from multiple possible locations
                let extractedAmount = this.extractAmount(detailAny.totalNetCharge);
                
                if (!extractedAmount && detailAny.totalNetFedExCharge) {
                  extractedAmount = this.extractAmount(detailAny.totalNetFedExCharge);
                }
                
                if (!extractedAmount && detailAny.shipmentRateDetail?.totalNetCharge) {
                  extractedAmount = this.extractAmount(detailAny.shipmentRateDetail.totalNetCharge);
                }
                
                if (extractedAmount && extractedAmount > 0) {
                  selectedDetail = detailAny;
                  selectedRateAmount = extractedAmount;
                  Logger.info('Using ACCOUNT rate as fallback', { 
                    rateType: detailAny.rateType,
                    amount: extractedAmount 
                  });
                  break;
                }
              }
            }
          }
          
          // If still no rate, try the first detail as last resort
          if (!selectedDetail || !selectedRateAmount) {
            const firstDetail = rateDetail.ratedShipmentDetails[0] as any;
            const extractedAmount = this.extractAmount(firstDetail.totalNetCharge) ||
                                   this.extractAmount(firstDetail.totalNetFedExCharge) ||
                                   this.extractAmount(firstDetail.shipmentRateDetail?.totalNetCharge);
            
            if (extractedAmount && extractedAmount > 0) {
              selectedDetail = firstDetail;
              selectedRateAmount = extractedAmount;
              Logger.info('Using first detail as last resort', { 
                rateType: firstDetail.rateType,
                amount: extractedAmount 
              });
            }
          }
          
          // Extract currency
          let rateCurrency = preferredCurrency;
          if (selectedDetail) {
            if (selectedDetail.currency) {
              // If currency is a symbol (like $, €, £), use the preferredCurrency instead
              const currencySymbols = ['$', '€', '£', '¥', '₹', '₩', 'R$', '₱'];
              if (currencySymbols.includes(selectedDetail.currency)) {
                rateCurrency = preferredCurrency;
                Logger.info('Currency was a symbol, using preferredCurrency instead', { 
                  symbolFound: selectedDetail.currency,
                  usingCurrency: preferredCurrency 
                });
              } else {
                // Otherwise use the currency code from API
                rateCurrency = selectedDetail.currency;
              }
            }
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
          if (selectedRateAmount !== null && selectedRateAmount > 0) {
            const rate: ShippingRate = {
              service: rateDetail.serviceType || 'Unknown Service',
              cost: selectedRateAmount,
              currency: rateCurrency,
              transitTime: transitTime,
              deliveryDate: deliveryDate
            };
            
            rates.push(rate);
            Logger.info('Added FedEx rate', { rate });
          } else {
            Logger.warn('No valid rate amount found for service', {
              serviceType: rateDetail.serviceType,
              checkedDetails: rateDetail.ratedShipmentDetails?.length || 0
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
