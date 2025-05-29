import { MapPin, Globe, DollarSign, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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
  
  // Set minimum date to tomorrow
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);
  minDate.setDate(minDate.getDate() + 1);
  
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-semibold text-slate-800">Shipping Details</h3>
        <p className="text-xs text-slate-600">Destination and shipping date information</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium">
            <Globe className="w-4 h-4 inline mr-1" />
            Country Code
          </Label>
          <Input
            id="country"
            placeholder="e.g., US, FR, ID"
            value={country}
            onChange={(e) => onCountryChange(e.target.value.toUpperCase())}
            className="h-10"
            maxLength={2}
          />
          <p className="text-xs text-slate-500">2-letter country code</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode" className="text-sm font-medium">
            <MapPin className="w-4 h-4 inline mr-1" />
            Postal Code
          </Label>
          <Input
            id="postalCode"
            placeholder="e.g., 10001, 75001"
            value={postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            className="h-10"
          />
          <p className="text-xs text-slate-500">Destination postal code</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shipDate" className="text-sm font-medium">
            <Calendar className="w-4 h-4 inline mr-1" />
            Ship Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="shipDate"
                variant="outline"
                className="w-full h-10 justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {shipDate ? format(shipDate, "PPP") : "Select ship date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={shipDate}
                onSelect={onShipDateChange}
                disabled={(date) => date < minDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-slate-500">Earliest ship date is tomorrow</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency" className="text-sm font-medium">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Preferred Currency
          </Label>
          <Select value={preferredCurrency} onValueChange={onPreferredCurrencyChange}>
            <SelectTrigger id="currency" className="h-10">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
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
          <p className="text-xs text-slate-500">Rate currency</p>
        </div>
      </div>
    </div>
  );
};
