/**
 * Error type definitions for shipping calculation
 */

export enum ErrorType {
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

export class ShippingError extends Error {
  public readonly type: ErrorType;
  public readonly userMessage: string;
  public readonly details?: unknown;

  constructor(type: ErrorType, message: string, userMessage: string, details?: unknown) {
    super(message);
    this.type = type;
    this.userMessage = userMessage;
    this.details = details;
    this.name = 'ShippingError';
  }
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}
