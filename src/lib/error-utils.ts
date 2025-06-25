/**
 * Centralized error handling utilities for shipping calculator
 * Phase 4 implementation - Standardizing error handling
 * Updated 2025-06-25: Enhanced FedEx service availability error handling with more routes
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
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE', // New: For FedEx service availability
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ShippingError extends Error {
  type: ErrorType;
  code?: string;
  details?: unknown;
  timestamp: string;
  context?: string;
  route?: {
    origin: { country: string; postalCode: string };
    destination: { country: string; postalCode: string };
  };
  suggestions?: string[];
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
  'RATE.LOCATION.NOSERVICE': 'FedEx does not currently offer service between these locations.',
  'SERVICE.UNAVAILABLE': 'This shipping service is not available for the selected route.',
  'SERVICE.NOT.AVAILABLE': 'FedEx service is not available for this origin/destination combination.',
  
  // Validation errors
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'INVALID_POSTAL_CODE': 'Invalid postal code format.',
  'INVALID_COUNTRY': 'Invalid country code.',
  'MISSING_REQUIRED_FIELDS': 'Please fill in all required fields.',
  
  // Configuration errors
  'CONFIG_MISSING': 'Configuration is missing. Please complete the setup.',
  'CONFIG_INVALID': 'Configuration is invalid. Please check your settings.',
};

/**
 * Alternative destination suggestions for common unsupported routes
 * Expanded to cover more routes from Thailand and other regions
 */
const ROUTE_ALTERNATIVES: Record<string, string[]> = {
  // Thailand to Europe (often requires hub routing)
  'TH_IT': ['TH_SG', 'TH_HK', 'TH_JP', 'TH_AU', 'TH_US', 'TH_GB'], // Thailand to Italy
  'TH_ES': ['TH_GB', 'TH_FR', 'TH_DE', 'TH_NL'], // Thailand to Spain
  'TH_PT': ['TH_GB', 'TH_FR', 'TH_DE', 'TH_NL'], // Thailand to Portugal
  'TH_GR': ['TH_GB', 'TH_DE', 'TH_FR', 'TH_NL'], // Thailand to Greece
  'TH_PL': ['TH_DE', 'TH_GB', 'TH_NL', 'TH_FR'], // Thailand to Poland
  'TH_CZ': ['TH_DE', 'TH_AT', 'TH_GB', 'TH_NL'], // Thailand to Czech Republic
  'TH_HU': ['TH_AT', 'TH_DE', 'TH_GB', 'TH_NL'], // Thailand to Hungary
  'TH_RO': ['TH_AT', 'TH_DE', 'TH_GB', 'TH_TR'], // Thailand to Romania
  'TH_BG': ['TH_TR', 'TH_GR', 'TH_DE', 'TH_GB'], // Thailand to Bulgaria
  
  // Thailand to Nordic countries
  'TH_NO': ['TH_SE', 'TH_DK', 'TH_DE', 'TH_GB'], // Thailand to Norway
  'TH_FI': ['TH_SE', 'TH_DE', 'TH_GB', 'TH_NL'], // Thailand to Finland
  'TH_IS': ['TH_DK', 'TH_GB', 'TH_DE', 'TH_NL'], // Thailand to Iceland
  
  // Thailand to Middle East/Africa
  'TH_IL': ['TH_TR', 'TH_AE', 'TH_SG', 'TH_HK'], // Thailand to Israel
  'TH_SA': ['TH_AE', 'TH_SG', 'TH_HK', 'TH_TR'], // Thailand to Saudi Arabia
  'TH_EG': ['TH_AE', 'TH_TR', 'TH_SG', 'TH_HK'], // Thailand to Egypt
  'TH_ZA': ['TH_AE', 'TH_SG', 'TH_HK', 'TH_AU'], // Thailand to South Africa
  
  // Thailand to Latin America
  'TH_BR': ['TH_US', 'TH_MX', 'TH_CL', 'TH_AR'], // Thailand to Brazil
  'TH_AR': ['TH_US', 'TH_CL', 'TH_BR', 'TH_UY'], // Thailand to Argentina
  'TH_CL': ['TH_US', 'TH_PE', 'TH_AR', 'TH_BR'], // Thailand to Chile
  'TH_CO': ['TH_US', 'TH_MX', 'TH_PA', 'TH_BR'], // Thailand to Colombia
  'TH_PE': ['TH_US', 'TH_CL', 'TH_CO', 'TH_BR'], // Thailand to Peru
  
  // Southeast Asia internal routes that might be restricted
  'TH_MM': ['TH_SG', 'TH_MY', 'TH_VN', 'TH_HK'], // Thailand to Myanmar
  'TH_LA': ['TH_VN', 'TH_KH', 'TH_SG', 'TH_MY'], // Thailand to Laos
  'TH_KH': ['TH_VN', 'TH_SG', 'TH_MY', 'TH_HK'], // Thailand to Cambodia
  
  // Other Asian routes from Thailand
  'TH_PK': ['TH_IN', 'TH_AE', 'TH_SG', 'TH_HK'], // Thailand to Pakistan
  'TH_BD': ['TH_IN', 'TH_SG', 'TH_MY', 'TH_HK'], // Thailand to Bangladesh
  'TH_LK': ['TH_IN', 'TH_SG', 'TH_MY', 'TH_HK'], // Thailand to Sri Lanka
  'TH_NP': ['TH_IN', 'TH_CN', 'TH_SG', 'TH_HK'], // Thailand to Nepal
};

