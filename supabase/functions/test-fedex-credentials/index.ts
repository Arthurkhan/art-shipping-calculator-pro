
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Complete CORS headers with all required fields
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// Enhanced error types
enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NETWORK = 'NETWORK',
  API_RESPONSE = 'API_RESPONSE',
  TIMEOUT = 'TIMEOUT'
}

class CredentialTestError extends Error {
  public readonly type: ErrorType;
  public readonly userMessage: string;
  public readonly details?: unknown;

  constructor(type: ErrorType, message: string, userMessage: string, details?: unknown) {
    super(message);
    this.type = type;
    this.userMessage = userMessage;
    this.details = details;
    this.name = 'CredentialTestError';
  }
}

type LogData = Record<string, unknown>;

// Enhanced logging
class Logger {
  private static requestId: string = '';

  static setRequestId(id: string) {
    this.requestId = id;
  }

  static log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      requestId: this.requestId,
      level,
      message,
      ...(data && { data: this.sanitizeData(data) })
    };
    console.log(JSON.stringify(logEntry));
  }

  static info(message: string, data?: unknown) {
    this.log('INFO', message, data);
  }

  static warn(message: string, data?: unknown) {
    this.log('WARN', message, data);
  }

  static error(message: string, data?: unknown) {
    this.log('ERROR', message, data);
  }

  private static sanitizeData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = ['clientSecret', 'access_token', 'clientId', 'accountNumber'];
    const sanitized = JSON.parse(JSON.stringify(data));

    const sanitizeRecursive = (obj: unknown): unknown => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeRecursive);
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const result: LogData = {};
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = sanitizeRecursive(value);
          }
        }
        return result;
      }
      
      return obj;
    };

    return sanitizeRecursive(sanitized);
  }
}

// Validate account number format
function validateAccountNumber(accountNumber: string): boolean {
  // FedEx account numbers should be 9 digits
  const cleaned = accountNumber.replace(/\D/g, '');
  return cleaned.length === 9;
}

// Test FedEx authentication
async function testFedexAuthentication(clientId: string, clientSecret: string): Promise<string> {
  Logger.info('Testing FedEx authentication');
  
  const authData = new URLSearchParams({
    'grant_type': 'client_credentials',
    'client_id': clientId,
    'client_secret': clientSecret,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const authResponse = await fetch('https://apis.fedex.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: authData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    Logger.info('FedEx auth response received', { 
      status: authResponse.status,
      statusText: authResponse.statusText 
    });

    const authResult = await authResponse.json();

    if (!authResponse.ok) {
      Logger.error('FedEx authentication failed', { 
        status: authResponse.status,
        statusText: authResponse.statusText,
        authResult 
      });

      if (authResponse.status === 401) {
        throw new CredentialTestError(
          ErrorType.AUTHENTICATION,
          `Authentication failed: ${authResponse.status}`,
          'Invalid FedEx credentials. Please check your Client ID and Client Secret.'
        );
      } else if (authResponse.status === 403) {
        throw new CredentialTestError(
          ErrorType.AUTHORIZATION,
          `Authorization failed: ${authResponse.status}`,
          'FedEx account not authorized for API access.'
        );
      } else if (authResponse.status >= 500) {
        throw new CredentialTestError(
          ErrorType.NETWORK,
          `FedEx server error: ${authResponse.status}`,
          'FedEx service temporarily unavailable. Please try again.'
        );
      } else {
        throw new CredentialTestError(
          ErrorType.API_RESPONSE,
          `Unexpected response: ${authResponse.status}`,
          authResult.error_description || 'Authentication failed. Please check your credentials.'
        );
      }
    }

    if (!authResult.access_token) {
      throw new CredentialTestError(
        ErrorType.API_RESPONSE,
        'No access token in authentication response',
        'Authentication response invalid. Please try again.'
      );
    }

    Logger.info('FedEx authentication successful');
    return authResult.access_token;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new CredentialTestError(
        ErrorType.TIMEOUT,
        'FedEx authentication request timed out',
        'Request timed out. Please try again.'
      );
    }
    
    throw error;
  }
}

