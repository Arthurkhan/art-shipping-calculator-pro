
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Mail } from "lucide-react";

interface ShippingDetailsFormProps {
  country: string;
  postalCode: string;
  onCountryChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
}

const countries = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "OTHER", name: "Other" }
];

export const ShippingDetailsForm = ({
  country,
  postalCode,
  onCountryChange,
  onPostalCodeChange
}: ShippingDetailsFormProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="country" className="text-slate-700 font-medium flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          Country
        </Label>
        <Select value={country} onValueChange={onCountryChange}>
          <SelectTrigger className="w-full h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder="Select country..." />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 shadow-lg max-h-60">
            {countries.map((country) => (
              <SelectItem 
                key={country.code} 
                value={country.code}
                className="hover:bg-blue-50 focus:bg-blue-50"
              >
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="postalCode" className="text-slate-700 font-medium flex items-center">
          <Mail className="w-4 h-4 mr-2" />
          Postal/ZIP Code
        </Label>
        <Input
          id="postalCode"
          type="text"
          placeholder="Enter postal code..."
          value={postalCode}
          onChange={(e) => onPostalCodeChange(e.target.value)}
          className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};
