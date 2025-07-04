import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle, HelpCircle, Phone, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ServiceAvailabilityAlertProps {
  origin: { country: string; postalCode: string };
  destination: { country: string; postalCode: string };
  suggestions?: string[];
  onRetry?: () => void;
  onContactSupport?: () => void;
}

export const ServiceAvailabilityAlert: React.FC<ServiceAvailabilityAlertProps> = ({
  origin,
  destination,
  suggestions = [],
  onRetry,
  onContactSupport
}) => {
  const handleContactFedEx = () => {
    window.open('https://www.fedex.com/en-us/customer-support.html', '_blank');
  };

  const handleViewServiceMap = () => {
    window.open('https://www.fedex.com/en-us/shipping/international/services.html', '_blank');
  };

  return (
    <div className="space-y-4 fade-in">
      <Alert className="border-orange-200 bg-orange-50 error-shake">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <AlertTitle className="text-orange-900 text-lg">
          Service Not Available
        </AlertTitle>
        <AlertDescription className="text-orange-800 space-y-3">
          <p className="font-medium">
            FedEx does not currently offer direct service between:
          </p>
          
          <div className="flex items-center justify-center gap-4 py-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-orange-200">
              <MapPin className="h-4 w-4 text-orange-600" />
              <span className="font-semibold">{origin.country} ({origin.postalCode})</span>
            </div>
            <span className="text-orange-600">→</span>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-orange-200">
              <MapPin className="h-4 w-4 text-orange-600" />
              <span className="font-semibold">{destination.country} ({destination.postalCode})</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 fade-in" style={{animationDelay: '0.3s'}}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="font-semibold text-blue-900">
                  Alternative Routes Available:
                </p>
                <p className="text-sm text-blue-800">
                  FedEx offers service to these alternative destinations from your origin:
                </p>
                <ul className="space-y-1 mt-3">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      <span className="text-blue-800">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleContactFedEx}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Phone className="h-4 w-4" />
          Contact FedEx Support
        </Button>
        
        <Button
          onClick={handleViewServiceMap}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          View FedEx Service Map
        </Button>

        {onRetry && (
          <Button
            onClick={onRetry}
            variant="default"
            className="flex items-center gap-2"
          >
            Try Different Destination
          </Button>
        )}
      </div>

      {/* Additional Help Text */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-700">
        <p className="font-medium mb-2">Why is service not available?</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>FedEx may not have direct routes between certain countries</li>
          <li>Some locations require multi-leg shipping through hub cities</li>
          <li>Regulatory or operational constraints may apply</li>
          <li>Consider using FedEx International Economy for more routing options</li>
        </ul>
      </div>
    </div>
  );
};
