import { useState } from "react";

interface FedexConfig {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}

export const useFedexCredentials = () => {
  const [config, setConfig] = useState<FedexConfig>({
    accountNumber: localStorage.getItem('fedex_account_number') || '',
    clientId: localStorage.getItem('fedex_client_id') || '',
    clientSecret: localStorage.getItem('fedex_client_secret') || '',
  });
  const [showSecrets, setShowSecrets] = useState(false);

  const updateConfig = (updates: Partial<FedexConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateAccountNumber = (value: string) => {
    const cleanedValue = value.replace(/\D/g, ''); // Only allow digits
    updateConfig({ accountNumber: cleanedValue });
  };

  const updateClientId = (value: string) => {
    updateConfig({ clientId: value });
  };

  const updateClientSecret = (value: string) => {
    updateConfig({ clientSecret: value });
  };

  const toggleShowSecrets = () => {
    setShowSecrets(prev => !prev);
  };

  const isFormComplete = Boolean(
    config.accountNumber && 
    config.clientId && 
    config.clientSecret
  );

  return {
    config,
    showSecrets,
    updateAccountNumber,
    updateClientId,
    updateClientSecret,
    toggleShowSecrets,
    isFormComplete,
  };
};