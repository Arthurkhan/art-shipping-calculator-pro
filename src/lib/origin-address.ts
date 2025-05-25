// Origin address utilities for shipping calculator
// Extracted from Index.tsx for Phase 2 refactoring

import { originAddressDefaults } from './utils';
import { originStorage } from './storage-utils';

/**
 * Initialize origin address defaults in localStorage if not set
 */
export const initializeOriginDefaults = (): void => {
  const savedCountry = originStorage.getOriginCountry('');
  const savedPostalCode = originStorage.getOriginPostalCode('');
  
  if (!savedCountry) {
    originStorage.setOriginCountry(originAddressDefaults.countryName);
  }
  if (!savedPostalCode) {
    originStorage.setOriginPostalCode(originAddressDefaults.postalCode);
  }
};

/**
 * Get origin address from storage with fallbacks
 */
export const getOriginAddress = () => {
  return {
    country: originStorage.getOriginCountry(originAddressDefaults.countryName),
    postalCode: originStorage.getOriginPostalCode(originAddressDefaults.postalCode),
    countryCode: originAddressDefaults.country, // ISO code for API calls
  };
};

/**
 * Update origin country in storage
 */
export const updateOriginCountry = (country: string): void => {
  originStorage.setOriginCountry(country);
};

/**
 * Update origin postal code in storage
 */
export const updateOriginPostalCode = (postalCode: string): void => {
  originStorage.setOriginPostalCode(postalCode);
};

/**
 * Reset origin address to Thailand defaults
 */
export const resetToDefaultOrigin = (): void => {
  originStorage.setOriginCountry(originAddressDefaults.countryName);
  originStorage.setOriginPostalCode(originAddressDefaults.postalCode);
};

/**
 * Check if current origin address is the default Thailand address
 */
export const isDefaultOriginAddress = (): boolean => {
  const current = getOriginAddress();
  return (
    current.country === originAddressDefaults.countryName &&
    current.postalCode === originAddressDefaults.postalCode
  );
};

/**
 * Origin address management interface
 */
export interface OriginAddressState {
  country: string;
  postalCode: string;
  countryCode: string;
}

/**
 * Origin address actions
 */
export interface OriginAddressActions {
  updateCountry: (country: string) => void;
  updatePostalCode: (postalCode: string) => void;
  reset: () => void;
  initialize: () => void;
}

/**
 * Get complete origin address management object
 */
export const createOriginAddressManager = (): {
  state: OriginAddressState;
  actions: OriginAddressActions;
} => {
  const state = getOriginAddress();
  
  const actions: OriginAddressActions = {
    updateCountry: updateOriginCountry,
    updatePostalCode: updateOriginPostalCode,
    reset: resetToDefaultOrigin,
    initialize: initializeOriginDefaults,
  };

  return { state, actions };
};
