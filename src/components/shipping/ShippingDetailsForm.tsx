import { MapPin, Globe, DollarSign, Calendar, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { useState, useEffect } from "react";

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
  
  // Country suggestions
  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
  
  // Popular destination countries
  const popularCountries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'JP', name: 'Japan' },
    { code: 'SG', name: 'Singapore' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'AU', name: 'Australia' },
    { code: 'CN', name: 'China' }
  ];
  
  // Update country suggestions
  const handleCountryChange = (value: string) => {
    const uppercased = value.toUpperCase();
    onCountryChange(uppercased);
    
    if (uppercased.length === 1) {
      const suggestions = popularCountries
        .filter(c => c.code.startsWith(uppercased))
        .map(c => `${c.code} - ${c.name}`);
      setCountrySuggestions(suggestions);
    } else {
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
        <h3 className="text-sm sm:text-base font-semibold text-slate-800">Shipping Details</h3>
        <p className="text-xs text-slate-600">Destination and shipping date information</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Country Code */}
        <EnhancedInput
          id="country"
          label="Destination Country"
          placeholder="e.g., US, FR, ID"
          value={country}
          onChange={(e) => handleCountryChange(e.target.value)}
          helperText="2-letter country code"
          tooltip="Enter the 2-letter ISO country code for the destination"
          showValidation={country.length === 2}
          isValid={country.length === 2}
          suggestions={countrySuggestions}
          onSuggestionSelect={(value) => onCountryChange(value.split(' ')[0])}
          leftIcon={<Globe className="w-4 h-4" />}
          maxLength={2}
          className="uppercase h-12 sm:h-10 text-base sm:text-sm"
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
          <p className="text-xs text-slate-500">Earliest ship date is today</p>
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <Label htmlFor="currency" className="text-sm font-medium flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            Preferred Currency 
            <span className="text-xs text-slate-500 ml-1">(optional)</span>
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
            <p className="text-xs text-slate-500">Defaults to EUR if not selected</p>
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
