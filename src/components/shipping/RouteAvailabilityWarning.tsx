import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { isKnownUnavailableRoute, getRouteDescription } from "@/config/fedex-routes";

interface RouteAvailabilityWarningProps {
  originCountry: string;
  destinationCountry: string;
  isVisible: boolean;
}

export const RouteAvailabilityWarning: React.FC<RouteAvailabilityWarningProps> = ({
  originCountry,
  destinationCountry,
  isVisible
}) => {
  // Check if this is a known unavailable route
  const isUnavailable = isKnownUnavailableRoute(originCountry, destinationCountry);
  
  if (!isVisible || !isUnavailable || !originCountry || !destinationCountry) {
    return null;
  }

  const routeDescription = getRouteDescription(originCountry, destinationCountry);

  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <Info className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <strong>Route Advisory:</strong> FedEx typically does not offer direct service for {routeDescription}. 
        You may receive suggestions for alternative routes after calculation.
      </AlertDescription>
    </Alert>
  );
};
