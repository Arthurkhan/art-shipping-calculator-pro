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
import { Truck, Package, Settings, Calculator } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
  const { toast } = useToast();

  // Load collections on mount
  useEffect(() => {
    loadCollections();
    // Set Thailand defaults in localStorage if first time user (Phase 2)
    initializeOriginDefaults();
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
        throw new Error(response.error.message || 'Failed to calculate shipping rates');
      }

      setRates(response.data?.rates || []);
      
      if (response.data?.rates?.length === 0) {
        setError("No shipping options available for this destination.");
      }
    } catch (err) {
      console.error('Error calculating rates:', err);
      setError("Unable to calculate shipping rates. Please try again later.");
      toast({
        title: "Calculation Error",
        description: "Failed to get shipping rates from FedEx. Please verify your information and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfigSave = (config: FedexConfig) => {
    setFedexConfig(config);
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
                className={`flex-1 px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'config'
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50/80'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                FedEx Configuration
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
                      disabled={!isFormValid()}
                      isLoading={isCalculating}
                    />
                  </div>

                  {error && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <ResultsDisplay rates={rates} isLoading={isCalculating} />
                </div>
              ) : (
                <FedexConfigForm onConfigSave={handleConfigSave} />
              )}
            </div>
          </div>

          {/* Compact Footer */}
          <div className="text-center mt-6 text-slate-500 text-sm">
            <p className="flex items-center justify-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Powered by FedEx Shipping API • Rates updated in real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
