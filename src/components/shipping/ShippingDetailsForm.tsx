
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Mail } from "lucide-react";

interface ShippingDetailsFormProps {
  country: string;
  postalCode: string;
  onCountryChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
}

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
        <Input
          id="country"
          type="text"
          placeholder="Enter country..."
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
        />
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
