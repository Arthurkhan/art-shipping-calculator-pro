/**
 * Enhanced logging utility with request/response tracking
 */

type LogData = Record<string, unknown>;

// Enhanced logging utility with request/response tracking
export class Logger {
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

  // Sanitize sensitive data for logging
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
