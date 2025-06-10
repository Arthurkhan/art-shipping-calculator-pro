import { useState, useEffect } from "react";
import { Package, Plus, Trash2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { BoxConfiguration, OverrideSettings } from "@/hooks/useOverrideSettings";

interface OverrideFormProps {
  overrideSettings: OverrideSettings;
  onAddBox: () => void;
  onRemoveBox: (boxId: string) => void;
  onUpdateBoxDimensions: (boxId: string, dimensions: Partial<BoxConfiguration['dimensions']>) => void;
  onUpdateBoxWeight: (boxId: string, weight: number) => void;
  onUpdateBoxQuantity: (boxId: string, quantity: number) => void;
  onReset: () => void;
  validationErrors: string[];
  isEnabled: boolean;
  shipmentStats?: {
    totalBoxes: number;
    totalWeight: number;
    totalBilledWeight: number;
    boxConfigurations: number;
  };
}

interface BoxRowProps {
  box: BoxConfiguration;
  index: number;
  showRemove: boolean;
  isEnabled: boolean;
  onUpdateDimensions: (dimensions: Partial<BoxConfiguration['dimensions']>) => void;
  onUpdateWeight: (weight: number) => void;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  calculateDimensionalWeight: (box: BoxConfiguration) => number;
  getBilledWeight: (box: BoxConfiguration) => number;
}

const BoxRow = ({
  box,
  index,
  showRemove,
  isEnabled,
  onUpdateDimensions,
  onUpdateWeight,
  onUpdateQuantity,
  onRemove,
  calculateDimensionalWeight,
  getBilledWeight,
}: BoxRowProps) => {
  const [localValues, setLocalValues] = useState({
    quantity: box.quantity.toString(),
    length: box.dimensions.length.toString(),
    width: box.dimensions.width.toString(),
    height: box.dimensions.height.toString(),
    weight: box.weight.toString(),
  });

  useEffect(() => {
    setLocalValues({
      quantity: box.quantity.toString(),
      length: box.dimensions.length.toString(),
      width: box.dimensions.width.toString(),
      height: box.dimensions.height.toString(),
      weight: box.weight.toString(),
    });
  }, [box]);

  const handleQuantityChange = (value: string) => {
    setLocalValues(prev => ({ ...prev, quantity: value }));
    const numValue = parseInt(value) || 0;
    if (numValue > 0) {
      onUpdateQuantity(numValue);
    }
  };

  const handleDimensionChange = (field: keyof BoxConfiguration['dimensions'], value: string) => {
    setLocalValues(prev => ({ ...prev, [field]: value }));
    const numValue = parseFloat(value) || 0;
    if (numValue > 0) {
      onUpdateDimensions({ [field]: numValue });
    }
  };

  const handleWeightChange = (value: string) => {
    setLocalValues(prev => ({ ...prev, weight: value }));
    const numValue = parseFloat(value) || 0;
    if (numValue > 0) {
      onUpdateWeight(numValue);
    }
  };

  const dimensionalWeight = calculateDimensionalWeight(box);
  const billedWeight = getBilledWeight(box);

  return (
    <div className="space-y-3">
      {/* Box label for multiple boxes */}
      {showRemove && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-700">Box Configuration {index + 1}</Label>
          {isEnabled && (
            <Button
              onClick={onRemove}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Responsive grid layout - stacked on mobile, grid on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Quantity */}
        <div>
          <Label htmlFor={`quantity-${box.id}`} className="text-xs sm:text-sm">Quantity</Label>
          <Input
            id={`quantity-${box.id}`}
            type="number"
            value={localValues.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder="1"
            min="1"
            step="1"
            disabled={!isEnabled}
            className="h-10 sm:h-9 text-base sm:text-sm"
            inputMode="numeric"
          />
        </div>

        {/* Length */}
        <div>
          <Label htmlFor={`length-${box.id}`} className="text-xs sm:text-sm">Length (cm)</Label>
          <Input
            id={`length-${box.id}`}
            type="number"
            value={localValues.length}
            onChange={(e) => handleDimensionChange('length', e.target.value)}
            placeholder="40"
            min="0.1"
            step="0.1"
            disabled={!isEnabled}
            className="h-10 sm:h-9 text-base sm:text-sm"
            inputMode="decimal"
          />
        </div>

        {/* Width */}
        <div>
          <Label htmlFor={`width-${box.id}`} className="text-xs sm:text-sm">Width (cm)</Label>
          <Input
            id={`width-${box.id}`}
            type="number"
            value={localValues.width}
            onChange={(e) => handleDimensionChange('width', e.target.value)}
            placeholder="31"
            min="0.1"
            step="0.1"
            disabled={!isEnabled}
            className="h-10 sm:h-9 text-base sm:text-sm"
            inputMode="decimal"
          />
        </div>

        {/* Height */}
        <div>
          <Label htmlFor={`height-${box.id}`} className="text-xs sm:text-sm">Height (cm)</Label>
          <Input
            id={`height-${box.id}`}
            type="number"
            value={localValues.height}
            onChange={(e) => handleDimensionChange('height', e.target.value)}
            placeholder="28"
            min="0.1"
            step="0.1"
            disabled={!isEnabled}
            className="h-10 sm:h-9 text-base sm:text-sm"
            inputMode="decimal"
          />
        </div>

        {/* Weight */}
        <div>
          <Label htmlFor={`weight-${box.id}`} className="text-xs sm:text-sm">Weight (kg)</Label>
          <Input
            id={`weight-${box.id}`}
            type="number"
            value={localValues.weight}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder="4"
            min="0.1"
            step="0.1"
            disabled={!isEnabled}
            className="h-10 sm:h-9 text-base sm:text-sm"
            inputMode="decimal"
          />
        </div>
      </div>

      {/* Weight calculations per box - responsive text */}
      {isEnabled && (
        <div className="text-xs sm:text-sm text-slate-600 pl-2 space-y-1 sm:space-y-0">
          <span className="block sm:inline">Actual: {box.weight} kg</span>
          <span className="hidden sm:inline mx-2">•</span>
          <span className="block sm:inline">Dimensional: {dimensionalWeight.toFixed(2)} kg</span>
          <span className="hidden sm:inline mx-2">•</span>
          <span className="block sm:inline">
            Billed: <span className="font-medium">{billedWeight.toFixed(2)} kg</span> × {box.quantity} {box.quantity > 1 ? 'boxes' : 'box'}
          </span>
        </div>
      )}
    </div>
  );
};

export const OverrideForm = ({
  overrideSettings,
  onAddBox,
  onRemoveBox,
  onUpdateBoxDimensions,
  onUpdateBoxWeight,
  onUpdateBoxQuantity,
  onReset,
  validationErrors,
  isEnabled,
  shipmentStats,
}: OverrideFormProps) => {
  const showMultipleBoxes = overrideSettings.boxes.length > 1;

  // Helper functions for calculations
  const calculateDimensionalWeight = (box: BoxConfiguration) => {
    const { length, width, height } = box.dimensions;
    return (length * width * height) / 5000;
  };

  const getBilledWeight = (box: BoxConfiguration) => {
    const dimWeight = calculateDimensionalWeight(box);
    return Math.max(box.weight, dimWeight);
  };

  return (
    <Card className={`border-purple-200 ${isEnabled ? 'bg-purple-50/50' : 'bg-slate-50/50'}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center text-purple-900">
          <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Custom Shipping Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-3 sm:px-6">
        {/* Box configurations */}
        <div className="space-y-4">
          {overrideSettings.boxes.map((box, index) => (
            <div key={box.id}>
              <BoxRow
                box={box}
                index={index}
                showRemove={showMultipleBoxes}
                isEnabled={isEnabled}
                onUpdateDimensions={(dimensions) => onUpdateBoxDimensions(box.id, dimensions)}
                onUpdateWeight={(weight) => onUpdateBoxWeight(box.id, weight)}
                onUpdateQuantity={(quantity) => onUpdateBoxQuantity(box.id, quantity)}
                onRemove={() => onRemoveBox(box.id)}
                calculateDimensionalWeight={calculateDimensionalWeight}
                getBilledWeight={getBilledWeight}
              />
              {index < overrideSettings.boxes.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>

        {/* Add Row Button */}
        {isEnabled && (
          <Button
            onClick={onAddBox}
            variant="outline"
            size="sm"
            className="w-full h-10 sm:h-9"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
        )}

        {/* Shipment Summary - responsive grid */}
        {isEnabled && shipmentStats && overrideSettings.boxes.length > 1 && (
          <div className="bg-white rounded-lg p-3 space-y-2">
            <div className="text-sm font-medium text-slate-700">Shipment Summary</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div>
                <span className="text-slate-600">Total Boxes:</span>{" "}
                <span className="font-medium">{shipmentStats.totalBoxes}</span>
              </div>
              <div>
                <span className="text-slate-600">Box Configurations:</span>{" "}
                <span className="font-medium">{shipmentStats.boxConfigurations}</span>
              </div>
              <div>
                <span className="text-slate-600">Total Weight:</span>{" "}
                <span className="font-medium">{shipmentStats.totalWeight.toFixed(2)} kg</span>
              </div>
              <div>
                <span className="text-slate-600">Total Billed Weight:</span>{" "}
                <Badge variant="outline" className="ml-1 bg-purple-100 text-purple-800 text-xs">
                  {shipmentStats.totalBilledWeight.toFixed(2)} kg
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && isEnabled && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside text-xs sm:text-sm">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Reset Button */}
        {isEnabled && (
          <div className="pt-2">
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="w-full h-10 sm:h-9"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
