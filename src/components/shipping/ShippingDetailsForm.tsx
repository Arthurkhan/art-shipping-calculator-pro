
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
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-semibold text-slate-800">Destination Address</h3>
        <p className="text-xs text-slate-600">Where are you shipping to?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-sm text-slate-700 font-medium flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1.5" />
            Country
          </Label>
          <Input
            id="country"
            type="text"
            placeholder="Enter country..."
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            className="h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="postalCode" className="text-sm text-slate-700 font-medium flex items-center">
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            Postal/ZIP Code
          </Label>
          <Input
            id="postalCode"
            type="text"
            placeholder="Enter postal code..."
            value={postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            className="h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
