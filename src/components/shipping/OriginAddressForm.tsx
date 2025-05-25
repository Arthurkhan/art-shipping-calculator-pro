
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
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-2 mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Origin Address</h3>
        <p className="text-sm text-slate-600">Where are you shipping from?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="originCountry" className="text-slate-700 font-medium flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Origin Country
          </Label>
          <Input
            id="originCountry"
            type="text"
            placeholder="Enter origin country..."
            value={originCountry}
            onChange={(e) => onOriginCountryChange(e.target.value)}
            className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="originPostalCode" className="text-slate-700 font-medium flex items-center">
            <Mail className="w-4 h-4 mr-2" />
            Origin Postal/ZIP Code
          </Label>
          <Input
            id="originPostalCode"
            type="text"
            placeholder="Enter origin postal code..."
            value={originPostalCode}
            onChange={(e) => onOriginPostalCodeChange(e.target.value)}
            className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
