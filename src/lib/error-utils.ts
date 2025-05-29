/**
 * Centralized error handling utilities for shipping calculator
 * Phase 4 implementation - Standardizing error handling
 */

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ShippingError extends Error {
  type: ErrorType;
  code?: string;
  details?: unknown;
  timestamp: string;
  context?: string;
}

/**
 * Create a standardized shipping error
 */
export const createShippingError = (
  type: ErrorType,
  message: string,
  code?: string,
  details?: unknown,
  context?: string
): ShippingError => {
  const error = new Error(message) as ShippingError;
  error.type = type;
  error.code = code;
  error.details = details;
  error.timestamp = new Date().toISOString();
  error.context = context;
  error.name = 'ShippingError';
  
  return error;
};

/**
 * User-friendly error messages mapping
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  '401': 'Authentication failed. Please check your credentials.',
  'UNAUTHORIZED': 'You are not authorized to perform this action.',
  'INVALID_CREDENTIALS': 'Invalid credentials provided.',
  
  // Permission errors
  '403': 'Access denied. You do not have permission to access this resource.',
  'FORBIDDEN': 'This action is not allowed.',
  'INSUFFICIENT_PERMISSIONS': 'You do not have sufficient permissions.',
  
  // Not found errors
  '404': 'The requested resource was not found.',
  'NOT_FOUND': 'The item you are looking for does not exist.',
  
  // Server errors
  '500': 'An internal server error occurred. Please try again later.',
  'INTERNAL_ERROR': 'Something went wrong on our end.',
  
  // Timeout errors
  'TIMEOUT': 'The request timed out. Please try again.',
  'REQUEST_TIMEOUT': 'The operation took too long to complete.',
  
  // Network errors
  'NETWORK_ERROR': 'Network connection error. Please check your internet connection.',
  'OFFLINE': 'You appear to be offline. Please check your connection.',
  
  // FedEx specific errors
  'FEDEX_API_ERROR': 'FedEx API error. Please try again or contact support.',
  'INVALID_FEDEX_CREDENTIALS': 'FedEx API credentials are invalid. Please check your configuration.',
  'FEDEX_RATE_LIMIT': 'FedEx API rate limit exceeded. Please try again later.',
  'NO_RATES_AVAILABLE': 'No shipping rates available for this destination.',
  
  // Validation errors
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'INVALID_POSTAL_CODE': 'Invalid postal code format.',
  'INVALID_COUNTRY': 'Invalid country code.',
  'MISSING_REQUIRED_FIELDS': 'Please fill in all required fields.',
  
  // Configuration errors
  'CONFIG_MISSING': 'Configuration is missing. Please complete the setup.',
  'CONFIG_INVALID': 'Configuration is invalid. Please check your settings.',
};

interface ErrorLike {
  code?: string | number;
  status?: string | number;
  statusCode?: string | number;
  message?: string;
  error?: string;
  description?: string;
}

/**
 * Handle API errors and return user-friendly messages
 */
export const handleApiError = (error: unknown): { message: string; type: ErrorType; code?: string } => {
  // Handle string errors
  if (typeof error === 'string') {
    const message = getErrorMessage(error);
    return {
      message,
      type: ErrorType.API_ERROR,
      code: error
    };
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    const errorMessage = error.message || 'An unexpected error occurred';
    
    // Check for specific error patterns
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return {
        message: ERROR_MESSAGES['401'] || errorMessage,
        type: ErrorType.AUTH_ERROR,
        code: '401'
      };
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      return {
        message: ERROR_MESSAGES['403'] || errorMessage,
        type: ErrorType.PERMISSION_ERROR,
        code: '403'
      };
    }
    
    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      return {
        message: ERROR_MESSAGES['404'] || errorMessage,
        type: ErrorType.API_ERROR,
        code: '404'
      };
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return {
        message: ERROR_MESSAGES['TIMEOUT'] || errorMessage,
        type: ErrorType.NETWORK_ERROR,
        code: 'TIMEOUT'
      };
    }
    
    if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
      return {
        message: ERROR_MESSAGES['NETWORK_ERROR'] || errorMessage,
        type: ErrorType.NETWORK_ERROR,
        code: 'NETWORK_ERROR'
      };
    }
    
    // Check for FedEx specific errors
    if (errorMessage.includes('FedEx') || errorMessage.includes('fedex')) {
      return {
        message: ERROR_MESSAGES['FEDEX_API_ERROR'] || errorMessage,
        type: ErrorType.API_ERROR,
        code: 'FEDEX_ERROR'
      };
    }
    
    // Default API error
    return {
      message: errorMessage,
      type: ErrorType.API_ERROR
    };
  }
  
  // Handle objects with error properties
  if (error && typeof error === 'object') {
    const errorObj = error as ErrorLike;
    const code = errorObj.code || errorObj.status || errorObj.statusCode;
    const message = errorObj.message || errorObj.error || errorObj.description || 'An error occurred';
    
    return {
      message: getErrorMessage(String(code)) || message,
      type: determineErrorType(code),
      code: code?.toString()
    };
  }
  
  // Fallback
  return {
    message: 'An unexpected error occurred. Please try again.',
    type: ErrorType.UNKNOWN_ERROR
  };
};

