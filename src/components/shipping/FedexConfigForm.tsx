
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
  const { toast } = useToast();

  const handleSave = () => {
    if (!config.accountNumber || !config.clientId || !config.clientSecret) {
      toast({
        title: "Missing Information",
        description: "Please fill in all FedEx configuration fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate account number is 9 digits
    if (!/^\d{9}$/.test(config.accountNumber)) {
      toast({
        title: "Invalid Account Number",
        description: "Account number must be exactly 9 digits.",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem('fedex_account_number', config.accountNumber);
    localStorage.setItem('fedex_client_id', config.clientId);
    localStorage.setItem('fedex_client_secret', config.clientSecret);

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
            Account Number (9 digits)
          </Label>
          <Input
            id="accountNumber"
            type="text"
            placeholder="123456789"
            value={config.accountNumber}
            onChange={(e) => setConfig({ ...config, accountNumber: e.target.value })}
            className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            maxLength={9}
          />
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
            onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
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
              onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
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

      <Button
        onClick={handleSave}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
      >
        <Save className="w-5 h-5 mr-2" />
        Save Configuration
      </Button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700 text-sm">
          <strong>Note:</strong> Your FedEx API credentials are stored locally in your browser cache. 
          You can find your Client ID and Client Secret in your FedEx Developer Portal account.
        </p>
      </div>
    </div>
  );
};
