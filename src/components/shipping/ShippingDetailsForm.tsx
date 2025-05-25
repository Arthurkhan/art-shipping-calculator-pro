import { MapPin, Globe, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ShippingDetailsFormProps {
  country: string;
  postalCode: string;
  preferredCurrency: string;
  onCountryChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onPreferredCurrencyChange: (value: string) => void;
}

export const ShippingDetailsForm = ({
  country,
  postalCode,
  preferredCurrency,
  onCountryChange,
  onPostalCodeChange,
  onPreferredCurrencyChange,
}: ShippingDetailsFormProps) => {
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-semibold text-slate-800">Destination Details</h3>
        <p className="text-xs text-slate-600">Where do you want to ship this artwork?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-2">
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

        <div className="md:col-span-1 space-y-2">
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

        <div className="md:col-span-1 space-y-2">
          <Label htmlFor="currency" className="text-sm font-medium">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Preferred Currency
          </Label>
          <Select value={preferredCurrency} onValueChange={onPreferredCurrencyChange}>
            <SelectTrigger className="h-10">
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
