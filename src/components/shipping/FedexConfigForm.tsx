import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, AlertCircle, CheckCircle, Lock, Shield, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { validateFedexConfig } from "@/lib/form-validation";
import { sanitizeInput } from "@/lib/input-sanitizer";
import { Switch } from "@/components/ui/switch";

interface FedexConfigFormProps {
  onConfigSave: (config: { accountNumber: string; clientId: string; clientSecret: string }) => void;
  isUsingDefaults?: boolean;
  preferDefaults?: boolean;
  onToggleDefaults?: (useDefaults: boolean) => void;
  hasDefaults?: boolean;
  hasCustomConfig?: boolean;
}

/**
 * Secure FedEx Configuration Form
 * Updated 2025-06-25: Use secure server-side storage instead of localStorage
 * Credentials are never stored client-side for security
 */
export const FedexConfigForm = ({ 
  onConfigSave, 
  isUsingDefaults,
  preferDefaults = false,
  onToggleDefaults,
  hasDefaults = false,
  hasCustomConfig = false
}: FedexConfigFormProps) => {
  const [accountNumber, setAccountNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  
  const { toast } = useToast();

  const handleSave = async () => {
    // Sanitize inputs
    const sanitizedConfig = {
      accountNumber: sanitizeInput(accountNumber.trim()),
      clientId: sanitizeInput(clientId.trim()),
      clientSecret: sanitizeInput(clientSecret.trim()),
    };
    
    // Validate
    const validation = validateFedexConfig(sanitizedConfig);
    
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }
    
    setIsTesting(true);
    
    try {
      // Save to secure storage
      await onConfigSave(sanitizedConfig);
      
      // Clear form for security
      setAccountNumber("");
      setClientId("");
      setClientSecret("");
      setShowCredentials(false);
      
      toast({
        title: "Configuration Saved",
        description: "Your FedEx credentials have been securely saved and validated.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClear = () => {
    setAccountNumber("");
    setClientId("");
    setClientSecret("");
    setShowCredentials(false);
  };

  return (
    <div className="space-y-6">
      {/* Credential Toggle */}
      {onToggleDefaults && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="use-defaults" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Use Default Credentials
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Toggle between default FedEx credentials and your custom configuration
                </p>
              </div>
              <Switch
                id="use-defaults"
                checked={preferDefaults}
                onCheckedChange={onToggleDefaults}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Status indicator */}
      <div className="text-sm">
        {isUsingDefaults ? (
          <span className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
            <CheckCircle className="w-4 h-4" />
            Currently using: Default credentials
          </span>
        ) : hasCustomConfig ? (
          <span className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium">
            <Settings className="w-4 h-4" />
            Currently using: Custom credentials
          </span>
        ) : (
          <span className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
            <AlertCircle className="w-4 h-4" />
            No credentials configured
          </span>
        )}
      </div>
      
      {/* Show simple message when using defaults */}
      {preferDefaults ? (
        <Alert className="border-green-600">
          <Shield className="h-4 w-4" />
          <AlertTitle>Using Default FedEx Credentials</AlertTitle>
          <AlertDescription>
            The application is configured with default FedEx API credentials. 
            Toggle off to enter your own custom credentials.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            FedEx API Configuration
          </CardTitle>
          <CardDescription>
            Enter your FedEx API credentials to enable shipping rate calculations.
            Need credentials? Visit the FedEx Developer Portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountNumber">FedEx Account Number</Label>
            <Input
              id="accountNumber"
              type={showCredentials ? "text" : "password"}
              placeholder="Enter your FedEx account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(sanitizeInput(e.target.value))}
              className="font-mono"
              maxLength={20}
              autoComplete="off"
              data-testid="fedex-account-number"
            />
            <p className="text-xs text-muted-foreground">
              Your 9-digit FedEx account number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">API Client ID</Label>
            <Input
              id="clientId"
              type={showCredentials ? "text" : "password"}
              placeholder="Enter your API client ID"
              value={clientId}
              onChange={(e) => setClientId(sanitizeInput(e.target.value))}
              className="font-mono"
              maxLength={50}
              autoComplete="off"
              data-testid="fedex-client-id"
            />
            <p className="text-xs text-muted-foreground">
              OAuth2 client ID from FedEx Developer Portal
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientSecret">API Client Secret</Label>
            <Input
              id="clientSecret"
              type={showCredentials ? "text" : "password"}
              placeholder="Enter your API client secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(sanitizeInput(e.target.value))}
              className="font-mono"
              maxLength={100}
              autoComplete="off"
              data-testid="fedex-client-secret"
            />
            <p className="text-xs text-muted-foreground">
              OAuth2 client secret from FedEx Developer Portal
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showCredentials"
              checked={showCredentials}
              onChange={(e) => setShowCredentials(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <Label htmlFor="showCredentials" className="text-sm font-normal cursor-pointer">
              Show credentials
            </Label>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button 
              onClick={handleSave} 
              disabled={!accountNumber || !clientId || !clientSecret || isTesting}
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save & Validate
                </>
              )}
            </Button>
            <Button 
              onClick={handleClear}
              variant="outline"
              disabled={isTesting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>

          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <strong>Need FedEx API Credentials?</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Visit <a href="https://developer.fedex.com" target="_blank" rel="noopener noreferrer" className="underline">developer.fedex.com</a></li>
                <li>Create a free developer account</li>
                <li>Create a new project and select "Track API" and "Rates & Transit Times API"</li>
                <li>Copy your credentials from the project dashboard</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      )}
    </div>
  );
};
