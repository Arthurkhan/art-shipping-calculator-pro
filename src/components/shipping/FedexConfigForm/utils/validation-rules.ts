/**
 * Validates a FedEx account number
 * @param accountNumber - The account number to validate
 * @returns boolean - True if valid, false otherwise
 */
export const validateAccountNumber = (accountNumber: string): boolean => {
  // FedEx account numbers should be 9 digits
  const cleaned = accountNumber.replace(/\D/g, '');
  return cleaned.length === 9;
};

/**
 * Validates that all required fields are filled
 * @param config - The FedEx configuration object
 * @returns boolean - True if all fields are filled, false otherwise
 */
export const validateRequiredFields = (config: {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}): boolean => {
  return Boolean(
    config.accountNumber?.trim() &&
    config.clientId?.trim() &&
    config.clientSecret?.trim()
  );
};

/**
 * Gets validation error message for account number
 * @param accountNumber - The account number to validate
 * @returns string | null - Error message or null if valid
 */
export const getAccountNumberValidationError = (accountNumber: string): string | null => {
  if (!accountNumber.trim()) {
    return "Account number is required";
  }
  
  if (!validateAccountNumber(accountNumber)) {
    return "Account number must be exactly 9 digits";
  }
  
  return null;
};

/**
 * Gets validation error message for required fields
 * @param config - The FedEx configuration object
 * @returns string | null - Error message or null if valid
 */
export const getRequiredFieldsValidationError = (config: {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}): string | null => {
  if (!config.accountNumber?.trim()) {
    return "Account number is required";
  }
  
  if (!config.clientId?.trim()) {
    return "Client ID is required";
  }
  
  if (!config.clientSecret?.trim()) {
    return "Client Secret is required";
  }
  
  return null;
};