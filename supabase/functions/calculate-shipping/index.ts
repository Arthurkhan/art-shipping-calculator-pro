
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShippingRequest {
  collection: string;
  size: string;
  country: string;
  postalCode: string;
  originCountry: string;
  originPostalCode: string;
  fedexConfig?: {
    accountNumber: string;
    clientId: string;
    clientSecret: string;
  };
}

interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
}

interface CollectionSize {
  weight_kg: number;
  height_cm: number;
  length_cm: number;
  width_cm: number;
}

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

// Enhanced error types for better error handling
enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NETWORK = 'NETWORK',
  API_RESPONSE = 'API_RESPONSE',
  RATE_PARSING = 'RATE_PARSING',
  DATABASE = 'DATABASE',
  CONFIGURATION = 'CONFIGURATION',
  TIMEOUT = 'TIMEOUT'
}

class ShippingError extends Error {
  public readonly type: ErrorType;
  public readonly userMessage: string;
  public readonly details?: any;

  constructor(type: ErrorType, message: string, userMessage: string, details?: any) {
    super(message);
    this.type = type;
    this.userMessage = userMessage;
    this.details = details;
    this.name = 'ShippingError';
  }
}

// Enhanced logging utility with request/response tracking
class Logger {
  private static requestId: string = '';

  static setRequestId(id: string) {
    this.requestId = id;
  }

  static log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any) {
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

  static info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  static warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }

  static error(message: string, data?: any) {
    this.log('ERROR', message, data);
  }

  // Sanitize sensitive data for logging
  private static sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = ['clientSecret', 'access_token', 'clientId', 'accountNumber'];
    const sanitized = JSON.parse(JSON.stringify(data));

    const sanitizeRecursive = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeRecursive);
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
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

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
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
        if