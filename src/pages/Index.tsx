import { useState, useEffect } from "react";
import { CollectionSelector } from "@/components/shipping/CollectionSelector";
import { SizeSelector } from "@/components/shipping/SizeSelector";
import { ShippingDetailsForm } from "@/components/shipping/ShippingDetailsForm";
import { OriginAddressForm } from "@/components/shipping/OriginAddressForm";
import { CalculateButton } from "@/components/shipping/CalculateButton";
import { ResultsDisplay } from "@/components/shipping/ResultsDisplay";
import { FedexConfigForm } from "@/components/shipping/FedexConfigForm/FedexConfigForm";
import { ParameterPreview } from "@/components/shipping/ParameterPreview";
import { Truck, Package, Settings, Calculator, AlertTriangle, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Phase 2 refactored hooks
import { useOriginAddress } from "@/hooks/useOriginAddress";
import { useFedexConfig } from "@/hooks/useFedexConfig";
import { useCurrencySelector } from "@/hooks/useCurrencySelector";
import { useCollectionData } from "@/hooks/useCollectionData";
import { useShippingValidation } from "@/hooks/useShippingValidation";
import { useShippingCalculator } from "@/hooks/useShippingCalculator";

const Index = () => {
  // UI state
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [activeTab, setActiveTab] = useState<'calculator' | 'config'>('calculator');

  // Custom hooks - Phase 2 refactoring
  const originAddress = useOriginAddress();
  const fedexConfig = useFedexConfig();
  const currencySelector = useCurrencySelector();
  const collectionData = useCollectionData();
  const shippingCalculator = useShippingCalculator();

  // Form validation using extracted hook
  const validation = useShippingValidation({
    selectedCollection: collectionData.selectedCollection,
    selectedSize: collectionData.selectedSize,
    country,
    postalCode,
    originCountry: originAddress.originCountry,
    originPostalCode: originAddress.originPostalCode,
    preferredCurrency: currencySelector.preferredCurrency,
  });

  // Auto-suggest currency when destination country changes
  useEffect(() => {
    if (country) {
      currencySelector.autoSuggestCurrency(country);
    }
  }, [country, currencySelector]);

  // Handle rate calculation
  const handleCalculateRates = async () => {
    // Check FedEx configuration first
    if (!fedexConfig.isConfigReady) {
      fedexConfig.checkFedexConfigStatus();
      setActiveTab('config');
      return;
    }

    // Use validation hook to check form
    if (!validation.isReadyForSubmission) {
      return;
    }

    // Execute calculation using the hook
    const success = await shippingCalculator.calculateRates({
      selectedCollection: collectionData.selectedCollection,
      selectedSize: collectionData.selectedSize,
      country,
      postalCode,
      originCountry: originAddress.originCountry,
      originPostalCode: originAddress.originPostalCode,
      preferredCurrency: currencySelector.preferredCurrency,
      fedexConfig: fedexConfig.fedexConfig || undefined,
    });

    // Additional UI feedback can be added here if needed
    if (success) {
      // Success handled by the hook's toast notifications
    }
  };

  // Check if parameter preview should be shown
  const shouldShowParameterPreview = () => {
    return validation.hasRequiredFields;
  };

  // Get configuration status badge
  const getConfigStatusBadge = () => {
    switch (fedexConfig.fedexConfigStatus) {
      case 'complete':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Configured
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Incomplete
          </Badge>
        );
      case 'missing':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Missing
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Invalid
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl mr-3 shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-3 rounded-xl shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-2">
              Art Collection Shipping Calculator
            </h1>
            <p className="text-slate-600">
              Get instant FedEx shipping rates for your art collections worldwide
            </p>
          </div>

          {/* FedEx Configuration Status Alert */}
          {!fedexConfig.hasCompleteConfig && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="flex items-center justify-between">
                  <span>
                    {fedexConfig.isMissingConfig 
                      ? 'FedEx API configuration is required to calculate shipping rates.'
                      : 'FedEx API configuration is incomplete. Some credentials are missing.'
                    }
                  </span>
                  <button
                    onClick={() => setActiveTab('config')}
                    className="ml-4 text-sm text-yellow-700 underline hover:text-yellow-900"
                  >
                    Configure Now
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200/70">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex-1 px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'calculator'
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50/80'
                }`}
              >
                <Calculator className="w-4 h-4 inline mr-2" />
                Rate Calculator
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`flex-1 px-6 py-3 text-sm font-semibold transition-all duration-200 relative ${
                  activeTab === 'config'
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50/80'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                FedEx Configuration
                <div className="ml-2 inline-block">
                  {getConfigStatusBadge()}
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'calculator' ? (
                <div className="space-y-5">
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
                    <div className="border-b border-slate-200 pb-2">
                      <h3 className="text-base font-semibold text-slate-800">Art Collection Selection</h3>
                      <p className="text-xs text-slate-600">Choose the artwork you want to ship</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
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
                  </div>

                  <Separator className="my-4" />

                  {/* Destination and Currency */}
                  <ShippingDetailsForm
                    country={country}
                    postalCode={postalCode}
                    preferredCurrency={currencySelector.preferredCurrency}
                    onCountryChange={setCountry}
                    onPostalCodeChange={setPostalCode}
                    onPreferredCurrencyChange={currencySelector.handlePreferredCurrencyChange}
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
                      />
                    </div>
                  )}

                  {/* Calculate Button */}
                  <div className="pt-3">
                    <CalculateButton
                      onClick={handleCalculateRates}
                      disabled={!validation.isReadyForSubmission || !fedexConfig.isConfigReady}
                      isLoading={shippingCalculator.isCalculating}
                      fedexConfigMissing={!fedexConfig.hasCompleteConfig}
                    />
                  </div>

                  {/* Error Display */}
                  {shippingCalculator.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{shippingCalculator.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Results */}
                  <ResultsDisplay 
                    rates={shippingCalculator.rates} 
                    isLoading={shippingCalculator.isCalculating} 
                  />
                </div>
              ) : (
                <FedexConfigForm onConfigSave={fedexConfig.handleConfigSave} />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 space-y-2">
            <div className="flex items-center justify-center text-slate-500 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
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
    </div>
  );
};

export default Index;
