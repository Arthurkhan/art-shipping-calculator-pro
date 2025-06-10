import { useState, useEffect } from "react";
import { Package, Ruler, Weight, Hash, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { OverrideSettings } from "@/hooks/useOverrideSettings";

interface OverrideFormProps {
  overrideSettings: OverrideSettings;
  onDimensionsChange: (dimensions: Partial<OverrideSettings['dimensions']>) => void;
  onWeightChange: (weight: number) => void;
  onQuantityChange: (quantity: number) => void;
  onReset: () => void;
  validationErrors: string[];
  isEnabled: boolean;
}

export const OverrideForm = ({
  overrideSettings,
  onDimensionsChange,
  onWeightChange,
  onQuantityChange,
  onReset,
  validationErrors,
  isEnabled,
}: OverrideFormProps) => {
  const [localValues, setLocalValues] = useState({
    length: overrideSettings.dimensions.length.toString(),
    width: overrideSettings.dimensions.width.toString(),
    height: overrideSettings.dimensions.height.toString(),
    weight: overrideSettings.weight.toString(),
    quantity: overrideSettings.quantity.toString(),
  });

  // Update local values when override settings change
  useEffect(() => {
    setLocalValues({
      length: overrideSettings.dimensions.length.toString(),
      width: overrideSettings.dimensions.width.toString(),
      height: overrideSettings.dimensions.height.toString(),
      weight: overrideSettings.weight.toString(),
      quantity: overrideSettings.quantity.toString(),
    });
  }, [overrideSettings]);

  const handleDimensionChange = (field: keyof OverrideSettings['dimensions'], value: string) => {
    setLocalValues(prev => ({ ...prev, [field]: value }));
    const numValue = parseFloat(value) || 0;
    if (numValue > 0) {
      onDimensionsChange({ [field]: numValue });
    }
  };

  const handleWeightChange = (value: string) => {
    setLocalValues(prev => ({ ...prev, weight: value }));
    const numValue = parseFloat(value) || 0;
    if (numValue > 0) {
      onWeightChange(numValue);
    }
  };

  const handleQuantityChange = (value: string) => {
    setLocalValues(prev => ({ ...prev, quantity: value }));
    const numValue = parseInt(value) || 0;
    if (numValue > 0) {
      onQuantityChange(numValue);
    }
  };

  // Calculate dimensional weight
  const dimensionalWeight = (
    overrideSettings.dimensions.length * 
    overrideSettings.dimensions.width * 
    overrideSettings.dimensions.height
  ) / 5000;
  const billedWeight = Math.max(overrideSettings.weight, dimensionalWeight);

  return (
    <Card className={`border-purple-200 ${isEnabled ? 'bg-purple-50/50' : 'bg-slate-50/50'}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center text-purple-900">
          <Package className="w-5 h-5 mr-2" />
          Custom Shipping Parameters
        </CardTitle>
        <CardDescription>
          Override the default collection dimensions, weight, and quantity for shipping calculations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dimensions Section */}
        <div className="space-y-3">
          <div className="flex items-center text-sm font-medium text-slate-700">
            <Ruler className="w-4 h-4 mr-2 text-purple-600" />
            Dimensions (CM)
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="length" className="text-xs">Length</Label>
              <Input
                id="length"
                type="number"
                value={localValues.length}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                placeholder="40"
                min="0.1"
                step="0.1"
                disabled={!isEnabled}
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="width" className="text-xs">Width</Label>
              <Input
                id="width"
                type="number"
                value={localValues.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                placeholder="31"
                min="0.1"
                step="0.1"
                disabled={!isEnabled}
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-xs">Height</Label>
              <Input
                id="height"
                type="number"
                value={localValues.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                placeholder="28"
                min="0.1"
                step="0.1"
                disabled={!isEnabled}
                className="h-9"
              />
            </div>
          </div>
          {isEnabled && (
            <div className="text-xs text-slate-600 pl-6">
              Total: {overrideSettings.dimensions.length} × {overrideSettings.dimensions.width} × {overrideSettings.dimensions.height} cm
            </div>
          )}
        </div>

        <Separator />

        {/* Weight and Quantity Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-slate-700">
              <Weight className="w-4 h-4 mr-2 text-orange-600" />
              Weight (KG)
            </div>
            <Input
              id="weight"
              type="number"
              value={localValues.weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              placeholder="4"
              min="0.1"
              step="0.1"
              disabled={!isEnabled}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-slate-700">
              <Hash className="w-4 h-4 mr-2 text-blue-600" />
              Quantity of Boxes
            </div>
            <Input
              id="quantity"
              type="number"
              value={localValues.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="1"
              min="1"
              step="1"
              disabled={!isEnabled}
              className="h-9"
            />
          </div>
        </div>

        {/* Weight Calculations */}
        {isEnabled && (
          <div className="bg-white rounded-lg p-3 space-y-2">
            <div className="text-sm font-medium text-slate-700 mb-2">Weight Calculations</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-600">Actual Weight:</span>{" "}
                <span className="font-medium">{overrideSettings.weight} kg</span>
              </div>
              <div>
                <span className="text-slate-600">Dimensional Weight:</span>{" "}
                <span className="font-medium">{dimensionalWeight.toFixed(2)} kg</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-600">Billed Weight:</span>{" "}
                <Badge variant="outline" className="ml-1 bg-purple-100 text-purple-800">
                  {billedWeight.toFixed(2)} kg × {overrideSettings.quantity} box{overrideSettings.quantity > 1 ? 'es' : ''}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && isEnabled && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside text-sm">
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
              className="w-full"
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
