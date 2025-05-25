
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
    <div className="space-y-1.5">
      <Label htmlFor="size" className="text-sm text-slate-700 font-medium flex items-center">
        <Ruler className="w-3.5 h-3.5 mr-1.5" />
        Artwork Size
      </Label>
      <Select value={selectedSize} onValueChange={onSizeChange} disabled={disabled}>
        <SelectTrigger id="size" className="w-full h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-slate-100">
          <SelectValue placeholder={disabled ? "Select a collection first..." : "Select artwork size..."} />
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