/**
 * Get user-friendly error message from code
 */
const getErrorMessage = (code: string | number): string => {
  const codeStr = code?.toString().toUpperCase();
  return ERROR_MESSAGES[codeStr] || `Error: ${code}`;
};

/**
 * Determine error type from code
 */
const determineErrorType = (code: string | number | undefined): ErrorType => {
  if (!code) return ErrorType.UNKNOWN_ERROR;
  
  const codeStr = code.toString();
  
  if (codeStr === '401' || codeStr.includes('AUTH')) {
    return ErrorType.AUTH_ERROR;
  }
  
  if (codeStr === '403' || codeStr.includes('FORBIDDEN') || codeStr.includes('PERMISSION')) {
    return ErrorType.PERMISSION_ERROR;
  }
  
  if (codeStr.includes('NETWORK') || codeStr.includes('TIMEOUT')) {
    return ErrorType.NETWORK_ERROR;
  }
  
  if (codeStr.includes('VALIDATION') || codeStr.includes('INVALID')) {
    return ErrorType.VALIDATION_ERROR;
  }
  
  if (codeStr.includes('CONFIG')) {
    return ErrorType.CONFIGURATION_ERROR;
  }
  
  if (codeStr.includes('DATABASE') || codeStr.includes('DB')) {
    return ErrorType.DATABASE_ERROR;
  }
  
  return ErrorType.API_ERROR;
};

/**
 * Log error with context
 */
export const logError = (error: Error | ShippingError, context: string, additionalData?: Record<string, unknown>): void => {
  const timestamp = new Date().toISOString();
  const isShippingError = 'type' in error;
  
  const errorLog = {
    timestamp,
    context,
    message: error.message,
    stack: error.stack,
    ...(isShippingError && {
      type: (error as ShippingError).type,
      code: (error as ShippingError).code,
      details: (error as ShippingError).details,
    }),
    ...(additionalData && { additionalData })
  };
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}] Error at ${timestamp}:`, errorLog);
  }
  
  // In production, you might want to send to a logging service
  // Example: sendToLoggingService(errorLog);
};

/**
 * Format error for display
 */
export const formatErrorForDisplay = (error: unknown): string => {
  const { message } = handleApiError(error);
  return message;
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  const errorStr = String(error) || '';
  const message = error instanceof Error ? error.message : '';
  
  // Network and timeout errors are typically retryable
  if (errorStr.includes('NETWORK') || errorStr.includes('TIMEOUT')) {
    return true;
  }
  
  if (message.includes('timeout') || message.includes('network')) {
    return true;
  }
  
  // Rate limit errors are retryable after a delay
  if (errorStr.includes('429') || message.includes('rate limit')) {
    return true;
  }
  
  // Server errors might be temporary
  if (errorStr.includes('500') || errorStr.includes('502') || errorStr.includes('503')) {
    return true;
  }
  
  return false;
};

/**
 * Get retry delay based on error type
 */
export const getRetryDelay = (error: unknown, attemptNumber: number): number => {
  const baseDelay = 1000; // 1 second
  
  const errorStr = String(error);
  const message = error instanceof Error ? error.message : '';
  
  // Rate limit errors should have longer delays
  if (errorStr.includes('429') || message.includes('rate limit')) {
    return baseDelay * Math.pow(2, attemptNumber) * 5; // Exponential backoff with 5x multiplier
  }
  
  // Regular exponential backoff for other errors
  return baseDelay * Math.pow(2, attemptNumber);
};

/**
 * Create error summary for logging/debugging
 */
export const createErrorSummary = (error: unknown): string => {
  if (typeof error === 'string') return error;
  
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  
  if (error && typeof error === 'object') {
    return JSON.stringify(error, null, 2);
  }
  
  return 'Unknown error';
};
