import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Package, Calculator, Globe, MapPin, Edit3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

interface CollectionSize {
  weight_kg: number;
  height_cm: number;
  length_cm: number;
  width_cm: number;
}

interface OverrideData {
  weight_kg: number;
  height_cm: number;
  length_cm: number;
  width_cm: number;
  quantity: number;
  box_configurations?: Array<{
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    weight: number;
    quantity: number;
  }>;
}

interface ParameterPreviewProps {
  collection: string;
  size: string;
  country: string;
  postalCode: string;
  originCountry: string;
  originPostalCode: string;
  preferredCurrency: string;
  isVisible: boolean;
  shipDate?: Date;
  overrideData?: OverrideData | null;
  isOverrideEnabled?: boolean;
}

export const ParameterPreview = ({
  collection,
  size,
  country,
  postalCode,
  originCountry,
  originPostalCode,
  preferredCurrency,
  isVisible,
  shipDate,
  overrideData,
  isOverrideEnabled = false
}: ParameterPreviewProps) => {
  const [sizeData, setSizeData] = useState<CollectionSize | null>(null);
  const [collectionName, setCollectionName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Load size data when parameters change
  useEffect(() => {
    if (collection && size && isVisible && !isOverrideEnabled) {
      const loadCollectionName = async () => {
        try {
          const { data, error } = await supabase
            .from('collections')
            .select('name')
            .eq('id', collection)
            .single();

          if (error) throw error;
          setCollectionName(data?.name || 'Unknown Collection');
        } catch (err) {
          setCollectionName('Unknown Collection');
        }
      };

      const loadSizeData = async () => {
        setLoading(true);
        setError("");
        try {
          const { data, error } = await supabase
            .from('sizes') // Changed from 'collection_sizes' to 'sizes'
            .select('weight_kg, height_cm, length_cm, width_cm')
            .eq('collection_id', collection)
            .eq('size', size)
            .single();

          if (error) throw error;
          
          if (!data) {
            setError(`No size data found for ${size}`);
            setSizeData(null);
            return;
          }

          setSizeData(data);
        } catch (err) {
          setError('Failed to load size data');
          setSizeData(null);
        } finally {
          setLoading(false);
        }
      };

      loadSizeData();
      loadCollectionName();
    } else if (collection && isVisible && isOverrideEnabled) {
      // Still load collection name even in override mode
      const loadCollectionName = async () => {
        try {
          const { data, error } = await supabase
            .from('collections')
            .select('name')
            .eq('id', collection)
            .single();

          if (error) throw error;
          setCollectionName(data?.name || 'Unknown Collection');
        } catch (err) {
          setCollectionName('Unknown Collection');
        }
      };
      loadCollectionName();
    }
  }, [collection, size, isVisible, isOverrideEnabled]);

  // Calculate dimensional weight (DIM weight) for a single box
  const calculateDimensionalWeight = (length: number, width: number, height: number) => {
    // FedEx DIM factor: 5000 for cm/kg
    const volumetricWeight = (length * width * height) / 5000;
    return Math.round(volumetricWeight * 100) / 100; // Round to 2 decimal places
  };

  // Get billed weight for a single box
  const getBilledWeight = (actualWeight: number, length: number, width: number, height: number) => {
    const dimWeight = calculateDimensionalWeight(length, width, height);
    return Math.max(actualWeight, dimWeight);
  };

  // Calculate total shipment stats when using box configurations
  const getShipmentStats = () => {
    if (!overrideData?.box_configurations) {
      return null;
    }

    let totalBoxes = 0;
    let totalWeight = 0;
    let totalBilledWeight = 0;

    overrideData.box_configurations.forEach(config => {
      const boxCount = config.quantity;
      const boxWeight = config.weight;
      const billedWeight = getBilledWeight(
        boxWeight,
        config.dimensions.length,
        config.dimensions.width,
        config.dimensions.height
      );

      totalBoxes += boxCount;
      totalWeight += boxWeight * boxCount;
      totalBilledWeight += billedWeight * boxCount;
    });

    return {
      totalBoxes,
      totalWeight,
      totalBilledWeight,
      configurations: overrideData.box_configurations.length
    };
  };

  // Format ship date
  const getFormattedShipDate = () => {
    if (!shipDate) {
      const today = new Date();
      return format(today, 'yyyy-MM-dd');
    }
    return format(shipDate, 'yyyy-MM-dd');
  };

  if (!isVisible) return null;

  if (loading && !isOverrideEnabled) {
    return (
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-blue-700 text-sm">Loading parameters...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if ((error || (!sizeData && !isOverrideEnabled)) && !overrideData) {
    return (
      <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
        <Info className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
          {error || 'No size data available'}
        </AlertDescription>
      </Alert>
    );
  }

  const shipmentStats = isOverrideEnabled ? getShipmentStats() : null;

  return (
    <Card className={`border-blue-200 ${isOverrideEnabled ? 'bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20' : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20'}`}>
      <CardHeader className="pb-3 px-3 sm:px-6">
        <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center text-blue-900 dark:text-blue-100">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Shipping Parameters Preview
          </div>
          {isOverrideEnabled && (
            <Badge variant="default" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700 text-xs sm:text-sm w-fit">
              <Edit3 className="w-3 h-3 mr-1" />
              Override Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-3 sm:px-6">
        {/* Collection & Size Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              <Package className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
              Collection & Size
            </div>
            <div className="pl-6 space-y-1">
              <div className="text-xs sm:text-sm">
                <span className="font-medium">Collection:</span> {collectionName}
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-medium">Size:</span> {isOverrideEnabled ? 'Custom' : size}
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-medium">Number of boxes:</span> {shipmentStats?.totalBoxes || (sizeData ? 1 : 0)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              <Globe className="w-4 h-4 mr-2 text-green-600" />
              Shipping Route
            </div>
            <div className="pl-6 space-y-1">
              <div className="text-xs sm:text-sm">
                <span className="font-medium">From:</span> {originCountry} {originPostalCode}
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-medium">To:</span> {country} {postalCode}
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-medium">Ship Date:</span> {getFormattedShipDate()}
              </div>
            </div>
          </div>
        </div>

        {/* Box Configurations for Override Mode */}
        {isOverrideEnabled && overrideData?.box_configurations && (
          <div className="space-y-2">
            <div className="flex items-center text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              <Calculator className="w-4 h-4 mr-2 text-purple-600" />
              Box Configurations
            </div>
            <div className="pl-6 space-y-3 mobile-scroll-container">
              {overrideData.box_configurations.map((config, index) => {
                const dimWeight = calculateDimensionalWeight(
                  config.dimensions.length,
                  config.dimensions.width,
                  config.dimensions.height
                );
                const billedWeight = getBilledWeight(
                  config.weight,
                  config.dimensions.length,
                  config.dimensions.width,
                  config.dimensions.height
                );

                return (
                  <div key={index} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 space-y-1">
                    <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Configuration {index + 1}: {config.quantity} {config.quantity > 1 ? 'boxes' : 'box'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Dimensions:</span>{' '}
                        <span className="block sm:inline">
                          {config.dimensions.length} × {config.dimensions.width} × {config.dimensions.height} cm
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Net Weight:</span> {config.weight} kg
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Dimensional Weight:</span> {dimWeight} kg
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Billed Weight:</span>{' '}
                        <Badge variant="outline" className="ml-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs">
                          {billedWeight} kg
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Standard Dimensions & Weight (non-override mode) */}
        {!isOverrideEnabled && sizeData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                <Calculator className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                Dimensions (CM)
              </div>
              <div className="pl-6 space-y-1">
                <div className="text-xs sm:text-sm">
                  <span className="font-medium">Length:</span> {sizeData.length_cm} cm
                </div>
                <div className="text-xs sm:text-sm">
                  <span className="font-medium">Width:</span> {sizeData.width_cm} cm
                </div>
                <div className="text-xs sm:text-sm">
                  <span className="font-medium">Height:</span> {sizeData.height_cm} cm
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Total: {sizeData.length_cm} × {sizeData.width_cm} × {sizeData.height_cm} cm
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                <Package className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                Weight Calculation
              </div>
              <div className="pl-6 space-y-1">
                <div className="text-xs sm:text-sm">
                  <span className="font-medium">Net Weight:</span> {sizeData.weight_kg} kg
                </div>
                <div className="text-xs sm:text-sm">
                  <span className="font-medium">Dimensional Weight:</span>{' '}
                  {calculateDimensionalWeight(sizeData.length_cm, sizeData.width_cm, sizeData.height_cm)} kg
                </div>
                <div className="text-xs sm:text-sm">
                  <span className="font-medium">Billed Weight:</span>{" "}
                  <Badge variant="outline" className="ml-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs">
                    {getBilledWeight(sizeData.weight_kg, sizeData.length_cm, sizeData.width_cm, sizeData.height_cm)} kg
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipment Summary for Override Mode */}
        {isOverrideEnabled && shipmentStats && (
          <div className="border-t pt-3">
            <div className="flex items-center text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Package className="w-4 h-4 mr-2 text-orange-600" />
              Shipment Summary
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-6">
              <div className="text-xs sm:text-sm">
                <span className="font-medium">Total Boxes:</span> {shipmentStats.totalBoxes}
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-medium">Total Weight:</span> {shipmentStats.totalWeight.toFixed(2)} kg
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-medium">Total Billed Weight:</span>{' '}
                <Badge variant="outline" className="ml-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs">
                  {shipmentStats.totalBilledWeight.toFixed(2)} kg
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* FedEx API Parameters */}
        <div className="border-t pt-4">
          <div className="flex items-center text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            <MapPin className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
            FedEx API Parameters
          </div>
          <div className="space-y-2 pl-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div>
                <span className="font-medium">Preferred Currency:</span>{" "}
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs">
                  {preferredCurrency}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Packaging Type:</span> YOUR_PACKAGING
              </div>
              <div>
                <span className="font-medium">Pickup Type:</span> DROPOFF_AT_FEDEX_LOCATION
              </div>
              <div>
                <span className="font-medium">Rate Request Types:</span> LIST, ACCOUNT, INCENTIVE
              </div>
              <div>
                <span className="font-medium">Group Package Count:</span> {shipmentStats?.totalBoxes || 1}
              </div>
              <div>
                <span className="font-medium">Weight Units:</span> KG
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info - Collapsible on mobile */}
        <details className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 mt-4">
          <summary className="text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer">Debug Information</summary>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1">
            <div>Collection ID: {collection}</div>
            {!isOverrideEnabled && sizeData && (
              <>
                <div>Volume: {(sizeData.length_cm * sizeData.width_cm * sizeData.height_cm).toLocaleString()} cm³</div>
              </>
            )}
            {isOverrideEnabled && shipmentStats && (
              <>
                <div>Box Configurations: {shipmentStats.configurations}</div>
                <div>Total Volume: Multiple configurations</div>
              </>
            )}
            <div>DIM Factor: 5000 (FedEx standard for CM/KG)</div>
            <div>Ship Date: {getFormattedShipDate()}</div>
            <div>Currency Source: User-selected (not auto-mapped)</div>
            {isOverrideEnabled && <div className="text-purple-600 dark:text-purple-400 font-medium mt-1">Using Override Values</div>}
          </div>
        </details>
      </CardContent>
    </Card>
  );
};
