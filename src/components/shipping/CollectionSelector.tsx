
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";

interface Collection {
  id: string;
  name: string;
}

interface CollectionSelectorProps {
  collections: Collection[];
  selectedCollection: string;
  onCollectionChange: (value: string) => void;
  isLoading: boolean;
}

export const CollectionSelector = ({
  collections,
  selectedCollection,
  onCollectionChange,
  isLoading
}: CollectionSelectorProps) => {
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-semibold text-slate-800">Art Collection Selection</h3>
        <p className="text-xs text-slate-600">Choose the artwork you want to ship</p>
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="collection" className="text-sm text-slate-700 font-medium flex items-center">
          <Palette className="w-3.5 h-3.5 mr-1.5" />
          Art Collection
        </Label>
        <Select value={selectedCollection} onValueChange={onCollectionChange} disabled={isLoading}>
          <SelectTrigger className="w-full h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder={isLoading ? "Loading collections..." : "Select an art collection..."} />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 shadow-lg">
            {collections.map((collection) => (
              <SelectItem 
                key={collection.id} 
                value={collection.id}
                className="hover:bg-blue-50 focus:bg-blue-50"
              >
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