/**
 * Get friendly country names
 */
const COUNTRY_NAMES: Record<string, string> = {
  'TH': 'Thailand',
  'IT': 'Italy',
  'SG': 'Singapore',
  'HK': 'Hong Kong',
  'JP': 'Japan',
  'AU': 'Australia',
  'US': 'United States',
  'GB': 'United Kingdom',
  'FR': 'France',
  'DE': 'Germany',
  'ES': 'Spain',
  'PT': 'Portugal',
  'MY': 'Malaysia',
  'ID': 'Indonesia',
  'CN': 'China',
  'KR': 'South Korea',
  'IN': 'India',
  'NL': 'Netherlands',
  'AT': 'Austria',
  'TR': 'Turkey',
  'SE': 'Sweden',
  'DK': 'Denmark',
  'NO': 'Norway',
  'FI': 'Finland',
  'IS': 'Iceland',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'RO': 'Romania',
  'BG': 'Bulgaria',
  'GR': 'Greece',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'IL': 'Israel',
  'EG': 'Egypt',
  'ZA': 'South Africa',
  'BR': 'Brazil',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'MX': 'Mexico',
  'PA': 'Panama',
  'UY': 'Uruguay',
  'MM': 'Myanmar',
  'LA': 'Laos',
  'KH': 'Cambodia',
  'VN': 'Vietnam',
  'PK': 'Pakistan',
  'BD': 'Bangladesh',
  'LK': 'Sri Lanka',
  'NP': 'Nepal',
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
 * Check if error is a service availability error
 */
export const isServiceAvailabilityError = (error: unknown): boolean => {
  const errorStr = String(error).toUpperCase();
  const message = error instanceof Error ? error.message.toUpperCase() : '';
  
  return (
    errorStr.includes('NOSERVICE') ||
    errorStr.includes('SERVICE.UNAVAILABLE') ||
    errorStr.includes('SERVICE.NOT.AVAILABLE') ||
    errorStr.includes('NOT CURRENTLY AVAILABLE') ||
    errorStr.includes('DOES NOT CURRENTLY OFFER SERVICE') ||
    message.includes('NOSERVICE') ||
    message.includes('SERVICE IS NOT CURRENTLY AVAILABLE') ||
    message.includes('DOES NOT CURRENTLY OFFER SERVICE')
  );
};

/**
 * Get route alternatives for unsupported routes
 */
export const getRouteAlternatives = (
  originCountry: string, 
  destinationCountry: string
): { suggestions: string[]; friendlyNames: string[] } => {
  const routeKey = `${originCountry}_${destinationCountry}`;
  const alternatives = ROUTE_ALTERNATIVES[routeKey] || [];
  
  const friendlyNames = alternatives.map(route => {
    const [origin, dest] = route.split('_');
    const originName = COUNTRY_NAMES[origin] || origin;
    const destName = COUNTRY_NAMES[dest] || dest;
    return `${originName} → ${destName}`;
  });
  
  return { suggestions: alternatives, friendlyNames };
};

/**
 * Handle API errors and return user-friendly messages
 */
export const handleApiError = (error: unknown): { 
  message: string; 
  type: ErrorType; 
  code?: string;
  isServiceAvailability?: boolean;
  route?: { origin: string; destination: string };
  suggestions?: string[];
} => {
  // Check for service availability errors first
  if (isServiceAvailabilityError(error)) {
    // Try to extract route information from error
    const errorStr = error instanceof Error ? error.message : String(error);
    const routeMatch = errorStr.match(/(\w{2})\s*\([\d\s]+\)\s*→\s*(\w{2})\s*\([\d\s]+\)/);
    
    let route = undefined;
    let suggestions: string[] = [];
    
    if (routeMatch) {
      const [, origin, destination] = routeMatch;
      route = { origin, destination };
      const alternatives = getRouteAlternatives(origin, destination);
      suggestions = alternatives.friendlyNames;
    }
    
    return {
      message: 'FedEx does not currently offer direct service between these locations. You may need to use an alternative shipping method or destination.',
      type: ErrorType.SERVICE_UNAVAILABLE,
      code: 'RATE.LOCATION.NOSERVICE',
      isServiceAvailability: true,
      route,
      suggestions
    };
  }
  
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
        message: errorMessage,
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
  
  if (codeStr.includes('NOSERVICE') || codeStr.includes('SERVICE')) {
    return ErrorType.SERVICE_UNAVAILABLE;
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
      route: (error as ShippingError).route,
      suggestions: (error as ShippingError).suggestions,
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
  
  // Service availability errors are NOT retryable
  if (isServiceAvailabilityError(error)) {
    return false;
  }
  
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
