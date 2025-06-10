import { Edit3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OverrideToggleButtonProps {
  isEnabled: boolean;
  onClick: () => void;
  hasValidValues: boolean;
}

export const OverrideToggleButton = ({ 
  isEnabled, 
  onClick, 
  hasValidValues 
}: OverrideToggleButtonProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onClick}
        variant={isEnabled ? "default" : "outline"}
        size="sm"
        className={`transition-all duration-200 ${
          isEnabled 
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md" 
            : "hover:bg-slate-50"
        }`}
      >
        {isEnabled ? (
          <>
            <X className="w-4 h-4 mr-2" />
            Disable Override
          </>
        ) : (
          <>
            <Edit3 className="w-4 h-4 mr-2" />
            Override Dimensions
          </>
        )}
      </Button>
      
      {isEnabled && (
        <Badge 
          variant={hasValidValues ? "default" : "destructive"}
          className={`${
            hasValidValues 
              ? "bg-green-100 text-green-800 border-green-200" 
              : "bg-red-100 text-red-800 border-red-200"
          }`}
        >
          {hasValidValues ? "Active" : "Invalid"}
        </Badge>
      )}
    </div>
  );
};
