
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Ruler } from "lucide-react";

interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string;
  onSizeChange: (value: string) => void;
  disabled: boolean;
}

export const SizeSelector = ({
  sizes,
  selectedSize,
  onSizeChange,
  disabled
}: SizeSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="size" className="text-slate-700 font-medium flex items-center">
        <Ruler className="w-4 h-4 mr-2" />
        Size
      </Label>
      <Select value={selectedSize} onValueChange={onSizeChange} disabled={disabled}>
        <SelectTrigger className="w-full h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-slate-100">
          <SelectValue placeholder={disabled ? "Select a collection first..." : "Select size..."} />
        </SelectTrigger>
        <SelectContent className="bg-white border-slate-200 shadow-lg">
          {sizes.map((size) => (
            <SelectItem 
              key={size} 
              value={size}
              className="hover:bg-blue-50 focus:bg-blue-50"
            >
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
