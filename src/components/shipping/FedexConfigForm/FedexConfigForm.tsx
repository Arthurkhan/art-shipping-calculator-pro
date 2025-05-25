import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Save, Eye, EyeOff, CheckCircle, XCircle, Loader2, TestTube } from "lucide-react";

import { useFedexCredentials } from "./hooks/useFedexCredentials";
import { useFedexValidation } from "./hooks/useFedexValidation";
import { useFedexStorage } from "./hooks/useFedexStorage";
import { validateAccountNumber } from "./utils/validation-rules";

interface FedexConfig {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}

interface FedexConfigFormProps {
  onConfigSave: (config: FedexConfig) => void;
}

export const FedexConfigForm = ({ onConfigSave }: FedexConfigFormProps) => {
  const {
    config,
    showSecrets,
    updateAccountNumber,
    updateClientId,
    updateClientSecret,
    toggleShowSecrets,
    isFormComplete,
  } = useFedexCredentials();

  const {
    isTestingCredentials,
    credentialsValid,
    testCredentials,
    resetValidationStatus,
  } = useFedexValidation();

  const { isSaving, saveConfig } = useFedexStorage();

  const handleConfigChange = (field: keyof FedexConfig, value: string) => {
    resetValidationStatus();
    
    switch (field) {
      case 'accountNumber':
        updateAccountNumber(value);
        break;
      case 'clientId':
        updateClientId(value);
        break;
      case 'clientSecret':
        updateClientSecret(value);
        break;
    }
  };

  const handleTestCredentials = () => {
    testCredentials(config);
  };

  const handleSave = () => {
    saveConfig(config, onConfigSave);
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
            onChange={(e) => handleConfigChange('accountNumber', e.target.value)}
            className={`h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
              config.accountNumber && !validateAccountNumber(config.accountNumber)
                ? 'border-red-300 focus:border-red-500'
                : ''
            }`}
            maxLength={9}
          />
          {config.accountNumber && !validateAccountNumber(config.accountNumber) && (
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
            onChange={(e) => handleConfigChange('clientId', e.target.value)}
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
              onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
              className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 pr-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={toggleShowSecrets}
            >
              {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleTestCredentials}
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