// Test FedEx API with a simple rate request
async function testFedexApiAccess(accessToken: string, accountNumber: string): Promise<boolean> {
  Logger.info('Testing FedEx API access with rate request');
  
  const testPayload = {
    accountNumber: {
      value: accountNumber
    },
    requestedShipment: {
      shipper: {
        address: {
          postalCode: "10240",
          countryCode: "TH"
        }
      },
      recipient: {
        address: {
          postalCode: "10110", 
          countryCode: "TH"
        }
      },
      shipDateStamp: new Date().toISOString().split('T')[0],
      rateRequestType: ["LIST"],
      requestedPackageLineItems: [{
        groupPackageCount: 1,
        weight: {
          units: "KG",
          value: 1
        },
        dimensions: {
          length: 10,
          width: 10,
          height: 10,
          units: "CM"
        }
      }],
      pickupType: "DROPOFF_AT_FEDEX_LOCATION",
      packagingType: "YOUR_PACKAGING",
      preferredCurrency: "USD"
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const testResponse = await fetch('https://apis.fedex.com/rate/v1/rates/quotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-locale': 'en_US',
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    Logger.info('FedEx API test response received', { 
      status: testResponse.status,
      statusText: testResponse.statusText 
    });

    const testResult = await testResponse.json();

    if (!testResponse.ok) {
      Logger.warn('FedEx API test call failed, but credentials may still be valid', { 
        status: testResponse.status,
        testResult 
      });
      
      interface FedexError {
        code?: string;
      }
      
      // Check if it's an account-related error
      if (testResult.errors && Array.isArray(testResult.errors) && 
          testResult.errors.some((error: unknown) => {
            if (error && typeof error === 'object') {
              const fedexError = error as FedexError;
              return fedexError.code && 
                (fedexError.code.includes('ACCOUNT') || fedexError.code.includes('UNAUTHORIZED'));
            }
            return false;
          })
      ) {
        throw new CredentialTestError(
          ErrorType.AUTHORIZATION,
          'Account number is invalid or not authorized for API access',
          'Account number is invalid or not authorized for FedEx API access.'
        );
      }
      
      // For other errors, credentials might still be valid (could be service-specific issues)
      Logger.info('API test failed but treating credentials as potentially valid');
      return false; // API test failed but credentials are authenticated
    }

    Logger.info('FedEx API test successful');
    return true; // Full success
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new CredentialTestError(
        ErrorType.TIMEOUT,
        'FedEx API test request timed out',
        'API test timed out. Please try again.'
      );
    }
    
    throw error;
  }
}

serve(async (req) => {
  // Generate unique request ID for correlation
  const requestId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  Logger.setRequestId(requestId);
  
  Logger.info('New FedEx credential test request received', {
    method: req.method,
    url: req.url,
    requestId
  });

  // Handle CORS preflight requests - THIS IS CRITICAL
  if (req.method === 'OPTIONS') {
    Logger.info('Handling OPTIONS preflight request');
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new CredentialTestError(
        ErrorType.VALIDATION,
        `Method ${req.method} not allowed`,
        'Only POST requests are allowed.'
      );
    }

    const { accountNumber, clientId, clientSecret } = await req.json();

    // Enhanced input validation
    if (!accountNumber || !clientId || !clientSecret) {
      throw new CredentialTestError(
        ErrorType.VALIDATION,
        'Missing required credentials',
        'Please provide all required FedEx credentials: Account Number, Client ID, and Client Secret.'
      );
    }

    if (!validateAccountNumber(accountNumber)) {
      throw new CredentialTestError(
        ErrorType.VALIDATION,
        'Invalid account number format',
        'Account number must be exactly 9 digits.'
      );
    }

    Logger.info('Testing FedEx credentials', { accountNumber: '[REDACTED]' });

    // Step 1: Test authentication
    const accessToken = await testFedexAuthentication(clientId, clientSecret);

    // Step 2: Test API access with account number
    const apiTestPassed = await testFedexApiAccess(accessToken, accountNumber);

    const result = {
      success: true,
      message: 'FedEx credentials are valid',
      accountVerified: apiTestPassed,
      authenticationPassed: true,
      requestId
    };

    Logger.info('Credential test completed successfully', { result });

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    Logger.error('Credential test failed', { 
      error: error instanceof Error ? error.message : String(error),
      type: error instanceof CredentialTestError ? error.type : 'UNKNOWN',
      requestId
    });
    
    let statusCode = 500;
    let userMessage = 'An unexpected error occurred while testing credentials.';

    if (error instanceof CredentialTestError) {
      userMessage = error.userMessage;
      
      // Map error types to appropriate HTTP status codes
      switch (error.type) {
        case ErrorType.VALIDATION:
          statusCode = 400;
          break;
        case ErrorType.AUTHENTICATION:
        case ErrorType.AUTHORIZATION:
          statusCode = 401;
          break;
        case ErrorType.TIMEOUT:
          statusCode = 408;
          break;
        case ErrorType.NETWORK:
        case ErrorType.API_RESPONSE:
        default:
          statusCode = 500;
          break;
      }
    }

    return new Response(
      JSON.stringify({ 
        error: userMessage,
        success: false,
        requestId,
        ...(error instanceof CredentialTestError && { errorType: error.type })
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});
