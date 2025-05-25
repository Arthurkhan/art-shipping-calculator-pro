import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CollectionSelector } from "@/components/shipping/CollectionSelector";
import { SizeSelector } from "@/components/shipping/SizeSelector";
import { ShippingDetailsForm } from "@/components/shipping/ShippingDetailsForm";
import { OriginAddressForm } from "@/components/shipping/OriginAddressForm";
import { CalculateButton } from "@/components/shipping/CalculateButton";
import { ResultsDisplay } from "@/components/shipping/ResultsDisplay";
import { FedexConfigForm } from "@/components/shipping/FedexConfigForm";
import { Truck, Package, Settings, Calculator, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { originAddressDefaults, validateOriginAddress } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
}

interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
}

interface FedexConfig {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}

const Index = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  
  // Initialize origin address with Thailand defaults (Phase 2 implementation)
  const [originCountry, setOriginCountry] = useState(() => {
    // Check localStorage first, otherwise use Thailand default
    const savedCountry = localStorage.getItem('origin_country');
    return savedCountry || originAddressDefaults.countryName;
  });
  
  const [originPostalCode, setOriginPostalCode] = useState(() => {
    // Check localStorage first, otherwise use Thailand default
    const savedPostalCode = localStorage.getItem('origin_postal_code');
    return savedPostalCode || originAddressDefaults.postalCode;
  });
  
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'calculator' | 'config'>('calculator');
  const [fedexConfig, setFedexConfig] = useState<FedexConfig | null>(null);
  const [fedexConfigStatus, setFedexConfigStatus] = useState<'missing' | 'partial' | 'complete'>('missing');
  const { toast } = useToast();

  // Load collections on mount
  useEffect(() => {
    loadCollections();
    // Set Thailand defaults in localStorage if first time user (Phase 2)
    initializeOriginDefaults();
    // Check FedEx configuration status
    checkFedexConfigStatus();
  }, []);

  // Load sizes when collection changes
  useEffect(() => {
    if (selectedCollection) {
      loadSizes(selectedCollection);
      setSelectedSize(""); // Reset size selection
    } else {
      setSizes([]);
      setSelectedSize("");
    }
  }, [selectedCollection]);

  // Check FedEx configuration status on mount and config changes
  useEffect(() => {
    checkFedexConfigStatus();
  }, [fedexConfig]);

  // Initialize Thailand defaults in localStorage if not set (Phase 2)
  const initializeOriginDefaults = () => {
    const savedCountry = localStorage.getItem('origin_country');
    const savedPostalCode = localStorage.getItem('origin_postal_code');
    
    if (!savedCountry) {
      localStorage.setItem('origin_country', originAddressDefaults.countryName);
    }
    if (!savedPostalCode) {
      localStorage.setItem('origin_postal_code', originAddressDefaults.postalCode);
    }
  };

  const checkFedexConfigStatus = () => {
    const accountNumber = localStorage.getItem('fedex_account_number') || '';
    const clientId = localStorage.getItem('fedex_client_id') || '';
    const clientSecret = localStorage.getItem('fedex_client_secret') || '';

    if (!accountNumber && !clientId && !clientSecret) {
      setFedexConfigStatus('missing');
    } else if (!accountNumber || !clientId || !clientSecret) {
      setFedexConfigStatus('partial');
    } else {
      setFedexConfigStatus('complete');
      setFedexConfig({ accountNumber, clientId, clientSecret });
    }
  };

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCollections(data || []);
    } catch (err) {
      console.error('Error loading collections:', err);
      toast({
        title: "Error",
        description: "Failed to load art collections. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSizes = async (collectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('collection_sizes')
        .select('size')
        .eq('collection_id', collectionId)
        .order('size');

      if (error) throw error;
      setSizes(data?.map(item => item.size) || []);
    } catch (err) {
      console.error('Error loading sizes:', err);
      toast({
        title: "Error",
        description: "Failed to load sizes for selected collection.",
        variant: "destructive",
      });
    }
  };

  const calculateRates = async () => {
    // Enhanced validation for Phase 5 - Clear FedEx config feedback
    if (fedexConfigStatus !== 'complete') {
      toast({
        title: "FedEx Configuration Required",
        description: "Please configure your FedEx API credentials in the Configuration tab before calculating rates.",
        variant: "destructive",
      });
      setActiveTab('config');
      return;
    }

    // Enhanced validation for Phase 2
    if (!selectedCollection || !selectedSize || !country || !postalCode || !originCountry || !originPostalCode) {
      setError("Please fill in all fields before calculating rates.");
      return;
    }

    // Validate origin address using new validation utilities
    const originValidation = validateOriginAddress(originCountry, originPostalCode);
    if (!originValidation.isValid) {
      setError(`Origin address validation failed: ${originValidation.error}`);
      return;
    }

    setIsCalculating(true);
    setError("");
    setRates([]);

    try {
      // Enhanced feedback during calculation
      toast({
        title: "Calculating Rates",
        description: "Contacting FedEx API to get shipping rates...",
      });

      const response = await supabase.functions.invoke('calculate-shipping', {
        body: {
          collection: selectedCollection,
          size: selectedSize,
          country,
          postalCode,
          originCountry,
          originPostalCode,
          fedexConfig: fedexConfig || undefined,
        },
      });

      if (response.error) {
        // Enhanced error handling with more specific messages
        const errorMessage = response.error.message || 'Failed to calculate shipping rates';
        
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          throw new Error('FedEx API credentials are invalid. Please check your configuration.');
        } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          throw new Error('Your FedEx account does not have permission to access the API. Please contact FedEx support.');
        } else if (errorMessage.includes('timeout')) {
          throw new Error('Request timed out. Please try again.');
        } else {
          throw new Error(errorMessage);
        }
      }

      setRates(response.data?.rates || []);
      
      if (response.data?.rates?.length === 0) {
        setError("No shipping options available for this destination.");
      } else {
        // Success feedback
        toast({
          title: "Rates Calculated",
          description: `Found ${response.data?.rates?.length} shipping options.`,
        });
      }
    } catch (err) {
      console.error('Error calculating rates:', err);
      const errorMessage = err instanceof Error ? err.message : "Unable to calculate shipping rates. Please try again later.";
      setError(errorMessage);
      
      // Enhanced error feedback
      toast({
        title: "Calculation Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfigSave = (config: FedexConfig) => {
    setFedexConfig(config);
    setFedexConfigStatus('complete');
  };

  const handleOriginCountryChange = (value: string) => {
    setOriginCountry(value);
    localStorage.setItem('origin_country', value);
  };

  const handleOriginPostalCodeChange = (value: string) => {
    setOriginPostalCode(value);
    localStorage.setItem('origin_postal_code', value);
  };

  // Enhanced form validation for Phase 2
  const isFormValid = () => {
    if (!selectedCollection || !selectedSize || !country.trim() || !postalCode.trim() || !originCountry.trim() || !originPostalCode.trim()) {
      return false;
    }
    
    // Validate origin address
    const originValidation = validateOriginAddress(originCountry, originPostalCode);
    return originValidation.isValid;
  };

  // Get configuration status badge
  const getConfigStatusBadge = () => {
    switch (fedexConfigStatus) {
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Compact Header */}
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
          {fedexConfigStatus !== 'complete' && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="flex items-center justify-between">
                  <span>
                    {fedexConfigStatus === 'missing' 
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

          {/* Compact Tab Navigation */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
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

            <div className="p-6">
              {activeTab === 'calculator' ? (
                <div className="space-y-5">
                  {/* Enhanced OriginAddressForm with Phase 2 improvements */}
                  <OriginAddressForm
                    originCountry={originCountry}
                    originPostalCode={originPostalCode}
                    onOriginCountryChange={handleOriginCountryChange}
                    onOriginPostalCodeChange={handleOriginPostalCodeChange}
                  />

                  <Separator className="my-4" />

                  <CollectionSelector
                    collections={collections}
                    selectedCollection={selectedCollection}
                    onCollectionChange={setSelectedCollection}
                    isLoading={isLoading}
                  />

                  <SizeSelector
                    sizes={sizes}
                    selectedSize={selectedSize}
                    onSizeChange={setSelectedSize}
                    disabled={!selectedCollection}
                  />

                  <Separator className="my-4" />

                  <ShippingDetailsForm
                    country={country}
                    postalCode={postalCode}
                    onCountryChange={setCountry}
                    onPostalCodeChange={setPostalCode}
                  />

                  <div className="pt-3">
                    <CalculateButton
                      onClick={calculateRates}
                      disabled={!isFormValid() || fedexConfigStatus !== 'complete'}
                      isLoading={isCalculating}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <ResultsDisplay rates={rates} isLoading={isCalculating} />
                </div>
              ) : (
                <FedexConfigForm onConfigSave={handleConfigSave} />
              )}
            </div>
          </div>

          {/* Enhanced Footer with Status Information */}
          <div className="text-center mt-6 space-y-2">
            <div className="flex items-center justify-center text-slate-500 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Powered by FedEx Shipping API • Rates updated in real-time
            </div>
            {fedexConfigStatus === 'complete' && (
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
