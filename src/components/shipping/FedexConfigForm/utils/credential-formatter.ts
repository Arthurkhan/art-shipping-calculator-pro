/**
 * Formats account number input to only allow digits
 * @param value - The input value to format
 * @returns string - Formatted account number (digits only)
 */
export const formatAccountNumber = (value: string): string => {
  return value.replace(/\D/g, ''); // Only allow digits
};

/**
 * Formats account number for display with spacing
 * @param accountNumber - The account number to format
 * @returns string - Formatted account number with spaces for readability
 */
export const formatAccountNumberForDisplay = (accountNumber: string): string => {
  const cleaned = formatAccountNumber(accountNumber);
  // Format as XXX XXX XXX for better readability
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
};

/**
 * Formats client ID by trimming whitespace
 * @param value - The client ID to format
 * @returns string - Formatted client ID
 */
export const formatClientId = (value: string): string => {
  return value.trim();
};

/**
 * Formats client secret by trimming whitespace
 * @param value - The client secret to format
 * @returns string - Formatted client secret
 */
export const formatClientSecret = (value: string): string => {
  return value.trim();
};

/**
 * Masks sensitive information for display
 * @param value - The sensitive value to mask
 * @param visibleChars - Number of characters to show at start and end
 * @returns string - Masked value
 */
export const maskSensitiveValue = (value: string, visibleChars: number = 4): string => {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length);
  }
  
  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  const middleLength = Math.max(4, value.length - visibleChars * 2);
  
  return `${start}${'*'.repeat(middleLength)}${end}`;
};

/**
 * Validates input length constraints
 * @param value - The value to validate
 * @param maxLength - Maximum allowed length
 * @returns boolean - True if within constraints
 */
export const validateInputLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * Truncates input to maximum length
 * @param value - The value to truncate
 * @param maxLength - Maximum allowed length
 * @returns string - Truncated value
 */
export const truncateToMaxLength = (value: string, maxLength: number): string => {
  return value.slice(0, maxLength);
};