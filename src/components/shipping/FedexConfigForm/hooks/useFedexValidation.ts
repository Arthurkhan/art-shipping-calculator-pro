import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateAccountNumber } from "../utils/validation-rules";

interface FedexConfig {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}

export const useFedexValidation = () => {
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [credentialsValid, setCredentialsValid] = useState<boolean | null>(null);
  const { toast } = useToast();

  const testCredentials = async (config: FedexConfig) => {
    if (!config.accountNumber || !config.clientId || !config.clientSecret) {
      toast({
        title: "Missing Information",
        description: "Please fill in all FedEx configuration fields before testing.",
        variant: "destructive",
      });
      return;
    }

    if (!validateAccountNumber(config.accountNumber)) {
      toast({
        title: "Invalid Account Number",
        description: "Account number must be exactly 9 digits.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingCredentials(true);
    setCredentialsValid(null);

    try {
      // Test credentials by making a simple API call
      const response = await supabase.functions.invoke('test-fedex-credentials', {
        body: {
          accountNumber: config.accountNumber,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Credential test failed');
      }

      setCredentialsValid(true);
      toast({
        title: "Credentials Valid",
        description: "Your FedEx API credentials are working correctly!",
      });
    } catch (err) {
      console.error('Credential test error:', err);
      setCredentialsValid(false);
      toast({
        title: "Credentials Invalid",
        description: err instanceof Error ? err.message : "Failed to validate FedEx credentials. Please check your account details.",
        variant: "destructive",
      });
    } finally {
      setIsTestingCredentials(false);
    }
  };

  const resetValidationStatus = () => {
    setCredentialsValid(null);
  };

  return {
    isTestingCredentials,
    credentialsValid,
    testCredentials,
    resetValidationStatus,
  };
};