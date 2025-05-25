
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Mail } from "lucide-react";

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
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-semibold text-slate-800">Origin Address</h3>
        <p className="text-xs text-slate-600">Where are you shipping from?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="originCountry" className="text-sm text-slate-700 font-medium flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1.5" />
            Origin Country
          </Label>
          <Input
            id="originCountry"
            type="text"
            placeholder="Enter origin country..."
            value={originCountry}
            onChange={(e) => onOriginCountryChange(e.target.value)}
            className="h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="originPostalCode" className="text-sm text-slate-700 font-medium flex items-center">
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            Origin Postal/ZIP Code
          </Label>
          <Input
            id="originPostalCode"
            type="text"
            placeholder="Enter origin postal code..."
            value={originPostalCode}
            onChange={(e) => onOriginPostalCodeChange(e.target.value)}
            className="h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
