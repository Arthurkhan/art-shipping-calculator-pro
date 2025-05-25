import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Package, Calculator, Globe, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useParameterPreview } from "./hooks/useParameterPreview";
import {
  calculateDimensionalWeight,
  getBilledWeight,
  calculateVolume,
} from "./utils/dimension-calculator";
import {
  getFormattedShipDate,
  formatNumberWithCommas,
  formatLocation,
  formatCurrency,
} from "./utils/preview-formatter";

interface ParameterPreviewProps {
  collection: string;
  size: string;
  country: string;
  postalCode: string;
  originCountry: string;
  originPostalCode: string;
  preferredCurrency: string;
  isVisible: boolean;
}

export const ParameterPreview = ({
  collection,
  size,
  country,
  postalCode,
  originCountry,
  originPostalCode,
  preferredCurrency,
  isVisible
}: ParameterPreviewProps) => {
  const { sizeData, collectionName, loading, error } = useParameterPreview({
    collection,
    size,
    isVisible
  });

  if (!isVisible) return null;

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-blue-700">Loading parameters...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !sizeData) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <Info className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error || 'No size data available'}
        </AlertDescription>
      </Alert>
    );
  }

  const dimensionalWeight = calculateDimensionalWeight(sizeData);
  const billedWeight = getBilledWeight(sizeData);
  const volume = calculateVolume(sizeData);
  const shipDate = getFormattedShipDate();

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center text-blue-900">
          <Info className="w-5 h-5 mr-2" />
          Shipping Parameters Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Collection & Size Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-slate-700">
              <Package className="w-4 h-4 mr-2 text-blue-600" />
              Collection & Size
            </div>
            <div className="pl-6 space-y-1">
              <div className="text-sm">
                <span className="font-medium">Collection:</span> {collectionName}
              </div>
              <div className="text-sm">
                <span className="font-medium">Size:</span> {size}
              </div>
              <div className="text-sm">
                <span className="font-medium">Number of boxes:</span> 1
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-slate-700">
              <Globe className="w-4 h-4 mr-2 text-green-600" />
              Shipping Route
            </div>
            <div className="pl-6 space-y-1">
              <div className="text-sm">
                <span className="font-medium">From:</span> {formatLocation(originCountry, originPostalCode)}
              </div>
              <div className="text-sm">
                <span className="font-medium">To:</span> {formatLocation(country, postalCode)}
              </div>
              <div className="text-sm">
                <span className="font-medium">Ship Date:</span> {shipDate}
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions & Weight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-slate-700">
              <Calculator className="w-4 h-4 mr-2 text-purple-600" />
              Dimensions (CM)
            </div>
            <div className="pl-6 space-y-1">
              <div className="text-sm">
                <span className="font-medium">Length:</span> {sizeData.length_cm} cm
              </div>
              <div className="text-sm">
                <span className="font-medium">Width:</span> {sizeData.width_cm} cm
              </div>
              <div className="text-sm">
                <span className="font-medium">Height:</span> {sizeData.height_cm} cm
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Total: {sizeData.length_cm} × {sizeData.width_cm} × {sizeData.height_cm} cm
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-slate-700">
              <Package className="w-4 h-4 mr-2 text-orange-600" />
              Weight Calculation
            </div>
            <div className="pl-6 space-y-1">
              <div className="text-sm">
                <span className="font-medium">Actual Weight:</span> {sizeData.weight_kg} kg
              </div>
              <div className="text-sm">
                <span className="font-medium">Dimensional Weight:</span> {dimensionalWeight} kg
              </div>
              <div className="text-sm">
                <span className="font-medium">Billed Weight:</span>{" "}
                <Badge variant="outline" className="ml-1 bg-blue-100 text-blue-800">
                  {billedWeight} kg
                </Badge>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                (Higher of actual or dimensional weight)
              </div>
            </div>
          </div>
        </div>

        {/* FedEx API Parameters */}
        <div className="border-t pt-4">
          <div className="flex items-center text-sm font-medium text-slate-700 mb-3">
            <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
            FedEx API Parameters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">Preferred Currency:</span>{" "}
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {formatCurrency(preferredCurrency)}
                </Badge>
              </div>
              <div className="text-sm">
                <span className="font-medium">Pickup Type:</span> DROPOFF_AT_FEDEX_LOCATION
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">Packaging Type:</span> YOUR_PACKAGING
              </div>
              <div className="text-sm">
                <span className="font-medium">Rate Request Types:</span> LIST, ACCOUNT, INCENTIVE
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">Group Package Count:</span> 1
              </div>
              <div className="text-sm">
                <span className="font-medium">Weight Units:</span> KG
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Currency Info */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="text-sm font-medium text-green-800 mb-1">
            💰 Currency Selection: User-Controlled
          </div>
          <div className="text-xs text-green-700">
            <div>Selected: <strong>{formatCurrency(preferredCurrency)}</strong> (manually chosen)</div>
            <div className="mt-1 text-green-600">
              Note: You can test different currencies to see which ones FedEx supports for your route.
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-slate-100 rounded-lg p-3 mt-4">
          <div className="text-xs text-slate-600">
            <div className="font-medium mb-1">Debug Information:</div>
            <div>Collection ID: {collection}</div>
            <div>Volume: {formatNumberWithCommas(volume)} cm³</div>
            <div>DIM Factor: 5000 (FedEx standard for CM/KG)</div>
            <div>Ship Date: {shipDate} (Tomorrow)</div>
            <div>Currency Source: User-selected (not auto-mapped)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};