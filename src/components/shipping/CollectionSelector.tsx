
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";
import { usePrefetch } from "@/hooks/usePrefetch";

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
  const { prefetchCollectionSizes } = usePrefetch();
  
  return (
    <div className="space-y-1.5">
      <Label htmlFor="collection" className="text-sm text-slate-700 font-medium flex items-center">
        <Palette className="w-3.5 h-3.5 mr-1.5" />
        Art Collection
      </Label>
      <Select value={selectedCollection} onValueChange={onCollectionChange} disabled={isLoading}>
        <SelectTrigger id="collection" className="w-full h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
          <SelectValue placeholder={isLoading ? "Loading collections..." : "Select an art collection..."} />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-900 border-slate-200 shadow-lg">
          {collections.map((collection) => (
            <SelectItem 
              key={collection.id} 
              value={collection.id}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/50 focus:bg-blue-50 dark:focus:bg-blue-900/50"
              onMouseEnter={() => prefetchCollectionSizes(collection.id)}
            >
              {collection.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
