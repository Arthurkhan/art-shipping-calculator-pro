import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { validateAccountNumber } from "../utils/validation-rules";

interface FedexConfig {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}

export const useFedexStorage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const saveConfig = async (config: FedexConfig, onConfigSave: (config: FedexConfig) => void) => {
    if (!config.accountNumber || !config.clientId || !config.clientSecret) {
      toast({
        title: "Missing Information",
        description: "Please fill in all FedEx configuration fields.",
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

    setIsSaving(true);

    try {
      // Save to localStorage
      localStorage.setItem('fedex_account_number', config.accountNumber);
      localStorage.setItem('fedex_client_id', config.clientId);
      localStorage.setItem('fedex_client_secret', config.clientSecret);

      onConfigSave(config);
      
      toast({
        title: "Configuration Saved",
        description: "FedEx API configuration has been saved successfully.",
      });
    } catch (err) {
      toast({
        title: "Save Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    saveConfig,
  };
};