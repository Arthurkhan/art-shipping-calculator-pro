import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Save, Eye, EyeOff, CheckCircle, XCircle, Loader2, TestTube } from "lucide-react";
import { validateFedexAccountNumberStrict } from "@/lib/validation-utils";
import { handleApiError, logError } from "@/lib/error-utils";

interface FedexConfigFormProps {
  onConfigSave: (config: FedexConfig) => void;
}

interface FedexConfig {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}

export const FedexConfigForm = ({ onConfigSave }: FedexConfigFormProps) => {
  const [config, setConfig] = useState<FedexConfig>({
    accountNumber: localStorage.getItem('fedex_account_number') || '',
    clientId: localStorage.getItem('fedex_client_id') || '',
    clientSecret: localStorage.getItem('fedex_client_secret') || '',
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [credentialsValid, setCredentialsValid] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const testCredentials = async () => {
    if (!config.accountNumber || !config.clientId || !config.clientSecret) {
      toast({
        title: "Missing Information",
        description: "Please fill in all FedEx configuration fields before testing.",
        variant: "destructive",
      });
      return;
    }

    if (!validateFedexAccountNumberStrict(config.accountNumber)) {
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
      logError(err as Error, 'FedexConfigForm.testCredentials');
      setCredentialsValid(false);
      
      const { message } = handleApiError(err);
      toast({
        title: "Credentials Invalid",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsTestingCredentials(false);
    }
  };

  const handleSave = async () => {
    if (!config.accountNumber || !config.clientId || !config.clientSecret) {
      toast({
        title: "Missing Information",
        description: "Please fill in all FedEx configuration fields.",
        variant: "destructive",
      });
      return;
    }

    if (!validateFedexAccountNumberStrict(config.accountNumber)) {
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
      logError(err as Error, 'FedexConfigForm.handleSave');
      toast({
        title: "Save Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCredentialStatusIcon = () => {
    if (isTestingCredentials) {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    if (credentialsValid === true) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (credentialsValid === false) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  const getCredentialStatusMessage = () => {
    if (isTestingCredentials) {
      return "Testing credentials...";
    }
    if (credentialsValid === true) {
      return "Credentials verified successfully";
    }
    if (credentialsValid === false) {
      return "Credentials test failed";
    }
    return null;
  };

  const isFormComplete = config.accountNumber && config.clientId && config.clientSecret;

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Settings className="w-5 h-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-800">FedEx API Configuration</h3>
        {getCredentialStatusIcon()}
      </div>

      {/* Credential Status Banner */}
      {getCredentialStatusMessage() && (
        <div className={`p-4 rounded-lg border ${
          credentialsValid === true
            ? 'bg-green-50 border-green-200 text-green-700'
            : credentialsValid === false
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-center">
            {getCredentialStatusIcon()}
            <span className="ml-2 font-medium">{getCredentialStatusMessage()}</span>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accountNumber" className="text-slate-700 font-medium">
            Account Number (9 digits)
          </Label>
          <Input
            id="accountNumber"
            type="text"
            placeholder="123456789"
            value={config.accountNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
              setConfig({ ...config, accountNumber: value });
              setCredentialsValid(null); // Reset validation status
            }}
            className={`h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
              config.accountNumber && !validateFedexAccountNumberStrict(config.accountNumber)
                ? 'border-red-300 focus:border-red-500'
                : ''
            }`}
            maxLength={9}
          />
          {config.accountNumber && !validateFedexAccountNumberStrict(config.accountNumber) && (
            <p className="text-sm text-red-600">Account number must be exactly 9 digits</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientId" className="text-slate-700 font-medium">
            Client ID
          </Label>
          <Input
            id="clientId"
            type="text"
            placeholder="Enter FedEx Client ID..."
            value={config.clientId}
            onChange={(e) => {
              setConfig({ ...config, clientId: e.target.value });
              setCredentialsValid(null); // Reset validation status
            }}
            className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientSecret" className="text-slate-700 font-medium">
            Client Secret
          </Label>
          <div className="relative">
            <Input
              id="clientSecret"
              type={showSecrets ? "text" : "password"}
              placeholder="Enter FedEx Client Secret..."
              value={config.clientSecret}
              onChange={(e) => {
                setConfig({ ...config, clientSecret: e.target.value });
                setCredentialsValid(null); // Reset validation status
              }}
              className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 pr-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={testCredentials}
          disabled={!isFormComplete || isTestingCredentials}
          variant="outline"
          className="w-full h-12 font-medium"
        >
          {isTestingCredentials ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Testing Credentials...
            </>
          ) : (
            <>
              <TestTube className="w-5 h-5 mr-2" />
              Test Credentials
            </>
          )}
        </Button>

        <Button
          onClick={handleSave}
          disabled={!isFormComplete || isSaving}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700 text-sm">
          <strong>Note:</strong> Your FedEx API credentials are stored locally in your browser cache. 
          You can find your Client ID and Client Secret in your FedEx Developer Portal account.
          <br /><br />
          <strong>Tip:</strong> Test your credentials before saving to ensure they work properly with the FedEx API.
        </p>
      </div>
    </div>
  );
};
