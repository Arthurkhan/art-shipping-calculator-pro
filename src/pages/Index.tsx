import { useState, useEffect } from "react";
import { DebugPanel } from "@/components/debug/DebugPanel";

// Components
import { CalculatorTab } from "@/components/shipping/CalculatorTab";
import { ConfigurationTab } from "@/components/shipping/ConfigurationTab";
import { MobileUI } from "@/components/shipping/MobileUI";
import { TabNavigation } from "@/components/shipping/TabNavigation";
import { FedexConfigAlert } from "@/components/shipping/FedexConfigAlert";
import { CalculatorHeader } from "@/components/shipping/CalculatorHeader";
import { CalculatorFooter } from "@/components/shipping/CalculatorFooter";

// Hooks
import { useOriginAddress } from "@/hooks/useOriginAddress";
import { useFedexConfig } from "@/hooks/useFedexConfig";
import { useCurrencySelector } from "@/hooks/useCurrencySelector";
import { useCollectionData } from "@/hooks/useCollectionData";
import { useShippingValidation } from "@/hooks/useShippingValidation";
import { useShippingCalculator } from "@/hooks/useShippingCalculator";
import { useOverrideSettings } from "@/hooks/useOverrideSettings";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useMobileFeatures } from "@/hooks/useMobileFeatures";
import { useFormProgress } from "@/hooks/useFormProgress";

const Index = () => {
  // Form state
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [shipDate, setShipDate] = useState<Date | undefined>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Custom hooks
  const originAddress = useOriginAddress();
  const fedexConfig = useFedexConfig();
  const currencySelector = useCurrencySelector();
  const collectionData = useCollectionData();
  const shippingCalculator = useShippingCalculator();
  const overrideSettings = useOverrideSettings();
  const { prefetchCollections, prefetchFedexStatus } = usePrefetch();
  
  // Prefetch data on component mount
  useEffect(() => {
    prefetchCollections();
    prefetchFedexStatus();
  }, [prefetchCollections, prefetchFedexStatus]);

  // Form validation
  const validation = useShippingValidation({
    selectedCollection: overrideSettings.isOverrideEnabled ? 'custom' : collectionData.selectedCollection,
    selectedSize: overrideSettings.isOverrideEnabled ? 'custom' : collectionData.selectedSize,
    country,
    postalCode,
    originCountry: originAddress.originCountry,
    originPostalCode: originAddress.originPostalCode,
    preferredCurrency: currencySelector.preferredCurrency,
  });

  // UI hooks
  const { activeTab, setActiveTab, tabsRef } = useTabNavigation(false);
  const mobileFeatures = useMobileFeatures(validation.hasRequiredFields);
  const formProgressSteps = useFormProgress({
    originAddress,
    collectionData,
    overrideSettings,
    country,
    postalCode,
    shipDate,
    preferredCurrency: currencySelector.preferredCurrency,
  });

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
      shipDate: shipDate?.toISOString().split('T')[0],
      sessionId: fedexConfig.sessionId || undefined,
      overrideData: overrideSettings.getOverrideData(),
    });

    // Open bottom sheet on mobile after successful calculation
    if (success && mobileFeatures.isMobile && shippingCalculator.rates.length > 0) {
      mobileFeatures.setIsBottomSheetOpen(true);
    }
  };

  // Handle retry from service availability alert
  const handleRetryWithDifferentDestination = () => {
    setCountry('');
    setPostalCode('');
    shippingCalculator.clearRates();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 animated-gradient transition-colors duration-300">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-full sm:max-w-2xl mx-auto">
          <CalculatorHeader />

          {/* FedEx Configuration Status Alert */}
          <FedexConfigAlert
            hasCompleteConfig={fedexConfig.hasCompleteConfig}
            isLoading={fedexConfig.isLoading}
            isMissingConfig={fedexConfig.isMissingConfig}
            onConfigureClick={() => setActiveTab('config')}
          />

          {/* Main Card */}
          <div className="glass-morphism rounded-2xl shadow-xl overflow-hidden fade-in">
            {/* Tab Navigation */}
            <TabNavigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabsRef={tabsRef}
              fedexConfigStatus={fedexConfig.fedexConfigStatus}
            />

            {/* Tab Content */}
            <div className={`p-3 sm:p-6 ${mobileFeatures.isMobile && mobileFeatures.showStickyButton ? 'content-with-sticky-button' : ''}`}>
              {activeTab === 'calculator' ? (
                <CalculatorTab
                  country={country}
                  postalCode={postalCode}
                  shipDate={shipDate}
                  setCountry={setCountry}
                  setPostalCode={setPostalCode}
                  originAddress={originAddress}
                  currencySelector={currencySelector}
                  collectionData={collectionData}
                  shippingCalculator={shippingCalculator}
                  overrideSettings={overrideSettings}
                  fedexConfig={fedexConfig}
                  validation={validation}
                  isMobile={mobileFeatures.isMobile}
                  showStickyButton={mobileFeatures.showStickyButton}
                  calculateButtonRef={mobileFeatures.calculateButtonRef}
                  onCalculate={handleCalculateRates}
                  onRetryWithDifferentDestination={handleRetryWithDifferentDestination}
                  onShipDateChange={setShipDate}
                  formProgressSteps={formProgressSteps}
                />
              ) : (
                <ConfigurationTab onConfigSave={fedexConfig.handleConfigSave} />
              )}
            </div>
          </div>

          <CalculatorFooter hasCompleteConfig={fedexConfig.hasCompleteConfig} />
        </div>
      </div>

      {/* Mobile UI Components */}
      <MobileUI
        isMobile={mobileFeatures.isMobile}
        showStickyButton={mobileFeatures.showStickyButton}
        isBottomSheetOpen={mobileFeatures.isBottomSheetOpen}
        setIsBottomSheetOpen={mobileFeatures.setIsBottomSheetOpen}
        onCalculate={handleCalculateRates}
        isCalculating={shippingCalculator.isCalculating}
        buttonDisabled={!validation.isReadyForSubmission || !fedexConfig.isConfigReady || (overrideSettings.isOverrideEnabled && !overrideSettings.hasValidOverrideValues)}
        fedexConfigMissing={!fedexConfig.hasCompleteConfig}
        rates={shippingCalculator.rates}
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

      {/* Debug Panel - Hidden in production */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel 
          rates={shippingCalculator.rates}
          isCalculating={shippingCalculator.isCalculating}
        />
      )}
    </div>
  );
};

export default Index;