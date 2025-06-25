import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, AlertCircle, CheckCircle, Lock, Shield, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { validateFedexConfig } from "@/lib/form-validation";
import { sanitizeInput } from "@/lib/input-sanitizer";

interface FedexConfigFormProps {
  onConfigSave: (config: { accountNumber: string; clientId: string; clientSecret: string }) => void;
}

/**
 * Secure FedEx Configuration Form
 * Updated 2025-06-25: Use secure server-side storage instead of localStorage
 * Credentials are never stored client-side for security
 */
export const FedexConfigForm = ({ onConfigSave }: FedexConfigFormProps) => {
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
      console.error("Failed to save FedEx config:", error);
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
      {/* Security Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Secure Configuration</AlertTitle>
        <AlertDescription className="text-blue-700">
          Your FedEx credentials are encrypted and stored securely on our servers. 
          They are never stored in your browser or exposed in the application code.
        </AlertDescription>
      </Alert>

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
              className="rounded border-gray-300"
            />
            <Label htmlFor="showCredentials" className="text-sm font-normal cursor-pointer">
              Show credentials
            </Label>
          </div>

          <Separator />

          <Alert className="border-amber-200 bg-amber-50">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Security Best Practices</AlertTitle>
            <AlertDescription className="text-amber-700 space-y-2 mt-2">
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Never share your API credentials with anyone</li>
                <li>Rotate your client secret regularly</li>
                <li>Use test credentials for development</li>
                <li>Monitor your API usage in the FedEx portal</li>
              </ul>
            </AlertDescription>
          </Alert>

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
    </div>
  );
};
