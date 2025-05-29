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
  FedexRatedShipmentDetailExtended 
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
  private static extractAmount(obj: FedexChargeVariant | undefined | null): number | null {
    if (!obj) return null;
    
    // Direct amount field
    if (obj.amount !== undefined && obj.amount !== null) {
      // Handle nested amount object
      if (typeof obj.amount === 'object' && 'value' in obj.amount && obj.amount.value !== undefined) {
        const value = typeof obj.amount.value === 'string' ? parseFloat(obj.amount.value) : obj.amount.value;
        return isNaN(value) ? null : value;
      }
      // Handle string or number amount
      const amount = typeof obj.amount === 'string' ? parseFloat(obj.amount) : obj.amount;
      return isNaN(amount) ? null : amount;
    }
    
    // Check for value field (some APIs use value instead of amount)
    if (obj.value !== undefined && obj.value !== null) {
      const value = typeof obj.value === 'string' ? parseFloat(obj.value) : obj.value;
      return isNaN(value) ? null : value;
    }
    
    return null;
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
        // Log each rate detail for debugging
        Logger.info('Processing rate detail', {
          serviceType: rateDetail.serviceType,
          hasRatedShipmentDetails: !!rateDetail.ratedShipmentDetails,
          ratedShipmentDetailsCount: rateDetail.ratedShipmentDetails?.length || 0
        });

        if (rateDetail.ratedShipmentDetails && rateDetail.ratedShipmentDetails.length > 0) {
          // Try multiple possible locations for the rate information
          for (const shipmentDetail of rateDetail.ratedShipmentDetails) {
            Logger.info('Processing shipment detail - checking all possible rate locations', {
              hasShipmentRateDetail: !!shipmentDetail.shipmentRateDetail,
              hasTotalNetCharge: !!shipmentDetail.totalNetCharge,
              hasRatedPackages: !!shipmentDetail.ratedPackages,
              shipmentDetailKeys: Object.keys(shipmentDetail)
            });

            // Try different possible locations for the rate
            let rateAmount: number | null = null;
            let rateCurrency = preferredCurrency;

            // Option 1: totalNetCharge at shipment detail level
            if (!rateAmount && shipmentDetail.totalNetCharge) {
              rateAmount = this.extractAmount(shipmentDetail.totalNetCharge);
              if (rateAmount !== null) {
                rateCurrency = shipmentDetail.totalNetCharge.currency || preferredCurrency;
                Logger.info('Found rate in totalNetCharge', { 
                  rateAmount, 
                  rateCurrency,
                  structure: shipmentDetail.totalNetCharge
                });
              }
            }
            
            // Option 2: shipmentRateDetail.totalNetCharge
            if (!rateAmount && shipmentDetail.shipmentRateDetail?.totalNetCharge) {
              rateAmount = this.extractAmount(shipmentDetail.shipmentRateDetail.totalNetCharge);
              if (rateAmount !== null) {
                rateCurrency = shipmentDetail.shipmentRateDetail.totalNetCharge.currency || preferredCurrency;
                Logger.info('Found rate in shipmentRateDetail.totalNetCharge', { 
                  rateAmount, 
                  rateCurrency,
                  structure: shipmentDetail.shipmentRateDetail.totalNetCharge
                });
              }
            }
            
            // Option 3: Check ratedPackages for rates
            if (!rateAmount && shipmentDetail.ratedPackages && shipmentDetail.ratedPackages.length > 0) {
              for (const pkg of shipmentDetail.ratedPackages) {
                if (pkg.packageRateDetail?.netCharge) {
                  rateAmount = this.extractAmount(pkg.packageRateDetail.netCharge);
                  if (rateAmount !== null) {
                    rateCurrency = pkg.packageRateDetail.netCharge.currency || preferredCurrency;
                    Logger.info('Found rate in ratedPackages', { 
                      rateAmount, 
                      rateCurrency,
                      structure: pkg.packageRateDetail.netCharge
                    });
                    break;
                  }
                }
              }
            }

            // Option 4: Check for totalNetFedExCharge (alternative field name)
            const extendedShipmentDetail = shipmentDetail as FedexRatedShipmentDetailExtended;
            if (!rateAmount && extendedShipmentDetail.totalNetFedExCharge) {
              rateAmount = this.extractAmount(extendedShipmentDetail.totalNetFedExCharge);
              if (rateAmount !== null) {
                rateCurrency = extendedShipmentDetail.totalNetFedExCharge.currency || preferredCurrency;
                Logger.info('Found rate in totalNetFedExCharge', { 
                  rateAmount, 
                  rateCurrency,
                  structure: extendedShipmentDetail.totalNetFedExCharge
                });
              }
            }

            // Log the full shipment detail structure if no rate found
            if (rateAmount === null) {
              Logger.warn('No rate found in expected locations, logging full structure', {
                shipmentDetail: JSON.stringify(shipmentDetail, null, 2)
              });
            }

            // Only add the rate if we found a valid amount
            if (rateAmount !== null && rateAmount > 0) {
              const rate: ShippingRate = {
                service: rateDetail.serviceType || 'Unknown Service',
                cost: rateAmount,
                currency: rateCurrency,
                transitTime: rateDetail.transitTime || 'Unknown',
                deliveryDate: rateDetail.deliveryTimestamp
              };
              
              rates.push(rate);
              Logger.info('Added FedEx rate', { rate });
              break; // Only use the first valid shipment detail
            }
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
      Logger.warn('No rates found in FedEx response - Enhanced debugging', { 
        responseStructure: JSON.stringify(responseData, null, 2),
        currencyInfo: {
          requested: preferredCurrency,
          source: userPreferredCurrency ? 'USER_SELECTED' : 'AUTO_MAPPED',
          userInput: userPreferredCurrency || 'Not provided'
        },
        possibleIssues: [
          'Destination postal code not serviced by FedEx',
          'Currency not supported for this route',
          'Package dimensions exceed limits',
          'Account restrictions for destination country',
          'Currency conversion not available for selected route',
          'Rate information in unexpected response structure',
          'Amount field might be in a different format or location',
          'Response might use different field names (e.g., totalNetFedExCharge)'
        ]
      });
      throw new ShippingError(
        ErrorType.RATE_PARSING,
        'No shipping rates available for this destination',
        'No shipping options available for this destination. This could be due to service availability or account restrictions.'
      );
    }

    Logger.info(`Successfully parsed ${rates.length} FedEx rates with currency ${preferredCurrency}`);
    return rates;
  }
}
