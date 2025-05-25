
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Eye, EyeOff } from "lucide-react";

interface FedexConfigFormProps {
  onConfigSave: (config: FedexConfig) => void;
}

interface FedexConfig {
  accountNumber: string;
  apiKey: string;
  secretKey: string;
  meterNumber: string;
}

export const FedexConfigForm = ({ onConfigSave }: FedexConfigFormProps) => {
  const [config, setConfig] = useState<FedexConfig>({
    accountNumber: localStorage.getItem('fedex_account_number') || '',
    apiKey: localStorage.getItem('fedex_api_key') || '',
    secretKey: localStorage.getItem('fedex_secret_key') || '',
    meterNumber: localStorage.getItem('fedex_meter_number') || '',
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    if (!config.accountNumber || !config.apiKey || !config.secretKey || !config.meterNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all FedEx configuration fields.",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem('fedex_account_number', config.accountNumber);
    localStorage.setItem('fedex_api_key', config.apiKey);
    localStorage.setItem('fedex_secret_key', config.secretKey);
    localStorage.setItem('fedex_meter_number', config.meterNumber);

    onConfigSave(config);
    
    toast({
      title: "Configuration Saved",
      description: "FedEx API configuration has been saved successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Settings className="w-5 h-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-800">FedEx API Configuration</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accountNumber" className="text-slate-700 font-medium">
            Account Number
          </Label>
          <Input
            id="accountNumber"
            type="text"
            placeholder="Enter FedEx account number..."
            value={config.accountNumber}
            onChange={(e) => setConfig({ ...config, accountNumber: e.target.value })}
            className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meterNumber" className="text-slate-700 font-medium">
            Meter Number
          </Label>
          <Input
            id="meterNumber"
            type="text"
            placeholder="Enter FedEx meter number..."
            value={config.meterNumber}
            onChange={(e) => setConfig({ ...config, meterNumber: e.target.value })}
            className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey" className="text-slate-700 font-medium">
            API Key
          </Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showSecrets ? "text" : "password"}
              placeholder="Enter FedEx API key..."
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
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

        <div className="space-y-2">
          <Label htmlFor="secretKey" className="text-slate-700 font-medium">
            Secret Key
          </Label>
          <Input
            id="secretKey"
            type={showSecrets ? "text" : "password"}
            placeholder="Enter FedEx secret key..."
            value={config.secretKey}
            onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
            className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <Button
        onClick={handleSave}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
      >
        <Save className="w-5 h-5 mr-2" />
        Save Configuration
      </Button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700 text-sm">
          <strong>Note:</strong> Your FedEx API credentials are stored locally in your browser. 
          For production use, consider using environment variables or a secure backend service.
        </p>
      </div>
    </div>
  );
};
