import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, RotateCcw, AlertCircle, CheckCircle2, Settings } from "lucide-react";
import { cn, originAddressDefaults, validateOriginAddress, type ValidationResult } from "@/lib/utils";

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
  };

  const handleCountryChange = (value: string) => {
    // Convert to uppercase and limit to 2 characters
    onOriginCountryChange(value.toUpperCase());
  };

  const handlePostalCodeChange = (value: string) => {
    onOriginPostalCodeChange(value);
  };

  const getFieldValidationIcon = (validation: ValidationResult, hasValue: boolean) => {
    if (!hasValue) return null;
    if (validation.isValid) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Origin Address</h3>
            <p className="text-xs text-slate-600">Where are you shipping from?</p>
          </div>
          <div className="flex gap-2">
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
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 flex items-center">
            <MapPin className="w-3 h-3 mr-1.5" />
            <strong>Default:</strong> Thailand (TH), Postal Code 10240
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Use 2-letter country codes (TH, US, GB, etc.) for all addresses.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="originCountry" className="text-sm text-slate-700 font-medium flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1.5" />
            Origin Country Code
          </Label>
          <div className="relative">
            <Input
              id="originCountry"
              type="text"
              placeholder="e.g., TH, US, GB"
              value={originCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className={cn(
                "h-10 pr-8 border-slate-300 focus:border-blue-500 focus:ring-blue-500",
                !countryValidation.isValid && originCountry && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              maxLength={2}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              {getFieldValidationIcon(countryValidation, !!originCountry)}
            </div>
          </div>
          {!countryValidation.isValid && countryValidation.error && originCountry && (
            <p className="text-xs text-red-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {countryValidation.error}
            </p>
          )}
          <p className="text-xs text-slate-500">
            2-letter country code (e.g., TH, US, GB)
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="originPostalCode" className="text-sm text-slate-700 font-medium flex items-center">
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            Origin Postal Code
          </Label>
          <div className="relative">
            <Input
              id="originPostalCode"
              type="text"
              placeholder="10240"
              value={originPostalCode}
              onChange={(e) => handlePostalCodeChange(e.target.value)}
              className={cn(
                "h-10 pr-8 border-slate-300 focus:border-blue-500 focus:ring-blue-500",
                !postalValidation.isValid && originPostalCode && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              {getFieldValidationIcon(postalValidation, !!originPostalCode)}
            </div>
          </div>
          {!postalValidation.isValid && postalValidation.error && originPostalCode && (
            <p className="text-xs text-red-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {postalValidation.error}
            </p>
          )}
          <p className="text-xs text-slate-500">
            Origin postal code
          </p>
        </div>
      </div>
    </div>
  );
};
