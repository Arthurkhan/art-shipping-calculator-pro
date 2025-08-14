import { FC, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { FormProgress } from '@/components/ui/form-progress';
import { CollectionSelector } from './CollectionSelector';
import { SizeSelector } from './SizeSelector';
import { ShippingDetailsForm } from './ShippingDetailsForm';
import { OriginAddressForm } from './OriginAddressForm';
import { CalculateButton } from './CalculateButton';
import { ParameterPreview } from './ParameterPreview';
import { OverrideToggleButton } from './OverrideToggleButton';
import { OverrideForm } from './OverrideForm';
import { ServiceAvailabilityAlert } from './ServiceAvailabilityAlert';
import { EnhancedResultsDisplay } from './EnhancedResultsDisplay';

interface CalculatorTabProps {
  // Form state
  country: string;
  postalCode: string;
  shipDate: Date | undefined;
  
  // Form setters
  setCountry: (value: string) => void;
  setPostalCode: (value: string) => void;
  
  // Custom hooks data
  originAddress: {
    originCountry: string;
    originPostalCode: string;
    handleOriginCountryChange: (value: string) => void;
    handleOriginPostalCodeChange: (value: string) => void;
  };
  
  currencySelector: {
    preferredCurrency: string;
    handlePreferredCurrencyChange: (value: string) => void;
  };
  
  collectionData: {
    collections: any[];
    sizes: any[];
    selectedCollection: string;
    selectedSize: string;
    handleCollectionChange: (value: string) => void;
    handleSizeChange: (value: string) => void;
    isLoading: boolean;
  };
  
  shippingCalculator: {
    rates: any[];
    isCalculating: boolean;
    error: string | null;
    serviceAvailabilityError: any;
  };
  
  overrideSettings: {
    isOverrideEnabled: boolean;
    hasValidOverrideValues: boolean;
    toggleOverride: () => void;
    overrideSettings: any;
    addBoxConfiguration: () => void;
    removeBoxConfiguration: (index: number) => void;
    updateBoxDimensions: (index: number, field: string, value: number) => void;
    updateBoxWeight: (index: number, value: number) => void;
    updateBoxQuantity: (index: number, value: number) => void;
    resetToDefaults: () => void;
    validateOverrideValues: () => { errors: string[] };
    getOverrideData: () => any;
    getShipmentStats: () => any;
  };
  
  fedexConfig: {
    hasCompleteConfig: boolean;
  };
  
  validation: {
    hasRequiredFields: boolean;
  };
  
  // UI state
  isMobile: boolean;
  showStickyButton: boolean;
  calculateButtonRef: React.RefObject<HTMLDivElement>;
  
  // Handlers
  onCalculate: () => void;
  onRetryWithDifferentDestination: () => void;
  onShipDateChange: (date: Date | undefined) => void;
  
  // Form progress
  formProgressSteps: any[];
}

export const CalculatorTab: FC<CalculatorTabProps> = ({
  country,
  postalCode,
  shipDate,
  setCountry,
  setPostalCode,
  originAddress,
  currencySelector,
  collectionData,
  shippingCalculator,
  overrideSettings,
  fedexConfig,
  validation,
  isMobile,
  showStickyButton,
  calculateButtonRef,
  onCalculate,
  onRetryWithDifferentDestination,
  onShipDateChange,
  formProgressSteps,
}) => {
  const [isParameterPreviewOpen, setIsParameterPreviewOpen] = useState(false);
  const shouldShowParameterPreview = validation.hasRequiredFields || overrideSettings.isOverrideEnabled;
  
  const debugInfo = {
    buttonDisabled: !validation.hasRequiredFields || 
                   !fedexConfig.hasCompleteConfig || 
                   (overrideSettings.isOverrideEnabled && !overrideSettings.hasValidOverrideValues)
  };

  return (
    <div className={`space-y-4 sm:space-y-5 ${isMobile && showStickyButton ? 'content-with-sticky-button' : ''}`}>
      {/* Form Progress Indicator */}
      <div className="mb-6">
        <FormProgress 
          steps={formProgressSteps} 
          variant={isMobile ? "circular" : "linear"}
          className={isMobile ? "mx-auto" : ""}
        />
      </div>

      {/* Origin Address Form */}
      <OriginAddressForm
        originCountry={originAddress.originCountry}
        originPostalCode={originAddress.originPostalCode}
        onOriginCountryChange={originAddress.handleOriginCountryChange}
        onOriginPostalCodeChange={originAddress.handleOriginPostalCodeChange}
      />

      <Separator className="my-4" />

      {/* Collection and Size Selection */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800">Art Collection Selection</h3>
            {!overrideSettings.isOverrideEnabled && (
              <p className="text-xs text-slate-600 dark:text-slate-400">Choose the artwork you want to ship</p>
            )}
          </div>
          {/* Override Toggle Button */}
          <OverrideToggleButton
            isEnabled={overrideSettings.isOverrideEnabled}
            onClick={overrideSettings.toggleOverride}
            hasValidValues={overrideSettings.hasValidOverrideValues}
          />
        </div>
        
        {/* Only show collection and size selectors when override is NOT enabled */}
        {!overrideSettings.isOverrideEnabled && (
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="w-full md:w-[70%]">
              <CollectionSelector
                collections={collectionData.collections}
                selectedCollection={collectionData.selectedCollection}
                onCollectionChange={collectionData.handleCollectionChange}
                isLoading={collectionData.isLoading}
              />
            </div>
            <div className="w-full md:w-[30%]">
              <SizeSelector
                sizes={collectionData.sizes}
                selectedSize={collectionData.selectedSize}
                onSizeChange={collectionData.handleSizeChange}
                disabled={!collectionData.selectedCollection}
              />
            </div>
          </div>
        )}
      </div>

      {/* Override Form */}
      {overrideSettings.isOverrideEnabled && (
        <OverrideForm
          overrideSettings={overrideSettings.overrideSettings}
          onAddBox={overrideSettings.addBoxConfiguration}
          onRemoveBox={overrideSettings.removeBoxConfiguration}
          onUpdateBoxDimensions={overrideSettings.updateBoxDimensions}
          onUpdateBoxWeight={overrideSettings.updateBoxWeight}
          onUpdateBoxQuantity={overrideSettings.updateBoxQuantity}
          onReset={overrideSettings.resetToDefaults}
          validationErrors={overrideSettings.validateOverrideValues().errors}
          isEnabled={overrideSettings.isOverrideEnabled}
          shipmentStats={overrideSettings.getShipmentStats()}
        />
      )}

      <Separator className="my-4" />

      {/* Destination and Currency */}
      <ShippingDetailsForm
        country={country}
        postalCode={postalCode}
        preferredCurrency={currencySelector.preferredCurrency}
        shipDate={shipDate}
        onCountryChange={setCountry}
        onPostalCodeChange={setPostalCode}
        onPreferredCurrencyChange={currencySelector.handlePreferredCurrencyChange}
        onShipDateChange={onShipDateChange}
      />

      {/* Parameter Preview */}
      {shouldShowParameterPreview && (
        <div className="space-y-4">
          <Separator className="my-4" />
          
          {/* Toggle Button */}
          <button
            onClick={() => setIsParameterPreviewOpen(!isParameterPreviewOpen)}
            className="w-full p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-all duration-200 flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              {isParameterPreviewOpen ? (
                <EyeOff className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {isParameterPreviewOpen ? 'Hide' : 'Show'} Shipping Parameters
              </span>
              {!isParameterPreviewOpen && (
                <Badge variant="outline" className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700 text-xs">
                  {overrideSettings.isOverrideEnabled ? 'Custom' : collectionData.selectedSize || 'Not selected'}
                </Badge>
              )}
            </div>
            {isParameterPreviewOpen ? (
              <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-y--0.5 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-y-0.5 transition-transform" />
            )}
          </button>
          
          {/* Collapsible Preview */}
          {isParameterPreviewOpen && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
              <ParameterPreview
                collection={collectionData.selectedCollection}
                size={collectionData.selectedSize}
                country={country}
                postalCode={postalCode}
                originCountry={originAddress.originCountry}
                originPostalCode={originAddress.originPostalCode}
                preferredCurrency={currencySelector.preferredCurrency}
                isVisible={true}
                shipDate={shipDate}
                overrideData={overrideSettings.getOverrideData()}
                isOverrideEnabled={overrideSettings.isOverrideEnabled}
              />
            </div>
          )}
        </div>
      )}

      {/* Calculate Button */}
      <div ref={calculateButtonRef} className="pt-3">
        <CalculateButton
          onClick={onCalculate}
          disabled={debugInfo.buttonDisabled}
          isLoading={shippingCalculator.isCalculating}
          fedexConfigMissing={!fedexConfig.hasCompleteConfig}
        />
      </div>

      {/* Service Availability Alert */}
      {shippingCalculator.serviceAvailabilityError && (
        <ServiceAvailabilityAlert
          origin={shippingCalculator.serviceAvailabilityError.origin}
          destination={shippingCalculator.serviceAvailabilityError.destination}
          suggestions={shippingCalculator.serviceAvailabilityError.suggestions}
          onRetry={onRetryWithDifferentDestination}
        />
      )}

      {/* Error Display (for non-service errors) */}
      {shippingCalculator.error && !shippingCalculator.serviceAvailabilityError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{shippingCalculator.error}</AlertDescription>
        </Alert>
      )}

      {/* Results - Desktop only */}
      {!isMobile && (
        <EnhancedResultsDisplay 
          rates={shippingCalculator.rates} 
          isLoading={shippingCalculator.isCalculating}
          originAddress={{
            country: originAddress.originCountry,
            postalCode: originAddress.originPostalCode
          }}
          destinationAddress={{
            country: country,
            postalCode: postalCode
          }}
          shipDate={shipDate}
          packageDetails={overrideSettings.isOverrideEnabled && overrideSettings.overrideSettings.boxes.length > 0 ? {
            weight: overrideSettings.overrideSettings.boxes[0].weight,
            dimensions: overrideSettings.overrideSettings.boxes[0].dimensions
          } : undefined}
          preferredCurrency={currencySelector.preferredCurrency}
        />
      )}
    </div>
  );
};