import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, RotateCcw, AlertCircle, CheckCircle2, Settings, Locate } from "lucide-react";
import { cn, originAddressDefaults, validateOriginAddress, type ValidationResult } from "@/lib/utils";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "sonner";

interface OriginAddressFormProps {
  originCountry: string;
  originPostalCode: string;
  onOriginCountryChange: (value: string) => void;
  onOriginPostalCodeChange: (value: string) => void;
}

export const OriginAddressForm = ({
  originCountry,
  originPostalCode,
  onOriginCountryChange,
  onOriginPostalCodeChange
}: OriginAddressFormProps) => {
  const [countryValidation, setCountryValidation] = useState<ValidationResult>({ isValid: true });
  const [postalValidation, setPostalValidation] = useState<ValidationResult>({ isValid: true });
  const [isUsingDefaults, setIsUsingDefaults] = useState(false);
  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
  
  // Geolocation hook
  const { detectLocation, isLoading: isDetectingLocation } = useGeolocation();

  // Check if current values match Thailand defaults
  useEffect(() => {
    const matchesDefaults = (
      originCountry === originAddressDefaults.country &&
      originPostalCode === originAddressDefaults.postalCode
    );
    setIsUsingDefaults(matchesDefaults);
  }, [originCountry, originPostalCode]);

  // Validate on value changes
  useEffect(() => {
    if (originCountry) {
      const validation = validateOriginAddress(originCountry, originPostalCode || "00000");
      setCountryValidation({
        isValid: originCountry.trim() ? true : false,
        error: originCountry.trim() ? undefined : "Country is required"
      });
    } else {
      setCountryValidation({ isValid: true });
    }
  }, [originCountry, originPostalCode]);

  useEffect(() => {
    if (originPostalCode && originCountry) {
      const validation = validateOriginAddress(originCountry, originPostalCode);
      setPostalValidation(validation);
    } else {
      setPostalValidation({ isValid: true });
    }
  }, [originPostalCode, originCountry]);

  const handleSetToDefaults = () => {
    onOriginCountryChange(originAddressDefaults.country);
    onOriginPostalCodeChange(originAddressDefaults.postalCode);
  };

  const handleSetCurrentAsDefault = () => {
    // Store current values as the new defaults in localStorage
    localStorage.setItem('origin_country', originCountry);
    localStorage.setItem('origin_postal_code', originPostalCode);
    toast.success('Default origin address updated');
  };
  
  const handleDetectLocation = async () => {
    const location = await detectLocation();
    if (location && location.country) {
      onOriginCountryChange(location.country);
      if (location.postalCode) {
        onOriginPostalCodeChange(location.postalCode);
      }
    }
  };

  const handleCountryChange = (value: string) => {
    // Convert to uppercase and limit to 2 characters
    const uppercased = value.toUpperCase();
    onOriginCountryChange(uppercased);
    
    // Update suggestions based on input
    if (uppercased.length === 1) {
      const suggestions = ['TH', 'US', 'GB', 'FR', 'DE', 'JP', 'CN', 'SG', 'MY', 'ID']
        .filter(code => code.startsWith(uppercased));
      setCountrySuggestions(suggestions);
    } else {
      setCountrySuggestions([]);
    }
  };

  const handlePostalCodeChange = (value: string) => {
    onOriginPostalCodeChange(value);
  };


  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Origin Address</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Where are you shipping from?</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDetectLocation}
              className="text-xs px-3 py-1.5 h-auto"
              disabled={isDetectingLocation}
            >
              <Locate className={cn("w-3 h-3 mr-1.5", isDetectingLocation && "animate-pulse")} />
              {isDetectingLocation ? 'Detecting...' : 'Auto-detect'}
            </Button>
            {!isUsingDefaults && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetToDefaults}
                className="text-xs px-3 py-1.5 h-auto"
              >
                <RotateCcw className="w-3 h-3 mr-1.5" />
                Use Thailand Default
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetCurrentAsDefault}
              className="text-xs px-3 py-1.5 h-auto"
              disabled={!originCountry.trim() || !originPostalCode.trim()}
            >
              <Settings className="w-3 h-3 mr-1.5" />
              Set as Default
            </Button>
          </div>
        </div>
        
        {/* Thailand Default Notice - Updated */}
        <div className="mt-2 p-2 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center">
            <MapPin className="w-3 h-3 mr-1.5" />
            <strong>Default:</strong> Thailand (TH), Postal Code 10240
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Use 2-letter country codes (TH, US, GB, etc.) for all addresses.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <EnhancedInput
          id="originCountry"
          label="Origin Country Code"
          type="text"
          placeholder="e.g., TH, US, GB"
          value={originCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
          error={!countryValidation.isValid && originCountry ? countryValidation.error : undefined}
          helperText="2-letter country code (e.g., TH, US, GB)"
          tooltip="Enter the 2-letter ISO country code for your shipping origin"
          showValidation={!!originCountry}
          isValid={countryValidation.isValid}
          suggestions={countrySuggestions}
          onSuggestionSelect={(value) => onOriginCountryChange(value)}
          leftIcon={<MapPin className="w-3.5 h-3.5" />}
          maxLength={2}
          className="uppercase"
        />

        <EnhancedInput
          id="originPostalCode"
          label="Origin Postal Code"
          type="text"
          placeholder="10240"
          value={originPostalCode}
          onChange={(e) => handlePostalCodeChange(e.target.value)}
          error={!postalValidation.isValid && originPostalCode ? postalValidation.error : undefined}
          helperText="Origin postal code"
          tooltip="Enter the postal or ZIP code for your shipping origin"
          showValidation={!!originPostalCode && !!originCountry}
          isValid={postalValidation.isValid}
          leftIcon={<Mail className="w-3.5 h-3.5" />}
        />
      </div>
    </div>
  );
};
