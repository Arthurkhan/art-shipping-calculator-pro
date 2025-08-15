// Secure storage utilities for shipping calculator
// This version removes FedEx credentials from localStorage for security

/**
 * Storage keys for the shipping calculator
 * FedEx credentials are NO LONGER stored in localStorage for security
 */
export const STORAGE_KEYS = {
  ORIGIN_COUNTRY: 'origin_country',
  ORIGIN_POSTAL_CODE: 'origin_postal_code',
  FEDEX_SESSION_ID: 'fedex_session_id', // Only store session ID, not credentials
  USE_DEFAULT_CREDENTIALS: 'use_default_credentials', // Toggle preference for default vs custom
} as const;

/**
 * Generic localStorage utilities
 */
export const storage = {
  /**
   * Get item from localStorage with fallback
   */
  getItem: (key: string, fallback: string = ''): string => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch (error) {
      return fallback;
    }
  },

  /**
   * Set item in localStorage
   */
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Silently fail
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Silently fail
    }
  },

  /**
   * Clear all storage
   */
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      // Silently fail
    }
  },
};

/**
 * Origin address storage utilities
 */
export const originStorage = {
  getOriginCountry: (fallback: string = 'Thailand'): string => {
    return storage.getItem(STORAGE_KEYS.ORIGIN_COUNTRY, fallback);
  },

  setOriginCountry: (country: string): void => {
    storage.setItem(STORAGE_KEYS.ORIGIN_COUNTRY, country);
  },

  getOriginPostalCode: (fallback: string = '10240'): string => {
    return storage.getItem(STORAGE_KEYS.ORIGIN_POSTAL_CODE, fallback);
  },

  setOriginPostalCode: (postalCode: string): void => {
    storage.setItem(STORAGE_KEYS.ORIGIN_POSTAL_CODE, postalCode);
  },
};

/**
 * Secure FedEx session storage
 * Only stores session ID, actual credentials are stored server-side
 */
export const secureFedexStorage = {
  /**
   * Get session ID for FedEx configuration
   */
  getSessionId: (): string => {
    return storage.getItem(STORAGE_KEYS.FEDEX_SESSION_ID);
  },

  /**
   * Set session ID for FedEx configuration
   */
  setSessionId: (sessionId: string): void => {
    storage.setItem(STORAGE_KEYS.FEDEX_SESSION_ID, sessionId);
  },

  /**
   * Clear session ID
   */
  clearSessionId: (): void => {
    storage.removeItem(STORAGE_KEYS.FEDEX_SESSION_ID);
  },

  /**
   * Check if session exists
   */
  hasSession: (): boolean => {
    return !!secureFedexStorage.getSessionId();
  },

  /**
   * Get preference for using default credentials
   */
  getUseDefaultsPreference: (): boolean => {
    return storage.getItem(STORAGE_KEYS.USE_DEFAULT_CREDENTIALS) === 'true';
  },

  /**
   * Set preference for using default credentials
   */
  setUseDefaultsPreference: (useDefaults: boolean): void => {
    storage.setItem(STORAGE_KEYS.USE_DEFAULT_CREDENTIALS, String(useDefaults));
  },
};

/**
 * Legacy FedEx storage - DEPRECATED
 * These functions are kept for backward compatibility but should NOT be used
 * They will log warnings when called
 */
export const fedexStorage = {
  getAccountNumber: (): string => {
    // DEPRECATED: Use secure session-based storage instead
    return '';
  },

  setAccountNumber: (accountNumber: string): void => {
    // DEPRECATED: Use secure session-based storage instead
  },

  getClientId: (): string => {
    // DEPRECATED: Use secure session-based storage instead
    return '';
  },

  setClientId: (clientId: string): void => {
    // DEPRECATED: Use secure session-based storage instead
  },

  getClientSecret: (): string => {
    // DEPRECATED: Use secure session-based storage instead
    return '';
  },

  setClientSecret: (clientSecret: string): void => {
    // DEPRECATED: Use secure session-based storage instead
  },

  /**
   * Get complete FedEx configuration - DEPRECATED
   */
  getFedexConfig: () => {
    // DEPRECATED: Use secure session-based storage instead
    return {
      accountNumber: '',
      clientId: '',
      clientSecret: '',
    };
  },

  /**
   * Set complete FedEx configuration - DEPRECATED
   */
  setFedexConfig: (config: { accountNumber: string; clientId: string; clientSecret: string }) => {
    // DEPRECATED: Use secure session-based storage instead
  },

  /**
   * Clear FedEx configuration - DEPRECATED
   */
  clearFedexConfig: () => {
    // DEPRECATED: Use secure session-based storage instead
    // Clear any legacy data that might exist
    localStorage.removeItem('fedex_account_number');
    localStorage.removeItem('fedex_client_id');
    localStorage.removeItem('fedex_client_secret');
  },
};

// Migration function to clean up any existing FedEx credentials in localStorage
export const migrateAndCleanupStorage = () => {
  const legacyKeys = ['fedex_account_number', 'fedex_client_id', 'fedex_client_secret'];
  let migrated = false;
  
  legacyKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      migrated = true;
    }
  });
  
  if (migrated) {
    // Legacy FedEx credentials removed from localStorage for security
  }
};

// Run migration on module load
migrateAndCleanupStorage();
