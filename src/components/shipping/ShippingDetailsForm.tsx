import { MapPin, Globe, DollarSign, Calendar, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { useState, useEffect } from "react";
import { 
  countryToCode, 
  searchCountries, 
  formatCountryDisplay,
  getPopularCountries 
} from "@/lib/country-utils";

interface ShippingDetailsFormProps {
  country: string;
  postalCode: string;
  preferredCurrency: string;
  shipDate: Date | undefined;
  onCountryChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onPreferredCurrencyChange: (value: string) => void;
  onShipDateChange: (date: Date | undefined) => void;
}

export const ShippingDetailsForm = ({
  country,
  postalCode,
  preferredCurrency,
  shipDate,
  onCountryChange,
  onPostalCodeChange,
  onPreferredCurrencyChange,
  onShipDateChange,
}: ShippingDetailsFormProps) => {
  // Calculate tomorrow's date as default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Set minimum date to today (allowing today and future dates)
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);
  
  // Country suggestions and input state
  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
  const [countryInput, setCountryInput] = useState(country);
  const [isValidCountry, setIsValidCountry] = useState(false);
  
  // Update country input display when country prop changes
  useEffect(() => {
    if (country && country.length === 2) {
      setCountryInput(country);
      setIsValidCountry(true);
    }
  }, [country]);
  
  // Handle country input changes
  const handleCountryChange = (value: string) => {
    setCountryInput(value);
    
    // Try to convert to country code
    const code = countryToCode(value);
    
    if (code) {
      // Valid country found, update with code
      onCountryChange(code);
      setIsValidCountry(true);
      
      // Clear suggestions if we have a valid code
      if (value.length === 2 && value.toUpperCase() === code) {
        setCountrySuggestions([]);
      }
    } else if (value.length === 2) {
      // If it's 2 chars but not a valid code, still update for user feedback
      onCountryChange(value.toUpperCase());
      setIsValidCountry(false);
    } else {
      // Search for country suggestions
      const matches = searchCountries(value, 8);
      const suggestions = matches.map(c => `${c.name} (${c.code})`);
      setCountrySuggestions(suggestions);
      setIsValidCountry(false);
    }
  };
  
  // Handle blur event - convert country name to code
  const handleCountryBlur = () => {
    if (countryInput && countryInput.length > 2) {
      const code = countryToCode(countryInput);
      if (code) {
        setCountryInput(code);
        onCountryChange(code);
        setIsValidCountry(true);
      }
    }
    setCountrySuggestions([]);
  };
  
  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    // Extract code from format "Country Name (CODE)"
    const match = suggestion.match(/\(([A-Z]{2})\)$/);
    if (match) {
      const code = match[1];
      setCountryInput(code);
      onCountryChange(code);
      setIsValidCountry(true);
      setCountrySuggestions([]);
    }
  };
  
  // Postal code validation based on country
  const getPostalCodeHelper = () => {
    switch (country) {
      case 'US': return 'ZIP code (e.g., 10001)';
      case 'GB': return 'Postcode (e.g., SW1A 1AA)';
      case 'CA': return 'Postal code (e.g., K1A 0B1)';
      case 'FR': return '5-digit postal code (e.g., 75001)';
      case 'DE': return '5-digit postal code (e.g., 10115)';
      case 'JP': return '7-digit postal code (e.g., 100-0001)';
      default: return 'Destination postal code';
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">Shipping Details</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Country Code */}
        <EnhancedInput
          id="country"
          label="Destination Country"
          placeholder="e.g., United States, Thailand, ID"
          value={countryInput}
          onChange={(e) => handleCountryChange(e.target.value)}
          onBlur={handleCountryBlur}
          helperText={isValidCountry && countryInput.length === 2 ? formatCountryDisplay(countryInput) : "Enter country name or 2-letter code"}
          tooltip="Enter the country name or 2-letter ISO code (e.g., 'United States', 'US', 'Thailand', 'TH')"
          showValidation={countryInput.length >= 2}
          isValid={isValidCountry}
          suggestions={countrySuggestions}
          onSuggestionSelect={handleSuggestionSelect}
          leftIcon={<Globe className="w-4 h-4" />}
          className="h-12 sm:h-10 text-base sm:text-sm"
        />

        {/* Postal Code */}
        <EnhancedInput
          id="postalCode"
          label="Postal Code"
          placeholder="e.g., 10001, 75001"
          value={postalCode}
          onChange={(e) => onPostalCodeChange(e.target.value)}
          helperText={getPostalCodeHelper()}
          tooltip="Enter the postal or ZIP code for the destination address"
          showValidation={postalCode.length > 3}
          isValid={postalCode.length > 3}
          leftIcon={<MapPin className="w-4 h-4" />}
          className="h-12 sm:h-10 text-base sm:text-sm"
          inputMode={country === 'GB' ? 'text' : 'numeric'}
        />

        {/* Ship Date */}
        <div className="space-y-2">
          <Label htmlFor="shipDate" className="text-sm font-medium flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Ship Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="shipDate"
                variant="outline"
                className="w-full h-12 sm:h-10 justify-start text-left font-normal text-base sm:text-sm"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {shipDate ? format(shipDate, "PPP") : "Select ship date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0" 
              align="start"
              sideOffset={5}
            >
              <CalendarComponent
                mode="single"
                selected={shipDate}
                onSelect={onShipDateChange}
                disabled={(date) => date < minDate}
                initialFocus
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-slate-500 dark:text-slate-400">Earliest ship date is today</p>
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <Label htmlFor="currency" className="text-sm font-medium flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            Preferred Currency 
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">(optional)</span>
          </Label>
          <Select value={preferredCurrency} onValueChange={onPreferredCurrencyChange}>
            <SelectTrigger id="currency" className="h-12 sm:h-10 text-base sm:text-sm">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="EUR">EUR - Euro (default)</SelectItem>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
              <SelectItem value="THB">THB - Thai Baht</SelectItem>
              <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
              <SelectItem value="HKD">HKD - Hong Kong Dollar</SelectItem>
              <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
              <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
              <SelectItem value="PHP">PHP - Philippine Peso</SelectItem>
              <SelectItem value="VND">VND - Vietnamese Dong</SelectItem>
              <SelectItem value="INR">INR - Indian Rupee</SelectItem>
              <SelectItem value="KRW">KRW - South Korean Won</SelectItem>
              <SelectItem value="TWD">TWD - Taiwan Dollar</SelectItem>
              <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
              <SelectItem value="BRL">BRL - Brazilian Real</SelectItem>
              <SelectItem value="MXN">MXN - Mexican Peso</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">Defaults to EUR if not selected</p>
          </div>
        </div>
      </div>

      {/* Currency Notice - Full width on mobile */}
      <div className="mt-3 sm:mt-4">
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-amber-700">
            Note: The displayed currency may differ from your selection if your FedEx account has a preferred currency assigned.
          </p>
        </div>
      </div>
    </div>
  );
};
