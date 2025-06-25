import { useState, useEffect } from 'react';
import SecureFedexService from '@/lib/secure-fedex-service';
import { validateFedexConfig, ValidationStatus } from '@/lib/form-validation';
import { useToast } from '@/hooks/use-toast';

export interface FedexConfig {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Custom hook for managing FedEx configuration with secure storage
 * Updated to use server-side storage instead of localStorage
 */
export const useFedexConfig = () => {
  const [fedexConfig, setFedexConfig] = useState<FedexConfig | null>(null);
  const [fedexConfigStatus, setFedexConfigStatus] = useState<ValidationStatus>('missing');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check FedEx configuration status
  const checkFedexConfigStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if config exists on server
      const { hasConfig, sessionId: existingSessionId } = await SecureFedexService.checkConfig();
      
      if (hasConfig && existingSessionId) {
        setFedexConfigStatus('complete');
        setSessionId(existingSessionId);
        // We don't store the actual config locally for security
        setFedexConfig({ 
          accountNumber: '***', 
          clientId: '***', 
          clientSecret: '***' 
        });
      } else {
        setFedexConfigStatus('missing');
        setFedexConfig(null);
        setSessionId(null);
      }
    } catch (error) {
      console.error('Failed to check FedEx config status:', error);
      setFedexConfigStatus('missing');
      setFedexConfig(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize config check on mount
  useEffect(() => {
    checkFedexConfigStatus();
  }, []);

  // Handle config save
  const handleConfigSave = async (config: FedexConfig) => {
    try {
      setIsLoading(true);
      
      // Validate config format
      const validation = validateFedexConfig(config);
      if (!validation.isValid) {
        toast({
          title: "Invalid Configuration",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      // Save to secure storage
      const { success, sessionId: newSessionId, error } = await SecureFedexService.saveConfig(config);
      
      if (success && newSessionId) {
        setSessionId(newSessionId);
        setFedexConfig({ 
          accountNumber: '***', 
          clientId: '***', 
          clientSecret: '***' 
        });
        setFedexConfigStatus('complete');
        
        toast({
          title: "Configuration Saved",
          description: "FedEx credentials have been securely saved.",
        });
        
        // Validate against FedEx API
        const { isValid, message } = await SecureFedexService.validateConfig();
        if (!isValid) {
          setFedexConfigStatus('invalid');
          toast({
            title: "Validation Failed",
            description: message || "FedEx credentials are invalid.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Save Failed",
          description: error || "Failed to save FedEx configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to save FedEx config:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear configuration
  const clearConfig = async () => {
    try {
      setIsLoading(true);
      
      const { success, error } = await SecureFedexService.deleteConfig();
      
      if (success) {
        setFedexConfig(null);
        setFedexConfigStatus('missing');
        setSessionId(null);
        
        toast({
          title: "Configuration Cleared",
          description: "FedEx configuration has been removed.",
        });
      } else {
        toast({
          title: "Clear Failed",
          description: error || "Failed to clear FedEx configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to clear FedEx config:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while clearing configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Validate current configuration
  const validateCurrentConfig = async () => {
    if (!sessionId) {
      return { isValid: false, errors: ['No configuration found'] };
    }
    
    try {
      const { isValid, message } = await SecureFedexService.validateConfig();
      return {
        isValid,
        errors: isValid ? [] : [message || 'Invalid configuration']
      };
    } catch (error) {
      return { isValid: false, errors: ['Failed to validate configuration'] };
    }
  };

  // Get configuration status details
  const getStatusDetails = () => {
    return {
      status: fedexConfigStatus,
      hasAnyCredentials: fedexConfigStatus !== 'missing',
      missingFields: fedexConfigStatus === 'missing' ? 
        ['Account Number', 'Client ID', 'Client Secret'] : [],
      isValid: fedexConfigStatus === 'complete',
      errors: fedexConfigStatus === 'invalid' ? ['Invalid credentials'] : [],
    };
  };

  // Check if config is ready for API calls
  const isConfigReady = fedexConfigStatus === 'complete' && sessionId !== null;

  return {
    // State
    fedexConfig,
    fedexConfigStatus,
    sessionId,
    isLoading,
    
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
