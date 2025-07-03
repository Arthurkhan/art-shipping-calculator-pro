import { useState, useEffect, useRef } from "react";
import { CollectionSelector } from "@/components/shipping/CollectionSelector";
import { SizeSelector } from "@/components/shipping/SizeSelector";
import { ShippingDetailsForm } from "@/components/shipping/ShippingDetailsForm";
import { OriginAddressForm } from "@/components/shipping/OriginAddressForm";
import { CalculateButton } from "@/components/shipping/CalculateButton";
import { ResultsDisplay } from "@/components/shipping/ResultsDisplay";
import { EnhancedResultsDisplay } from "@/components/shipping/EnhancedResultsDisplay";
import { FedexConfigForm } from "@/components/shipping/FedexConfigForm";
import { ParameterPreview } from "@/components/shipping/ParameterPreview";
import { OverrideToggleButton } from "@/components/shipping/OverrideToggleButton";
import { OverrideForm } from "@/components/shipping/OverrideForm";
import { ServiceAvailabilityAlert } from "@/components/shipping/ServiceAvailabilityAlert";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { Truck, Package, Settings, Calculator, AlertTriangle, CheckCircle, Bug } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BottomSheet, useIsMobile } from "@/components/ui/bottom-sheet";
import { FormProgress } from "@/components/ui/form-progress";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Phase 2 refactored hooks
import { useOriginAddress } from "@/hooks/useOriginAddress";
import { useFedexConfig } from "@/hooks/useFedexConfig";
import { useCurrencySelector } from "@/hooks/useCurrencySelector";
import { useCollectionData } from "@/hooks/useCollectionData";
import { useShippingValidation } from "@/hooks/useShippingValidation";
import { useShippingCalculator } from "@/hooks/useShippingCalculator";
import { useOverrideSettings } from "@/hooks/useOverrideSettings";
import { usePrefetch } from "@/hooks/usePrefetch";

