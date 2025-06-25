/**
 * Input sanitization utilities for security
 * Prevents XSS attacks and injection vulnerabilities
 */

/**
 * Sanitize user input by removing potentially dangerous characters
 * @param input - The raw user input
 * @returns Sanitized string safe for use
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Escape special characters that could be used in SQL injection
  sanitized = sanitized.replace(/['";\\]/g, (char) => {
    const escapeMap: Record<string, string> = {
      "'": "\\'",
      '"': '\\"',
      ';': '\\;',
      '\\': '\\\\'
    };
    return escapeMap[char] || char;
  });
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Sanitize postal codes - only allow alphanumeric, spaces, and hyphens
 * @param postalCode - The postal code to sanitize
 * @returns Sanitized postal code
 */
export function sanitizePostalCode(postalCode: string): string {
  if (!postalCode || typeof postalCode !== 'string') {
    return '';
  }
  
  // Only allow alphanumeric characters, spaces, and hyphens
  return postalCode.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
}

/**
 * Sanitize country codes - only allow uppercase letters
 * @param countryCode - The country code to sanitize
 * @returns Sanitized country code
 */
export function sanitizeCountryCode(countryCode: string): string {
  if (!countryCode || typeof countryCode !== 'string') {
    return '';
  }
  
  // Only allow uppercase letters and limit to 2 characters
  return countryCode.replace(/[^A-Z]/g, '').substring(0, 2);
}

/**
 * Sanitize currency codes - only allow uppercase letters
 * @param currencyCode - The currency code to sanitize
 * @returns Sanitized currency code
 */
export function sanitizeCurrencyCode(currencyCode: string): string {
  if (!currencyCode || typeof currencyCode !== 'string') {
    return '';
  }
  
  // Only allow uppercase letters and limit to 3 characters
  return currencyCode.replace(/[^A-Z]/g, '').substring(0, 3);
}

/**
 * Sanitize numeric input - only allow numbers and decimal points
 * @param numericInput - The numeric input to sanitize
 * @returns Sanitized numeric string
 */
export function sanitizeNumeric(numericInput: string): string {
  if (!numericInput || typeof numericInput !== 'string') {
    return '';
  }
  
  // Only allow numbers and decimal points
  const sanitized = numericInput.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  return sanitized;
}

/**
 * Sanitize email addresses
 * @param email - The email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  // Basic email sanitization - remove potentially dangerous characters
  return email
    .toLowerCase()
    .replace(/[<>'"]/g, '')
    .trim();
}

/**
 * Sanitize FedEx account numbers - only allow alphanumeric
 * @param accountNumber - The account number to sanitize
 * @returns Sanitized account number
 */
export function sanitizeFedexAccountNumber(accountNumber: string): string {
  if (!accountNumber || typeof accountNumber !== 'string') {
    return '';
  }
  
  // Only allow alphanumeric characters
  return accountNumber.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
}

/**
 * Sanitize API keys/secrets - remove whitespace and control characters
 * @param apiKey - The API key/secret to sanitize
 * @returns Sanitized API key
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey || typeof apiKey !== 'string') {
    return '';
  }
  
  // Remove whitespace and control characters
  return apiKey.replace(/[\s\x00-\x1F\x7F]/g, '').substring(0, 100);
}

/**
 * Escape HTML entities to prevent XSS when displaying user input
 * @param text - The text to escape
 * @returns HTML-escaped string
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
}

/**
 * Validate and sanitize URL
 * @param url - The URL to validate and sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }
    
    return urlObj.toString();
  } catch {
    return '';
  }
}

/**
 * Deep sanitize an object by sanitizing all string values
 * @param obj - The object to sanitize
 * @returns Sanitized object
 */
export function deepSanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = deepSanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized as T;
}
