/**
 * Retry utility with exponential backoff
 */

import { Logger } from './logger.ts';
import { ErrorType, ShippingError, RetryOptions } from '../types/index.ts';

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
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
