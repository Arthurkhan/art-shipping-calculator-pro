import { useState, useEffect } from "react";
import { Package, Plus, Trash2, RotateCcw, ChevronRight } from "lucide-react";
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

  const [isExpanded, setIsExpanded] = useState(true);

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
    <div className="space-y-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 sm:p-4">
      {/* Box header - collapsible on mobile */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:cursor-default"
          disabled={!showRemove}
        >
          {showRemove && (
            <ChevronRight 
              className={`w-4 h-4 transition-transform sm:hidden ${isExpanded ? 'rotate-90' : ''}`} 
            />
          )}
          <span>Box {showRemove ? `Configuration ${index + 1}` : 'Configuration'}</span>
          <Badge variant="outline" className="ml-2 text-xs">
            {box.quantity} {box.quantity > 1 ? 'boxes' : 'box'}
          </Badge>
        </button>
        {showRemove && isEnabled && (
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

      {/* Box inputs - collapsible on mobile, always visible on desktop */}
      <div className={`space-y-3 ${!isExpanded && showRemove ? 'hidden sm:block' : ''}`}>
        {/* Mobile: Vertical layout | Desktop: Horizontal scroll wrapper */}
        <div className="block sm:hidden space-y-3">
          {/* Quantity - full width on mobile */}
          <div>
            <Label htmlFor={`quantity-${box.id}`} className="text-sm font-medium">
              Quantity
            </Label>
            <Input
              id={`quantity-${box.id}`}
              type="number"
              value={localValues.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="1"
              min="1"
              step="1"
              disabled={!isEnabled}
              className="h-12 text-base"
              inputMode="numeric"
            />
          </div>

          {/* Dimensions - 2 column grid on mobile */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`length-${box.id}`} className="text-sm">Length (cm)</Label>
              <Input
                id={`length-${box.id}`}
                type="number"
                value={localValues.length}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                placeholder="40"
                min="0.1"
                step="0.1"
                disabled={!isEnabled}
                className="h-12 text-base"
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor={`width-${box.id}`} className="text-sm">Width (cm)</Label>
              <Input
                id={`width-${box.id}`}
                type="number"
                value={localValues.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                placeholder="31"
                min="0.1"
                step="0.1"
                disabled={!isEnabled}
                className="h-12 text-base"
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor={`height-${box.id}`} className="text-sm">Height (cm)</Label>
              <Input
                id={`height-${box.id}`}
                type="number"
                value={localValues.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                placeholder="28"
                min="0.1"
                step="0.1"
                disabled={!isEnabled}
                className="h-12 text-base"
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor={`weight-${box.id}`} className="text-sm">Weight (kg)</Label>
              <Input
                id={`weight-${box.id}`}
                type="number"
                value={localValues.weight}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder="4"
                min="0.1"
                step="0.1"
                disabled={!isEnabled}
                className="h-12 text-base"
                inputMode="decimal"
              />
            </div>
          </div>
        </div>

        {/* Desktop: Horizontal layout with scroll if needed */}
        <div className="hidden sm:block overflow-x-auto">
          <div className="grid grid-cols-5 gap-3 min-w-[600px]">
            <div>
              <Label htmlFor={`quantity-${box.id}-desktop`} className="text-sm">Quantity</Label>
              <Input
                id={`quantity-${box.id}-desktop`}
                type="number"
                value={localValues.quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="1"
                min="1"
                step="1"
                disabled={!isEnabled}
                className="h-9 text-sm"
                inputMode="numeric"
              />
            </div>
            <div>
              <Label htmlFor={`length-${box.id}-desktop`} className="text-sm">Length (cm)</Label>
              <Input
                id={`length-${box.id}-desktop`}
                type="number"
                value={localValues.length}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                placeholder="40"
                min="0.1"
                step="0.1"
                disabled={!isEnabled}
                className="h-9 text-sm"
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor={`width-${box.id}-desktop`} className="text-sm">Width (cm)</Label>
              <Input
                id={`width-${box.id}-desktop`}
                type="number"
                value={localValues.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                placeholder="31"
                min="0.1"
                step="0.1"
                disabled={!isEnabled}
                className="h-9 text-sm"
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor={`height-${box.id}-desktop`} className="text-sm">Height (cm)</Label>
              <Input
                id={`height-${box.id}-desktop`}
                type="number"
                value={localValues.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                placeholder="28"
                min="0.1"
                step="0.1"
                disabled={!isEnabled}
                className="h-9 text-sm"
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor={`weight-${box.id}-desktop`} className="text-sm">Weight (kg)</Label>
              <Input
                id={`weight-${box.id}-desktop`}
                type="number"
                value={localValues.weight}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder="4"
                min="0.1"
                step="0.1"
                disabled={!isEnabled}
                className="h-9 text-sm"
                inputMode="decimal"
              />
            </div>
          </div>
        </div>

        {/* Weight calculations - responsive layout */}
        {isEnabled && (
          <div className="bg-white dark:bg-gray-800 rounded-md p-2 sm:p-3 space-y-1">
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Actual:</span>{' '}
                  <span className="font-medium">{box.weight} kg</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Dimensional:</span>{' '}
                  <span className="font-medium">{dimensionalWeight.toFixed(2)} kg</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Billed:</span>{' '}
                  <span className="font-semibold text-purple-700">
                    {billedWeight.toFixed(2)} kg
                  </span>
                </div>
              </div>
              {box.quantity > 1 && (
                <div className="mt-1 text-xs text-purple-600">
                  Total: {(billedWeight * box.quantity).toFixed(2)} kg ({box.quantity} boxes)
                </div>
              )}
            </div>
          </div>
        )}
      </div>
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
    <Card className={`border-purple-200 ${isEnabled ? 'bg-purple-50/50 dark:bg-slate-800/50' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center text-purple-900">
          <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Custom Shipping Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
        {/* Box configurations */}
        <div className="space-y-3">
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
            </div>
          ))}
        </div>

        {/* Add Row Button */}
        {isEnabled && (
          <Button
            onClick={onAddBox}
            variant="outline"
            size="sm"
            className="w-full h-12 sm:h-10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Box Configuration
          </Button>
        )}

        {/* Shipment Summary - responsive grid */}
        {isEnabled && shipmentStats && overrideSettings.boxes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 space-y-2">
            <div className="text-sm font-medium text-slate-700">Shipment Summary</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Total Boxes:</span>{" "}
                  <span className="font-medium">{shipmentStats.totalBoxes}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Configurations:</span>{" "}
                  <span className="font-medium">{shipmentStats.boxConfigurations}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Total Weight:</span>{" "}
                  <span className="font-medium">{shipmentStats.totalWeight.toFixed(2)} kg</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Billed Weight:</span>{" "}
                  <Badge variant="outline" className="ml-1 bg-purple-100 text-purple-800 text-xs">
                    {shipmentStats.totalBilledWeight.toFixed(2)} kg
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && isEnabled && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside text-xs sm:text-sm space-y-1">
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
              className="w-full h-12 sm:h-10"
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
