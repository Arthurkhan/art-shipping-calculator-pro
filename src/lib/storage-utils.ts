// localStorage utilities for shipping calculator
// Centralized storage management for Phase 2 refactoring

/**
 * Storage keys for the shipping calculator
 */
export const STORAGE_KEYS = {
  ORIGIN_COUNTRY: 'origin_country',
  ORIGIN_POSTAL_CODE: 'origin_postal_code',
  FEDEX_ACCOUNT_NUMBER: 'fedex_account_number',
  FEDEX_CLIENT_ID: 'fedex_client_id',
  FEDEX_CLIENT_SECRET: 'fedex_client_secret',
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
      console.warn(`Failed to get localStorage item: ${key}`, error);
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
      console.warn(`Failed to set localStorage item: ${key}`, error);
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove localStorage item: ${key}`, error);
    }
  },

  /**
   * Clear all storage
   */
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage', error);
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
 * FedEx configuration storage utilities
 */
export const fedexStorage = {
  getAccountNumber: (): string => {
    return storage.getItem(STORAGE_KEYS.FEDEX_ACCOUNT_NUMBER);
  },

  setAccountNumber: (accountNumber: string): void => {
    storage.setItem(STORAGE_KEYS.FEDEX_ACCOUNT_NUMBER, accountNumber);
  },

  getClientId: (): string => {
    return storage.getItem(STORAGE_KEYS.FEDEX_CLIENT_ID);
  },

  setClientId: (clientId: string): void => {
    storage.setItem(STORAGE_KEYS.FEDEX_CLIENT_ID, clientId);
  },

  getClientSecret: (): string => {
    return storage.getItem(STORAGE_KEYS.FEDEX_CLIENT_SECRET);
  },

  setClientSecret: (clientSecret: string): void => {
    storage.setItem(STORAGE_KEYS.FEDEX_CLIENT_SECRET, clientSecret);
  },

  /**
   * Get complete FedEx configuration
   */
  getFedexConfig: () => {
    return {
      accountNumber: fedexStorage.getAccountNumber(),
      clientId: fedexStorage.getClientId(),
      clientSecret: fedexStorage.getClientSecret(),
    };
  },

  /**
   * Set complete FedEx configuration
   */
  setFedexConfig: (config: { accountNumber: string; clientId: string; clientSecret: string }) => {
    fedexStorage.setAccountNumber(config.accountNumber);
    fedexStorage.setClientId(config.clientId);
    fedexStorage.setClientSecret(config.clientSecret);
  },

  /**
   * Clear FedEx configuration
   */
  clearFedexConfig: () => {
    storage.removeItem(STORAGE_KEYS.FEDEX_ACCOUNT_NUMBER);
    storage.removeItem(STORAGE_KEYS.FEDEX_CLIENT_ID);
    storage.removeItem(STORAGE_KEYS.FEDEX_CLIENT_SECRET);
  },
};
