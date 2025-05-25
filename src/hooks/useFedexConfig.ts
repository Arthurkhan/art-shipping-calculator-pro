import { useState, useEffect } from 'react';
import { fedexStorage } from '@/lib/storage-utils';
import { validateFedexConfig, getFedexConfigStatus, ValidationStatus } from '@/lib/form-validation';

export interface FedexConfig {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Custom hook for managing FedEx configuration
 * Extracted from Index.tsx for Phase 2 refactoring
 */
export const useFedexConfig = () => {
  const [fedexConfig, setFedexConfig] = useState<FedexConfig | null>(null);
  const [fedexConfigStatus, setFedexConfigStatus] = useState<ValidationStatus>('missing');

  // Check FedEx configuration status
  const checkFedexConfigStatus = () => {
    const accountNumber = fedexStorage.getAccountNumber();
    const clientId = fedexStorage.getClientId();
    const clientSecret = fedexStorage.getClientSecret();

    const config = { accountNumber, clientId, clientSecret };
    const status = getFedexConfigStatus(config);
    
    setFedexConfigStatus(status);

    if (status === 'complete') {
      // Only set fedexConfig if it's not already set or if the values changed
      setFedexConfig(prev => {
        if (!prev || 
            prev.accountNumber !== accountNumber || 
            prev.clientId !== clientId || 
            prev.clientSecret !== clientSecret) {
          return { accountNumber, clientId, clientSecret };
        }
        return prev;
      });
    } else {
      setFedexConfig(null);
    }
  };

  // Initialize config check on mount
  useEffect(() => {
    checkFedexConfigStatus();
  }, []);

  // Handle config save
  const handleConfigSave = (config: FedexConfig) => {
    fedexStorage.setFedexConfig(config);
    setFedexConfig(config);
    setFedexConfigStatus('complete');
    // Re-check status after saving to ensure consistency
    checkFedexConfigStatus();
  };

  // Clear configuration
  const clearConfig = () => {
    fedexStorage.clearFedexConfig();
    setFedexConfig(null);
    setFedexConfigStatus('missing');
  };

  // Validate current configuration
  const validateCurrentConfig = () => {
    if (!fedexConfig) {
      return { isValid: false, errors: ['No configuration found'] };
    }
    return validateFedexConfig(fedexConfig);
  };

  // Get configuration status details
  const getStatusDetails = () => {
    const config = fedexStorage.getFedexConfig();
    const validation = validateFedexConfig(config);
    
    return {
      status: fedexConfigStatus,
      hasAnyCredentials: !!(config.accountNumber || config.clientId || config.clientSecret),
      missingFields: [
        !config.accountNumber && 'Account Number',
        !config.clientId && 'Client ID',
        !config.clientSecret && 'Client Secret',
      ].filter(Boolean),
      isValid: validation.isValid,
      errors: validation.errors,
    };
  };

  // Check if config is ready for API calls
  const isConfigReady = fedexConfigStatus === 'complete' && fedexConfig !== null;

  return {
    // State
    fedexConfig,
    fedexConfigStatus,
    
    // Actions
    handleConfigSave,
    clearConfig,
    checkFedexConfigStatus,
    
    // Utilities
    validateCurrentConfig,
    getStatusDetails,
    
    // Status
    isConfigReady,
    hasCompleteConfig: fedexConfigStatus === 'complete',
    hasPartialConfig: fedexConfigStatus === 'partial',
    isMissingConfig: fedexConfigStatus === 'missing',
    isInvalidConfig: fedexConfigStatus === 'invalid',
  };
};
