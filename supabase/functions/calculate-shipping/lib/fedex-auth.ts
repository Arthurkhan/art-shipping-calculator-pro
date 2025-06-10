/**
 * FedEx authentication logic
 */

import { Logger } from './logger.ts';
import { retryWithBackoff } from './retry-utils.ts';
import { ErrorType, ShippingError, RetryOptions } from '../types/index.ts';
import type { FedexConfig } from '../types/index.ts';

/**
 * FedEx Authentication Service
 */
export class FedexAuthService {
  /**
   * Get FedEx access token with enhanced error handling
   */
  static async getAccessToken(clientId: string, clientSecret: string): Promise<string> {
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
        
        if (error.name === 'AbortError') {
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

  /**
   * Validate FedEx credentials format
   */
  static validateCredentials(config: FedexConfig): boolean {
    const { accountNumber, clientId, clientSecret } = config;
    
    if (!accountNumber || !clientId || !clientSecret) {
      return false;
    }
    
    // Basic format validation
    if (accountNumber.length < 8 || accountNumber.length > 12) {
      return false;
    }
    
    if (clientId.length < 10 || clientSecret.length < 20) {
      return false;
    }
    
    return true;
  }
}