const Index = () => {
  // UI state
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [activeTab, setActiveTab] = useState<'calculator' | 'config'>('calculator');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [showStickyButton, setShowStickyButton] = useState(false);
  
  // Mobile detection
  const isMobile = useIsMobile();
  const calculateButtonRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Shipping date state - default to today
  const [shipDate, setShipDate] = useState<Date | undefined>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Custom hooks - Phase 2 refactoring
  const originAddress = useOriginAddress();
  const fedexConfig = useFedexConfig();
  const currencySelector = useCurrencySelector();
  const collectionData = useCollectionData();
  const shippingCalculator = useShippingCalculator();
  const overrideSettings = useOverrideSettings();
  
  // Performance optimization - prefetching
  const { prefetchCollections, prefetchFedexStatus } = usePrefetch();
  
  // Prefetch data on component mount
  useEffect(() => {
    prefetchCollections();
    prefetchFedexStatus();
  }, [prefetchCollections, prefetchFedexStatus]);

  // Form validation using extracted hook
  const validation = useShippingValidation({
    selectedCollection: overrideSettings.isOverrideEnabled ? 'custom' : collectionData.selectedCollection,
    selectedSize: overrideSettings.isOverrideEnabled ? 'custom' : collectionData.selectedSize,
    country,
    postalCode,
    originCountry: originAddress.originCountry,
    originPostalCode: originAddress.originPostalCode,
    preferredCurrency: currencySelector.preferredCurrency,
  });

  // Enhanced debug logging to help identify the issue
  const debugInfo = {
    // Button status
    buttonDisabled: !validation.isReadyForSubmission || !fedexConfig.isConfigReady || (overrideSettings.isOverrideEnabled && !overrideSettings.hasValidOverrideValues),
    validationReady: validation.isReadyForSubmission,
    fedexReady: fedexConfig.isConfigReady,
    overrideReady: !overrideSettings.isOverrideEnabled || overrideSettings.hasValidOverrideValues,
    
    // Detailed form data
    formData: {
      selectedCollection: collectionData.selectedCollection,
      selectedSize: collectionData.selectedSize,
      country,
      postalCode,
      originCountry: originAddress.originCountry,
      originPostalCode: originAddress.originPostalCode,
      preferredCurrency: currencySelector.preferredCurrency,
      shipDate: shipDate?.toISOString().split('T')[0],
      overrideEnabled: overrideSettings.isOverrideEnabled,
      overrideData: overrideSettings.getOverrideData(),
    },
    
    // Validation breakdown
    validationBreakdown: {
      isFormValid: validation.isFormValid,
      hasRequiredFields: validation.hasRequiredFields,
      errors: validation.errors,
      warnings: validation.warnings,
      fieldValidations: validation.fieldValidations,
    },
    
    // FedEx config breakdown
    fedexBreakdown: {
      status: fedexConfig.fedexConfigStatus,
      hasCompleteConfig: fedexConfig.hasCompleteConfig,
      hasPartialConfig: fedexConfig.hasPartialConfig,
      isMissingConfig: fedexConfig.isMissingConfig,
      isInvalidConfig: fedexConfig.isInvalidConfig,
      statusDetails: fedexConfig.getStatusDetails(),
      sessionId: fedexConfig.sessionId ? 'Present' : 'Missing',
    },
    
    // Collection data status
    collectionStatus: {
      isLoading: collectionData.isLoading,
      collectionsCount: collectionData.collections.length,
      sizesCount: collectionData.sizes.length,
      hasSelectedCollection: !!collectionData.selectedCollection,
      hasSelectedSize: !!collectionData.selectedSize,
    },
    
    // Override status
    overrideStatus: {
      enabled: overrideSettings.isOverrideEnabled,
      valid: overrideSettings.hasValidOverrideValues,
      errors: overrideSettings.validateOverrideValues().errors,
    }
  };

  // Mobile enhancements - Phase 2
  useEffect(() => {
    if (!isMobile) return;

    // Sticky button scroll behavior
    const handleScroll = () => {
      if (!calculateButtonRef.current) return;
      
      const buttonRect = calculateButtonRef.current.getBoundingClientRect();
      const isButtonVisible = buttonRect.top < window.innerHeight && buttonRect.bottom > 0;
      
      setShowStickyButton(!isButtonVisible && validation.hasRequiredFields);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, validation.hasRequiredFields]);

  // Swipe gesture for tabs
  useEffect(() => {
    if (!isMobile || !tabsRef.current) return;

    let startX = 0;
    let currentX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const diffX = currentX - startX;
      const threshold = 50; // minimum swipe distance

      if (Math.abs(diffX) > threshold) {
        if (diffX > 0 && activeTab === 'config') {
          // Swipe right to calculator
          setActiveTab('calculator');
        } else if (diffX < 0 && activeTab === 'calculator') {
          // Swipe left to config
          setActiveTab('config');
        }
      }
    };

    const tabsElement = tabsRef.current;
    tabsElement.addEventListener('touchstart', handleTouchStart);
    tabsElement.addEventListener('touchmove', handleTouchMove);
    tabsElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      tabsElement.removeEventListener('touchstart', handleTouchStart);
      tabsElement.removeEventListener('touchmove', handleTouchMove);
      tabsElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, activeTab]);

  // Handle calculation with mobile bottom sheet
  const handleCalculateRatesWithMobile = async () => {
    await handleCalculateRates();
    
    // Open bottom sheet on mobile after successful calculation
    if (isMobile && shippingCalculator.rates.length > 0) {
      setIsBottomSheetOpen(true);
    }
  };

  // Form progress steps
  const getFormProgressSteps = () => {
    const steps = [
      {
        id: 'origin',
        label: 'Origin Address',
        isComplete: !!originAddress.originCountry && !!originAddress.originPostalCode,
        isCurrent: !originAddress.originCountry || !originAddress.originPostalCode
      },
      {
        id: 'collection',
        label: overrideSettings.isOverrideEnabled ? 'Custom Dimensions' : 'Art Collection',
        isComplete: overrideSettings.isOverrideEnabled 
          ? overrideSettings.hasValidOverrideValues 
          : (!!collectionData.selectedCollection && !!collectionData.selectedSize),
        isCurrent: (!!originAddress.originCountry && !!originAddress.originPostalCode) &&
          (overrideSettings.isOverrideEnabled 
            ? !overrideSettings.hasValidOverrideValues
            : (!collectionData.selectedCollection || !collectionData.selectedSize))
      },
      {
        id: 'destination',
        label: 'Destination',
        isComplete: !!country && !!postalCode,
        isCurrent: (!!originAddress.originCountry && !!originAddress.originPostalCode) &&
          (overrideSettings.isOverrideEnabled 
            ? overrideSettings.hasValidOverrideValues 
            : (!!collectionData.selectedCollection && !!collectionData.selectedSize)) &&
          (!country || !postalCode)
      },
      {
        id: 'shipping',
        label: 'Shipping Details',
        isComplete: !!shipDate && !!currencySelector.preferredCurrency,
        isCurrent: (!!originAddress.originCountry && !!originAddress.originPostalCode) &&
          (overrideSettings.isOverrideEnabled 
            ? overrideSettings.hasValidOverrideValues 
            : (!!collectionData.selectedCollection && !!collectionData.selectedSize)) &&
          (!!country && !!postalCode) &&
          (!shipDate || !currencySelector.preferredCurrency)
      }
    ];

    return steps;
  };

  // Get missing validation details
  const getMissingValidationDetails = () => {
    const missing = [];
    const data = debugInfo.formData;
    
    if (!overrideSettings.isOverrideEnabled) {
      if (!data.selectedCollection) missing.push('Art Collection');
      if (!data.selectedSize) missing.push('Artwork Size');
    }
    if (!data.country) missing.push('Destination Country');
    if (!data.postalCode) missing.push('Destination Postal Code');
    if (!data.originCountry) missing.push('Origin Country');
    if (!data.originPostalCode) missing.push('Origin Postal Code');
    
    return missing;
  };

  // Handle rate calculation
  const handleCalculateRates = async () => {
    // Check FedEx configuration first
    if (!fedexConfig.isConfigReady) {
      await fedexConfig.checkFedexConfigStatus();
      if (!fedexConfig.isConfigReady) {
        setActiveTab('config');
        return;
      }
    }

    // Check override validation if enabled
    if (overrideSettings.isOverrideEnabled && !overrideSettings.hasValidOverrideValues) {
      return;
    }

    // Use validation hook to check form
    if (!validation.isReadyForSubmission) {
      return;
    }

    // Execute calculation using the hook with session ID
    const success = await shippingCalculator.calculateRates({
      selectedCollection: collectionData.selectedCollection,
      selectedSize: collectionData.selectedSize,
      country,
      postalCode,
      originCountry: originAddress.originCountry,
      originPostalCode: originAddress.originPostalCode,
      preferredCurrency: currencySelector.preferredCurrency,
      shipDate: shipDate?.toISOString().split('T')[0], // Pass ship date as YYYY-MM-DD
      sessionId: fedexConfig.sessionId || undefined, // Pass session ID instead of config
      overrideData: overrideSettings.getOverrideData(), // Pass override data
    });

    // Additional UI feedback can be added here if needed
    if (success) {
      // Success handled by the hook's toast notifications
    }
  };

  // Handle retry from service availability alert
  const handleRetryWithDifferentDestination = () => {
    // Clear the current destination
    setCountry('');
    setPostalCode('');
    // Clear any errors
    shippingCalculator.clearRates();
    // Focus on the country field (would need ref for this)
  };

  // Check if parameter preview should be shown
  const shouldShowParameterPreview = () => {
    return validation.hasRequiredFields || overrideSettings.isOverrideEnabled;
  };

  // Get configuration status badge
  const getConfigStatusBadge = () => {
    switch (fedexConfig.fedexConfigStatus) {
      case 'complete':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs sm:text-sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Configured</span>
            <span className="sm:hidden">OK</span>
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs sm:text-sm">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Incomplete</span>
            <span className="sm:hidden">!</span>
          </Badge>
        );
      case 'missing':
        return (
          <Badge variant="destructive" className="text-xs sm:text-sm">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Missing</span>
            <span className="sm:hidden">X</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive" className="text-xs sm:text-sm">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Invalid</span>
            <span className="sm:hidden">!</span>
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 animated-gradient transition-colors duration-300">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Theme Toggle - Fixed Position */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        
        <div className="max-w-full sm:max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 sm:p-3 rounded-xl mr-2 sm:mr-3 shadow-lg float-animation" style={{animationDelay: '0s'}}>
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-2 sm:p-3 rounded-xl shadow-lg float-animation" style={{animationDelay: '0.5s'}}>
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 dark:from-slate-100 dark:to-blue-200 bg-clip-text text-transparent mb-2 gradient-text">
              Art Collection Shipping Calculator
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 px-4">
              Get instant FedEx shipping rates for your art collections worldwide
            </p>
          </div>

          {/* FedEx Configuration Status Alert */}
          {!fedexConfig.hasCompleteConfig && !fedexConfig.isLoading && (
            <Alert className="mb-4 sm:mb-6 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm sm:text-base">
                    {fedexConfig.isMissingConfig 
                      ? 'FedEx API configuration is required to calculate shipping rates.'
                      : 'FedEx API configuration is incomplete. Some credentials are missing.'
                    }
                  </span>
                  <button
                    onClick={() => setActiveTab('config')}
                    className="text-sm text-yellow-700 underline hover:text-yellow-900 whitespace-nowrap"
                  >
                    Configure Now
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Debug Information - Completely hidden */}
          {false && debugInfo.buttonDisabled && (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <Bug className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2 text-sm">
                  <div><strong>🚫 Calculate Button Disabled</strong></div>
                  
                  {!validation.hasRequiredFields && (
                    <div>
                      <strong>❌ Missing Required Fields:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {getMissingValidationDetails().map(field => (
                          <li key={field} className="text-xs sm:text-sm">{field}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {validation.hasRequiredFields && !validation.isFormValid && (
                    <div>
                      <strong>❌ Form Validation Errors:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {validation.errors.map((error, idx) => (
                          <li key={idx} className="text-xs sm:text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {!fedexConfig.isConfigReady && (
                    <div>
                      <strong>❌ FedEx Configuration Issue:</strong>
                      <div className="text-xs sm:text-sm ml-4 mt-1">
                        Status: {fedexConfig.fedexConfigStatus}
                        {fedexConfig.getStatusDetails().missingFields.length > 0 && (
                          <div>Missing: {fedexConfig.getStatusDetails().missingFields.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {overrideSettings.isOverrideEnabled && !overrideSettings.hasValidOverrideValues && (
                    <div>
                      <strong>❌ Override Validation Errors:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {overrideSettings.validateOverrideValues().errors.map((error, idx) => (
                          <li key={idx} className="text-xs sm:text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="text-xs text-blue-600 mt-2">
                    Check browser console for detailed debugging information.
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Card */}
          <div className="glass-morphism rounded-2xl shadow-xl overflow-hidden fade-in">
            {/* Tab Navigation - responsive */}
            <div ref={tabsRef} className="flex border-b border-slate-200/70 touch-target gesture-hint">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex-1 px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'calculator'
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50/80'
                }`}
              >
                <Calculator className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Rate Calculator</span>
                <span className="sm:hidden">Calculator</span>
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`flex-1 px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold transition-all duration-200 relative ${
                  activeTab === 'config'
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50/80'
                }`}
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">FedEx Configuration</span>
                <span className="sm:hidden">Config</span>
                <div className="ml-1 sm:ml-2 inline-block">
                  {getConfigStatusBadge()}
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className={`p-3 sm:p-6 ${isMobile && showStickyButton ? 'content-with-sticky-button' : ''}`}>
              {activeTab === 'calculator' ? (
                <div className="space-y-4 sm:space-y-5">
                  {/* Form Progress Indicator */}
                  <div className="mb-6">
                    <FormProgress 
                      steps={getFormProgressSteps()} 
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
                          <p className="text-xs text-slate-600">Choose the artwork you want to ship</p>
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
                    <>
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
                    </>
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
                    onShipDateChange={setShipDate}
                  />

                  {/* Parameter Preview */}
                  {shouldShowParameterPreview() && (
                    <div className="space-y-4">
                      <Separator className="my-4" />
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

                  {/* Calculate Button */}
                  <div ref={calculateButtonRef} className="pt-3">
                    <CalculateButton
                      onClick={handleCalculateRatesWithMobile}
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
                      onRetry={handleRetryWithDifferentDestination}
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
                    />
                  )}
                </div>
              ) : (
                <FedexConfigForm onConfigSave={fedexConfig.handleConfigSave} />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 sm:mt-6 space-y-2">
            <div className="flex items-center justify-center text-slate-500 text-xs sm:text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 pulse-dot"></span>
              Powered by FedEx Shipping API • Rates updated in real-time
            </div>
            {fedexConfig.hasCompleteConfig && (
              <div className="flex items-center justify-center text-slate-400 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                FedEx configuration validated and ready
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug Panel - Completely hidden */}
      {false && (
        <DebugPanel 
          rates={shippingCalculator.rates}
          isCalculating={shippingCalculator.isCalculating}
        />
      )}

      {/* Mobile Sticky Calculate Button */}
      {isMobile && showStickyButton && (
        <div className={`sticky-calculate-button ${showStickyButton ? 'visible' : 'hidden'}`}>
          <CalculateButton
            onClick={handleCalculateRatesWithMobile}
            disabled={debugInfo.buttonDisabled}
            isLoading={shippingCalculator.isCalculating}
            fedexConfigMissing={!fedexConfig.hasCompleteConfig}
          />
        </div>
      )}

      {/* Mobile Bottom Sheet for Results */}
      {isMobile && (
        <BottomSheet
          isOpen={isBottomSheetOpen}
          onClose={() => setIsBottomSheetOpen(false)}
          title="Shipping Rates"
          snapPoints={[0.5, 0.9]}
          defaultSnapPoint={0}
        >
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
          />
        </BottomSheet>
      )}
    </div>
  );
};

export default Index;
