
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
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-2 mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Art Collection Selection</h3>
        <p className="text-sm text-slate-600">Choose the artwork you want to ship</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="collection" className="text-slate-700 font-medium flex items-center">
          <Palette className="w-4 h-4 mr-2" />
          Art Collection
        </Label>
        <Select value={selectedCollection} onValueChange={onCollectionChange} disabled={isLoading}>
          <SelectTrigger className="w-full h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
