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
  const [originCountry, setOriginCountry] = useState(localStorage.getItem('origin_country') || '');
  const [originPostalCode, setOriginPostalCode] = useState(localStorage.getItem('origin_postal_code') || '');
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
    if (!selectedCollection || !selectedSize || !country || !postalCode) {
      setError("Please fill in all fields before calculating rates.");
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

  const isFormValid = selectedCollection && selectedSize && country.trim() && postalCode.trim() && originCountry.trim() && originPostalCode.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-full mr-3">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div className="bg-slate-600 p-3 rounded-full">
                <Package className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Art Collection Shipping Calculator
            </h1>
            <p className="text-slate-600">
              Get instant FedEx shipping rates for your art collections
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'calculator'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Calculator className="w-4 h-4 inline mr-2" />
                Rate Calculator
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'config'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                FedEx Configuration
              </button>
            </div>

            <div className="p-8">
              {activeTab === 'calculator' ? (
                <div className="space-y-6">
                  <OriginAddressForm
                    originCountry={originCountry}
                    originPostalCode={originPostalCode}
                    onOriginCountryChange={handleOriginCountryChange}
                    onOriginPostalCodeChange={handleOriginPostalCodeChange}
                  />

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

                  <ShippingDetailsForm
                    country={country}
                    postalCode={postalCode}
                    onCountryChange={setCountry}
                    onPostalCodeChange={setPostalCode}
                  />

                  <CalculateButton
                    onClick={calculateRates}
                    disabled={!isFormValid}
                    isLoading={isCalculating}
                  />

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <ResultsDisplay rates={rates} isLoading={isCalculating} />
                </div>
              ) : (
                <FedexConfigForm onConfigSave={handleConfigSave} />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-slate-500 text-sm">
            <p>Powered by FedEx Shipping API • Rates updated in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
